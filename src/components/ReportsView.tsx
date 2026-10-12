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
  Users,
  CreditCard,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { customers, credits, payments, activeBusiness } = useAuth();

  const [activeReportTab, setActiveReportTab] = useState<'debtors' | 'credits' | 'payments'>('debtors');
  const reportA4Ref = useRef<HTMLDivElement>(null);

  // Debtor clients
  const debtorCustomers = customers.filter((c) => c.currentDebt > 0);
  const totalDebtorDebt = debtorCustomers.reduce((s, c) => s + c.currentDebt, 0);
  const totalCreditGranted = credits.reduce((s, c) => s + c.amount, 0);
  const totalRefundsReceived = payments.reduce((s, p) => s + p.amount, 0);
  const recoveryRate = totalCreditGranted > 0
    ? Math.min(100, Math.round((totalRefundsReceived / totalCreditGranted) * 100))
    : 100;

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
        summary: `Créances totales restant à recouvrer : ${formatFCFA(totalDebtorDebt)}`,
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
        summary: `Volume total des crédits octroyés : ${formatFCFA(totalCreditGranted)}`,
      };
    } else {
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
        summary: `Total des encaissements enregistrés : ${formatFCFA(totalRefundsReceived)}`,
      };
    }
  }, [
    activeReportTab,
    debtorCustomers,
    totalDebtorDebt,
    credits,
    totalCreditGranted,
    payments,
    totalRefundsReceived
  ]);

  // react-to-print hook on off-screen mounted container
  const handleReactToPrint = useReactToPrint({
    contentRef: reportA4Ref,
    documentTitle: `${currentReportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}`,
    pageStyle: '@page { size: A4 landscape; margin: 12mm; }',
  });

  const handlePrint = () => {
    try {
      if (reportA4Ref.current) {
        handleReactToPrint();
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    if (!activeBusiness) return;
    generateReportPDF(
      activeBusiness,
      currentReportData.title,
      currentReportData.headers,
      currentReportData.rows,
      currentReportData.summary
    );
  };

  const handleExportCSV = () => {
    const filename = `DDS_Rapport_${activeReportTab}_${new Date().toISOString().substring(0, 10)}`;
    exportToCSV(filename, currentReportData.headers, currentReportData.rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Off-screen fully rendered printable sheet for react-to-print */}
      {activeBusiness && (
        <div style={{ position: 'fixed', left: '-99999px', top: '-99999px', width: '297mm' }}>
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
            Rapports & Relevés Officiels A4
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Statistiques financières de la boutique, relevés de créances et documents imprimables.
          </p>
        </div>

        {/* Action Buttons: Simple, Clean and Working */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Rapport (A4)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Télécharger PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Dettes à Recouvrer</p>
          <p className="text-lg sm:text-xl font-black text-rose-400 mt-1">
            {formatFCFA(totalDebtorDebt)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {debtorCustomers.length} client(s) débiteur(s)
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Crédits Accordés</p>
          <p className="text-lg sm:text-xl font-black text-cyan-400 mt-1">
            {formatFCFA(totalCreditGranted)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {credits.length} crédit(s) enregistrés
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Remboursements</p>
          <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
            {formatFCFA(totalRefundsReceived)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {payments.length} encaissement(s)
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Taux de Recouvrement</p>
          <p className="text-lg sm:text-xl font-black text-teal-400 mt-1">
            {recoveryRate}%
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Efficacité de recouvrement
          </p>
        </div>
      </div>

      {/* Clean Report Selector Tabs (Only 3 simple direct categories) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveReportTab('debtors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReportTab === 'debtors'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clients Débiteurs ({debtorCustomers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('credits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReportTab === 'credits'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Tous les Crédits ({credits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReportTab === 'payments'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Tous les Versements ({payments.length})</span>
        </button>
      </div>

      {/* Report Data Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {currentReportData.title}
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {currentReportData.summary}
          </span>
        </div>

        <div className="overflow-x-auto">
          {currentReportData.rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Aucune donnée à afficher dans cette catégorie.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  {currentReportData.headers.map((h, i) => (
                    <th key={i} className="py-3 px-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentReportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-slate-200">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
