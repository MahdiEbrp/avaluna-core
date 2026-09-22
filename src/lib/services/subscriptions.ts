import { eq } from "drizzle-orm";
import {
  canTransitionSubscription,
  dunningExhausted,
  isSubscriptionStatus,
  nextBillingAtMs,
} from "../../domain/subscriptions";
import { toMinorUnits } from "../../domain/money";
import { db } from "../db/client";
import { subscriptions } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";

export async function createSubscription(input: {
  customer_id: number;
  amount: string;
  interval_days?: number;
}) {
  const intervalDays = input.interval_days ?? 30;
  const row = await db
    .insert(subscriptions)
    .values({
      customerId: input.customer_id,
      amountCents: toMinorUnits(input.amount),
      intervalDays,
      nextBillingAtMs: nextBillingAtMs(Date.now(), intervalDays),
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "subscription");
}

export async function listSubscriptions() {
  return db.select().from(subscriptions);
}

export async function updateSubscriptionStatus(id: number, status: string) {
  const current = (await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1))[0];
  if (!current) {
    throw new ApiError(404, "subscriptions.not_found", "Subscription not found.");
  }
  if (
    !isSubscriptionStatus(current.status) ||
    !isSubscriptionStatus(status) ||
    !canTransitionSubscription(current.status, status)
  ) {
    throw new ApiError(409, "subscriptions.illegal_transition", "Illegal subscription transition.");
  }
  await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, id));
  return { ...current, status };
}

export async function attemptSubscriptionBilling(id: number, success: boolean, maxAttempts = 4) {
  const current = (await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1))[0];
  if (!current) {
    throw new ApiError(404, "subscriptions.not_found", "Subscription not found.");
  }
  if (success) {
    await db
      .update(subscriptions)
      .set({
        status: "active",
        attempt: 0,
        nextBillingAtMs: nextBillingAtMs(Date.now(), current.intervalDays),
      })
      .where(eq(subscriptions.id, id));
    return { id, status: "active", attempt: 0 };
  }
  const attempt = current.attempt + 1;
  const status = dunningExhausted(attempt, maxAttempts) ? "cancelled" : "past_due";
  await db.update(subscriptions).set({ attempt, status }).where(eq(subscriptions.id, id));
  return { id, status, attempt };
}
