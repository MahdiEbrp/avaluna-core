import { eq } from "drizzle-orm";
import { LOW_STOCK_THRESHOLD } from "../../config/constants";
import { remainingAfterSale, stockStatusFromQuantity } from "../../domain/inventory";
import { isLowStock } from "../../domain/inventory-ledger";
import { db } from "../db/client";
import { messageOutbox, orderItems, productVariations, products } from "../db/schema";
import { nowIso } from "../time";
import { dispatchWebhook } from "../webhooks";

export async function applyStockDelta(productId: number, variationId: number | null, delta: number) {
  if (variationId) {
    const variation = (
      await db.select().from(productVariations).where(eq(productVariations.id, variationId)).limit(1)
    )[0];
    if (!variation) {
      return;
    }
    const next = remainingAfterSale(variation.stockQuantity, -delta);
    await db
      .update(productVariations)
      .set({ stockQuantity: next, stockStatus: stockStatusFromQuantity(next) === "in_stock" ? "instock" : "outofstock" })
      .where(eq(productVariations.id, variationId));
    await notifyLowStock(productId, next);
    return;
  }
  const product = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!product) {
    return;
  }
  const next = remainingAfterSale(product.stockQuantity, -delta);
  await db
    .update(products)
    .set({
      stockQuantity: next,
      stockStatus: stockStatusFromQuantity(next) === "in_stock" ? "instock" : "outofstock",
    })
    .where(eq(products.id, productId));
  await notifyLowStock(productId, next);
}

async function notifyLowStock(productId: number, quantity: number) {
  if (!isLowStock(quantity, LOW_STOCK_THRESHOLD)) {
    return;
  }
  await dispatchWebhook("inventory.low_stock", { product_id: productId, quantity });
  await db.insert(messageOutbox).values({
    channel: "sms",
    provider: "ops",
    recipient: "ops",
    subject: "low_stock",
    body: `low stock product ${productId} qty ${quantity}`,
    createdAt: nowIso(),
  });
}

export async function applyOrderStock(orderId: number, direction: "take" | "release") {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const sign = direction === "take" ? -1 : 1;
  for (const item of items) {
    if (item.productId) {
      await applyStockDelta(item.productId, item.variationId, sign * item.quantity);
    }
  }
}

export async function markOrderStockTaken(orderId: number, taken: boolean) {
  const { orders } = await import("../db/schema");
  await db.update(orders).set({ stockTaken: taken }).where(eq(orders.id, orderId));
}
