import { IRAN_PAYMENT_PROVIDERS } from "./iran-gateways";

export const PAYMENT_PROVIDERS = IRAN_PAYMENT_PROVIDERS;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export function isPaymentProvider(value: string): value is PaymentProvider {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export function canCharge(amountMinor: number): boolean {
  return Number.isInteger(amountMinor) && amountMinor > 0;
}

export function simulateCardCharge(panLast4: string, amountMinor: number): { ok: true } | { ok: false; reason: string } {
  if (!canCharge(amountMinor)) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (panLast4 === "0002") {
    return { ok: false, reason: "declined" };
  }
  return { ok: true };
}

export function isE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export const MESSAGE_CHANNELS = ["email", "sms"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export function isMessageChannel(value: string): value is MessageChannel {
  return (MESSAGE_CHANNELS as readonly string[]).includes(value);
}
