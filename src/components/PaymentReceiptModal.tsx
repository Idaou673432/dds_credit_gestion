import React, { useRef } from 'react';
import { Payment, Credit, Business } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { generateReceiptPDF } from '../lib/pdf';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceiptA4 } from './PrintableReceiptA4';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  Phone,
  Calendar,
  FileCheck,
  ShieldCheck,
  FileText
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
  onOpenWhatsApp,
}) => {
  const isFullyPaid = payment.remainingAfter <= 0;
  const printableRef = useRef<HTMLDivElement>(null);

  // react-to-print A4 printer hook
  const handleReactToPrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `Recu_${payment.reference}_${payment.customerName.replace(/\s+/g, '_')}`,
    pageStyle: '@page { size: A4 portrait; margin: 12mm; }',
  });

  const handleDownloadPDF = () => {
    generateReceiptPDF(business, payment, credit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      
      {/* Hidden printable A4 sheet specifically for react-to-print */}
      <div className="hidden">
        <PrintableReceiptA4
          ref={printableRef}
          business={business}
          payment={payment}
          credit={credit}
        />
      </div>

      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden my-6">
        
        {/* Modal Top Actions */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Reçu Officiel de Remboursement</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleReactToPrint()}
              title="Imprimer directement en format A4 propre"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer (A4)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              title="Télécharger en format PDF A4 officiel"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Receipt Content Container */}
        <div className="p-6 sm:p-8 bg-slate-950 space-y-6 print:p-0 print:bg-white print:text-black">
          
          {/* Shop Header */}
          <div className="text-center pb-5 border-b border-dashed border-slate-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-xl mb-2">
              DDS
            </div>
            <h2 className="text-lg font-black tracking-tight text-white uppercase">
              {business.name}
            </h2>
            <p className="text-xs text-cyan-400 font-medium">
              {business.slogan || 'DDS Crédit Confiance — Diaby Digital Solution'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {[business.phone, business.city, business.address].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* Receipt Badge & Reference */}
          <div className="text-center bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              REÇU DE CAISSE / PAIEMENT
            </p>
            <p className="font-mono text-base font-black text-white mt-0.5">
              N° {payment.reference}
            </p>
            <p className="text-[11px] text-slate-400">
              Date : {formatDateBamako(payment.paymentDate, true)}
            </p>
          </div>

          {/* Customer & Credit Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-850">
              <span className="text-slate-400">Bénéficiaire (Client) :</span>
              <span className="font-bold text-slate-200">{payment.customerName}</span>
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
          </div>

          {/* Encaissé & Solde Restant */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">MONTANT ENCAISSÉ :</span>
              <span className="text-xl font-black text-emerald-400">
                {formatFCFA(payment.amount)}
              </span>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">NOUVEAU SOLDE RESTANT :</span>
              <span
                className={`text-base font-black ${
                  isFullyPaid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isFullyPaid ? '0 FCFA (SOLDÉ)' : formatFCFA(payment.remainingAfter)}
              </span>
            </div>
          </div>

          {/* Comment if any */}
          {payment.notes && (
            <p className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              Remarque : {payment.notes}
            </p>
          )}

          {/* Signatures & Stamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-800">
            <div>
              <p className="font-semibold text-slate-400">Cachet du commerçant</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] text-cyan-500/50 border border-cyan-500/30 px-2 py-1 rounded-md">
                  CERTIFIÉ DDS CONFIANCE
                </span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-400">Signature du client</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] text-slate-600">Bon pour accord</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-500 pt-2">
            Système DDS Crédit Confiance • Diaby Digital Solution (DDS Mali)
          </p>

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Fermer le reçu
          </button>
        </div>

      </div>
    </div>
  );
};
