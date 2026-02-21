import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(agorot: number): string {
  return currencyFormatter.format(agorot / 100);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function daysBetween(dateA: string | Date, dateB: string | Date): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}
