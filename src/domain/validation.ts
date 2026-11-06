/**
 * Input validation guards for KuroStop domain and persistence.
 */

import type { PmoType, Sensitivity, Intensity } from './types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateSmokeQty(qty: number): number {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new ValidationError(`Kuantitas rokok harus berupa bilangan bulat positif (diterima: ${qty})`);
  }
  if (qty > 100) {
    throw new ValidationError(`Kuantitas rokok melebihi batas wajar sekali catat (maks 100, diterima: ${qty})`);
  }
  return qty;
}

export function validatePrice(price: number): number {
  if (!Number.isInteger(price) || price < 0) {
    throw new ValidationError(`Harga harus berupa nominal Rupiah bulat tidak negatif (diterima: ${price})`);
  }
  return price;
}

export function validatePmoType(type: string): PmoType {
  if (type !== 'p' && type !== 'm' && type !== 'pmo') {
    throw new ValidationError(`Tipe PMO tidak valid: "${type}". Harus salah satu dari 'p', 'm', atau 'pmo'.`);
  }
  return type as PmoType;
}

export function validateTimestamp(ts: number, maxFutureMs = 300_000): number {
  if (!Number.isFinite(ts) || ts <= 0) {
    throw new ValidationError(`Timestamp waktu tidak valid: ${ts}`);
  }
  const now = Date.now();
  if (ts > now + maxFutureMs) {
    throw new ValidationError(`Waktu catatan tidak boleh melebihi waktu sekarang.`);
  }
  return ts;
}

export function validateSleepTimes(startTime: number, endTime?: number): void {
  validateTimestamp(startTime);
  if (endTime !== undefined && endTime !== null) {
    validateTimestamp(endTime);
    if (endTime < startTime) {
      throw new ValidationError(`Waktu bangun (${endTime}) tidak boleh lebih awal dari waktu mulai tidur (${startTime}).`);
    }
  }
}

export function validateSensitivity(val: string): Sensitivity {
  if (val !== 'lunak' && val !== 'standar' && val !== 'keras') {
    throw new ValidationError(`Sensitivitas konsekuensi tidak valid: ${val}`);
  }
  return val;
}

export function validateIntensity(val: string): Intensity {
  if (val !== 'normal' && val !== 'strict' && val !== 'brutal') {
    throw new ValidationError(`Intensitas pesan akuntabilitas tidak valid: ${val}`);
  }
  return val;
}
