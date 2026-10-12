import React, { useState, useRef, useMemo } from 'react';
import { Customer, Credit, Payment, Business } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  formatFCFA,
  formatDateBamako,
  PAYMENT_METHOD_LABELS,
  exportToCSV
} from '../lib/utils';
import { generateReportPDF } from '../lib/pdf';
import { useReactToPrint } from 'react-to-print';
import { PrintableReportA4 } from './PrintableReportA4';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Users,
  CreditCard,
  Receipt,
  Clock,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { customers, credits, payments, activeBusiness } = useAuth();

  const [activeReportTab, setActiveReportTab] = useState<
    'debtors' | 'credits' | 'payments' | 'overdue' | 'period'
  >('debtors');

  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const reportA4Ref = useRef<HTMLDivElement>(null);

  // Debtor clients
  const debtorCustomers = customers.filter((c) => c.currentDebt > 0);
  const totalDebtorDebt = debtorCustomers.reduce((s, c) => s + c.currentDebt, 0);

  // Overdue credits
  const overdueCredits = credits.filter((c) => c.status === 'overdue' && c.remainingAmount > 0);
  const totalOverdueAmount = overdueCredits.reduce((s, c) => s + c.remainingAmount, 0);

  // Filter credits & payments by date period
  const filterByPeriod = (dateString: string) => {
    if (periodFilter === 'all') return true;
    const itemDate = new Date(dateString);
    const now = new Date();

    if (periodFilter === 'today') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }
    if (periodFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return itemDate >= oneWeekAgo;
    }
    if (periodFilter === 'month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }
    return true;
  };

  const periodCredits = credits.filter((c) => filterByPeriod(c.createdAt));
  const periodPayments = payments.filter((p) => filterByPeriod(p.createdAt));

  const periodCreditSum = periodCredits.reduce((s, c) => s + c.amount, 0);
  const periodPaymentSum = periodPayments.reduce((s, p) => s + p.amount, 0);

  // Active Report Data Configuration for A4 Print & PDF
  const currentReportData = useMemo(() => {
    if (activeReportTab === 'debtors') {
      return {
        title: `Rapport des Clients Débiteurs (${debtorCustomers.length})`,
        headers: ['Nom du Client', 'Téléphone', 'Adresse', 'Total Crédits', 'Total Remboursé', 'Solde Restant Dû'],
        rows: debtorCustomers.map((c) => [
          c.name,
          c.phone,
          c.address || '—',
          formatFCFA(c.totalCredit),
          formatFCFA(c.totalPaid),
          formatFCFA(c.currentDebt)
        ]),
        summary: `Créances totales à recouvrer auprès des clients : ${formatFCFA(totalDebtorDebt)}`,
      };
    } else if (activeReportTab === 'credits') {
      return {
        title: `Registre des Crédits Accordés (${credits.length})`,
        headers: ['Réf', 'Date', 'Client', 'Marchandise', 'Montant Initial', 'Total Payé', 'Solde Restant', 'Statut'],
        rows: credits.map((c) => [
          c.reference,
          formatDateBamako(c.creditDate),
          c.customerName,
          c.description,
          formatFCFA(c.amount),
          formatFCFA(c.totalPaid),
          formatFCFA(c.remainingAmount),
          c.status === 'paid' ? 'Soldé' : c.status === 'overdue' ? 'En retard' : 'En cours'
        ]),
        summary: `Volume total des crédits octroyés : ${formatFCFA(credits.reduce((s, c) => s + c.amount, 0))}`,
      };
    } else if (activeReportTab === 'payments') {
      return {
        title: `Journal des Remboursements Encaissés (${payments.length})`,
        headers: ['N° Reçu', 'Date', 'Client', 'Mode de Règlement', 'Réf Crédit', 'Montant Versé', 'Solde Restant Après'],
        rows: payments.map((p) => [
          p.reference,
          formatDateBamako(p.paymentDate, true),
          p.customerName,
          PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
          p.creditReference || '—',
          formatFCFA(p.amount),
          formatFCFA(p.remainingAfter)
        ]),
        summary: `Total général des encaissements enregistrés : ${formatFCFA(payments.reduce((s, p) => s + p.amount, 0))}`,
      };
    } else if (activeReportTab === 'overdue') {
      return {
        title: `Rapport des Crédits en Retard (${overdueCredits.length})`,
        headers: ['Réf Crédit', 'Client', 'Téléphone', 'Date Accord', 'Échéance Dépassée', 'Solde en Souffrance'],
        rows: overdueCredits.map((c) => [
          c.reference,
          c.customerName,
          c.customerPhone || '—',
          formatDateBamako(c.creditDate),
          formatDateBamako(c.dueDate),
          formatFCFA(c.remainingAmount)
        ]),
        summary: `Total des créances dont la date d'échéance est dépassée : ${formatFCFA(totalOverdueAmount)}`,
      };
    } else {
      return {
        title: `Synthèse Comptable par Période (${periodFilter})`,
        headers: ['Indicateur Financier', 'Période Analysée', 'Montant en FCFA', 'Nombre d\'Opérations'],
        rows: [
          ['Crédits accordés', periodFilter, formatFCFA(periodCreditSum), `${periodCredits.length} opération(s)`],
          ['Remboursements encaissés', periodFilter, formatFCFA(periodPaymentSum), `${periodPayments.length} versement(s)`],
          ['Solde net de trésorerie', periodFilter, formatFCFA(periodPaymentSum - periodCreditSum), '-']
        ],
        summary: `Bilan net sur la période : ${formatFCFA(periodPaymentSum - periodCreditSum)} (${periodPaymentSum >= periodCreditSum ? 'Flux positif' : 'Déficit de trésorerie'})`,
      };
    }
  }, [
    activeReportTab,
    debtorCustomers,
    totalDebtorDebt,
    credits,
    payments,
    overdueCredits,
    totalOverdueAmount,
    periodFilter,
    periodCredits,
    periodPayments,
    periodCreditSum,
    periodPaymentSum
  ]);

  // react-to-print A4 printer hook
  const handlePrintA4 = useReactToPrint({
    contentRef: reportA4Ref,
    documentTitle: `${currentReportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}`,
    pageStyle: '@page { size: A4 landscape; margin: 12mm; }',
  });

  const handleDownloadPDFReport = () => {
    if (!activeBusiness) return;
    generateReportPDF(
      activeBusiness,
      currentReportData.title,
      currentReportData.headers,
      currentReportData.rows,
      currentReportData.summary
    );
  };

  // CSV Exporters
  const handleExportDebtorsCSV = () => {
    const headers = ['Nom du Client', 'Téléphone', 'Adresse', 'Total Crédits Accordés', 'Total Remboursé', 'Solde Restant Dû', 'Statut'];
    const rows = debtorCustomers.map((c) => [
      c.name,
      c.phone,
      c.address || '',
      c.totalCredit,
      c.totalPaid,
      c.currentDebt,
      c.status === 'active' ? 'Actif' : 'Archivé'
    ]);
    exportToCSV(`DDS_Clients_Debiteurs_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handleExportCreditsCSV = () => {
    const headers = ['Référence', 'Date', 'Client', 'Description', 'Montant Initial (FCFA)', 'Total Payé', 'Solde Restant (FCFA)', 'Échéance', 'Statut'];
    const rows = credits.map((c) => [
      c.reference,
      c.creditDate,
      c.customerName,
      c.description,
      c.amount,
      c.totalPaid,
      c.remainingAmount,
      c.dueDate || '',
      c.status === 'paid' ? 'Soldé' : c.status === 'overdue' ? 'En retard' : 'En cours'
    ]);
    exportToCSV(`DDS_Credits_Accordes_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handleExportPaymentsCSV = () => {
    const headers = ['N° Reçu', 'Date', 'Client', 'Réf Crédit', 'Mode de Règlement', 'Montant Encaissé (FCFA)', 'Solde Restant Après'];
    const rows = payments.map((p) => [
      p.reference,
      p.paymentDate,
      p.customerName,
      p.creditReference || '',
      PAYMENT_METHOD_LABELS[p.paymentMethod],
      p.amount,
      p.remainingAfter
    ]);
    exportToCSV(`DDS_Remboursements_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handleExportPeriodSummaryCSV = () => {
    const headers = ['Indicateur', 'Période', 'Montant (FCFA)', 'Nombre d\'opérations'];
    const rows = [
      ['Crédits accordés', periodFilter, periodCreditSum, periodCredits.length],
      ['Remboursements encaissés', periodFilter, periodPaymentSum, periodPayments.length],
      ['Différence nette', periodFilter, periodPaymentSum - periodCreditSum, '-']
    ];
    exportToCSV(`DDS_Resume_Periode_${periodFilter}_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handleExportCurrentCSV = () => {
    setShowExportMenu(false);
    if (activeReportTab === 'debtors') handleExportDebtorsCSV();
    else if (activeReportTab === 'credits') handleExportCreditsCSV();
    else if (activeReportTab === 'payments') handleExportPaymentsCSV();
    else if (activeReportTab === 'overdue') handleExportCreditsCSV();
    else handleExportPeriodSummaryCSV();
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden printable A4 report component for react-to-print */}
      {activeBusiness && (
        <div className="hidden">
          <PrintableReportA4
            ref={reportA4Ref}
            business={activeBusiness}
            title={currentReportData.title}
            headers={currentReportData.headers}
            rows={currentReportData.rows}
            summaryText={currentReportData.summary}
          />
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-cyan-400" />
            Rapports & Synthèses Financières
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Génération automatique de rapports A4, fiches comptables et exports de données.
          </p>
        </div>

        {/* Simplified Action Toolbar: Single Main Button Visible + Secondary Menu */}
        <div className="flex items-center gap-2 relative">
          {/* THE SINGLE PRIMARY BUTTON */}
          <button
            onClick={handleDownloadPDFReport}
            title="Télécharger ce rapport en document PDF format A4"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PDF (A4)</span>
          </button>

          {/* Secondary Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <span>Options d'export</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handlePrintA4();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-cyan-300 hover:bg-slate-800 transition text-left cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Imprimer en direct (A4)</span>
                </button>

                <button
                  onClick={handleExportCurrentCSV}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition text-left cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Exporter le tableau en Excel (CSV)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        {[
          { id: 'debtors', label: '1. Clients Débiteurs', count: debtorCustomers.length },
          { id: 'credits', label: '2. Crédits Accordés', count: credits.length },
          { id: 'payments', label: '3. Remboursements', count: payments.length },
          { id: 'overdue', label: '4. Crédits en Retard', count: overdueCredits.length },
          { id: 'period', label: '5. Résumé par Période', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeReportTab === tab.id
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeReportTab === tab.id
                    ? 'bg-slate-950 text-cyan-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Report 1: Clients Débiteurs */}
      {activeReportTab === 'debtors' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-bold text-white">
              Liste des Clients avec Dette en Cours ({debtorCustomers.length})
            </p>
            <p className="text-xs text-rose-400 mt-0.5">
              Total des créances à recouvrer : <strong>{formatFCFA(totalDebtorDebt)}</strong>
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Nom du Client</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Adresse</th>
                  <th className="p-4">Total Crédits</th>
                  <th className="p-4">Total Remboursé</th>
                  <th className="p-4 text-right">Solde Dû (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {debtorCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucun client débiteur. Tous les crédits sont à jour !
                    </td>
                  </tr>
                ) : (
                  debtorCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white">{cust.name}</td>
                      <td className="p-4 text-slate-400">{cust.phone}</td>
                      <td className="p-4 text-slate-500">{cust.address || '—'}</td>
                      <td className="p-4">{formatFCFA(cust.totalCredit)}</td>
                      <td className="p-4 text-emerald-400">{formatFCFA(cust.totalPaid)}</td>
                      <td className="p-4 text-right font-black text-rose-400">
                        {formatFCFA(cust.currentDebt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Crédits Accordés */}
      {activeReportTab === 'credits' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-bold text-white">Registre exhaustif des crédits accordés</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Total accordé : {formatFCFA(credits.reduce((s, c) => s + c.amount, 0))}
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Réf</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Marchandise</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Remboursé</th>
                  <th className="p-4">Solde</th>
                  <th className="p-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {credits.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-cyan-400">{c.reference}</td>
                    <td className="p-4 text-slate-400">{formatDateBamako(c.creditDate)}</td>
                    <td className="p-4 font-bold text-white">{c.customerName}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{c.description}</td>
                    <td className="p-4 font-semibold text-slate-200">{formatFCFA(c.amount)}</td>
                    <td className="p-4 text-emerald-400">{formatFCFA(c.totalPaid)}</td>
                    <td className="p-4 font-black text-rose-400">{formatFCFA(c.remainingAmount)}</td>
                    <td className="p-4 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          c.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {c.status === 'paid' ? 'Soldé' : c.status === 'overdue' ? 'En retard' : 'En cours'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Remboursements */}
      {activeReportTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-bold text-white">Journal des encaissements</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Total encaissé : {formatFCFA(payments.reduce((s, p) => s + p.amount, 0))}
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">N° Reçu</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Réf Crédit</th>
                  <th className="p-4">Montant Versé</th>
                  <th className="p-4 text-right">Solde Après</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-emerald-400">{p.reference}</td>
                    <td className="p-4 text-slate-400">{formatDateBamako(p.paymentDate, true)}</td>
                    <td className="p-4 font-bold text-white">{p.customerName}</td>
                    <td className="p-4 text-slate-300">{PAYMENT_METHOD_LABELS[p.paymentMethod]}</td>
                    <td className="p-4 text-slate-400">{p.creditReference || '—'}</td>
                    <td className="p-4 font-bold text-emerald-400">+{formatFCFA(p.amount)}</td>
                    <td className="p-4 text-right text-slate-400">{formatFCFA(p.remainingAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Crédits en Retard */}
      {activeReportTab === 'overdue' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-300">
            <div>
              <p className="text-xs font-bold">
                Crédits dont la date d'échéance est dépassée ({overdueCredits.length})
              </p>
              <p className="text-xs mt-0.5">
                Total en souffrance : <strong>{formatFCFA(totalOverdueAmount)}</strong>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Réf Crédit</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Date Accord</th>
                  <th className="p-4">Échéance Dépassement</th>
                  <th className="p-4 text-right">Reste Dû (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {overdueCredits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucun crédit en retard. Toutes les échéances sont respectées !
                    </td>
                  </tr>
                ) : (
                  overdueCredits.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-bold text-rose-400">{c.reference}</td>
                      <td className="p-4 font-bold text-white">{c.customerName}</td>
                      <td className="p-4 text-slate-400">{c.customerPhone || '—'}</td>
                      <td className="p-4 text-slate-400">{formatDateBamako(c.creditDate)}</td>
                      <td className="p-4 font-bold text-rose-400">
                        {formatDateBamako(c.dueDate)}
                      </td>
                      <td className="p-4 text-right font-black text-rose-400">
                        {formatFCFA(c.remainingAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 5: Résumé par Période */}
      {activeReportTab === 'period' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Choisir la période :</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'today', label: "Aujourd'hui" },
                  { id: 'week', label: '7 derniers jours' },
                  { id: 'month', label: 'Ce mois-ci' },
                  { id: 'all', label: 'Tout l’historique' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriodFilter(p.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      periodFilter === p.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric cards for the period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Crédits Accordés sur la période</p>
              <p className="text-2xl font-black text-cyan-400 mt-2">{formatFCFA(periodCreditSum)}</p>
              <p className="text-xs text-slate-500 mt-1">{periodCredits.length} opération(s)</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Remboursements Reçus sur la période</p>
              <p className="text-2xl font-black text-emerald-400 mt-2">{formatFCFA(periodPaymentSum)}</p>
              <p className="text-xs text-slate-500 mt-1">{periodPayments.length} versement(s)</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Solde Net Encaissé / Accordé</p>
              <p className={`text-2xl font-black mt-2 ${periodPaymentSum >= periodCreditSum ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatFCFA(periodPaymentSum - periodCreditSum)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {periodPaymentSum >= periodCreditSum ? 'Flux positif' : 'Crédits supérieurs aux encaissements'}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
