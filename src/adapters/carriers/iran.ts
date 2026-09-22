import { isIranCarrier, quoteIranCarrier, type IranCarrier } from "../../domain/iran-gateways";
import { ApiError } from "../../lib/errors";
import type { CarrierAdapter, LabelInput } from "../ports";

export function createIranCarrierAdapter(id: string): CarrierAdapter {
  if (!isIranCarrier(id)) {
    throw new ApiError(400, "shipping.unknown_carrier", "Unknown Iranian carrier.");
  }
  const carrier = id as IranCarrier;
  return {
    id: carrier,
    async quote(input: LabelInput) {
      const quoted = quoteIranCarrier(carrier, input.weightGrams);
      return { amountRial: quoted.amountMinor, days: quoted.days };
    },
    async buyLabel(input: LabelInput) {
      const quoted = quoteIranCarrier(carrier, input.weightGrams);
      return { trackingNumber: `${carrier}-${input.postcode}-${quoted.days}` };
    },
  };
}
