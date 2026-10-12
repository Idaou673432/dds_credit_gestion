import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  CreditCard,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight
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

  // Real-time calculations
  const totalRemainingDebt = credits.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
  const totalCreditGranted = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalRefundsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const debtorCustomersCount = customers.filter((c) => (c.currentDebt || 0) > 0).length;
  const overdueCreditsCount = credits.filter(
    (c) => c.status === 'overdue' && (c.remainingAmount || 0) > 0
  ).length;

  // Collection recovery rate percentage
  const recoveryRate =
    totalCreditGranted > 0
      ? Math.min(100, Math.round((totalRefundsReceived / totalCreditGranted) * 100))
      : 100;

  // Monthly stats
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const currentMonthGranted = credits
    .filter((c) => c.createdAt.startsWith(currentMonthKey))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const currentMonthReceived = payments
    .filter((p) => p.createdAt.startsWith(currentMonthKey))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyRecoveryRate =
    currentMonthGranted > 0
      ? Math.min(100, Math.round((currentMonthReceived / currentMonthGranted) * 100))
      : 100;

  // Due today and overdue calculations
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

  // Upcoming due dates (credits with dueDate that are still active and not paid)
  const upcomingCredits = credits
    .filter((c) => c.status !== 'paid' && c.remainingAmount > 0 && c.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 6);

  // Recent operations combining credits and payments
  type Operation =
    | { type: 'credit'; data: Credit; date: string }
    | { type: 'payment'; data: Payment; date: string };

  const recentOperations: Operation[] = [
    ...credits.map((c) => ({ type: 'credit' as const, data: c, date: c.createdAt })),
    ...payments.map((p) => ({ type: 'payment' as const, data: p, date: p.createdAt })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const canCreateCredit = userRole === 'owner' || userRole === 'manager';

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Tableau de Bord
            <span className="text-xs font-normal text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
              {activeBusiness?.city || 'Bamako'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestion financière en temps réel pour <strong className="text-slate-200">{activeBusiness?.name}</strong>.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            Nouveau client
          </button>

          {canCreateCredit && (
            <button
              onClick={onOpenNewCredit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Nouveau crédit
            </button>
          )}

          <button
            onClick={() => onOpenNewPayment()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            Nouveau remboursement
          </button>
        </div>
      </div>

      {/* Alert banner for urgent/overdue debts */}
      {urgentCredits.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/30 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Alertes de Recouvrement ({urgentCredits.length}) :</span>
                <span className="text-rose-400 font-extrabold">Échéances du jour & Retards</span>
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('credits')}
              className="text-xs font-semibold text-rose-300 hover:text-white underline cursor-pointer self-start sm:self-auto"
            >
              Voir tous les retards
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {urgentCredits.slice(0, 3).map((uc) => (
              <div
                key={uc.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/20 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{uc.customerName}</p>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        uc.isDueToday
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {uc.isDueToday ? "Aujourd'hui" : `+${uc.daysOverdue}j`}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-rose-400 mt-0.5">
                    Reste : {formatFCFA(uc.remainingAmount)}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {uc.customerPhone && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(uc.customerName, uc.customerPhone || '', uc.remainingAmount, uc.dueDate)}
                      title="Relance WhatsApp immédiate"
                      className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenNewPayment(uc)}
                    className="px-2 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    Encaisser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Total Dettes Restantes */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Dettes Restantes</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
            {formatFCFA(totalRemainingDebt)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            À recouvrer auprès des clients
          </p>
        </div>

        {/* Card 2: Total Crédits Accordés */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Crédits Accordés</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight">
            {formatFCFA(totalCreditGranted)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {credits.length} crédit{credits.length > 1 ? 's' : ''} au total
          </p>
        </div>

        {/* Card 3: Total Remboursements Reçus */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Remboursements Reçus</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            {formatFCFA(totalRefundsReceived)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {payments.length} versement{payments.length > 1 ? 's' : ''} encaissés
          </p>
        </div>

        {/* Card 4: Clients Débiteurs */}
        <div
          onClick={() => onSelectTab('customers')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Clients Débiteurs</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
            {debtorCustomersCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-cyan-400 transition">
            Sur {customers.length} client{customers.length > 1 ? 's' : ''} enregistrés <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Card 5: Crédits en Retard */}
        <div
          onClick={() => onSelectTab('credits')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Crédits en Retard</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
            {overdueCreditsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-rose-300 transition">
            Échéance dépassée <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Financial Health Chart & Recovery Rate */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Taux de Recouvrement des Dettes
            </h3>
            <p className="text-xs text-slate-400">
              Proportion des remboursements encaissés par rapport aux crédits totaux accordés.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-cyan-400">{recoveryRate}%</span>
            <span className="text-xs text-slate-400">recouvré</span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/60 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${recoveryRate}%` }}
            title={`Remboursé : ${formatFCFA(totalRefundsReceived)}`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span>Remboursements encaissés : <strong className="text-slate-200">{formatFCFA(totalRefundsReceived)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-500" />
            <span>Reste à percevoir : <strong className="text-slate-200">{formatFCFA(totalRemainingDebt)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-cyan-500" />
            <span>Volume total accordé : <strong className="text-slate-200">{formatFCFA(totalCreditGranted)}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid: Prochaines Échéances + Dernières Opérations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Prochaines Échéances */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Prochaines Échéances & Alertes
              </h3>
              <button
                onClick={() => onSelectTab('credits')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingCredits.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                Aucune échéance urgente en attente. Tout est à jour !
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingCredits.map((credit) => {
                  const isPast = credit.status === 'overdue';
                  return (
                    <div
                      key={credit.id}
                      className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-3 hover:border-slate-600 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {credit.customerName}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isPast
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isPast ? 'En retard' : 'À venir'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {credit.description} • Échéance : {formatDateBamako(credit.dueDate)}
                        </p>
                        <p className="text-xs font-extrabold text-rose-400 mt-1">
                          Reste : {formatFCFA(credit.remainingAmount)}
                        </p>
                      </div>

                      {/* Quick Actions for this debtor */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {credit.customerPhone && (
                          <button
                            onClick={() =>
                              onOpenWhatsApp(
                                credit.customerName,
                                credit.customerPhone || '',
                                credit.remainingAmount,
                                credit.dueDate
                              )
                            }
                            title="Envoyer un rappel par WhatsApp"
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenNewPayment(credit)}
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer"
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

        {/* Box 2: Dernières Opérations */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                Dernières Opérations Financières
              </h3>
              <button
                onClick={() => onSelectTab('reports')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
              >
                Journal complet <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {recentOperations.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Aucune opération enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentOperations.map((op, idx) => {
                  const isPayment = op.type === 'payment';
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-800/70 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl flex-shrink-0 ${
                            isPayment
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}
                        >
                          {isPayment ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">
                            {op.data.customerName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {isPayment
                              ? `Remboursement (${PAYMENT_METHOD_LABELS[op.data.paymentMethod]})`
                              : `Crédit : ${op.data.description}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-xs font-black ${
                            isPayment ? 'text-emerald-400' : 'text-cyan-400'
                          }`}
                        >
                          {isPayment ? '+' : ''}{formatFCFA(op.data.amount)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {formatDateBamako(op.date, true)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
