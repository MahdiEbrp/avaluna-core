import { ORDER_STATUSES, type OrderStatus } from "../config/constants";

const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["processing", "on_hold", "cancelled", "failed"],
  processing: ["completed", "on_hold", "cancelled", "refunded"],
  on_hold: ["processing", "cancelled", "failed"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
  failed: ["pending_payment", "cancelled"],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) {
    return true;
  }
  return ALLOWED[from].includes(to);
}

const DELAYED_SETTLEMENT = new Set(["bank_transfer", "cash_on_delivery", "cheque", "card_to_card"]);
const REDIRECT_SETTLEMENT = new Set([
  "zarinpal",
  "idpay",
  "nextpay",
  "zibal",
  "payping",
  "sadad",
  "behpardakht",
]);

export function paymentSettlesImmediately(methodId: string): boolean {
  return !DELAYED_SETTLEMENT.has(methodId) && !REDIRECT_SETTLEMENT.has(methodId);
}

export function statusAfterCheckout(methodId: string): OrderStatus {
  if (REDIRECT_SETTLEMENT.has(methodId)) {
    return "pending_payment";
  }
  return paymentSettlesImmediately(methodId) ? "processing" : "on_hold";
}

export function formatOrderNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(8, "0")}`;
}
