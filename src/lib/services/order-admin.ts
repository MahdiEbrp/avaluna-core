import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ORDER_STATUSES } from "../../config/constants";
import { offsetOf, parsePage } from "../../domain/pagination";
import { canTransition, isOrderStatus } from "../../domain/orders";
import { evaluateRefund } from "../../domain/refunds";
import { toMinorUnits } from "../../domain/money";
import { db } from "../db/client";
import { orderNotes, orders, refunds } from "../db/schema";
import { ApiError } from "../errors";
import { nowIso } from "../time";
import { dispatchWebhook } from "../webhooks";
import { serializeOrder } from "./orders";

export const orderWriteSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  customer_id: z.number().int().nullable().optional(),
  billing: z.record(z.string(), z.string()).optional(),
  shipping: z.record(z.string(), z.string()).optional(),
  payment_method: z.string().optional(),
  customer_note: z.string().optional(),
});

function mapLegacyStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "pending_payment",
    processing: "processing",
    "on-hold": "on_hold",
    completed: "completed",
    cancelled: "cancelled",
    refunded: "refunded",
    failed: "failed",
  };
  return map[status] ?? status;
}

export async function listOrders(search: URLSearchParams) {
  const { page, pageSize } = parsePage(search);
  const status = search.get("status");
  const where = status ? eq(orders.status, status) : undefined;
  const totalRow = await db.select({ c: sql<number>`count(*)` }).from(orders).where(where);
  const total = Number(totalRow[0]?.c ?? 0);
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(where)
    .limit(pageSize)
    .offset(offsetOf(page, pageSize));
  const data = await Promise.all(rows.map((row) => serializeOrder(row.id)));
  return { data, total, page, pageSize, perPage: pageSize };
}

export async function updateOrder(id: number, body: z.infer<typeof orderWriteSchema>) {
  const parsed = orderWriteSchema.parse(body);
  const existing = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!existing) {
    throw new ApiError(404, "orders.not_found", "Order not found.");
  }
  if (parsed.status) {
    const from = mapLegacyStatus(existing.status);
    if (!isOrderStatus(from) || !canTransition(from, parsed.status)) {
      throw new ApiError(409, "orders.illegal_transition", `Cannot change status from ${from} to ${parsed.status}.`);
    }
  }
  const nextStatus = parsed.status ?? existing.status;
  await db
    .update(orders)
    .set({
      status: nextStatus,
      paymentMethod: parsed.payment_method ?? existing.paymentMethod,
      customerNote: parsed.customer_note ?? existing.customerNote,
      billingJson: parsed.billing ? JSON.stringify(parsed.billing) : existing.billingJson,
      shippingJson: parsed.shipping ? JSON.stringify(parsed.shipping) : existing.shippingJson,
      dateCompleted: nextStatus === "completed" ? nowIso() : existing.dateCompleted,
      updatedAt: nowIso(),
    })
    .where(eq(orders.id, id));
  await dispatchWebhook("order.updated", await serializeOrder(id));
  return serializeOrder(id);
}

export async function createRefund(orderId: number, amount: string, reason: string, restock: boolean) {
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) {
    throw new ApiError(404, "orders.not_found", "Order not found.");
  }
  const already = (
    await db.select({ s: sql<number>`coalesce(sum(amount_cents),0)` }).from(refunds).where(eq(refunds.orderId, orderId))
  )[0];
  const decision = evaluateRefund({
    orderTotalMinor: order.totalCents,
    alreadyRefundedMinor: Number(already?.s ?? 0),
    requestedMinor: toMinorUnits(amount),
  });
  if (!decision.ok) {
    throw new ApiError(400, `orders.${decision.reason}`, "Refund cannot be applied.");
  }
  await db.insert(refunds).values({
    orderId,
    amountCents: decision.amountMinor,
    reason,
    restock,
    createdAt: nowIso(),
  });
  if (decision.fullyRefunded) {
    await db.update(orders).set({ status: "refunded", updatedAt: nowIso() }).where(eq(orders.id, orderId));
  }
  return serializeOrder(orderId);
}

export async function addNote(orderId: number, note: string, visibleToCustomer: boolean) {
  const row = await db
    .insert(orderNotes)
    .values({ orderId, note, customerNote: visibleToCustomer, createdAt: nowIso() })
    .returning();
  return row[0];
}
