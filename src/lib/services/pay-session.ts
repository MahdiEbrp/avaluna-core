import { eq } from "drizzle-orm";
import { getPaymentAdapter } from "../../adapters/registry";
import { ApiError } from "../errors";
import { db } from "../db/client";
import { orders } from "../db/schema";
import { loadSettings, readMerged } from "../settings/store";
import { nowIso } from "../time";
import { applyOrderStock, markOrderStockTaken } from "./stock";

export async function startOrderPayment(orderId: number, method: string) {
  const map = await loadSettings();
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) {
    throw new ApiError(404, "orders.not_found", "Order not found.");
  }
  const adapter = getPaymentAdapter(method, map);
  const callback =
    readMerged(map, "payments", "callback_url") || "/api/storefront/v1/payments/callback";
  const started = await adapter.start({
    amountRial: order.totalCents,
    description: `Order ${order.number}`,
    callbackUrl: callback,
    orderId: String(order.id),
  });
  await db
    .update(orders)
    .set({ transactionId: started.authority, updatedAt: nowIso() })
    .where(eq(orders.id, orderId));
  return { authority: started.authority, redirect_url: started.redirectUrl || null };
}

export async function verifyOrderPayment(input: { provider: string; authority: string; order_id?: number }) {
  const map = await loadSettings();
  const order = input.order_id
    ? (await db.select().from(orders).where(eq(orders.id, input.order_id)).limit(1))[0]
    : (await db.select().from(orders).where(eq(orders.transactionId, input.authority)).limit(1))[0];
  if (!order) {
    throw new ApiError(404, "orders.not_found", "Order not found for this authority.");
  }
  if (order.status === "processing" && order.transactionId === input.authority) {
    return { order_id: order.id, status: "processing", authority: input.authority, replay: true };
  }
  const adapter = getPaymentAdapter(input.provider || order.paymentMethod, map);
  const verified = await adapter.verify({ authority: input.authority, amountRial: order.totalCents });
  if (!verified.ok) {
    if (order.stockTaken) {
      await applyOrderStock(order.id, "release");
      await markOrderStockTaken(order.id, false);
    }
    await db.update(orders).set({ status: "failed", updatedAt: nowIso() }).where(eq(orders.id, order.id));
    throw new ApiError(402, "payments.verify_failed", "Gateway did not accept the payment.");
  }
  if (!order.stockTaken) {
    await applyOrderStock(order.id, "take");
    await markOrderStockTaken(order.id, true);
  }
  await db
    .update(orders)
    .set({
      status: "processing",
      transactionId: verified.reference ?? input.authority,
      datePaid: nowIso(),
      updatedAt: nowIso(),
    })
    .where(eq(orders.id, order.id));
  const { queueOrderNotice } = await import("./order-notify");
  await queueOrderNotice(order.id, "order_paid");
  try {
    const { submitOrderToMoadian } = await import("./moadian-submit");
    await submitOrderToMoadian(order.id);
  } catch {
    await db.insert((await import("../db/schema")).moadianSubmissions).values({
      orderId: order.id,
      status: "failed",
      reference: null,
      createdAt: nowIso(),
    });
  }
  return { order_id: order.id, status: "processing", authority: input.authority, replay: false };
}
