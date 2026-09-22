import { RETURN_STATUSES, type ReturnStatus } from "../config/constants";

const ALLOWED: Record<ReturnStatus, readonly ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["received", "rejected"],
  rejected: [],
  received: ["refunded"],
  refunded: [],
};

export function isReturnStatus(value: string): value is ReturnStatus {
  return (RETURN_STATUSES as readonly string[]).includes(value);
}

export function canTransitionReturn(from: ReturnStatus, to: ReturnStatus): boolean {
  if (from === to) {
    return true;
  }
  return ALLOWED[from].includes(to);
}

export function canReturnQuantity(purchased: number, alreadyReturned: number, requestQty: number): boolean {
  if (requestQty < 1) {
    return false;
  }
  return alreadyReturned + requestQty <= purchased;
}
