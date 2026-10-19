import { Business, Payment, Credit, Customer, Sale } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from './utils';

export function printReceiptDirect(business: Business, payment: Payment, credit?: Credit) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.opacity = '0';
  iframe.style.zIndex = '-9999';
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

export function printThermalReceiptDirect(business: Business, payment: Payment, credit?: Credit) {
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
        <title>Ticket ${payment.reference}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 2mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 4px;
            width: 100%;
            max-width: 58mm;
            font-size: 11px;
            line-height: 1.25;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px double #000; margin: 6px 0; }
          .title { font-size: 13px; font-weight: 900; letter-spacing: 0.5px; }
          .shop-name { font-size: 12px; font-weight: bold; margin: 2px 0; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
          .amount-box {
            text-align: center;
            border: 1px solid #000;
            padding: 6px 2px;
            margin: 6px 0;
          }
          .amount { font-size: 15px; font-weight: 900; }
          .remaining { font-size: 13px; font-weight: 900; }
          .footer { font-size: 9px; text-align: center; margin-top: 8px; }
          .cut-line { text-align: center; font-size: 8px; margin-top: 10px; color: #555; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">DDS CONFIANCE</div>
          <div class="shop-name">${business.name}</div>
          <div>${business.city || 'Bamako'}${business.phone ? ' • ' + business.phone : ''}</div>
          ${business.address ? `<div>${business.address}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="center bold">REÇU DE CAISSE N° ${payment.reference}</div>
        <div class="center" style="font-size: 10px;">${formatDateBamako(payment.paymentDate, true)}</div>

        <div class="divider"></div>

        <div class="row">
          <span>Client :</span>
          <span class="bold">${payment.customerName}</span>
        </div>
        ${payment.creditReference ? `
        <div class="row">
          <span>Réf Dette :</span>
          <span>${payment.creditReference}</span>
        </div>` : ''}
        <div class="row">
          <span>Règlement :</span>
          <span class="bold">${PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</span>
        </div>

        <div class="divider"></div>

        <div class="amount-box">
          <div style="font-size: 10px;">MONTANT ENCAISSÉ</div>
          <div class="amount">+${formatFCFA(payment.amount)}</div>
        </div>

        <div class="amount-box" style="background: #fafafa;">
          <div style="font-size: 10px;">NOUVEAU SOLDE RESTANT</div>
          <div class="remaining">
            ${isFullyPaid ? '0 FCFA (SOLDÉ !)' : formatFCFA(payment.remainingAfter)}
          </div>
        </div>

        ${payment.notes ? `
        <div style="font-size: 10px; font-style: italic; margin: 4px 0;">
          Note: ${payment.notes}
        </div>` : ''}

        <div class="double-divider"></div>

        <div class="footer">
          <div>Merci de votre confiance !</div>
          <div style="margin-top: 3px;">Diaby Digital Solution • Bamako</div>
        </div>

        <div class="cut-line">--------- ✂ DÉCOUPE TICKET ✂ ---------</div>
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
      console.warn("Thermal print error:", e);
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

export function printSaleThermalDirect(
  business: Business,
  sale: Sale,
  paperWidth: '58mm' | '80mm' = '58mm'
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

  const isSoldOut = sale.remainingAmount <= 0;
  const isCredit = sale.paymentType === 'credit';
  const isPartial = sale.paymentType === 'partial';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Ticket ${sale.reference}</title>
        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 2mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: ${paperWidth === '80mm' ? '8px' : '4px'};
            width: 100%;
            max-width: ${paperWidth};
            font-size: ${paperWidth === '80mm' ? '12px' : '11px'};
            line-height: 1.3;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px double #000; margin: 6px 0; }
          .title { font-size: ${paperWidth === '80mm' ? '15px' : '13px'}; font-weight: 900; letter-spacing: 0.5px; }
          .shop-name { font-size: ${paperWidth === '80mm' ? '14px' : '12px'}; font-weight: bold; margin: 2px 0; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .item-row { margin: 4px 0; }
          .item-desc { font-weight: bold; }
          .item-calc { display: flex; justify-content: space-between; font-size: 10px; color: #222; }
          .total-box {
            border: 2px solid #000;
            padding: 8px;
            margin: 10px 0;
            background: #fbfbfb;
          }
          .total-label { font-size: ${paperWidth === '80mm' ? '14px' : '12px'}; font-weight: bold; }
          .total-amount { font-size: ${paperWidth === '80mm' ? '20px' : '18px'}; font-weight: 900; text-align: right; }
          .status-banner {
            text-align: center;
            padding: 6px;
            margin: 8px 0;
            border: 2px solid #000;
            font-weight: 900;
            font-size: ${paperWidth === '80mm' ? '13px' : '11px'};
            letter-spacing: 0.5px;
            background: #f4f4f5;
          }
          .footer { font-size: 9px; text-align: center; margin-top: 8px; }
          .cut-line { text-align: center; font-size: 8px; margin-top: 10px; color: #555; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">DDS FACTURATION</div>
          <div class="shop-name">${business.name}</div>
          <div>${business.city || 'Bamako'}${business.phone ? ' • ' + business.phone : ''}</div>
          ${business.address ? `<div>${business.address}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="center bold" style="font-size: 13px;">FACTURE N° ${sale.reference}</div>
        <div class="center" style="font-size: 10px;">${formatDateBamako(sale.createdAt, true)}</div>

        <div class="divider"></div>

        <div class="row">
          <span>Client :</span>
          <span class="bold">${sale.customerName}</span>
        </div>
        ${sale.customerPhone ? `
        <div class="row">
          <span>Tél :</span>
          <span>${sale.customerPhone}</span>
        </div>` : ''}
        <div class="row">
          <span>Règlement :</span>
          <span class="bold">
            ${isCredit ? 'À CRÉDIT' : (isPartial ? 'PAIEMENT PARTIEL' : 'TOUT PAYÉ')}
            ${sale.paidAmount > 0 ? `(${PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod})` : ''}
          </span>
        </div>

        <div class="divider"></div>

        <div class="bold" style="margin-bottom: 4px;">ARTICLES :</div>
        ${sale.items.map((item, idx) => `
          <div class="item-row">
            <div class="item-desc">${idx + 1}. ${item.description}</div>
            <div class="item-calc">
              <span>${item.quantity} x ${formatFCFA(item.unitPrice)}</span>
              <span class="bold">${formatFCFA(item.total)}</span>
            </div>
          </div>
        `).join('')}

        <div class="divider"></div>

        <div class="total-box">
          <div class="row" style="align-items: center;">
            <span class="total-label">TOTAL FACTURE :</span>
            <span class="total-amount">${formatFCFA(sale.totalAmount)}</span>
          </div>
          <div class="row" style="font-size: 12px; margin-top: 6px; border-top: 1px dotted #888; padding-top: 4px;">
            <span>Montant Versé :</span>
            <span class="bold" style="font-size: 13px;">${formatFCFA(sale.paidAmount)}</span>
          </div>
          <div class="row" style="font-size: 13px; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
            <span class="bold">RESTE À PAYER :</span>
            <span class="bold" style="font-size: 16px;">${isSoldOut ? '0 FCFA' : formatFCFA(sale.remainingAmount)}</span>
          </div>
        </div>

        <div class="status-banner">
          ${isSoldOut ? '✓ FACTURE TOTALEMENT RÉGLÉE' : (isPartial ? `⚠ RESTE À PAYER : ${formatFCFA(sale.remainingAmount)}` : `⚠ VENTE À CRÉDIT : ${formatFCFA(sale.remainingAmount)}`)}
        </div>

        ${sale.dueDate ? `
        <div class="center bold" style="font-size: 10px; margin: 4px 0;">
          Date limite de paiement : ${formatDateBamako(sale.dueDate)}
        </div>` : ''}

        ${sale.notes ? `
        <div style="font-size: 10px; font-style: italic; margin: 4px 0;">
          Note : ${sale.notes}
        </div>` : ''}

        <div class="double-divider"></div>

        <div class="footer">
          <div>Merci de votre confiance !</div>
          <div style="margin-top: 2px;">Vendeur : ${sale.createdByName || 'Caisse'}</div>
          <div style="margin-top: 3px; font-size: 8px; color: #555;">DDS Crédit Confiance • Bamako, Mali</div>
        </div>

        <div class="cut-line">--------- ✂ DÉCOUPE TICKET ✂ ---------</div>
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
      console.warn("Thermal print sale error:", e);
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

export function printSaleA4Direct(business: Business, sale: Sale) {
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

  const isSoldOut = sale.remainingAmount <= 0;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Facture ${sale.reference} - ${business.name}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .biz-title { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
          .biz-sub { font-size: 11px; color: #475569; margin-top: 3px; }
          .inv-title { text-align: right; }
          .inv-badge { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0f172a; }
          .inv-ref { font-family: monospace; font-size: 13px; font-weight: bold; color: #0284c7; margin-top: 2px; }
          
          .client-box {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
          }
          .box-col { width: 48%; }
          .box-label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 4px; }
          .box-val { font-size: 13px; font-weight: bold; color: #0f172a; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
            color: #334155;
          }
          td {
            padding: 9px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .bold { font-weight: bold; }
          .num { text-align: right; }

          .summary-wrap {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 25px;
          }
          .summary-card {
            width: 320px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            background: #f8fafc;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 12px;
          }
          .summary-total {
            font-size: 16px;
            font-weight: 900;
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
            padding: 8px 0;
            margin: 6px 0;
            color: #0f172a;
          }
          .remaining-row {
            font-size: 14px;
            font-weight: bold;
            color: ${isSoldOut ? '#059669' : '#b45309'};
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 15px;
          }
          .sig-col {
            width: 40%;
            text-align: center;
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="biz-title">${business.name}</div>
            <div class="biz-sub">${business.slogan || 'Vos crédits sous contrôle, votre commerce en confiance.'}</div>
            <div class="biz-sub">${[business.address, business.city || 'Bamako', business.phone].filter(Boolean).join(' • ')}</div>
          </div>
          <div class="inv-title">
            <div class="inv-badge">FACTURE</div>
            <div class="inv-ref">${sale.reference}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Date : ${formatDateBamako(sale.createdAt, true)}</div>
          </div>
        </div>

        <div class="client-box">
          <div class="box-col">
            <div class="box-label">Facturé à (Client) :</div>
            <div class="box-val">${sale.customerName}</div>
            ${sale.customerPhone ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Tél : ${sale.customerPhone}</div>` : ''}
          </div>
          <div class="box-col" style="text-align: right;">
            <div class="box-label">Statut du Règlement :</div>
            <div class="box-val" style="color: ${isSoldOut ? '#059669' : '#b45309'};">
              ${isSoldOut ? 'SOLDÉ EN TOTALITÉ' : (sale.paymentType === 'credit' ? 'VENTE À CRÉDIT' : 'PAIEMENT PARTIEL')}
            </div>
            ${sale.dueDate ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Échéance : ${formatDateBamako(sale.dueDate)}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px;">N°</th>
              <th>Désignation de l'Article</th>
              <th class="num" style="width: 80px;">Quantité</th>
              <th class="num" style="width: 120px;">Prix Unitaire</th>
              <th class="num" style="width: 130px;">Total (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((item, index) => `
              <tr>
                <td style="color: #64748b;">${index + 1}</td>
                <td class="bold">${item.description}</td>
                <td class="num font-mono">${item.quantity}</td>
                <td class="num font-mono">${formatFCFA(item.unitPrice)}</td>
                <td class="num font-mono bold">${formatFCFA(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-wrap">
          <div class="summary-card">
            <div class="summary-row">
              <span>Nombre d'articles :</span>
              <span class="bold">${sale.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>MONTANT TOTAL :</span>
              <span>${formatFCFA(sale.totalAmount)}</span>
            </div>
            <div class="summary-row">
              <span>Montant versé :</span>
              <span class="bold" style="color: #059669;">${formatFCFA(sale.paidAmount)}</span>
            </div>
            <div class="summary-row remaining-row">
              <span>Reste à payer :</span>
              <span>${isSoldOut ? '0 FCFA (SOLDÉ)' : formatFCFA(sale.remainingAmount)}</span>
            </div>
            ${sale.paidAmount > 0 ? `
            <div class="summary-row" style="font-size: 10px; color: #64748b; margin-top: 4px; border-top: 1px dotted #cbd5e1; padding-top: 4px;">
              <span>Mode de paiement :</span>
              <span class="bold">${PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}</span>
            </div>` : ''}
          </div>
        </div>

        ${sale.notes ? `
        <div style="background: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 11px; color: #334155; margin-bottom: 20px;">
          <strong>Observations :</strong> ${sale.notes}
        </div>` : ''}

        <div class="signatures">
          <div class="sig-col">
            Signature & Cachet du Commerçant
          </div>
          <div class="sig-col">
            Signature du Client (Reçu conforme)
          </div>
        </div>

        <div class="footer">
          Document certifié par <strong>DDS Crédit Confiance</strong> • Diaby Digital Solution (Bamako, Mali)
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
      console.warn("A4 print sale error:", e);
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


