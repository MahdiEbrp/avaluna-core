import type { MinorUnits } from "./money";

export type StockPolicy = "none" | "notify" | "allow";

export function canFulfill(params: {
  manageStock: boolean;
  quantityOnHand: number;
  requested: number;
  backorderPolicy: StockPolicy;
}): boolean {
  if (params.requested < 1) {
    return false;
  }
  if (!params.manageStock) {
    return true;
  }
  if (params.quantityOnHand >= params.requested) {
    return true;
  }
  return params.backorderPolicy !== "none";
}

export function remainingAfterSale(onHand: number, sold: number): number {
  return Math.max(0, onHand - sold);
}

export function stockStatusFromQuantity(onHand: number): "in_stock" | "out_of_stock" {
  return onHand > 0 ? "in_stock" : "out_of_stock";
}

export function lineTotal(unitMinor: MinorUnits, quantity: number): MinorUnits {
  return unitMinor * quantity;
}
