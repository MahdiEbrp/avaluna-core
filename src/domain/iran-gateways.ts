export const IRAN_PAYMENT_PROVIDERS = [
  "zarinpal",
  "idpay",
  "nextpay",
  "zibal",
  "payping",
  "sadad",
  "behpardakht",
  "card_to_card",
  "cash_on_delivery",
  "avaluna_offline",
  "avaluna_card_sim",
] as const;

export type IranPaymentProvider = (typeof IRAN_PAYMENT_PROVIDERS)[number];

export function isIranPaymentProvider(value: string): value is IranPaymentProvider {
  return (IRAN_PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export const IRAN_SMS_PROVIDERS = ["kavenegar", "ghasedak", "melipayamak", "sms_ir", "avaluna_sms"] as const;
export type IranSmsProvider = (typeof IRAN_SMS_PROVIDERS)[number];

export function isIranSmsProvider(value: string): value is IranSmsProvider {
  return (IRAN_SMS_PROVIDERS as readonly string[]).includes(value);
}

export const IRAN_EMAIL_PROVIDERS = ["smtp", "mailir", "avaluna_mail"] as const;

export const IRAN_CARRIERS = ["post_iran", "tipax", "chapar", "alopeyk", "snappbox"] as const;
export type IranCarrier = (typeof IRAN_CARRIERS)[number];

export function isIranCarrier(value: string): value is IranCarrier {
  return (IRAN_CARRIERS as readonly string[]).includes(value);
}

export function zarinpalStartUrl(authority: string, sandbox: boolean): string {
  const host = sandbox ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com";
  return `${host}/pg/StartPay/${encodeURIComponent(authority)}`;
}

export function zarinpalRequestPath(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
    : "https://api.zarinpal.com/pg/v4/payment/request.json";
}

export function zarinpalAccepted(code: number): boolean {
  return code === 100 || code === 101;
}

export function kavenegarSendPath(apiKey: string): string {
  const key = apiKey.replace(/[^a-zA-Z0-9]/g, "");
  return `https://api.kavenegar.com/v1/${key}/sms/send.json`;
}

export function quoteIranCarrier(carrier: IranCarrier, weightGrams: number): { amountMinor: number; days: number } {
  const kg = Math.ceil(Math.max(1, weightGrams) / 1000);
  if (carrier === "alopeyk" || carrier === "snappbox") {
    return { amountMinor: 45000 + kg * 5000, days: 1 };
  }
  if (carrier === "tipax" || carrier === "chapar") {
    return { amountMinor: 80000 + kg * 15000, days: 2 };
  }
  return { amountMinor: 35000 + kg * 8000, days: 4 };
}

export function simulateIranPayment(provider: string, amountRial: number): { ok: true; authority: string } | { ok: false; reason: string } {
  if (!isIranPaymentProvider(provider)) {
    return { ok: false, reason: "unknown_provider" };
  }
  if (!Number.isInteger(amountRial) || amountRial < 1000) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (provider === "card_to_card" || provider === "cash_on_delivery" || provider === "avaluna_offline") {
    return { ok: true, authority: `offline_${provider}` };
  }
  return { ok: true, authority: `A${String(amountRial).padStart(35, "0").slice(0, 35)}` };
}
