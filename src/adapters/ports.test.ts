import { describe, expect, it } from "vitest";
import { createIranCarrierAdapter } from "./carriers/iran";
import type { PaymentAdapter, SmsAdapter } from "./ports";
import { ApiError } from "../lib/errors";

describe("adapter ports", () => {
  it("describes start/verify/send shapes", async () => {
    const payment: PaymentAdapter = {
      id: "zarinpal",
      start: async () => ({ authority: "A", redirectUrl: "https://sandbox.zarinpal.com/pg/StartPay/A" }),
      verify: async () => ({ ok: true, reference: "1", code: 100 }),
    };
    const sms: SmsAdapter = {
      id: "kavenegar",
      send: async () => ({ providerMessageId: "1" }),
    };
    expect(payment.id).toBe("zarinpal");
    expect(sms.id).toBe("kavenegar");
    const carrier = createIranCarrierAdapter("post_iran");
    expect((await carrier.quote({ carrier: "post_iran", weightGrams: 500, postcode: "11", city: "Tehran" })).days).toBe(4);
    expect((await carrier.buyLabel({ carrier: "post_iran", weightGrams: 500, postcode: "11", city: "Tehran" })).trackingNumber).toContain("post_iran");
    expect(() => createIranCarrierAdapter("fedex")).toThrow(ApiError);
  });
});
