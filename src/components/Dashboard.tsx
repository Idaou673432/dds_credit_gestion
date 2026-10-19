import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import {
  Plus,
  Receipt,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { Credit, Payment } from '../types';

interface DashboardProps {
  onOpenNewCustomer: () => void;
  onOpenNewCredit: () => void;
  onOpenNewPayment: (prefillCredit?: Credit) => void;
  onOpenWhatsApp: (customerName: string, phone: string, amount: number, dueDate?: string) => void;
  onSelectTab: (tab: 'customers' | 'credits' | 'payments' | 'reports') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewCustomer,
  onOpenNewCredit,
  onOpenNewPayment,
  onOpenWhatsApp,
  onSelectTab,
}) => {
  const { customers, credits, payments, activeBusiness, userRole } = useAuth();

  // Financial calculations
  const totalRemainingDebt = credits.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
  const totalCreditGranted = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalRefundsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const debtorCustomersCount = customers.filter((c) => (c.currentDebt || 0) > 0).length;

  const recoveryRate =
    totalCreditGranted > 0
      ? Math.min(100, Math.round((totalRefundsReceived / totalCreditGranted) * 100))
      : 100;

  // Monthly stats
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const currentMonthReceived = payments
    .filter((p) => p.createdAt.startsWith(currentMonthKey))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Urgent and overdue debts
  const todayDateStr = new Date().toISOString().substring(0, 10);
  const urgentCredits = credits
    .filter((c) => c.status !== 'paid' && c.remainingAmount > 0 && c.dueDate)
    .map((c) => {
      const isDueToday = c.dueDate === todayDateStr;
      const isPast = (c.dueDate || '') < todayDateStr;
      const diffTime = new Date(todayDateStr).getTime() - new Date(c.dueDate!).getTime();
      const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      return { ...c, isDueToday, isPast, daysOverdue };
    })
    .filter((c) => c.isDueToday || c.isPast)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Recent operations
  type Operation =
    | { type: 'credit'; data: Credit; date: string }
    | { type: 'payment'; data: Payment; date: string };

  const recentOperations: Operation[] = [
    ...credits.map((c) => ({ type: 'credit' as const, data: c, date: c.createdAt })),
    ...payments.map((p) => ({ type: 'payment' as const, data: p, date: p.createdAt })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const canCreateCredit = userRole === 'owner' || userRole === 'manager';

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Single Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Tableau de Bord
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeBusiness?.name} · {activeBusiness?.city || 'Bamako'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreateCredit && (
            <button
              onClick={onOpenNewCredit}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Vendre à Crédit</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewPayment()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Encaisser un paiement</span>
          </button>

          {canCreateCredit && (
            <button
              onClick={onOpenNewCustomer}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold transition cursor-pointer bg-white"
            >
              <UserPlus className="w-4 h-4 text-slate-600" />
              <span>+ Nouveau Client</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Crisp Financial Metrics (No clutter, no decorative pills) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Dettes en cours (Créances)</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-amber-800 mt-1">
            {formatFCFA(totalRemainingDebt)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            À recouvrer
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Encaissé ce mois</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 mt-1">
            {formatFCFA(currentMonthReceived)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Remboursements reçus
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Clients débiteurs</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900 mt-1">
            {debtorCustomersCount} <span className="text-xs font-normal text-slate-500">/ {customers.length}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Ayant un solde dû
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Taux de recouvrement</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900 mt-1">
            {recoveryRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Total crédits soldés
          </p>
        </div>

      </div>

      {/* Urgent Overdue Alert Section */}
      {urgentCredits.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Échéances urgentes ({urgentCredits.length})
              </h3>
              <p className="text-xs text-amber-700">
                Crédits arrivés à terme nécessitant un encaissement ou une relance
              </p>
            </div>
            <button
              onClick={() => onSelectTab('credits')}
              className="text-xs font-medium text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Voir la liste
            </button>
          </div>

          <div className="space-y-2">
            {urgentCredits.slice(0, 3).map((uc) => (
              <div
                key={uc.id}
                className="p-3 rounded-lg bg-white border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {uc.customerName}
                    </p>
                    <span className="text-[10px] text-amber-800 font-medium font-mono">
                      {uc.isDueToday ? "Échéance aujourd'hui" : `+${uc.daysOverdue}j retard`}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-mono font-bold mt-0.5">
                    Reste : {formatFCFA(uc.remainingAmount)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {uc.customerPhone && (
                    <button
                      onClick={() =>
                        onOpenWhatsApp(
                          uc.customerName,
                          uc.customerPhone || '',
                          uc.remainingAmount,
                          uc.dueDate
                        )
                      }
                      title="Relance WhatsApp"
                      className="p-1.5 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenNewPayment(uc)}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Encaisser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Échéances à venir & Dernières Opérations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Box 1: Dernières Opérations */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Dernières Opérations
            </h3>
            <button
              onClick={() => onSelectTab('payments')}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              Historique complet →
            </button>
          </div>

          {recentOperations.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucune opération enregistrée pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOperations.map((op, idx) => {
                const isPayment = op.type === 'payment';
                return (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {op.data.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {isPayment
                          ? `Remboursement (${PAYMENT_METHOD_LABELS[op.data.paymentMethod]})`
                          : `Crédit : ${op.data.description}`}
                        {' · '}
                        {formatDateBamako(op.date, true)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-mono font-bold ${
                          isPayment ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isPayment ? '+' : ''}{formatFCFA(op.data.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Box 2: Liste des Débiteurs Prioritaires */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Principaux Débiteurs
            </h3>
            <button
              onClick={() => onSelectTab('customers')}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              Tous les clients →
            </button>
          </div>

          {customers.filter((c) => c.currentDebt > 0).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucun client débiteur actuellement. Tous les comptes sont à jour.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customers
                .filter((c) => c.currentDebt > 0)
                .sort((a, b) => b.currentDebt - a.currentDebt)
                .slice(0, 5)
                .map((cust) => {
                  const unpaidCredit = credits.find(
                    (c) => c.customerId === cust.id && c.remainingAmount > 0
                  );
                  return (
                    <div
                      key={cust.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {cust.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {cust.phone} {cust.address ? `· ${cust.address}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono font-bold text-amber-800">
                          {formatFCFA(cust.currentDebt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenNewPayment(unpaidCredit)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition cursor-pointer"
                        >
                          Encaisser
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
