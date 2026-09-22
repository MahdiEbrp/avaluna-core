import { eq } from "drizzle-orm";
import { buildInvoice } from "../../domain/invoice";
import { db } from "../db/client";
import { orders } from "../db/schema";
import { ApiError } from "../errors";
import { loadSettings, readMerged } from "../settings/store";

export async function invoiceForOrder(orderId: number) {
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) {
    throw new ApiError(404, "orders.not_found", "Order not found.");
  }
  const map = await loadSettings();
  return buildInvoice({
    number: order.number,
    createdAt: order.createdAt,
    totalRial: order.totalCents,
    taxRial: order.taxTotalCents,
    currency: order.currency,
    sheba: readMerged(map, "legal", "sheba"),
    storeName: readMerged(map, "general", "store_name_fa") || readMerged(map, "general", "store_name"),
    returnDays: Number(readMerged(map, "legal", "return_days") || 7),
  });
}
