import React, { forwardRef } from 'react';
import { Business } from '../types';
import { formatDateBamako } from '../lib/utils';

interface PrintableReportA4Props {
  business: Business;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summaryText?: string;
}

export const PrintableReportA4 = forwardRef<HTMLDivElement, PrintableReportA4Props>(
  ({ business, title, headers, rows, summaryText }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 p-8 max-w-[297mm] mx-auto font-sans leading-normal text-xs"
        style={{ minHeight: '210mm' }}
      >
        {/* Header Bar with Logo and Boutique Details */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-4">
          <div className="flex items-center gap-3">
            {/* DDS Official Vector Emblem */}
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-cyan-500 flex flex-col items-center justify-center text-white flex-shrink-0">
              <span className="text-lg font-black text-cyan-400 tracking-wider">DDS</span>
              <span className="text-[6px] font-bold text-slate-200 tracking-widest uppercase">CONFIANCE</span>
            </div>

            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
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
              Rapport Officiel A4
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              Édité le : {formatDateBamako(new Date().toISOString(), true)}
            </p>
          </div>
        </div>

        {/* Report Title */}
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            {title}
          </h2>
          <span className="text-xs font-bold text-slate-600">
            Total : {rows.length} enregistrement(s)
          </span>
        </div>

        {/* Summary Card if present */}
        {summaryText && (
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-xs font-bold text-cyan-900 mb-4">
            {summaryText}
          </div>
        )}

        {/* Table */}
        <table className="w-full text-left border-collapse border border-slate-300 text-[11px] mb-6">
          <thead>
            <tr className="bg-slate-900 text-white">
              {headers.map((h, i) => (
                <th key={i} className="p-2 border border-slate-700 font-bold uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="p-6 text-center text-slate-500 italic">
                  Aucune donnée disponible pour ce rapport.
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border border-slate-200 font-medium text-slate-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Official Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            Rapport comptable officiel • DDS Crédit Confiance • Diaby Digital Solution (DDS Mali)
          </p>
          <p>
            Imprimé via le module sécurisé react-to-print • Format A4 certifié • Bamako, Mali
          </p>
        </div>
      </div>
    );
  }
);
PrintableReportA4.displayName = 'PrintableReportA4';
