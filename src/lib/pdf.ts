import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Business, Customer, Credit, Payment } from '../types';
import { formatFCFA, formatDateBamako, PAYMENT_METHOD_LABELS } from './utils';

// Helper to draw DDS Logo Emblem in jsPDF vector
function drawDDSLogo(doc: jsPDF, x: number, y: number) {
  // Shield background
  doc.setFillColor(15, 23, 42); // Navy #0F172A
  doc.roundedRect(x, y, 22, 22, 4, 4, 'F');

  // Cyan border
  doc.setDrawColor(6, 182, 212); // #06B6D4
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, 22, 22, 4, 4, 'S');

  // Text monogram DDS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(34, 211, 238); // Cyan
  doc.text('DDS', x + 11, y + 12, { align: 'center' });

  doc.setFontSize(5);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIANCE', x + 11, y + 17, { align: 'center' });
}

export function generateReceiptPDF(business: Business, payment: Payment, credit?: Credit) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // Standard A4 (210 x 297 mm)
  });

  const pageWidth = 210;
  let y = 16;

  // Header Bar with deep navy background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Draw DDS Logo at top left
  drawDDSLogo(doc, 16, 7);

  // Shop Name & Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(business.name.toUpperCase(), 44, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248); // Cyan
  doc.text(business.slogan || 'DDS Crédit Confiance — Diaby Digital Solution (Mali)', 44, 21);

  doc.setTextColor(203, 213, 225);
  const contactText = [business.phone, business.city || 'Bamako', business.address].filter(Boolean).join(' • ');
  doc.text(contactText, 44, 27);

  y = 44;

  // Document Title & Badge Box
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(16, y, pageWidth - 32, 18, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(3, 105, 161);
  doc.text('REÇU OFFICIEL DE REMBOURSEMENT (FORMAT A4)', pageWidth / 2, y + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`N° ${payment.reference}  •  Date : ${formatDateBamako(payment.paymentDate, true)}`, pageWidth / 2, y + 13.5, { align: 'center' });

  y += 26;

  // Client and Transaction Details Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, y, pageWidth - 32, 28, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Bénéficiaire (Client) :', 22, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.customerName, 68, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Crédit rattaché :', 22, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payment.creditReference || 'Dette'} ${credit?.description ? `(${credit.description})` : ''}`, 68, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Mode de règlement :', 22, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(2, 132, 199);
  doc.text(PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod, 68, y + 24);

  y += 36;

  // Table of Amounts using AutoTable
  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16 },
    head: [['Désignation', 'Détails & Montants']],
    body: [
      ['Montant initial du crédit', formatFCFA(credit?.amount || 0)],
      ['Total des remboursements antérieurs', formatFCFA((credit?.totalPaid || 0) - payment.amount)],
      ['Montant encaissé ce jour', formatFCFA(payment.amount)],
      ['Nouveau solde restant dû', formatFCFA(payment.remainingAfter)]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold' },
      1: { cellWidth: 'auto', halign: 'right' }
    }
  });

  // Position after table
  const finalY = (doc as any).lastAutoTable?.finalY || y + 45;
  y = finalY + 8;

  // Solde Restant Highlight Box
  const isFullyPaid = payment.remainingAfter <= 0;
  if (isFullyPaid) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
  }
  doc.roundedRect(16, y, pageWidth - 32, 22, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  if (isFullyPaid) {
    doc.setTextColor(5, 150, 105);
    doc.text('CRÉDIT INTÉGRALEMENT SOLDÉ (0 FCFA)', pageWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Le client a honoré l’intégralité de sa créance auprès de la boutique.', pageWidth / 2, y + 16, { align: 'center' });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`SOLDE RESTANT DÛ : ${formatFCFA(payment.remainingAfter)}`, pageWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('À régler selon les modalités et échéances convenues.', pageWidth / 2, y + 16, { align: 'center' });
  }

  y += 30;

  // Notes if any
  if (payment.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Remarque / Référence transaction : ${payment.notes}`, 18, y);
    y += 10;
  }

  // Stamp and Signatures Section
  doc.setDrawColor(203, 213, 225);
  doc.line(16, y + 4, pageWidth - 16, y + 4);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Cachet et signature du commerçant', 35, y);
  doc.text('Signature du client', pageWidth - 65, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Pour valoir ce que de droit', 35, y + 25);
  doc.text('Bon pour accord', pageWidth - 65, y + 25);

  // Footer branding
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document officiel généré par DDS Crédit Confiance • Diaby Digital Solution (DDS Mali)', pageWidth / 2, 285, { align: 'center' });

  doc.save(`Recu_${payment.reference}.pdf`);
}

export function generateCustomerStatementPDF(
  business: Business,
  customer: Customer,
  credits: Credit[],
  payments: Payment[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;

  // Header Bar with deep navy background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Draw DDS Logo at top left
  drawDDSLogo(doc, 16, 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(business.name.toUpperCase(), 44, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248);
  doc.text('RELEVÉ DE COMPTE CLIENT OFFICIEL (FORMAT A4)', 44, 21);

  doc.setTextColor(203, 213, 225);
  const contactText = [business.phone, business.city || 'Bamako', business.address].filter(Boolean).join(' • ');
  doc.text(contactText, 44, 27);

  let y = 44;

  // Customer Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, y, pageWidth - 32, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Client : ${customer.name}`, 22, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Téléphone : ${customer.phone}   |   Adresse : ${customer.address || 'Non spécifiée'}`, 22, y + 16);
  doc.text(`Date d'édition : ${formatDateBamako(new Date().toISOString(), true)}`, 22, y + 23);

  // Solde Restant Box
  const debtBoxWidth = 65;
  const debtBoxX = pageWidth - 16 - debtBoxWidth - 6;
  doc.setFillColor(customer.currentDebt > 0 ? 254 : 236, customer.currentDebt > 0 ? 242 : 253, customer.currentDebt > 0 ? 242 : 245);
  doc.setDrawColor(customer.currentDebt > 0 ? 254 : 167, customer.currentDebt > 0 ? 202 : 243, customer.currentDebt > 0 ? 202 : 208);
  doc.roundedRect(debtBoxX, y + 4, debtBoxWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(customer.currentDebt > 0 ? 185 : 5, customer.currentDebt > 0 ? 28 : 150, customer.currentDebt > 0 ? 28 : 105);
  doc.text('SOLDE RESTANT DÛ', debtBoxX + debtBoxWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.text(formatFCFA(customer.currentDebt), debtBoxX + debtBoxWidth / 2, y + 18, { align: 'center' });

  y += 35;

  // Section 1: Credits
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Historique des Crédits Accordés (${credits.length})`, 16, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16 },
    head: [['Réf', 'Date', 'Description', 'Montant Initial', 'Total Payé', 'Solde Restant', 'Statut']],
    body: credits.map(c => [
      c.reference,
      formatDateBamako(c.creditDate),
      c.description,
      formatFCFA(c.amount),
      formatFCFA(c.totalPaid),
      formatFCFA(c.remainingAmount),
      c.status === 'paid' ? 'Soldé' : c.status === 'overdue' ? 'En retard' : 'En cours'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  const creditsFinalY = (doc as any).lastAutoTable?.finalY || y + 30;
  y = creditsFinalY + 10;

  // Section 2: Payments
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Historique des Remboursements Encaissés (${payments.length})`, 16, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 16, right: 16 },
    head: [['N° Reçu', 'Date', 'Mode', 'Réf Crédit', 'Montant Versé', 'Solde Après']],
    body: payments.map(p => [
      p.reference,
      formatDateBamako(p.paymentDate),
      PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
      p.creditReference || '—',
      formatFCFA(p.amount),
      formatFCFA(p.remainingAfter)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136], fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('DDS Crédit Confiance • Diaby Digital Solution (Bamako, Mali)', pageWidth / 2, 287, { align: 'center' });

  doc.save(`Releve_${customer.name.replace(/\s+/g, '_')}.pdf`);
}

export function generateReportPDF(
  business: Business,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  summaryText?: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' // Landscape A4 for wide table reports
  });

  const pageWidth = 297;

  // Header Bar with deep navy background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Draw DDS Logo at top left
  drawDDSLogo(doc, 14, 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(business.name.toUpperCase(), 42, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248);
  doc.text(`${title.toUpperCase()} (FORMAT A4)`, 42, 19);

  doc.setTextColor(203, 213, 225);
  doc.text(`${[business.phone, business.city || 'Bamako', business.address].filter(Boolean).join(' • ')}   |   Édité le : ${formatDateBamako(new Date().toISOString(), true)}`, 42, 25);

  let startY = 40;

  if (summaryText) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, pageWidth - 28, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(summaryText, 20, startY + 6.5);
    startY += 15;
  }

  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Rapport comptable officiel • DDS Crédit Confiance • Diaby Digital Solution (Mali)', pageWidth / 2, 200, { align: 'center' });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`);
}
