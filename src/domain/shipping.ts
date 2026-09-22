import type { MinorUnits } from "./money";

export type ShippingOption = {
  id: string;
  methodId: string;
  title: string;
  costMinor: MinorUnits;
  minSubtotalMinor: number | null;
};

export function eligibleRates(options: ShippingOption[], subtotalAfterDiscount: MinorUnits): ShippingOption[] {
  return options.filter((option) => {
    if (option.methodId !== "free_shipping") {
      return true;
    }
    const minimum = option.minSubtotalMinor ?? 0;
    return subtotalAfterDiscount >= minimum;
  });
}

export function resolveSelectedRate(
  rates: ShippingOption[],
  selectedId: string | null,
): ShippingOption | null {
  if (rates.length === 0) {
    return null;
  }
  return rates.find((rate) => rate.id === selectedId) ?? rates[0] ?? null;
}
