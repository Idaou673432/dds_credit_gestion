import React from 'react';
import { Customer, Credit, Payment, Business } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { generateCustomerStatementPDF } from '../lib/pdf';
import { printStatementDirect } from '../lib/print';
import { useAuth } from '../context/AuthContext';
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
  ChevronDown
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
  const { userRole } = useAuth();
  const canCreateCredit = userRole === 'owner' || userRole === 'manager';

  const customerCredits = credits.filter((c) => c.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  const hasDebt = customer.currentDebt > 0;
  const firstUnpaidCredit = customerCredits.find((c) => c.remainingAmount > 0);

  const handleDownloadStatement = () => {
    generateCustomerStatementPDF(business, customer, customerCredits, customerPayments);
  };

  const handlePrintStatement = () => {
    printStatementDirect(business, customer, customerCredits, customerPayments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 max-h-[94vh] flex flex-col my-0 sm:my-8 pb-safe">
        
        {/* Header */}
        <div className="p-6 bg-slate-850 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
              {customer.name[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    customer.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {customer.status === 'active' ? 'Actif' : 'Archivé'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" /> {customer.phone}
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
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="p-6 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Total Crédits</p>
            <p className="text-lg font-black text-cyan-400 mt-1">
              {formatFCFA(customer.totalCredit)}
            </p>
            <p className="text-[11px] text-slate-500">{customerCredits.length} engagement(s)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Total Remboursé</p>
            <p className="text-lg font-black text-emerald-400 mt-1">
              {formatFCFA(customer.totalPaid)}
            </p>
            <p className="text-[11px] text-slate-500">{customerPayments.length} versement(s)</p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              hasDebt
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <p className="text-xs font-semibold">Solde Restant Dû</p>
            <p className="text-lg font-black mt-1">
              {formatFCFA(customer.currentDebt)}
            </p>
            <p className="text-[11px] opacity-80">
              {hasDebt ? 'Dette active en cours' : 'À jour / Aucune dette'}
            </p>
          </div>
        </div>

        {/* Simple Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
          {hasDebt && firstUnpaidCredit ? (
            <button
              onClick={() => onOpenNewPayment(firstUnpaidCredit)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Encaisser un versement</span>
            </button>
          ) : canCreateCredit ? (
            <button
              onClick={() => onOpenNewCredit(customer)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Nouveau Crédit</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Fiche client</span>
          )}

          <button
            onClick={handleDownloadStatement}
            title="Télécharger le relevé de compte en PDF"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relevé PDF</span>
          </button>
        </div>

        {/* Body tabs or tables */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Notes if any */}
          {customer.notes && (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300">
              <span className="font-bold text-slate-200">Notes commerçant :</span> {customer.notes}
            </div>
          )}

          {/* Credits Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Historique des Crédits accordés ({customerCredits.length})
            </h4>

            {customerCredits.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">Aucun crédit enregistré.</p>
            ) : (
              <div className="space-y-2">
                {customerCredits.map((credit) => (
                  <div
                    key={credit.id}
                    className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{credit.reference}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            credit.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : credit.status === 'overdue'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {credit.status === 'paid'
                            ? 'Soldé'
                            : credit.status === 'overdue'
                            ? 'En retard'
                            : 'En cours'}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">{credit.description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Date : {formatDateBamako(credit.creditDate)}
                        {credit.dueDate && ` • Échéance : ${formatDateBamako(credit.dueDate)}`}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-xs font-black text-cyan-400">{formatFCFA(credit.amount)}</p>
                      <p className="text-[11px] text-rose-400 font-semibold">
                        Reste : {formatFCFA(credit.remainingAmount)}
                      </p>
                      {credit.remainingAmount > 0 && (
                        <button
                          onClick={() => onOpenNewPayment(credit)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer"
                        >
                          Rembourser
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Historique des Remboursements reçus ({customerPayments.length})
            </h4>

            {customerPayments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">Aucun versement enregistré.</p>
            ) : (
              <div className="space-y-2">
                {customerPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{payment.reference}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Reçu pour crédit {payment.creditReference || ''} • {formatDateBamako(payment.paymentDate)}
                      </p>
                      {payment.notes && (
                        <p className="text-[11px] text-slate-500 italic">{payment.notes}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-400">+{formatFCFA(payment.amount)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Solde restant après : {formatFCFA(payment.remainingAfter)}
                      </p>
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
