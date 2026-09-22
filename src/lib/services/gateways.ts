import { nanoid } from "nanoid";
import { MONEY } from "../../config/constants";
import { canCharge, isE164, isEmailAddress, isPaymentProvider, simulateCardCharge } from "../../domain/gateways";
import { isIranMobile, normalizeIranMobile } from "../../domain/iran";
import { toMinorUnits } from "../../domain/money";
import { db } from "../db/client";
import { messageOutbox, paymentCharges } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";

export async function chargeViaGateway(input: {
  provider: string;
  amount: string;
  order_id?: number;
  pan_last4?: string;
}) {
  if (!isPaymentProvider(input.provider)) {
    throw new ApiError(400, "payments.unknown_provider", "Unknown Avaluna payment provider.");
  }
  const amountCents = toMinorUnits(input.amount);
  if (!canCharge(amountCents)) {
    throw new ApiError(400, "payments.invalid_amount", "Charge amount must be positive.");
  }
  if (input.provider === "avaluna_card_sim") {
    const decision = simulateCardCharge(input.pan_last4 ?? "4242", amountCents);
    if (!decision.ok) {
      throw new ApiError(402, `payments.${decision.reason}`, "Card simulation declined the charge.");
    }
  }
  const row = await db
    .insert(paymentCharges)
    .values({
      provider: input.provider,
      amountCents,
      currency: MONEY.DEFAULT_CURRENCY,
      status: "captured",
      reference: `avl_${nanoid(12)}`,
      orderId: input.order_id ?? null,
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "payment_charge");
}

export async function sendEmail(input: { to: string; subject: string; body: string }) {
  if (!isEmailAddress(input.to)) {
    throw new ApiError(400, "email.invalid_recipient", "Recipient must be a valid email address.");
  }
  const row = await db
    .insert(messageOutbox)
    .values({
      channel: "email",
      provider: "avaluna_mail",
      recipient: input.to,
      subject: input.subject,
      body: input.body,
      status: "queued",
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "email");
}

export async function sendSms(input: { to: string; body: string }) {
  const iran = normalizeIranMobile(input.to);
  const to = iran ?? input.to;
  if (!isE164(to) && !isIranMobile(input.to)) {
    throw new ApiError(400, "sms.invalid_recipient", "Recipient must be E.164 or an Iranian mobile number.");
  }
  const row = await db
    .insert(messageOutbox)
    .values({
      channel: "sms",
      provider: "avaluna_sms",
      recipient: to,
      body: input.body,
      status: "queued",
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "sms");
}

export async function listOutbox(channel?: string) {
  const rows = await db.select().from(messageOutbox);
  if (!channel) {
    return rows;
  }
  return rows.filter((row) => row.channel === channel);
}

export async function listCharges() {
  return db.select().from(paymentCharges);
}
