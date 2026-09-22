import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { ORDER } from "../../config/constants";
import { checkoutIdentityIssue } from "../../domain/checkout-identity";
import { decideIdempotency, isIdempotencyKeyValid } from "../../domain/idempotency";
import { formatJalaliIso } from "../../domain/jalali";
import { fromMinorUnits, toMinorUnits } from "../../domain/money";
import { formatOrderNumber, statusAfterCheckout } from "../../domain/orders";
import { db, withWriteTransaction } from "../db/client";
import { coupons, idempotencyKeys, orderItems, orders, products } from "../db/schema";
import { ApiError } from "../errors";
import { moneyPayload, moneyProfile } from "../money/profile";
import { requireInserted } from "../result";
import { parseJsonColumn } from "../safety";
import { isYes, loadSettings, readMerged } from "../settings/store";
import { nowIso } from "../time";
import { dispatchWebhook } from "../webhooks";
import { serializeCart } from "./cart";
import { startOrderPayment } from "./pay-session";
import { applyOrderStock } from "./stock";

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

export async function serializeOrder(id: number) {
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) {
    throw new ApiError(404, "orders.not_found", "Order not found.");
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const profile = moneyProfile(await loadSettings());
  return {
    id: order.id,
    number: order.number,
    status: mapLegacyStatus(order.status),
    currency: order.currency,
    jalali_date: formatJalaliIso(order.createdAt),
    customer_id: order.customerId ?? 0,
    customer_email: order.customerEmail,
    billing: parseJsonColumn<object>(order.billingJson, {}),
    shipping: parseJsonColumn<object>(order.shippingJson, {}),
    payment: {
      method: order.paymentMethod,
      title: order.paymentMethodTitle,
      transaction_id: order.transactionId,
    },
    customer_note: order.customerNote,
    totals: {
      discount: fromMinorUnits(order.discountTotalCents, profile.scale, profile.decimalPlaces),
      shipping: fromMinorUnits(order.shippingTotalCents, profile.scale, profile.decimalPlaces),
      tax: fromMinorUnits(order.taxTotalCents, profile.scale, profile.decimalPlaces),
      grand: fromMinorUnits(order.totalCents, profile.scale, profile.decimalPlaces),
      money: moneyPayload(order.totalCents, profile),
    },
    line_items: items.map((item) => ({
      id: item.id,
      name: item.name,
      product_id: item.productId,
      variation_id: item.variationId,
      quantity: item.quantity,
      sku: item.sku,
      amounts: {
        subtotal: fromMinorUnits(item.subtotalCents, profile.scale, profile.decimalPlaces),
        total: fromMinorUnits(item.totalCents, profile.scale, profile.decimalPlaces),
        tax: fromMinorUnits(item.taxCents, profile.scale, profile.decimalPlaces),
      },
    })),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    paid_at: order.datePaid,
    completed_at: order.dateCompleted,
  };
}

export async function checkoutFromCart(
  cartId: number,
  body: {
    billing_address?: Record<string, string>;
    shipping_address?: Record<string, string>;
    payment_method?: string;
    customer_note?: string;
    customer_id?: number;
  },
  idempotencyKey?: string,
) {
  const cartView = await serializeCart(cartId);
  if (cartView.items.length === 0) {
    throw new ApiError(400, "checkout.empty_cart", "Cart is empty.");
  }
  const map = await loadSettings();
  const billing = body.billing_address ?? (cartView.addresses.billing as Record<string, string>);
  const issue = checkoutIdentityIssue(
    billing,
    {
      requireMobile: isYes(readMerged(map, "checkout", "require_mobile")),
      requireNationalId: isYes(readMerged(map, "checkout", "require_national_id")),
      guestOk: isYes(readMerged(map, "checkout", "guest_ok")),
      requireIdempotency: isYes(readMerged(map, "checkout", "require_idempotency")),
    },
    Boolean(body.customer_id),
    idempotencyKey,
  );
  if (issue) {
    throw new ApiError(400, issue.code, issue.message);
  }
  if (idempotencyKey && !isIdempotencyKeyValid(idempotencyKey)) {
    throw new ApiError(400, "idempotency.invalid_key", "Idempotency-Key must be 8–128 URL-safe characters.");
  }
  const method = body.payment_method ?? readMerged(map, "payments", "default_provider") ?? "cash_on_delivery";
  const status = statusAfterCheckout(method);
  const paid = status === "processing";
  const profile = moneyProfile(map);
  const countRow = await db.select({ c: sql<number>`count(*)` }).from(orders);
  const number = formatOrderNumber(ORDER.NUMBER_PREFIX, Number(countRow[0]?.c ?? 0) + 1);
  const shipping = body.shipping_address ?? (cartView.addresses.shipping as Record<string, string>);
  const email = billing.email ?? "guest@avaluna.local";
  const fingerprint = createHash("sha256")
    .update(`${cartId}:${cartView.totals.grand}:${method}`)
    .digest("hex");
  if (idempotencyKey) {
    const existing = (await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, idempotencyKey)).limit(1))[0];
    const decision = decideIdempotency(existing?.fingerprint, fingerprint);
    if (decision === "conflict") {
      throw new ApiError(409, "idempotency.conflict", "Idempotency-Key was reused with a different payload.");
    }
    if (decision === "replay" && existing) {
      return serializeOrder(Number(existing.resourceId));
    }
  }
  const orderId = await withWriteTransaction(async () => {
    const inserted = await db
      .insert(orders)
      .values({
        number,
        status,
        currency: profile.currency,
        customerEmail: email,
        billingJson: JSON.stringify(billing),
        shippingJson: JSON.stringify(shipping),
        paymentMethod: method,
        paymentMethodTitle: method,
        customerNote: body.customer_note ?? "",
        discountTotalCents: toMinorUnits(cartView.totals.discount, profile.scale),
        shippingTotalCents: toMinorUnits(cartView.totals.shipping, profile.scale),
        taxTotalCents: toMinorUnits(cartView.totals.tax, profile.scale),
        totalCents: toMinorUnits(cartView.totals.grand, profile.scale),
        datePaid: paid ? nowIso() : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .returning({ id: orders.id });
    const id = requireInserted(inserted[0], "order").id;
    for (const item of cartView.items) {
      const product = (await db.select().from(products).where(eq(products.id, item.product_id)).limit(1))[0];
      await db.insert(orderItems).values({
        orderId: id,
        productId: item.product_id,
        variationId: item.variation_id ?? null,
        name: item.name,
        sku: product?.sku ?? null,
        quantity: item.quantity,
        subtotalCents: toMinorUnits(item.pricing.line_amount, profile.scale),
        totalCents: toMinorUnits(item.pricing.line_amount, profile.scale),
      });
    }
    if (status !== "pending_payment") {
      await applyOrderStock(id, "take");
      const { markOrderStockTaken } = await import("./stock");
      await markOrderStockTaken(id, true);
    }
    for (const promo of cartView.promotions) {
      await db.update(coupons).set({ usageCount: sql`usage_count + 1` }).where(eq(coupons.code, promo.code));
    }
    return id;
  });
  let redirect: { authority: string; redirect_url: string | null } | null = null;
  if (status === "pending_payment") {
    redirect = await startOrderPayment(orderId, method);
  }
  const created = await serializeOrder(orderId);
  await dispatchWebhook("order.created", created);
  const { queueOrderNotice } = await import("./order-notify");
  await queueOrderNotice(orderId, "order_placed");
  return { ...created, payment: { ...created.payment, ...redirect } };
}
