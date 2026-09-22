import { FULFILLMENT_STATUSES, type FulfillmentStatus } from "../config/constants";

export function isFulfillmentStatus(value: string): value is FulfillmentStatus {
  return (FULFILLMENT_STATUSES as readonly string[]).includes(value);
}

export function fulfillmentFromShipped(orderedQty: number, shippedQty: number): FulfillmentStatus {
  if (shippedQty <= 0) {
    return "unfulfilled";
  }
  if (shippedQty >= orderedQty) {
    return "fulfilled";
  }
  return "partial";
}

export function canShipQuantity(orderedQty: number, alreadyShipped: number, requestQty: number): boolean {
  if (requestQty < 1) {
    return false;
  }
  return alreadyShipped + requestQty <= orderedQty;
}
