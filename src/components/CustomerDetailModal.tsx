import React from 'react';
import { Customer, Credit, Payment, Business } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { generateCustomerStatementPDF } from '../lib/pdf';
import { printStatementDirect, printSaleThermalDirect } from '../lib/print';
import { useAuth } from '../context/AuthContext';
import { deleteCustomer, deleteCredit, deletePayment } from '../services/creditService';
import {
  X,
  Phone,
  MapPin,
  FileText,
  MessageCircle,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Receipt,
  User,
  Clock,
  Trash2,
  ShoppingBag
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer;
  business: Business;
  credits: Credit[];
  payments: Payment[];
  onClose: () => void;
  onOpenNewCredit: (customer: Customer) => void;
  onOpenNewPayment: (credit: Credit) => void;
  onOpenWhatsApp: (customerName: string, phone: string, amount: number) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  business,
  credits,
  payments,
  onClose,
  onOpenNewCredit,
  onOpenNewPayment,
  onOpenWhatsApp,
}) => {
  const { userRole, currentUser, sales } = useAuth();
  const canCreateCredit = userRole === 'owner' || userRole === 'manager';

  const customerCredits = credits.filter((c) => c.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);
  const customerSales = (sales || []).filter(
    (s) => s.customerId === customer.id || (s.customerPhone && s.customerPhone === customer.phone)
  );

  const hasDebt = customer.currentDebt > 0;
  const firstUnpaidCredit = customerCredits.find((c) => c.remainingAmount > 0);

  const handleDownloadStatement = () => {
    generateCustomerStatementPDF(business, customer, customerCredits, customerPayments);
  };

  const handlePrintStatement = () => {
    printStatementDirect(business, customer, customerCredits, customerPayments);
  };

  const handleDeleteThisCustomer = async () => {
    if (!currentUser) return;
    const ok = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement le client ${customer.name} ? Cette action effacera également son historique.`
    );
    if (ok) {
      await deleteCustomer(
        customer.id,
        business.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'utilisateur'
      );
      onClose();
    }
  };

  const handleDeleteCreditItem = async (cred: Credit) => {
    if (!currentUser) return;
    const ok = window.confirm(`Supprimer le crédit ${cred.reference} (${formatFCFA(cred.amount)}) ?`);
    if (ok) {
      await deleteCredit(
        cred.id,
        business.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'utilisateur'
      );
    }
  };

  const handleDeletePaymentItem = async (pay: Payment) => {
    if (!currentUser) return;
    const ok = window.confirm(`Supprimer le versement ${pay.reference} (${formatFCFA(pay.amount)}) ?`);
    if (ok) {
      await deletePayment(
        pay.id,
        business.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'utilisateur'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 max-h-[94vh] flex flex-col my-0 sm:my-8">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {customer.name[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{customer.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    customer.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {customer.status === 'active' ? 'Actif' : 'Archivé'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-600" /> {customer.phone}
                {customer.address && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {customer.address}
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="p-5 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Total Crédits</p>
            <p className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatFCFA(customer.totalCredit)}
            </p>
            <p className="text-[11px] text-slate-400">{customerCredits.length} crédit(s) accordé(s)</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Total Remboursé</p>
            <p className="text-lg font-bold font-mono text-emerald-700 mt-1">
              {formatFCFA(customer.totalPaid)}
            </p>
            <p className="text-[11px] text-slate-400">{customerPayments.length} versement(s)</p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              hasDebt
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <p className="text-xs font-semibold">Solde Restant Dû</p>
            <p className="text-lg font-bold font-mono mt-1">
              {formatFCFA(customer.currentDebt)}
            </p>
            <p className="text-[11px] opacity-85">
              {hasDebt ? 'Dette active en cours' : 'À jour / Aucune dette'}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap bg-slate-50">
          <div className="flex items-center gap-2">
            {hasDebt && firstUnpaidCredit ? (
              <button
                onClick={() => onOpenNewPayment(firstUnpaidCredit)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Encaisser un versement</span>
              </button>
            ) : canCreateCredit ? (
              <button
                onClick={() => onOpenNewCredit(customer)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Nouveau Crédit</span>
              </button>
            ) : null}

            {hasDebt && onOpenWhatsApp && (
              <button
                onClick={() => onOpenWhatsApp(customer.name, customer.phone, customer.currentDebt)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStatement}
              title="Imprimer le relevé de compte"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleDownloadStatement}
              title="Télécharger le relevé de compte en PDF"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Relevé PDF</span>
            </button>

            {canCreateCredit && (
              <button
                onClick={handleDeleteThisCustomer}
                title="Supprimer définitivement ce client"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Body tabs or tables */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-slate-50">
          
          {/* Notes if any */}
          {customer.notes && (
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Notes commerçant :</span> {customer.notes}
            </div>
          )}

          {/* Factures & Ventes de ce client */}
          {customerSales.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                Factures & Ventes du client ({customerSales.length})
              </h4>

              <div className="space-y-2">
                {customerSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{sale.reference}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            sale.remainingAmount <= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentType === 'credit'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sale.remainingAmount <= 0
                            ? 'SOLDÉ'
                            : sale.paymentType === 'credit'
                            ? 'À CRÉDIT'
                            : 'PARTIEL'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateBamako(sale.createdAt, true)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 truncate max-w-md">
                        {sale.items.map((i) => `${i.quantity}x ${i.description}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {formatFCFA(sale.totalAmount)}
                        </p>
                        {sale.remainingAmount > 0 && (
                          <p className="text-[11px] font-mono font-bold text-amber-800">
                            Reste : {formatFCFA(sale.remainingAmount)}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => printSaleThermalDirect(business, sale, '58mm')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Imprimer le ticket"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ticket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credits Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-600" />
              Historique des Crédits accordés ({customerCredits.length})
            </h4>

            {customerCredits.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Aucun crédit enregistré pour ce client.</p>
            ) : (
              <div className="space-y-2">
                {customerCredits.map((credit) => (
                  <div
                    key={credit.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{credit.reference}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            credit.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : credit.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {credit.status === 'paid'
                            ? 'Soldé'
                            : credit.status === 'overdue'
                            ? 'En retard'
                            : 'En cours'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{credit.description}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Date : {formatDateBamako(credit.creditDate)}
                        {credit.dueDate && ` • Échéance : ${formatDateBamako(credit.dueDate)}`}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xs font-mono font-bold text-slate-900">{formatFCFA(credit.amount)}</p>
                      <p className="text-[11px] font-mono font-semibold text-amber-800">
                        Reste : {formatFCFA(credit.remainingAmount)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {credit.remainingAmount > 0 && (
                          <button
                            onClick={() => onOpenNewPayment(credit)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition cursor-pointer"
                          >
                            Rembourser
                          </button>
                        )}
                        <button
                          type="button"
                          title="Supprimer ce crédit"
                          onClick={() => handleDeleteCreditItem(credit)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Historique des Remboursements reçus ({customerPayments.length})
            </h4>

            {customerPayments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Aucun versement enregistré pour ce client.</p>
            ) : (
              <div className="space-y-2">
                {customerPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{payment.reference}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Reçu pour {payment.creditReference || 'crédit'} • {formatDateBamako(payment.paymentDate)}
                      </p>
                      {payment.notes && (
                        <p className="text-[11px] text-slate-500 italic">{payment.notes}</p>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xs font-mono font-bold text-emerald-700">+{formatFCFA(payment.amount)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Solde restant : {formatFCFA(payment.remainingAfter)}
                      </p>
                      <button
                        type="button"
                        title="Supprimer ce versement"
                        onClick={() => handleDeletePaymentItem(payment)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
