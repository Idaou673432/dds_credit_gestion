import React, { useRef, useState } from 'react';
import { Payment, Credit, Business } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { generateReceiptPDF } from '../lib/pdf';
import { printThermalReceiptDirect, printReceiptDirect } from '../lib/print';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceiptA4 } from './PrintableReceiptA4';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
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
}) => {
  const isFullyPaid = payment.remainingAfter <= 0;
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('thermal');
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

  const handlePrintThermal = () => {
    printThermalReceiptDirect(business, payment, credit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      
      {/* Hidden printable A4 sheet specifically for react-to-print */}
      <div className="hidden">
        <PrintableReceiptA4
          ref={printableRef}
          business={business}
          payment={payment}
          credit={credit}
        />
      </div>

      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto my-0 sm:my-6 pb-safe">
        
        {/* Modal Top Actions */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white">Reçu de Remboursement</h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Format Toggle */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3 h-3" />
                <span>Ticket 58mm</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Format A4</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content based on selected format */}
        {printFormat === 'thermal' ? (
          /* THERMAL POS 58MM TICKET PREVIEW */
          <div className="p-6 bg-slate-950 flex flex-col items-center">
            <div className="w-full max-w-[320px] bg-white text-slate-900 rounded-xl p-5 shadow-2xl font-mono text-[11px] leading-relaxed border-t-8 border-cyan-500 selection:bg-cyan-200">
              
              {/* Thermal Shop Header */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <p className="font-black text-sm tracking-widest uppercase">DDS CONFIANCE</p>
                <p className="font-bold text-xs mt-0.5 text-slate-800 uppercase">{business.name}</p>
                <p className="text-[10px] text-slate-600">{business.city || 'Bamako'}{business.phone ? ` • ${business.phone}` : ''}</p>
                {business.address && <p className="text-[9px] text-slate-500">{business.address}</p>}
              </div>

              {/* Ticket Info */}
              <div className="py-2.5 border-b border-dashed border-slate-400 text-center">
                <p className="font-bold text-[10px] uppercase">REÇU DE CAISSE ENCAISSEMENT</p>
                <p className="font-black text-xs">N° {payment.reference}</p>
                <p className="text-[10px] text-slate-600">{formatDateBamako(payment.paymentDate, true)}</p>
              </div>

              {/* Rows */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Client :</span>
                  <span className="font-bold">{payment.customerName}</span>
                </div>
                {payment.creditReference && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-600">Réf Dette :</span>
                    <span>{payment.creditReference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Règlement :</span>
                  <span className="font-bold">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="my-2.5 p-2 bg-slate-100 rounded border border-slate-300 text-center space-y-1">
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Montant Encaissé</p>
                <p className="text-base font-black text-emerald-700">+{formatFCFA(payment.amount)}</p>
                
                <div className="h-px bg-slate-300 my-1" />
                
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Nouveau Solde Restant</p>
                <p className={`text-xs font-black ${isFullyPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isFullyPaid ? '0 FCFA (SOLDÉ !)' : formatFCFA(payment.remainingAfter)}
                </p>
              </div>

              {payment.notes && (
                <p className="text-[10px] italic text-slate-600 py-1 border-b border-dashed border-slate-400">
                  Note: {payment.notes}
                </p>
              )}

              {/* Thermal Footer */}
              <div className="text-center pt-2 text-[9px] text-slate-500">
                <p>Merci pour votre confiance !</p>
                <p className="mt-0.5">DDS Crédit Confiance • Bamako, Mali</p>
                <p className="text-[8px] text-slate-400 mt-2 tracking-widest">------------------------</p>
              </div>

            </div>

            {/* Thermal Print Action */}
            <div className="w-full max-w-[320px] mt-4 flex gap-2">
              <button
                type="button"
                onClick={handlePrintThermal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Ticket Thermique (58mm)</span>
              </button>
            </div>
          </div>
        ) : (
          /* A4 FORMAT PREVIEW */
          <div className="p-6 sm:p-8 bg-slate-950 space-y-6">
            
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
                REÇU DE CAISSE / PAIEMENT OFFICIEL A4
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
                  +{formatFCFA(payment.amount)}
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

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-800">
              <div>
                <p className="font-semibold text-slate-400">Cachet du commerçant</p>
                <div className="h-12 flex items-center justify-center">
                  <span className="text-[10px] text-cyan-500/50 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    CERTIFIÉ DDS CONFIANCE
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-400">Signature du client</p>
                <div className="h-12 flex items-center justify-center">
                  <span className="text-[10px] text-slate-600">Bon pour accord</span>
                </div>
              </div>
            </div>

            {/* A4 Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleReactToPrint()}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer (A4)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger PDF A4</span>
              </button>
            </div>

          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {printFormat === 'thermal' ? 'Ticket format 58mm compact (POS)' : 'Document officiel format A4'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
