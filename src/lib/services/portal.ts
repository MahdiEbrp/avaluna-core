import { eq } from "drizzle-orm";
import { canPortalReturn, canViewOrder } from "../../domain/portal";
import { canonicalUrl, productJsonLd, sitemapUrlset } from "../../domain/seo";
import { presentmentMinor } from "../../domain/presentment";
import { db } from "../db/client";
import { orders, products } from "../db/schema";
import { ApiError } from "../errors";
import { serializeOrder } from "./orders";

export async function portalOrders(customerId: number) {
  const rows = await db.select({ id: orders.id, customerId: orders.customerId }).from(orders);
  const mine = rows.filter((row) => canViewOrder(customerId, row.customerId));
  return Promise.all(mine.map((row) => serializeOrder(row.id)));
}

export async function portalReturnAllowed(customerId: number, orderId: number) {
  const order = await serializeOrder(orderId);
  if (!canViewOrder(customerId, order.customer_id || null)) {
    throw new ApiError(403, "portal.forbidden", "Order does not belong to this customer.");
  }
  return { allowed: canPortalReturn(order.status) };
}

export async function seoSitemap(origin: string) {
  const rows = await db.select({ id: products.id, updatedAt: products.updatedAt, slug: products.slug }).from(products);
  const urls = rows.map((row) => ({
    loc: canonicalUrl(origin, `/products/${row.slug}`),
    lastmod: row.updatedAt.slice(0, 10),
  }));
  return sitemapUrlset(urls);
}

export async function seoProduct(origin: string, productId: number) {
  const product = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!product) {
    throw new ApiError(404, "catalog.product_not_found", "Product not found.");
  }
  const url = canonicalUrl(origin, `/products/${product.slug}`);
  return productJsonLd({
    name: product.name,
    url,
    amount: String(product.regularPriceCents),
    currency: "IRR",
  });
}

export function convertPresentment(settlementMinor: number, fromRate: number, toRate: number) {
  return { presentment_minor: presentmentMinor(settlementMinor, fromRate, toRate) };
}
