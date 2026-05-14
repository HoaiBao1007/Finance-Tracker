import type { ComponentProps } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import type { TransactionType } from '@/types/finance';

export type FinanceIconName = ComponentProps<typeof FontAwesome>['name'];

export const financeFonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getFriendlyName(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return 'BAN';
  }

  const parts = trimmed.split(/\s+/);
  return (parts[parts.length - 1] ?? trimmed).toUpperCase();
}

export function getCategoryIconName(name: string, type?: TransactionType): FinanceIconName {
  const normalized = normalizeLabel(name);

  if (normalized.includes('an') || normalized.includes('uong')) {
    return 'cutlery';
  }

  if (normalized.includes('hoa don') || normalized.includes('dien') || normalized.includes('nuoc')) {
    return 'file-text-o';
  }

  if (normalized.includes('di chuyen') || normalized.includes('xang') || normalized.includes('xe')) {
    return 'car';
  }

  if (normalized.includes('giai tri') || normalized.includes('game') || normalized.includes('xem phim')) {
    return 'gamepad';
  }

  if (normalized.includes('luong') || normalized.includes('thuong') || normalized.includes('thu nhap')) {
    return 'money';
  }

  if (normalized.includes('qua') || normalized.includes('gift')) {
    return 'gift';
  }

  if (type === 'income') {
    return 'arrow-up';
  }

  return 'credit-card';
}

export function toChartNumber(amount: string) {
  const numericValue = Number(amount);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  try {
    return Number(BigInt(amount));
  } catch {
    return 0;
  }
}