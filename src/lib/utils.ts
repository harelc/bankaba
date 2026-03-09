import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatters: Record<string, Intl.NumberFormat> = {
  he: new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  en: new Intl.NumberFormat('en-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

export function formatCurrency(agorot: number, locale: 'he' | 'en' = 'he'): string {
  return (currencyFormatters[locale] || currencyFormatters.he).format(agorot / 100);
}

export function formatDate(isoDate: string, locale: 'he' | 'en' = 'he'): string {
  return new Date(isoDate).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function daysBetween(dateA: string | Date, dateB: string | Date): number {
  // Compare date portions only (strip time) to avoid timezone issues
  const toDateOnly = (d: string | Date) => {
    const s = typeof d === 'string' ? d : d.toISOString();
    return new Date(s.split('T')[0].split(' ')[0] + 'T00:00:00Z');
  };
  const a = toDateOnly(dateA);
  const b = toDateOnly(dateB);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}
