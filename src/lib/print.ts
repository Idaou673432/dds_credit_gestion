import { Business, Payment, Credit, Customer } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from './utils';

export function printReceiptDirect(business: Business, payment: Payment, credit?: Credit) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  const isFullyPaid = payment.remainingAfter <= 0;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Reçu ${payment.reference} - ${business.name}</title>
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 13px;
            line-height: 1.4;
          }
          .receipt {
            max-width: 440px;
            margin: 0 auto;
            border: 2px solid #000;
            border-radius: 8px;
            padding: 18px;
          }
          .header { text-align: center; border-bottom: 2px dashed #999; padding-bottom: 12px; margin-bottom: 12px; }
          .logo { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
          .biz-name { font-size: 16px; font-weight: bold; margin-top: 3px; text-transform: uppercase; }
          .slogan { font-size: 11px; color: #555; }
          .contact { font-size: 11px; color: #666; margin-top: 2px; }
          .badge {
            background: #f4f4f5;
            padding: 8px;
            margin: 10px 0;
            text-align: center;
            border-radius: 6px;
            border: 1px solid #ddd;
          }
          .badge-title { font-size: 13px; font-weight: bold; letter-spacing: 1px; color: #0284c7; }
          .badge-ref { font-family: monospace; font-size: 12px; font-weight: bold; margin-top: 2px; }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dotted #ccc;
          }
          .bold { font-weight: bold; }
          .total-box {
            margin: 15px 0;
            padding: 12px;
            border: 2px solid #0f172a;
            border-radius: 6px;
            background: #f8fafc;
          }
          .total-amount { font-size: 18px; font-weight: 900; color: #059669; }
          .remaining-amount { font-size: 15px; font-weight: 900; color: ${isFullyPaid ? '#059669' : '#dc2626'}; }
          .note { font-size: 11px; font-style: italic; color: #555; margin: 8px 0; }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding-top: 10px;
          }
          .sig-box {
            width: 45%;
            text-align: center;
            font-size: 11px;
            border-top: 1px solid #777;
            padding-top: 6px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #777;
            border-top: 1px dotted #bbb;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">DDS CRÉDIT CONFIANCE</div>
            <div class="biz-name">${business.name}</div>
            <div class="slogan">${business.slogan || 'Vos crédits sous contrôle, votre commerce en confiance.'}</div>
            <div class="contact">${[business.phone, business.city, business.address].filter(Boolean).join(' • ')}</div>
          </div>

          <div class="badge">
            <div class="badge-title">REÇU DE REMBOURSEMENT</div>
            <div class="badge-ref">N° ${payment.reference}</div>
            <div style="font-size: 11px; color: #555;">Date : ${formatDateBamako(payment.paymentDate, true)}</div>
          </div>

          <div class="row">
            <span>Bénéficiaire (Client) :</span>
            <span class="bold">${payment.customerName}</span>
          </div>
          <div class="row">
            <span>Crédit rattaché :</span>
            <span>${payment.creditReference || 'Dette'} ${credit?.description ? `(${credit.description})` : ''}</span>
          </div>
          <div class="row">
            <span>Mode de règlement :</span>
            <span class="bold">${PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</span>
          </div>

          <div class="total-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="bold">MONTANT ENCAISSÉ :</span>
              <span class="total-amount">+${formatFCFA(payment.amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px;">
              <span class="bold">NOUVEAU SOLDE RESTANT :</span>
              <span class="remaining-amount">
                ${isFullyPaid ? '0 FCFA (SOLDÉ !)' : formatFCFA(payment.remainingAfter)}
              </span>
            </div>
          </div>

          ${payment.notes ? `<div class="note">Remarque : ${payment.notes}</div>` : ''}

          <div class="signatures">
            <div class="sig-box">Cachet / Commerçant</div>
            <div class="sig-box">Signature du Client</div>
          </div>

          <div class="footer">
            Document officiel certifié DDS • Diaby Digital Solution (DDS Mali)
          </div>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn("Iframe print error:", e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 250);
}

export function printStatementDirect(
  business: Business,
  customer: Customer,
  credits: Credit[],
  payments: Payment[]
) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Relevé ${customer.name} - ${business.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
          .logo { font-size: 22px; font-weight: 900; }
          .biz-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .client-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
          }
          .debt-box {
            text-align: right;
            padding: 6px 12px;
            background: #fff;
            border: 2px solid ${customer.currentDebt > 0 ? '#dc2626' : '#059669'};
            border-radius: 6px;
          }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
          th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 2px solid #cbd5e1; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          .bold { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">DDS CRÉDIT CONFIANCE</div>
          <div class="biz-name">${business.name}</div>
          <div>${[business.phone, business.city, business.address].filter(Boolean).join(' • ')}</div>
          <div style="font-weight: bold; margin-top: 6px; color: #0284c7;">RELEVÉ DE COMPTE CLIENT OFFICIEL</div>
        </div>

        <div class="client-card">
          <div>
            <div style="font-size: 14px; font-weight: bold;">Client : ${customer.name}</div>
            <div>Téléphone : ${customer.phone} ${customer.address ? `• Adresse : ${customer.address}` : ''}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Édité le : ${formatDateBamako(new Date().toISOString(), true)}</div>
          </div>
          <div class="debt-box">
            <div style="font-size: 10px; font-weight: bold; color: #64748b;">SOLDE RESTANT DÛ</div>
            <div style="font-size: 16px; font-weight: 900; color: ${customer.currentDebt > 0 ? '#dc2626' : '#059669'};">
              ${formatFCFA(customer.currentDebt)}
            </div>
          </div>
        </div>

        <div style="font-weight: bold; margin-top: 10px;">1. Crédits Accordés (${credits.length})</div>
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>Date</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Total Payé</th>
              <th style="text-align: right;">Reste</th>
            </tr>
          </thead>
          <tbody>
            ${credits.length === 0 ? '<tr><td colspan="6" style="text-align: center;">Aucun crédit</td></tr>' : credits.map(c => `
              <tr>
                <td class="bold">${c.reference}</td>
                <td>${formatDateBamako(c.creditDate)}</td>
                <td>${c.description}</td>
                <td>${formatFCFA(c.amount)}</td>
                <td style="color: #059669;">${formatFCFA(c.totalPaid)}</td>
                <td style="text-align: right; font-weight: bold; color: ${c.remainingAmount > 0 ? '#dc2626' : '#059669'};">${formatFCFA(c.remainingAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="font-weight: bold; margin-top: 10px;">2. Remboursements Encaissés (${payments.length})</div>
        <table>
          <thead>
            <tr>
              <th>N° Reçu</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Réf Crédit</th>
              <th style="text-align: right;">Montant Versé</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length === 0 ? '<tr><td colspan="5" style="text-align: center;">Aucun versement</td></tr>' : payments.map(p => `
              <tr>
                <td class="bold">${p.reference}</td>
                <td>${formatDateBamako(p.paymentDate)}</td>
                <td>${PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                <td>${p.creditReference || '—'}</td>
                <td style="text-align: right; font-weight: bold; color: #059669;">+${formatFCFA(p.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          DDS Crédit Confiance • Diaby Digital Solution (Bamako, Mali)
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn("Iframe print statement error:", e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 250);
}

export function printReportDirect(
  business: Business,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  summaryText?: string
) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${title} - ${business.name}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            line-height: 1.3;
          }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
          .logo { font-size: 18px; font-weight: 900; }
          .biz-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .report-title { font-size: 14px; font-weight: bold; color: #0284c7; margin-top: 5px; }
          .summary { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th { background: #f1f5f9; text-align: left; padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; font-weight: bold; }
          td { padding: 5px 6px; border: 1px solid #e2e8f0; font-size: 10px; }
          .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">DDS CRÉDIT CONFIANCE</div>
          <div class="biz-name">${business.name} • ${business.city || 'Bamako'}</div>
          <div class="report-title">${title}</div>
          <div style="font-size: 10px; color: #64748b;">Édité le : ${formatDateBamako(new Date().toISOString(), true)}</div>
        </div>

        ${summaryText ? `<div class="summary">${summaryText}</div>` : ''}

        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                ${r.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Rapport comptable officiel • DDS Crédit Confiance • Diaby Digital Solution (Mali)
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn("Iframe print report error:", e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 250);
}

