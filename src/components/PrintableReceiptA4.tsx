import React, { forwardRef } from 'react';
import { Business, Payment, Credit } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from '../lib/utils';

interface PrintableReceiptA4Props {
  business: Business;
  payment: Payment;
  credit?: Credit;
}

export const PrintableReceiptA4 = forwardRef<HTMLDivElement, PrintableReceiptA4Props>(
  ({ business, payment, credit }, ref) => {
    const isFullyPaid = payment.remainingAfter <= 0;

    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 p-8 max-w-[210mm] mx-auto font-sans leading-relaxed text-xs"
        style={{ minHeight: '297mm' }}
      >
        {/* Header with deep blue banner and DDS Logo */}
        <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            {/* DDS Official Vector Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-cyan-500 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm">
              <span className="text-xl font-black text-cyan-400 tracking-wider">DDS</span>
              <span className="text-[7px] font-bold text-slate-200 tracking-widest uppercase">CONFIANCE</span>
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {business.name}
              </h1>
              <p className="text-xs font-semibold text-cyan-700">
                {business.slogan || 'Vos crédits sous contrôle, votre commerce en confiance.'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {[business.phone, business.city || 'Bamako', business.address].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-800 border border-cyan-300 font-bold text-xs rounded-lg uppercase tracking-wider">
              Format A4 Officiel
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              Édition Diaby Digital Solution
            </p>
          </div>
        </div>

        {/* Receipt Banner */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-wider uppercase">
              REÇU DE REMBOURSEMENT DE CRÉDIT
            </h2>
            <p className="text-xs font-mono font-bold text-cyan-700 mt-0.5">
              N° {payment.reference}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">
              Date : {formatDateBamako(payment.paymentDate, true)}
            </p>
            <p className="text-[10px] text-slate-500">
              Fuseau horaire : Africa/Bamako
            </p>
          </div>
        </div>

        {/* Client & Transaction Details Card */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500 font-semibold">Bénéficiaire (Client) :</span>{' '}
              <strong className="text-slate-900 text-sm">{payment.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Crédit concerné :</span>{' '}
              <strong className="text-slate-800">{payment.creditReference || 'Dette'}</strong>
              {credit?.description && ` (${credit.description})`}
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <div>
              <span className="text-slate-500 font-semibold">Mode de règlement :</span>{' '}
              <span className="font-bold text-cyan-800 uppercase px-2 py-0.5 bg-cyan-100 rounded">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Boutique émettrice :</span>{' '}
              <strong className="text-slate-800">{business.name}</strong>
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <table className="w-full text-left border-collapse border border-slate-300 text-xs mb-6">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 border border-slate-700 font-bold uppercase">Désignation</th>
              <th className="p-3 border border-slate-700 text-right font-bold uppercase">Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-3 border border-slate-200 font-semibold text-slate-800">
                Montant total initial du crédit accordé
              </td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">
                {formatFCFA(credit?.amount || 0)}
              </td>
            </tr>
            <tr className="bg-slate-50">
              <td className="p-3 border border-slate-200 font-semibold text-slate-800">
                Total des remboursements antérieurs validés
              </td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-700">
                {formatFCFA((credit?.totalPaid || 0) - payment.amount)}
              </td>
            </tr>
            <tr className="bg-emerald-50">
              <td className="p-3 border border-slate-200 font-bold text-emerald-900">
                Montant encaissé ce jour (Versement validé)
              </td>
              <td className="p-3 border border-slate-200 text-right font-black text-emerald-700 text-sm">
                +{formatFCFA(payment.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Solde Restant Box */}
        <div
          className={`p-5 rounded-2xl border-2 mb-6 ${
            isFullyPaid
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
              : 'bg-rose-50 border-rose-500 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                NOUVEAU SOLDE RESTANT DÛ APRÈS CE PAIEMENT
              </p>
              <p className="text-[11px] mt-0.5 opacity-80">
                {isFullyPaid
                  ? 'Félicitations ! Ce crédit est intégralement soldé et libéré.'
                  : 'Reste à recouvrer auprès du client conformément aux accords.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">
                {isFullyPaid ? '0 FCFA (SOLDÉ)' : formatFCFA(payment.remainingAfter)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-6 italic">
            <strong>Remarque / Référence complémentaire :</strong> {payment.notes}
          </div>
        )}

        {/* Signatures & Stamps */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-12 border-t-2 border-dashed border-slate-300">
          <div className="text-center">
            <p className="font-bold text-slate-900 text-xs mb-1">
              Cachet et signature du commerçant
            </p>
            <div className="h-24 border border-dashed border-slate-400 rounded-xl flex items-center justify-center text-[10px] text-slate-400">
              [ Cachet certifié • {business.name} ]
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Pour valoir ce que de droit</p>
          </div>

          <div className="text-center">
            <p className="font-bold text-slate-900 text-xs mb-1">
              Signature du client
            </p>
            <div className="h-24 border border-dashed border-slate-400 rounded-xl flex items-center justify-center text-[10px] text-slate-400">
              [ Bon pour accord • {payment.customerName} ]
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Reconnaissance de règlement</p>
          </div>
        </div>

        {/* Official Footer */}
        <div className="mt-16 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            Document certifié conforme • Application DDS Crédit Confiance
          </p>
          <p>
            Développé par Diaby Digital Solution (DDS) • Bamako, République du Mali • Système d'authentification et de traçabilité financière
          </p>
        </div>
      </div>
    );
  }
);
PrintableReceiptA4.displayName = 'PrintableReceiptA4';
