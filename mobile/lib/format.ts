import type { TransactionType } from '@/types/finance';

function addThousandsSeparator(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatMoney(amount: string) {
  const sign = amount.startsWith('-') ? '-' : amount.startsWith('+') ? '+' : '';
  const normalized = amount.replace(/^[-+]/, '');

  if (!/^\d+$/.test(normalized)) {
    return amount;
  }

  return `${sign}${addThousandsSeparator(normalized)} VND`;
}

export function formatSignedMoney(amount: string, type: TransactionType) {
  const prefix = type === 'expense' ? '-' : '+';
  return `${prefix}${formatMoney(amount)}`;
}

export function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
}

export function toDateInputValue(date?: string) {
  if (!date) {
    return new Date().toISOString().slice(0, 10);
  }

  const normalizedDate = new Date(date);

  if (Number.isNaN(normalizedDate.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return normalizedDate.toISOString().slice(0, 10);
}