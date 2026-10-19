import {
  collection,
  doc,
  runTransaction,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Sale,
  SaleItem,
  SalePaymentType,
  SaleStatus,
  Customer,
  Credit,
  Payment,
  PaymentMethod
} from '../types';
import { generateReference, isDateOverdue, cleanForFirestore } from '../lib/utils';
import { createCustomer } from './creditService';

export interface CreateSaleItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleParams {
  businessId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CreateSaleItemInput[];
  paymentType: SalePaymentType; // 'full' | 'partial' | 'credit'
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  dueDate?: string;
  notes?: string;
  userId: string;
  userName?: string;
}

export async function createSale(params: CreateSaleParams): Promise<{
  sale: Sale;
  credit?: Credit;
  payment?: Payment;
}> {
  if (!params.items || params.items.length === 0) {
    throw new Error('Veuillez ajouter au moins un article à la vente.');
  }

  // Sanitize line items and calculate totals
  const sanitizedItems: SaleItem[] = params.items.map((item, idx) => {
    const desc = (item.description || '').trim() || `Article ${idx + 1}`;
    const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
    const price = Math.max(0, Math.round(Number(item.unitPrice) || 0));
    const total = qty * price;
    return {
      id: `item_${idx + 1}_${Date.now()}`,
      description: desc,
      quantity: qty,
      unitPrice: price,
      total,
    };
  });

  const totalAmount = sanitizedItems.reduce((sum, item) => sum + item.total, 0);
  if (totalAmount <= 0) {
    throw new Error('Le montant total de la facture doit être strictement supérieur à 0 FCFA.');
  }

  let finalPaidAmount = 0;
  let finalRemainingAmount = 0;
  let status: SaleStatus = 'paid';

  if (params.paymentType === 'full') {
    finalPaidAmount = totalAmount;
    finalRemainingAmount = 0;
    status = 'paid';
  } else if (params.paymentType === 'partial') {
    const vers = Math.round(Number(params.paidAmount) || 0);
    if (vers <= 0) {
      throw new Error('Pour un paiement partiel, le montant versé doit être supérieur à 0 FCFA.');
    }
    if (vers >= totalAmount) {
      throw new Error(
        `Le versement (${vers} FCFA) couvre la totalité de la facture (${totalAmount} FCFA). Choisissez « Tout payé ».`
      );
    }
    finalPaidAmount = vers;
    finalRemainingAmount = totalAmount - vers;
    status = 'partial';
  } else if (params.paymentType === 'credit') {
    finalPaidAmount = 0;
    finalRemainingAmount = totalAmount;
    status = 'credit';
  }

  // Si dette restante > 0, un client identifiable est obligatoire
  const rawCustomerName = (params.customerName || '').trim();
  const rawCustomerPhone = (params.customerPhone || '').trim();

  if (finalRemainingAmount > 0 && !rawCustomerName) {
    throw new Error('Le nom du client est obligatoire pour une vente à crédit ou avec paiement partiel.');
  }

  const customerName = rawCustomerName || 'Client Comptoir';
  const customerPhone = rawCustomerPhone || '';

  const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const saleReference = generateReference('FAC');
  const now = new Date().toISOString();

  let createdCredit: Credit | undefined;
  let createdPayment: Payment | undefined;

  let creditId: string | undefined;
  let creditRefCode: string | undefined;

  if (finalRemainingAmount > 0) {
    creditId = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    creditRefCode = generateReference('CR');
  }

  const saleData: Sale = {
    id: saleId,
    reference: saleReference,
    businessId: params.businessId,
    customerName,
    items: sanitizedItems,
    totalAmount,
    paidAmount: finalPaidAmount,
    remainingAmount: finalRemainingAmount,
    paymentType: params.paymentType,
    paymentMethod: params.paymentMethod,
    status,
    createdBy: params.userId,
    createdByName: params.userName || 'Commerçant',
    createdAt: now,
    updatedAt: now,
  };

  if (params.customerId) saleData.customerId = params.customerId;
  if (customerPhone) saleData.customerPhone = customerPhone;
  if (creditId) saleData.creditId = creditId;
  if (params.dueDate) saleData.dueDate = params.dueDate;
  if (params.notes?.trim()) saleData.notes = params.notes.trim();

  try {
    await runTransaction(db, async (transaction) => {
      // 1. If credit is created, verify/resolve Customer
      let resolvedCustomerId = params.customerId;
      let customerRef: any = null;
      let existingCustomer: Customer | null = null;

      if (finalRemainingAmount > 0) {
        if (!resolvedCustomerId) {
          // Create customer ID inside transaction
          resolvedCustomerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          customerRef = doc(db, 'customers', resolvedCustomerId);

          const newCustomer: Customer = {
            id: resolvedCustomerId,
            businessId: params.businessId,
            name: customerName,
            phone: customerPhone,
            address: '',
            notes: 'Créé automatiquement lors de la vente à crédit ' + saleReference,
            totalCredit: totalAmount,
            totalPaid: finalPaidAmount,
            currentDebt: finalRemainingAmount,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          };

          transaction.set(customerRef, cleanForFirestore(newCustomer));
          saleData.customerId = resolvedCustomerId;
        } else {
          customerRef = doc(db, 'customers', resolvedCustomerId);
          const customerSnap = await transaction.get(customerRef);
          if (customerSnap.exists()) {
            existingCustomer = customerSnap.data() as Customer;
            const newTotalCredit = (existingCustomer.totalCredit || 0) + totalAmount;
            const newTotalPaid = (existingCustomer.totalPaid || 0) + finalPaidAmount;
            const newCurrentDebt = (existingCustomer.currentDebt || 0) + finalRemainingAmount;

            transaction.update(customerRef, {
              totalCredit: newTotalCredit,
              totalPaid: newTotalPaid,
              currentDebt: newCurrentDebt,
              updatedAt: now,
            });
          }
        }

        // 2. Prepare and save Credit document
        const creditStatus = finalRemainingAmount === 0 ? 'paid' : (isDateOverdue(params.dueDate) ? 'overdue' : 'active');
        const itemsSummary = sanitizedItems.map((i) => `${i.quantity}x ${i.description}`).join(', ');

        createdCredit = {
          id: creditId!,
          reference: creditRefCode!,
          businessId: params.businessId,
          customerId: resolvedCustomerId!,
          customerName,
          description: `Facture ${saleReference} : ${itemsSummary}`.substring(0, 250),
          amount: totalAmount,
          initialPayment: finalPaidAmount,
          totalPaid: finalPaidAmount,
          remainingAmount: finalRemainingAmount,
          creditDate: now.substring(0, 10),
          dueDate: params.dueDate || '',
          status: creditStatus,
          notes: `Généré automatiquement depuis la vente ${saleReference}`,
          saleId,
          createdBy: params.userId,
          createdByName: params.userName || 'Commerçant',
          createdAt: now,
          updatedAt: now,
        };
        if (customerPhone) {
          createdCredit.customerPhone = customerPhone;
        }

        const creditDocRef = doc(db, 'credits', creditId!);
        transaction.set(creditDocRef, cleanForFirestore(createdCredit));

        // 3. If there is an initial partial payment, save Payment receipt
        if (finalPaidAmount > 0) {
          const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          createdPayment = {
            id: paymentId,
            reference: generateReference('REC'),
            businessId: params.businessId,
            customerId: resolvedCustomerId!,
            customerName,
            creditId: creditId!,
            creditReference: creditRefCode,
            creditDescription: `Acompte Facture ${saleReference}`,
            saleId,
            amount: finalPaidAmount,
            paymentMethod: params.paymentMethod,
            paymentDate: now.substring(0, 10),
            notes: `Versement initial sur facture ${saleReference}`,
            remainingAfter: finalRemainingAmount,
            createdBy: params.userId,
            createdByName: params.userName || 'Commerçant',
            createdAt: now,
          };

          const paymentDocRef = doc(db, 'payments', paymentId);
          transaction.set(paymentDocRef, cleanForFirestore(createdPayment));
        }
      } else {
        // Vente au comptant (Tout payé)
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        createdPayment = {
          id: paymentId,
          reference: generateReference('REC'),
          businessId: params.businessId,
          customerId: params.customerId || 'comptoir',
          customerName,
          creditId: 'comptoir',
          creditReference: saleReference,
          creditDescription: `Vente au comptant ${saleReference}`,
          saleId,
          amount: totalAmount,
          paymentMethod: params.paymentMethod,
          paymentDate: now.substring(0, 10),
          notes: `Règlement total au comptant`,
          remainingAfter: 0,
          createdBy: params.userId,
          createdByName: params.userName || 'Commerçant',
          createdAt: now,
        };

        const paymentDocRef = doc(db, 'payments', paymentId);
        transaction.set(paymentDocRef, cleanForFirestore(createdPayment));
      }

      // 4. Save Sale document - clean from any undefined
      const saleDocRef = doc(db, 'sales', saleId);
      transaction.set(saleDocRef, cleanForFirestore(saleData));

      // 5. Save Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logRef = doc(db, 'auditLogs', logId);
      transaction.set(logRef, {
        id: logId,
        businessId: params.businessId,
        userId: params.userId,
        userEmail: params.userName || 'utilisateur',
        action: 'VENTE_ENREGISTRÉE',
        details: `Vente ${saleReference} (${params.paymentType.toUpperCase()}) : ${totalAmount} FCFA (Encaissé: ${finalPaidAmount} FCFA, Reste: ${finalRemainingAmount} FCFA) pour ${customerName}.`,
        timestamp: now,
      });
    });

    return {
      sale: saleData,
      credit: createdCredit,
      payment: createdPayment,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sales/${saleId}`);
  }
}
