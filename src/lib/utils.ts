import { PaymentMethod } from '../types';

export function formatFCFA(amount: number | null | undefined): string {
  const val = Math.round(Number(amount) || 0);
  const formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatDateBamako(dateInput?: string | Date | null, includeTime = false): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Africa/Bamako',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };

    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  } catch {
    return String(dateInput);
  }
}

export function isDateOverdue(dueDateString?: string | null): boolean {
  if (!dueDateString) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime();
  } catch {
    return false;
  }
}

export function generateReference(prefix: 'CR' | 'REC'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${randomPart}`;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // If Mali number without country code (8 digits starting with 5, 6, 7, 8, 9)
  if (/^\d{8}$/.test(cleaned)) {
    cleaned = '223' + cleaned;
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  bank_transfer: 'Virement bancaire',
  other: 'Autre moyen'
};

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // Use UTF-8 BOM so Excel opens accented French characters properly
  const bom = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
  ].join('\r\n');

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
