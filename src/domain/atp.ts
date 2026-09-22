export function availableToPromise(onHand: number, reserved: number, incoming: number, outgoing: number): number {
  return Math.max(0, onHand - reserved - outgoing + incoming);
}

export function canTransfer(fromAtp: number, quantity: number): boolean {
  return quantity > 0 && fromAtp >= quantity;
}

export function poReceivable(ordered: number, alreadyReceived: number, incoming: number): boolean {
  return incoming > 0 && alreadyReceived + incoming <= ordered;
}
