export function applyMovement(onHand: number, delta: number): number {
  return Math.max(0, onHand + delta);
}

export function transferDelta(quantity: number): { from: number; to: number } {
  const qty = Math.max(0, quantity);
  return { from: -qty, to: qty };
}

export function isLowStock(onHand: number, threshold: number): boolean {
  return onHand <= threshold;
}
