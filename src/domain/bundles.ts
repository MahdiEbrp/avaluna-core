export type KitComponent = { productId: number; quantity: number };

export function expandKit(components: KitComponent[], kits: number): KitComponent[] {
  const qty = Math.max(0, kits);
  return components.map((component) => ({
    productId: component.productId,
    quantity: component.quantity * qty,
  }));
}

export function optionSurchargeMinor(baseMinor: number, selected: { surchargeMinor: number }[]): number {
  return Math.max(0, baseMinor) + selected.reduce((sum, option) => sum + Math.max(0, option.surchargeMinor), 0);
}

export function giftWrapMinor(enabled: boolean, feeMinor: number, lines: number): number {
  if (!enabled || lines < 1) {
    return 0;
  }
  return Math.max(0, feeMinor) * lines;
}
