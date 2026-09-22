import { eq } from "drizzle-orm";
import { isAbandoned } from "../../domain/abandoned-cart";
import { canShipQuantity, fulfillmentFromShipped } from "../../domain/fulfillment";
import { pointsEarnedForPurchase } from "../../domain/loyalty";
import { toMinorUnits } from "../../domain/money";
import { canTransitionPayment, isPaymentIntentStatus } from "../../domain/payments";
import { canReturnQuantity, canTransitionReturn, isReturnStatus } from "../../domain/returns";
import { db } from "../db/client";
import {
  auditEvents,
  cartItems,
  carts,
  fulfillmentItems,
  fulfillments,
  loyaltyAccounts,
  notifications,
  orderItems,
  paymentIntents,
  returnItems,
  returnRequests,
} from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";
import { completeRmaRefund, notifyShipment } from "./fulfillment-flow";

export async function recordAudit(actorId: number | null, action: string, entity: string, entityId: string) {
  await db.insert(auditEvents).values({ actorId, action, entity, entityId, createdAt: nowIso() });
}

export async function queueNotification(template: string, recipient: string, payload: unknown) {
  const row = await db
    .insert(notifications)
    .values({ template, recipient, payloadJson: JSON.stringify(payload), createdAt: nowIso() })
    .returning();
  return row[0];
}

export async function createFulfillment(input: {
  order_id: number;
  tracking_number?: string;
  carrier?: string;
  items: { order_item_id: number; quantity: number }[];
}) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.order_id));
  const existingShipments = await db.select().from(fulfillments).where(eq(fulfillments.orderId, input.order_id));
  const shippedByItem = new Map<number, number>();
  for (const shipment of existingShipments) {
    const lines = await db.select().from(fulfillmentItems).where(eq(fulfillmentItems.fulfillmentId, shipment.id));
    for (const line of lines) {
      shippedByItem.set(line.orderItemId, (shippedByItem.get(line.orderItemId) ?? 0) + line.quantity);
    }
  }
  for (const line of input.items) {
    const ordered = items.find((item) => item.id === line.order_item_id);
    if (!ordered) {
      throw new ApiError(400, "fulfillment.unknown_item", "Order line not found.");
    }
    const already = shippedByItem.get(line.order_item_id) ?? 0;
    if (!canShipQuantity(ordered.quantity, already, line.quantity)) {
      throw new ApiError(400, "fulfillment.quantity_exceeds", "Cannot ship more than ordered.");
    }
  }
  const created = await db
    .insert(fulfillments)
    .values({
      orderId: input.order_id,
      status: "in_transit",
      trackingNumber: input.tracking_number,
      carrier: input.carrier ?? "",
      createdAt: nowIso(),
    })
    .returning();
  const fulfillment = requireInserted(created[0], "fulfillment");
  for (const line of input.items) {
    await db.insert(fulfillmentItems).values({
      fulfillmentId: fulfillment.id,
      orderItemId: line.order_item_id,
      quantity: line.quantity,
    });
  }
  const totalOrdered = items.reduce((sum, item) => sum + item.quantity, 0);
  let totalShipped = 0;
  for (const line of input.items) {
    totalShipped += line.quantity + (shippedByItem.get(line.order_item_id) ?? 0);
  }
  for (const [itemId, qty] of shippedByItem) {
    if (!input.items.some((line) => line.order_item_id === itemId)) {
      totalShipped += qty;
    }
  }
  await notifyShipment(input.order_id, input.tracking_number ?? "");
  return {
    fulfillment,
    order_fulfillment_status: fulfillmentFromShipped(totalOrdered, totalShipped),
  };
}

export async function createReturnRequest(input: {
  order_id: number;
  reason?: string;
  items: { order_item_id: number; quantity: number }[];
}) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.order_id));
  for (const line of input.items) {
    const purchased = items.find((item) => item.id === line.order_item_id);
    if (!purchased || !canReturnQuantity(purchased.quantity, 0, line.quantity)) {
      throw new ApiError(400, "returns.invalid_quantity", "Return quantity is invalid.");
    }
  }
  const created = await db
    .insert(returnRequests)
    .values({ orderId: input.order_id, reason: input.reason ?? "", createdAt: nowIso() })
    .returning();
  const ret = requireInserted(created[0], "return");
  for (const line of input.items) {
    await db.insert(returnItems).values({
      returnId: ret.id,
      orderItemId: line.order_item_id,
      quantity: line.quantity,
    });
  }
  return ret;
}

export async function updateReturnStatus(id: number, status: string) {
  const current = (await db.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1))[0];
  if (!current) {
    throw new ApiError(404, "returns.not_found", "Return not found.");
  }
  if (!isReturnStatus(current.status) || !isReturnStatus(status) || !canTransitionReturn(current.status, status)) {
    throw new ApiError(409, "returns.illegal_transition", "Illegal return status change.");
  }
  await db.update(returnRequests).set({ status }).where(eq(returnRequests.id, id));
  if (status === "refunded") {
    await completeRmaRefund(id);
  }
  return { ...current, status };
}

export async function listAbandonedCarts() {
  const all = await db.select().from(carts);
  const now = Date.now();
  const abandoned = [];
  for (const cart of all) {
    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    if (isAbandoned(cart.updatedAt, now, count)) {
      abandoned.push({
        id: cart.id,
        email: cart.email,
        item_count: count,
        updated_at: cart.updatedAt,
      });
    }
  }
  return abandoned;
}

export async function creditLoyalty(customerId: number, orderTotalMinor: number) {
  const points = pointsEarnedForPurchase(orderTotalMinor);
  const existing = (await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.customerId, customerId)).limit(1))[0];
  if (existing) {
    await db
      .update(loyaltyAccounts)
      .set({ points: existing.points + points })
      .where(eq(loyaltyAccounts.customerId, customerId));
    return { customer_id: customerId, points: existing.points + points, earned: points };
  }
  await db.insert(loyaltyAccounts).values({ customerId, points });
  return { customer_id: customerId, points, earned: points };
}

export async function listAudit(limit = 50) {
  return db.select().from(auditEvents).limit(limit);
}

export async function listNotifications() {
  return db.select().from(notifications);
}

export async function createPaymentIntent(input: { amount: string; method: string; order_id?: number }) {
  const row = await db
    .insert(paymentIntents)
    .values({
      orderId: input.order_id ?? null,
      amountCents: toMinorUnits(input.amount),
      method: input.method,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "payment_intent");
}

export async function updatePaymentIntent(id: number, status: string) {
  const current = (await db.select().from(paymentIntents).where(eq(paymentIntents.id, id)).limit(1))[0];
  if (!current) {
    throw new ApiError(404, "payments.intent_not_found", "Payment intent not found.");
  }
  if (
    !isPaymentIntentStatus(current.status) ||
    !isPaymentIntentStatus(status) ||
    !canTransitionPayment(current.status, status)
  ) {
    throw new ApiError(409, "payments.illegal_transition", "Illegal payment intent transition.");
  }
  await db.update(paymentIntents).set({ status, updatedAt: nowIso() }).where(eq(paymentIntents.id, id));
  return { ...current, status };
}
