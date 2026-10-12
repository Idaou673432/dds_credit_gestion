import React, { useRef } from 'react';
import { Payment, Credit, Business } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { generateReceiptPDF } from '../lib/pdf';
import { printReceiptDirect } from '../lib/print';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceiptA4 } from './PrintableReceiptA4';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  MessageCircle
} from 'lucide-react';

interface PaymentReceiptModalProps {
  payment: Payment;
  credit?: Credit;
  business: Business;
  onClose: () => void;
  onOpenWhatsApp?: (customerName: string, phone: string, amount: number) => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  credit,
  business,
  onClose,
}) => {
  const isFullyPaid = payment.remainingAfter <= 0;
  const printableRef = useRef<HTMLDivElement>(null);

  // react-to-print hook on off-screen mounted container
  const handleReactToPrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `Recu_${payment.reference}_${payment.customerName.replace(/\s+/g, '_')}`,
    pageStyle: '@page { size: A4 portrait; margin: 12mm; }',
  });

  const handlePrint = () => {
    try {
      if (printableRef.current) {
        handleReactToPrint();
      } else {
        printReceiptDirect(business, payment, credit);
      }
    } catch {
      printReceiptDirect(business, payment, credit);
    }
  };

  const handleDownloadPDF = () => {
    generateReceiptPDF(business, payment, credit);
  };

  const handleShareWhatsAppReceipt = () => {
    const phone = credit?.customerPhone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message =
      `*REÇU DE PAIEMENT - ${business.name}*\n` +
      `Client : ${payment.customerName}\n` +
      `N° Reçu : ${payment.reference}\n` +
      `Montant encaissé : ${formatFCFA(payment.amount)}\n` +
      `Mode : ${PAYMENT_METHOD_LABELS[payment.paymentMethod]}\n` +
      `Nouveau solde restant : ${formatFCFA(payment.remainingAfter)}${isFullyPaid ? ' (Dette entièrement soldée !)' : ''}\n` +
      `Date : ${formatDateBamako(payment.paymentDate, true)}\n\n` +
      `Merci pour votre confiance ! - DDS Crédit Confiance`;
    const encoded = encodeURIComponent(message);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('223') ? cleanPhone : `223${cleanPhone}`}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      
      {/* Off-screen fully rendered printable sheet for react-to-print (NOT display:none) */}
      <div style={{ position: 'fixed', left: '-99999px', top: '-99999px', width: '210mm' }}>
        <PrintableReceiptA4
          ref={printableRef}
          business={business}
          payment={payment}
          credit={credit}
        />
      </div>

      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto my-4">
        
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white">Reçu de Paiement Officiel</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Receipt Card View */}
        <div className="p-6 sm:p-7 bg-slate-950 space-y-5">
          
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-xl mb-2">
              DDS
            </div>
            <h2 className="text-base font-black tracking-tight text-white uppercase">
              {business.name}
            </h2>
            <p className="text-xs text-cyan-400 font-medium">
              {business.slogan || 'Vos crédits sous contrôle, votre commerce en confiance.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {[business.phone, business.city || 'Bamako', business.address].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* Receipt Number & Date */}
          <div className="text-center bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              REÇU DE REMBOURSEMENT N°
            </p>
            <p className="font-mono text-base font-black text-white mt-0.5">
              {payment.reference}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Date : {formatDateBamako(payment.paymentDate, true)}
            </p>
          </div>

          {/* Customer & Transaction Info */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Bénéficiaire (Client) :</span>
              <span className="font-bold text-white">{payment.customerName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Crédit rattaché :</span>
              <span className="font-semibold text-slate-300">
                {payment.creditReference || 'Dette'} {credit?.description ? `(${credit.description})` : ''}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Moyen de règlement :</span>
              <span className="font-semibold text-cyan-400">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
              </span>
            </div>
            {payment.notes && (
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Note :</span>
                <span className="text-slate-300 italic">{payment.notes}</span>
              </div>
            )}
          </div>

          {/* Encaissé & Solde Restant */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">MONTANT ENCAISSÉ :</span>
              <span className="text-xl font-black text-emerald-400">
                +{formatFCFA(payment.amount)}
              </span>
            </div>

            <div className="h-px bg-slate-800 my-1" />

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">NOUVEAU SOLDE RESTANT :</span>
              <span
                className={`text-sm font-black ${
                  isFullyPaid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isFullyPaid ? '0 FCFA (SOLDÉ !)' : formatFCFA(payment.remainingAfter)}
              </span>
            </div>
          </div>

          {/* Actions Bar: Simple, Clear and Direct */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Reçu</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Télécharger PDF (A4)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsAppReceipt}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer sur WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Fermer
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
