/**
 * Currency Formatting Utilities
 * Standardized for Egypt (EGP / ج.م) as primary market
 */

export const DEFAULT_CURRENCY = 'EGP';

export function formatCurrencySymbol(code: string = DEFAULT_CURRENCY): string {
  if (!code || code.toUpperCase() === 'EGP') {
    return 'ج.م';
  }
  if (code.toUpperCase() === 'SAR') {
    return 'ر.س';
  }
  if (code.toUpperCase() === 'USD') {
    return '$';
  }
  if (code.toUpperCase() === 'EUR') {
    return '€';
  }
  return code;
}

export function formatPrice(amount: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  if (amount === null || amount === undefined) return '';
  return `${amount} ${formatCurrencySymbol(currency)}`;
}
