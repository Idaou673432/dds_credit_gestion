import {
  collection,
  doc,
  runTransaction,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Customer, Credit, Payment, UserRole } from '../types';
import { generateReference, isDateOverdue } from '../lib/utils';

export interface CreateCreditParams {
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  description: string;
  amount: number;
  initialPayment?: number;
  creditDate: string;
  dueDate?: string;
  notes?: string;
  userId: string;
  userName?: string;
}

export interface RecordPaymentParams {
  businessId: string;
  customerId: string;
  customerName: string;
  creditId: string;
  amount: number;
  paymentMethod: 'cash' | 'orange_money' | 'moov_money' | 'bank_transfer' | 'other';
  paymentDate: string;
  notes?: string;
  userId: string;
  userName?: string;
}

export async function createCustomer(
  businessId: string,
  name: string,
  phone: string,
  address?: string,
  notes?: string
): Promise<Customer> {
  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const customerData: Customer = {
    id: customerId,
    businessId,
    name: name.trim(),
    phone: phone.trim(),
    address: address?.trim() || '',
    notes: notes?.trim() || '',
    totalCredit: 0,
    totalPaid: 0,
    currentDebt: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'customers', customerId), customerData);
    return customerData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `customers/${customerId}`);
  }
}

export async function updateCustomer(
  customerId: string,
  data: Partial<Pick<Customer, 'name' | 'phone' | 'address' | 'notes' | 'status'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'customers', customerId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
  }
}

export async function createCredit(params: CreateCreditParams): Promise<{ credit: Credit; payment?: Payment }> {
  const amount = Math.round(Number(params.amount));
  const initialPayment = Math.max(0, Math.round(Number(params.initialPayment) || 0));

  if (amount <= 0) {
    throw new Error('Le montant du crédit doit être strictement supérieur à 0 FCFA.');
  }

  if (initialPayment > amount) {
    throw new Error('Le paiement initial ne peut pas dépasser le montant total du crédit.');
  }

  const remainingAmount = amount - initialPayment;
  const creditId = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reference = generateReference('CR');
  const now = new Date().toISOString();
  const status = remainingAmount === 0 ? 'paid' : (isDateOverdue(params.dueDate) ? 'overdue' : 'active');

  const creditData: Credit = {
    id: creditId,
    reference,
    businessId: params.businessId,
    customerId: params.customerId,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    description: params.description.trim(),
    amount,
    initialPayment,
    totalPaid: initialPayment,
    remainingAmount,
    creditDate: params.creditDate,
    dueDate: params.dueDate || '',
    status,
    notes: params.notes || '',
    createdBy: params.userId,
    createdByName: params.userName || 'Commerçant',
    createdAt: now,
    updatedAt: now,
  };

  let initialPaymentData: Payment | undefined;
  if (initialPayment > 0) {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    initialPaymentData = {
      id: paymentId,
      reference: generateReference('REC'),
      businessId: params.businessId,
      customerId: params.customerId,
      customerName: params.customerName,
      creditId: creditId,
      creditReference: reference,
      creditDescription: params.description.trim(),
      amount: initialPayment,
      paymentMethod: 'cash',
      paymentDate: params.creditDate,
      notes: 'Paiement initial à la création du crédit',
      remainingAfter: remainingAmount,
      createdBy: params.userId,
      createdByName: params.userName || 'Commerçant',
      createdAt: now,
    };
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read customer to get current stats
      const customerRef = doc(db, 'customers', params.customerId);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Client introuvable.');
      }

      const existingCust = customerDoc.data() as Customer;
      const newTotalCredit = (existingCust.totalCredit || 0) + amount;
      const newTotalPaid = (existingCust.totalPaid || 0) + initialPayment;
      const newCurrentDebt = (existingCust.currentDebt || 0) + remainingAmount;

      // 2. Write credit doc
      const creditRef = doc(db, 'credits', creditId);
      transaction.set(creditRef, creditData);

      // 3. Write initial payment doc if applicable
      if (initialPaymentData) {
        const paymentRef = doc(db, 'payments', initialPaymentData.id);
        transaction.set(paymentRef, initialPaymentData);
      }

      // 4. Update customer stats
      transaction.update(customerRef, {
        totalCredit: newTotalCredit,
        totalPaid: newTotalPaid,
        currentDebt: newCurrentDebt,
        updatedAt: now,
      });

      // 5. Write audit log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logRef = doc(db, 'auditLogs', logId);
      transaction.set(logRef, {
        id: logId,
        businessId: params.businessId,
        userId: params.userId,
        userEmail: params.userName || 'utilisateur',
        action: 'CRÉDIT_ACCORDÉ',
        details: `Octroi crédit ${reference} de ${amount} FCFA au client ${params.customerName} (Solde restant: ${remainingAmount} FCFA)`,
        timestamp: now,
      });
    });

    return { credit: creditData, payment: initialPaymentData };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `credits/${creditId}`);
  }
}

