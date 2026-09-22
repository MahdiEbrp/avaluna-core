import { describe, expect, it } from "vitest";
import { cronMatchesUtc, isCronExpression, nextCronUtcMs } from "./cron";
import {
  canCharge,
  isE164,
  isEmailAddress,
  isMessageChannel,
  isPaymentProvider,
  simulateCardCharge,
} from "./gateways";

describe("avaluna payment sms email gateways", () => {
  it("validates providers and charge simulation", () => {
    expect(isPaymentProvider("avaluna_offline")).toBe(true);
    expect(isPaymentProvider("stripe")).toBe(false);
    expect(canCharge(1)).toBe(true);
    expect(canCharge(0)).toBe(false);
    expect(simulateCardCharge("4242", 100).ok).toBe(true);
    expect(simulateCardCharge("0002", 100).ok).toBe(false);
    expect(simulateCardCharge("4242", 0).ok).toBe(false);
  });

  it("validates recipients", () => {
    expect(isE164("+491701234567")).toBe(true);
    expect(isE164("01701234567")).toBe(false);
    expect(isEmailAddress("ops@avaluna.local")).toBe(true);
    expect(isEmailAddress("nope")).toBe(false);
    expect(isMessageChannel("sms")).toBe(true);
    expect(isMessageChannel("push")).toBe(false);
  });
});

describe("avaluna cron", () => {
  it("matches five-field UTC expressions", () => {
    expect(isCronExpression("* * * * *")).toBe(true);
    expect(isCronExpression("bad")).toBe(false);
    const noon = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
    expect(cronMatchesUtc("0 12 * * *", noon)).toBe(true);
    expect(cronMatchesUtc("0 11 * * *", noon)).toBe(false);
    expect(cronMatchesUtc("*/15 * * * *", new Date(Date.UTC(2026, 0, 1, 0, 30, 0)))).toBe(true);
    expect(cronMatchesUtc("only-four-fields x", noon)).toBe(false);
    expect(cronMatchesUtc("0 12 * * * * extra", noon)).toBe(false);
    expect(nextCronUtcMs("bad", Date.now())).toBeNull();
    const next = nextCronUtcMs("0 12 * * *", Date.UTC(2026, 0, 1, 11, 59, 0));
    expect(next).toBe(Date.UTC(2026, 0, 1, 12, 0, 0));
  });
});
