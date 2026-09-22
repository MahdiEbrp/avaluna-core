export type StackableDiscount = {
  kind: "bxgy" | "shipping" | "app" | "coupon";
  amountMinor: number;
  exclusive: boolean;
};

export function bxgyDiscountMinor(buyQty: number, getQty: number, unitMinor: number, cartQty: number): number {
  if (buyQty < 1 || getQty < 1 || cartQty < buyQty) {
    return 0;
  }
  const sets = Math.floor(cartQty / buyQty);
  return sets * getQty * Math.max(0, unitMinor);
}

export function stackDiscounts(discounts: StackableDiscount[], subtotalMinor: number, shippingMinor: number): number {
  const exclusive = discounts.filter((d) => d.exclusive);
  const pool = exclusive.length > 0 ? exclusive : discounts;
  let total = 0;
  for (const discount of pool) {
    if (discount.kind === "shipping") {
      total += Math.min(discount.amountMinor, shippingMinor);
    } else {
      total += Math.max(0, discount.amountMinor);
    }
  }
  return Math.min(total, subtotalMinor + shippingMinor);
}
