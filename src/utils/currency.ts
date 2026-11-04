/**
 * Currency utilities for Indonesian Rupiah (IDR)
 * Strictly uses integer arithmetic to avoid IEEE-754 floating point imprecision.
 */

export const formatIDR = (amount: number): string => {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);
  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
};

export const formatSignedIDR = (amount: number): string => {
  const rounded = Math.round(amount);
  const absVal = Math.abs(rounded);
  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (rounded > 0) {
    return `+Rp ${formatted}`;
  } else if (rounded < 0) {
    return `-Rp ${formatted}`;
  }
  return `Rp 0`;
};

export const parseIDRInput = (input: string): number => {
  if (!input) return 0;
  const digits = input.replace(/\D/g, '');
  if (!digits) return 0;
  const val = parseInt(digits, 10);
  return isNaN(val) ? 0 : val;
};
