import { eq } from "drizzle-orm";
import { statusAfterCodDelivered } from "../../domain/cod";
import { renderTemplate } from "../../domain/templates";
import { db } from "../db/client";
import { fulfillments, messageOutbox, orders, returnItems, returnRequests } from "../db/schema";
import { parseJsonColumn } from "../safety";
import { nowIso } from "../time";
import { createRefund } from "./order-admin";
import { applyStockDelta } from "./stock";

export async function notifyShipment(orderId: number, tracking: string) {
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) {
    return;
  }
  const billing = parseJsonColumn<{ mobile?: string }>(order.billingJson, {});
  const to = billing.mobile ?? order.customerEmail;
  const body = renderTemplate("order_shipped", "fa", { number: order.number, tracking });
  await db.insert(messageOutbox).values({
    channel: billing.mobile ? "sms" : "email",
    provider: "transactional",
    recipient: to,
    subject: "shipped",
    body,
    createdAt: nowIso(),
  });
}

export async function markDelivered(fulfillmentId: number) {
  const row = (await db.select().from(fulfillments).where(eq(fulfillments.id, fulfillmentId)).limit(1))[0];
  if (!row) {
    return null;
  }
  await db.update(fulfillments).set({ status: "delivered" }).where(eq(fulfillments.id, fulfillmentId));
  const order = (await db.select().from(orders).where(eq(orders.id, row.orderId)).limit(1))[0];
  if (order) {
    const next = statusAfterCodDelivered(order.paymentMethod, order.status);
    await db.update(orders).set({ status: next, dateCompleted: nowIso(), updatedAt: nowIso() }).where(eq(orders.id, order.id));
  }
  return { id: fulfillmentId, status: "delivered" };
}

export async function completeRmaRefund(returnId: number) {
  const ret = (await db.select().from(returnRequests).where(eq(returnRequests.id, returnId)).limit(1))[0];
  if (!ret) {
    return;
  }
  const lines = await db.select().from(returnItems).where(eq(returnItems.returnId, returnId));
  const { orderItems } = await import("../db/schema");
  for (const line of lines) {
    const item = (await db.select().from(orderItems).where(eq(orderItems.id, line.orderItemId)).limit(1))[0];
    if (item?.productId) {
      await applyStockDelta(item.productId, item.variationId, line.quantity);
    }
  }
  const order = (await db.select().from(orders).where(eq(orders.id, ret.orderId)).limit(1))[0];
  if (order) {
    await createRefund(order.id, String(order.totalCents), "rma", true);
  }
}
