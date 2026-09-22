import { getCarrierAdapter } from "../../adapters/registry";
import { eligibleRates, resolveSelectedRate } from "../../domain/shipping";
import { readMerged, type SettingMap } from "../settings/store";

type MethodRow = {
  id: number;
  methodId: string;
  title: string;
  costCents: number;
  minAmountCents: number | null;
};

export async function quoteCartShipping(
  map: SettingMap,
  methods: MethodRow[],
  afterDiscount: number,
  selectedId: string | null,
  postcode: string,
) {
  const freeAbove = Number(readMerged(map, "shipping", "free_above_rial") || 0);
  const rates = eligibleRates(
    methods.map((method) => ({
      id: `${method.methodId}:${method.id}`,
      methodId: method.methodId,
      title: method.title,
      costMinor: method.methodId === "free_shipping" ? 0 : method.costCents,
      minSubtotalMinor:
        method.methodId === "free_shipping" ? freeAbove || method.minAmountCents : method.minAmountCents,
    })),
    afterDiscount,
  );
  let carrierQuote: { amountRial: number; days: number; carrier: string } | null = null;
  try {
    const adapter = getCarrierAdapter(map);
    const quoted = await adapter.quote({
      carrier: adapter.id,
      weightGrams: 1000,
      postcode: postcode || "1111111111",
      city: "Tehran",
    });
    carrierQuote = { ...quoted, carrier: adapter.id };
  } catch {
    carrierQuote = null;
  }
  const selected = resolveSelectedRate(rates, selectedId);
  return { rates, selected, carrierQuote };
}
