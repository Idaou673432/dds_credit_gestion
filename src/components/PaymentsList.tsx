import React, { useState } from 'react';
import { Payment, Credit, Business } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { NewPaymentModal } from './NewPaymentModal';
import {
  Receipt,
  Search,
  Plus,
  Calendar,
  User,
  CreditCard,
  Printer,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface PaymentsListProps {
  isNewPaymentModalOpen: boolean;
  preselectedCreditForPayment?: Credit | null;
  onCloseNewPaymentModal: () => void;
  onOpenNewPaymentModal: () => void;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({
  isNewPaymentModalOpen,
  preselectedCreditForPayment,
  onCloseNewPaymentModal,
  onOpenNewPaymentModal,
}) => {
  const { payments, credits, activeBusiness } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  const filteredPayments = payments.filter((pay) => {
    const matchSearch =
      pay.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pay.creditReference && pay.creditReference.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (methodFilter === 'all') return true;
    return pay.paymentMethod === methodFilter;
  });

  const totalFilteredAmount = filteredPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Remboursements Encaissés ({payments.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historique des encaissements, génération de reçus officiels et suivi des modes de règlement.
          </p>
        </div>

        <button
          onClick={onOpenNewPaymentModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Encaisser un Remboursement
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par client, référence reçu (REC-...) ou crédit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Payment Method Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'cash', label: 'Espèces' },
            { id: 'orange_money', label: 'Orange Money' },
            { id: 'moov_money', label: 'Moov Money' },
            { id: 'bank_transfer', label: 'Virement' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                methodFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Summary */}
      <div className="px-4 py-2 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between text-xs text-slate-400">
        <span>{filteredPayments.length} versement(s) affiché(s)</span>
        <span>
          Total encaissé filtré :{' '}
          <strong className="text-emerald-400 font-bold">{formatFCFA(totalFilteredAmount)}</strong>
        </span>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Aucun versement trouvé</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm
              ? 'Aucun reçu ne correspond à votre recherche.'
              : 'Aucun remboursement enregistré pour le moment.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenNewPaymentModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition cursor-pointer"
            >
              Encaisser un premier versement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              onClick={() => setSelectedPaymentForReceipt(payment)}
              className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition shadow-lg cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800/40">
                    {payment.reference}
                  </span>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                  </span>

                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                    {payment.customerName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formatDateBamako(payment.paymentDate, true)}
                  </span>

                  {payment.creditReference && (
                    <span>
                      Réf Crédit : <strong className="text-slate-300">{payment.creditReference}</strong>
                    </span>
                  )}
                </div>

                {payment.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    Note : {payment.notes}
                  </p>
                )}
              </div>

              {/* Right Balances & Action */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 flex-shrink-0">
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400">Montant encaissé :</p>
                  <p className="text-base font-black text-emerald-400">
                    +{formatFCFA(payment.amount)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Solde restant après : {formatFCFA(payment.remainingAfter)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPaymentForReceipt(payment);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Voir le Reçu</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* New Payment Modal */}
      {isNewPaymentModalOpen && (
        <NewPaymentModal
          preselectedCredit={preselectedCreditForPayment}
          onClose={onCloseNewPaymentModal}
          onSuccess={(newPayment) => {
            onCloseNewPaymentModal();
            setSelectedPaymentForReceipt(newPayment);
          }}
        />
      )}

      {/* Payment Receipt Modal */}
      {selectedPaymentForReceipt && activeBusiness && (
        <PaymentReceiptModal
          payment={selectedPaymentForReceipt}
          credit={credits.find((c) => c.id === selectedPaymentForReceipt.creditId)}
          business={activeBusiness}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}

    </div>
  );
};
