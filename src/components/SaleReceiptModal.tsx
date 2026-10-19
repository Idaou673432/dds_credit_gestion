import React, { useState } from 'react';
import { Sale } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS, generateWhatsAppUrl } from '../lib/utils';
import { printSaleThermalDirect, printSaleA4Direct } from '../lib/print';
import {
  X,
  Printer,
  FileText,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Check
} from 'lucide-react';

interface SaleReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  onOpenPaymentModal?: (sale: Sale) => void;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({
  sale,
  onClose,
  onOpenPaymentModal,
}) => {
  const { activeBusiness } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!activeBusiness) return null;

  const isSoldOut = sale.remainingAmount <= 0;
  const isCredit = sale.paymentType === 'credit';
  const isPartial = sale.paymentType === 'partial';

  const handlePrint58mm = () => {
    printSaleThermalDirect(activeBusiness, sale, '58mm');
  };

  const handlePrint80mm = () => {
    printSaleThermalDirect(activeBusiness, sale, '80mm');
  };

  const handlePrintA4 = () => {
    printSaleA4Direct(activeBusiness, sale);
  };

  const getWhatsAppMessage = () => {
    const itemsList = sale.items
      .map((item, idx) => `• ${item.quantity}x ${item.description} = ${formatFCFA(item.total)}`)
      .join('\n');

    let text = `Bonjour *${sale.customerName}*,\n\n`;
    text += `Voici le reçu de votre achat chez *${activeBusiness.name}* (${activeBusiness.city || 'Bamako'}) :\n`;
    text += `📄 *Facture N° ${sale.reference}*\n`;
    text += `📅 Date : ${formatDateBamako(sale.createdAt, true)}\n\n`;
    text += `*Détail des articles :*\n${itemsList}\n\n`;
    text += `💰 *Total Facture :* ${formatFCFA(sale.totalAmount)}\n`;
    text += `💵 *Montant Versé :* ${formatFCFA(sale.paidAmount)}\n`;

    if (isSoldOut) {
      text += `✅ *Statut :* FACTURE ENTIÈREMENT SOLDÉE. Merci pour votre fidélité !\n`;
    } else {
      text += `⚠️ *Solde restant dû :* ${formatFCFA(sale.remainingAmount)}\n`;
      if (sale.dueDate) {
        text += `📅 Échéance convenue : ${formatDateBamako(sale.dueDate)}\n`;
      }
      text += `\nMerci de votre confiance et à bientôt !`;
    }

    if (activeBusiness.phone) {
      text += `\n📞 Contact : ${activeBusiness.phone}`;
    }

    return text;
  };

  const handleSendWhatsApp = () => {
    const msg = getWhatsAppMessage();
    const phone = sale.customerPhone || '';
    const url = generateWhatsAppUrl(phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-900 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reçu de Facturation {sale.reference}
              </h3>
              <p className="text-xs text-slate-500">
                {formatDateBamako(sale.createdAt, true)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        <div
          className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            isSoldOut
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isCredit
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSoldOut ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isSoldOut
                  ? 'Facture entièrement réglée (Tout payé)'
                  : isCredit
                  ? 'Vente à crédit (100% différé)'
                  : 'Paiement partiel (Acompte versé)'}
              </p>
              <p className="text-[11px] opacity-85">
                Client : <strong>{sale.customerName}</strong>
                {sale.customerPhone ? ` · ${sale.customerPhone}` : ''}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
              {isSoldOut ? 'Soldé' : 'Reste dû'}
            </span>
            <p className="text-base font-mono font-bold">
              {isSoldOut ? '0 FCFA' : formatFCFA(sale.remainingAmount)}
            </p>
          </div>
        </div>

        {/* Printable Ticket Preview Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-sans">
          
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-sm uppercase text-slate-900 tracking-wide">
              {activeBusiness.name}
            </h4>
            <p className="text-xs text-slate-500">
              {activeBusiness.city || 'Bamako'}{activeBusiness.phone ? ` · ${activeBusiness.phone}` : ''}
            </p>
            {activeBusiness.slogan && (
              <p className="text-[11px] text-slate-400 italic mt-0.5">
                {activeBusiness.slogan}
              </p>
            )}
          </div>

          {/* Table of items */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-slate-500 text-[11px] uppercase pb-1 border-b border-slate-200">
              <span>Article</span>
              <span>Qté x PU</span>
              <span className="text-right">Total</span>
            </div>

            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-dotted border-slate-200">
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {item.description}
                </span>
                <span className="text-slate-500 text-[11px] font-mono">
                  {item.quantity} × {formatFCFA(item.unitPrice)}
                </span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {formatFCFA(item.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between font-bold text-sm text-slate-900">
              <span>TOTAL DE LA VENTE :</span>
              <span className="font-mono text-base font-black">{formatFCFA(sale.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Montant versé ({PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}) :</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatFCFA(sale.paidAmount)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-sm text-amber-800 pt-1 border-t border-dashed border-slate-200">
              <span>Reste à payer :</span>
              <span className="font-mono font-bold">
                {isSoldOut ? '0 FCFA (SOLDÉ)' : formatFCFA(sale.remainingAmount)}
              </span>
            </div>
          </div>

          {sale.dueDate && (
            <div className="pt-2 text-center text-xs font-semibold text-amber-800 bg-amber-50 py-1 rounded">
              Échéance convenue : {formatDateBamako(sale.dueDate)}
            </div>
          )}
        </div>

        {/* Action Buttons : Clairs, sans hésitation */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handlePrint80mm}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimer le ticket de caisse</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer sur WhatsApp</span>
            </button>
          </div>

          {/* Autres formats si besoin */}
          <div className="flex items-center justify-center gap-4 text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Autres formats :</span>
            <button
              type="button"
              onClick={handlePrint58mm}
              className="text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              Petit ticket (58 mm)
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={handlePrintA4}
              className="text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              Grand format (A4)
            </button>
          </div>

          {!isSoldOut && onOpenPaymentModal && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(sale);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Encaisser un versement sur ce solde</span>
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Terminer
          </button>
        </div>

      </div>
    </div>
  );
};
