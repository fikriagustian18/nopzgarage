export function normalizeCommissionRate(value: unknown): number {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error("Rate komisi harus berada pada rentang 0-100%.");
  }
  return rate;
}

export function calculateCommission(serviceSubtotal: unknown, rateValue: unknown): number {
  const subtotal = Number(serviceSubtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new Error("Subtotal jasa harus berupa angka non-negatif.");
  }

  const rate = normalizeCommissionRate(rateValue);
  return Math.round((subtotal * rate) / 100);
}