export async function recordPayment(params: RecordPaymentParams): Promise<Payment> {
  const amount = Math.round(Number(params.amount));

  if (amount <= 0) {
    throw new Error('Le montant du remboursement doit être strictement supérieur à 0 FCFA.');
  }

  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reference = generateReference('REC');
  const now = new Date().toISOString();

  let createdPayment: Payment | null = null;

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch Credit Document
      const creditRef = doc(db, 'credits', params.creditId);
      const creditDoc = await transaction.get(creditRef);

      if (!creditDoc.exists()) {
        throw new Error('Crédit introuvable.');
      }

      const credit = creditDoc.data() as Credit;

      if (credit.remainingAmount <= 0) {
        throw new Error('Ce crédit est déjà entièrement soldé. Aucun paiement supplémentaire ne peut être enregistré.');
      }

      if (amount > credit.remainingAmount) {
        throw new Error(
          `Montant invalide : le paiement (${amount} FCFA) dépasse le solde restant dû (${credit.remainingAmount} FCFA).`
        );
      }

      // 2. Fetch Customer Document
      const customerRef = doc(db, 'customers', params.customerId);
      const customerDoc = await transaction.get(customerRef);

      if (!customerDoc.exists()) {
        throw new Error('Client introuvable.');
      }

      const customer = customerDoc.data() as Customer;

      // 3. Compute new balances
      const newRemainingAmount = credit.remainingAmount - amount;
      const newTotalPaidCredit = credit.totalPaid + amount;
      const newCreditStatus = newRemainingAmount === 0 ? 'paid' : (isDateOverdue(credit.dueDate) ? 'overdue' : 'active');

      const newCustomerTotalPaid = (customer.totalPaid || 0) + amount;
      const newCustomerDebt = Math.max(0, (customer.currentDebt || 0) - amount);

      createdPayment = {
        id: paymentId,
        reference,
        businessId: params.businessId,
        customerId: params.customerId,
        customerName: params.customerName,
        creditId: params.creditId,
        creditReference: credit.reference,
        creditDescription: credit.description,
        amount,
        paymentMethod: params.paymentMethod,
        paymentDate: params.paymentDate,
        notes: params.notes || '',
        remainingAfter: newRemainingAmount,
        createdBy: params.userId,
        createdByName: params.userName || 'Caissier',
        createdAt: now,
      };

      // 4. Update Credit
      transaction.update(creditRef, {
        totalPaid: newTotalPaidCredit,
        remainingAmount: newRemainingAmount,
        status: newCreditStatus,
        updatedAt: now,
      });

      // 5. Update Customer
      transaction.update(customerRef, {
        totalPaid: newCustomerTotalPaid,
        currentDebt: newCustomerDebt,
        updatedAt: now,
      });

      // 6. Insert Payment
      const paymentRef = doc(db, 'payments', paymentId);
      transaction.set(paymentRef, createdPayment);

      // 7. Insert Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logRef = doc(db, 'auditLogs', logId);
      transaction.set(logRef, {
        id: logId,
        businessId: params.businessId,
        userId: params.userId,
        userEmail: params.userName || 'utilisateur',
        action: 'REMBOURSEMENT_REÇU',
        details: `Remboursement ${reference} de ${amount} FCFA reçu pour crédit ${credit.reference} (${params.customerName}). Nouveau solde restant: ${newRemainingAmount} FCFA.`,
        timestamp: now,
      });
    });

    if (!createdPayment) {
      throw new Error('Erreur inattendue lors de la transaction.');
    }

    return createdPayment;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payments/${paymentId}`);
  }
}
