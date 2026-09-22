export const PAYMENT_INTENT_STATUSES = [
  "requires_action",
  "authorized",
  "captured",
  "cancelled",
  "failed",
] as const;

export type PaymentIntentStatus = (typeof PAYMENT_INTENT_STATUSES)[number];

const TRANSITIONS: Record<PaymentIntentStatus, readonly PaymentIntentStatus[]> = {
  requires_action: ["authorized", "cancelled", "failed"],
  authorized: ["captured", "cancelled"],
  captured: ["captured"],
  cancelled: ["cancelled"],
  failed: ["failed"],
};

export function isPaymentIntentStatus(value: string): value is PaymentIntentStatus {
  return (PAYMENT_INTENT_STATUSES as readonly string[]).includes(value);
}

export function canTransitionPayment(from: PaymentIntentStatus, to: PaymentIntentStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}
