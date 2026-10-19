import React, { useState } from 'react';
import { Sale, Credit } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { printSaleThermalDirect, printSaleA4Direct } from '../lib/print';
import {
  Plus,
  Search,
  Printer,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageCircle,
  FileText,
  Filter,
  Eye,
  Banknote,
  DollarSign
} from 'lucide-react';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onOpenSaleReceipt: (sale: Sale) => void;
  onOpenPaymentForCredit?: (credit: Credit) => void;
  onOpenWhatsApp?: (name: string, phone: string, debt: number, dueDate?: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenNewSale,
  onOpenSaleReceipt,
  onOpenPaymentForCredit,
  onOpenWhatsApp,
}) => {
  const { sales, credits, activeBusiness, userRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Financial calculations from sales
  const totalSalesAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPaidCash = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalRemainingCredit = sales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);
  const creditSalesCount = sales.filter((s) => s.status !== 'paid' && s.remainingAmount > 0).length;

  // Filtered sales list
  const filteredSales = sales.filter((sale) => {
    // Status filter
    if (filterStatus === 'paid' && sale.status !== 'paid') return false;
    if (filterStatus === 'partial' && sale.status !== 'partial') return false;
    if (filterStatus === 'credit' && sale.status !== 'credit') return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchRef = (sale.reference || '').toLowerCase().includes(q);
    const matchCust = (sale.customerName || '').toLowerCase().includes(q);
    const matchPhone = (sale.customerPhone || '').includes(q);
    const matchItem = sale.items.some((item) => item.description.toLowerCase().includes(q));

    return matchRef || matchCust || matchPhone || matchItem;
  });

  const canCreateSale = userRole === 'owner' || userRole === 'manager' || userRole === 'cashier';

  return (
    <div className="space-y-5">
      
      {/* Top Banner & Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Ventes, Facturation & Archives
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeBusiness?.name} · Gestion des factures, règlements comptant et créances
          </p>
        </div>

        {canCreateSale && (
          <button
            onClick={onOpenNewSale}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouvelle Vente</span>
          </button>
        )}
      </div>

      {/* 4 Crisp Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Facturé */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Chiffre d'affaires total</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900 mt-1">
            {formatFCFA(totalSalesAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {sales.length} facture{sales.length > 1 ? 's' : ''} enregistrée{sales.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Metric 2: Encaissé au comptant */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Encaissé au comptant</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 mt-1">
            {formatFCFA(totalPaidCash)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Règlements immédiats
          </p>
        </div>

        {/* Metric 3: Reste à recouvrer */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Créances ventes à crédit</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-amber-800 mt-1">
            {formatFCFA(totalRemainingCredit)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {creditSalesCount} facture{creditSalesCount > 1 ? 's' : ''} avec solde dû
          </p>
        </div>

        {/* Metric 4: Taux de règlement */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Taux de recouvrement ventes</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900 mt-1">
            {totalSalesAmount > 0
              ? `${Math.round((totalPaidCash / totalSalesAmount) * 100)}%`
              : '100%'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Encaissé / Total facturé
          </p>
        </div>

      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par N° facture (ex: FAC-XXXX), client, article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all' as const, label: 'Toutes' },
              { id: 'paid' as const, label: 'Tout payé' },
              { id: 'partial' as const, label: 'Partiel' },
              { id: 'credit' as const, label: 'À crédit' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* List of Invoices & Sales */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Archives des Ventes & Factures ({filteredSales.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredSales.length} résultat{filteredSales.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">Aucune facture trouvée.</p>
            <p className="text-[11px] text-slate-400">
              {searchQuery
                ? 'Aucun résultat ne correspond à votre recherche.'
                : 'Commencez par enregistrer une vente via le bouton « + Nouvelle Vente ».'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSales.map((sale) => {
              const isSoldOut = sale.remainingAmount <= 0;
              const isCredit = sale.paymentType === 'credit';
              const isPartial = sale.paymentType === 'partial';

              // Find associated credit if debt remains
              const associatedCredit = sale.creditId
                ? credits.find((c) => c.id === sale.creditId)
                : undefined;

              return (
                <div
                  key={sale.id}
                  className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left Column: Reference, Client & Articles */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {sale.reference}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isSoldOut
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCredit
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isSoldOut ? 'SOLDÉ' : isCredit ? 'À CRÉDIT' : 'PARTIEL'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {formatDateBamako(sale.createdAt, true)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="font-semibold text-slate-900">{sale.customerName}</span>
                      {sale.customerPhone && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({sale.customerPhone})
                        </span>
                      )}
                    </div>

                    {/* Articles preview */}
                    <p className="text-[11px] text-slate-500 truncate max-w-lg">
                      {sale.items.map((i) => `${i.quantity}x ${i.description}`).join(', ')}
                    </p>
                  </div>

                  {/* Middle Column: Financial Breakdown */}
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {formatFCFA(sale.totalAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Versé</p>
                      <p className="font-mono font-bold text-emerald-700 text-sm">
                        {formatFCFA(sale.paidAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Reste dû</p>
                      <p
                        className={`font-mono font-bold text-sm ${
                          isSoldOut ? 'text-emerald-700' : 'text-amber-800'
                        }`}
                      >
                        {formatFCFA(sale.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                    
                    {/* View details / receipt modal */}
                    <button
                      type="button"
                      onClick={() => onOpenSaleReceipt(sale)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      title="Afficher le reçu et imprimer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Reçu</span>
                    </button>

                    {/* WhatsApp */}
                    {sale.customerPhone && onOpenWhatsApp && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenWhatsApp(
                            sale.customerName,
                            sale.customerPhone || '',
                            sale.remainingAmount,
                            sale.dueDate
                          )
                        }
                        className="p-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs transition cursor-pointer"
                        title="Envoyer rappel / reçu WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Encaisser le reste */}
                    {!isSoldOut && associatedCredit && onOpenPaymentForCredit && (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentForCredit(associatedCredit)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        Encaisser
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
