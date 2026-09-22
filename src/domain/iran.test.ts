import { describe, expect, it } from "vitest";
import { formatJalaliIso, gregorianToJalali } from "./jalali";
import {
  amountForGateway,
  isIranEconomicCode,
  isIranMobile,
  isIranNationalId,
  isIranPostalCode,
  isIranSheba,
  normalizeIranMobile,
  rialsToToman,
  tomanToRials,
} from "./iran";
import {
  IRAN_PAYMENT_PROVIDERS,
  isIranCarrier,
  isIranPaymentProvider,
  isIranSmsProvider,
  kavenegarSendPath,
  quoteIranCarrier,
  simulateIranPayment,
  zarinpalAccepted,
  zarinpalRequestPath,
  zarinpalStartUrl,
} from "./iran-gateways";
import { defaultSetting, mergeSettingValue, settingGroups, settingsForGroup } from "./settings-catalog";

describe("iran identity and money", () => {
  it("converts toman/rial and phones", () => {
    expect(tomanToRials(1)).toBe(10);
    expect(rialsToToman(15)).toBe(1);
    expect(amountForGateway(10000, "toman")).toBe(1000);
    expect(amountForGateway(10000, "rial")).toBe(10000);
    expect(normalizeIranMobile("09121234567")).toBe("+989121234567");
    expect(normalizeIranMobile("+989121234567")).toBe("+989121234567");
    expect(normalizeIranMobile("00989121234567")).toBe("+989121234567");
    expect(normalizeIranMobile("9121234567")).toBe("+989121234567");
    expect(isIranMobile("02122000000")).toBe(false);
    expect(isIranPostalCode("1234567890")).toBe(true);
    expect(isIranPostalCode("123")).toBe(false);
    expect(isIranEconomicCode("12345678901")).toBe(true);
    expect(isIranNationalId("0000000019")).toBe(true);
    expect(isIranNationalId("0000000000")).toBe(false);
    expect(isIranNationalId("123")).toBe(false);
    expect(isIranSheba("IR000000000000000000000000")).toBe(false);
    expect(isIranSheba("DE00")).toBe(false);
  });
});

describe("iran gateways and settings", () => {
  it("lists customizable iran providers", () => {
    expect(isIranPaymentProvider("zarinpal")).toBe(true);
    expect(isIranPaymentProvider("paypal")).toBe(false);
    expect(IRAN_PAYMENT_PROVIDERS.includes("kavenegar" as never)).toBe(false);
    expect(isIranSmsProvider("kavenegar")).toBe(true);
    expect(isIranCarrier("tipax")).toBe(true);
    expect(zarinpalAccepted(100)).toBe(true);
    expect(zarinpalAccepted(101)).toBe(true);
    expect(zarinpalAccepted(99)).toBe(false);
    expect(zarinpalStartUrl("ABC", true)).toContain("sandbox");
    expect(zarinpalStartUrl("ABC", false)).toContain("www.zarinpal.com");
    expect(zarinpalRequestPath(false)).toContain("api.zarinpal.com");
    expect(zarinpalRequestPath(true)).toContain("sandbox");
    expect(kavenegarSendPath("ab-cd")).toContain("/abcd/");
    expect(quoteIranCarrier("post_iran", 500).days).toBe(4);
    expect(quoteIranCarrier("tipax", 2000).days).toBe(2);
    expect(quoteIranCarrier("alopeyk", 100).days).toBe(1);
    expect(simulateIranPayment("zarinpal", 5000).ok).toBe(true);
    expect(simulateIranPayment("zarinpal", 1).ok).toBe(false);
    expect(simulateIranPayment("nope", 5000).ok).toBe(false);
    expect(simulateIranPayment("card_to_card", 5000).ok).toBe(true);
    expect(settingGroups()).toContain("payments");
    expect(settingsForGroup("sms")[0]?.id).toBe("provider");
    expect(defaultSetting("general", "timezone")).toBe("Asia/Tehran");
    expect(defaultSetting("missing", "x")).toBeUndefined();
    const def = settingsForGroup("general")[0];
    expect(def).toBeDefined();
    if (!def) {
      return;
    }
    expect(mergeSettingValue(def, "X").value).toBe("X");
    expect(mergeSettingValue(def, undefined).value).toBe(def.value);
  });
});

describe("jalali", () => {
  it("formats storefront dates", () => {
    const j = gregorianToJalali({ year: 2024, month: 3, day: 20 });
    expect(j.year).toBeGreaterThan(1400);
    expect(gregorianToJalali({ year: 2023, month: 6, day: 15 }).month).toBeGreaterThan(2);
    expect(gregorianToJalali({ year: 2000, month: 12, day: 31 }).year).toBeGreaterThan(1300);
    expect(gregorianToJalali({ year: 2024, month: 1, day: 1 }).month).toBeGreaterThan(0);
    expect(gregorianToJalali({ year: 2024, month: 3, day: 20 })).toEqual({ year: 1403, month: 1, day: 1 });
    expect(gregorianToJalali({ year: 2025, month: 3, day: 21 })).toEqual({ year: 1404, month: 1, day: 1 });
    expect(formatJalaliIso("2024-03-20T00:00:00.000Z")).toBe("1403/01/01");
    expect(formatJalaliIso("not-a-date")).toBe("not-a-date");
  });
});
