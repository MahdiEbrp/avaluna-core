export function availableToSell(onHand: number, reserved: number): number {
  return Math.max(0, onHand - Math.max(0, reserved));
}

export function canReserve(onHand: number, reserved: number, quantity: number): boolean {
  return quantity > 0 && availableToSell(onHand, reserved) >= quantity;
}

export function isReservationActive(expiresAtMs: number, nowMs: number, released: boolean): boolean {
  return !released && expiresAtMs > nowMs;
}

export function reservationExpiresAt(nowMs: number, ttlMs: number): number {
  return nowMs + ttlMs;
}
