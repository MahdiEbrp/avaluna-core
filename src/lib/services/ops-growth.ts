import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { isAppSlug } from "../../domain/apps";
import { availableToPromise, canTransfer, poReceivable } from "../../domain/atp";
import { expandKit } from "../../domain/bundles";
import { quoteCarrier, trackingUrl } from "../../domain/carriers";
import { avsResult, shouldHoldOrder } from "../../domain/fraud";
import { resolveTaxRegime } from "../../domain/tax-engine";
import { toMinorUnits } from "../../domain/money";
import { db } from "../db/client";
import {
  fraudSignals,
  installedApps,
  kitComponents,
  purchaseOrders,
  shippingLabels,
  stockTransfers,
  taxExemptions,
} from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";

export async function addKitComponent(kitProductId: number, productId: number, quantity: number) {
  const row = await db.insert(kitComponents).values({ kitProductId, productId, quantity }).returning();
  return requireInserted(row[0], "kit");
}

export async function expandKitProduct(kitProductId: number, kits: number) {
  const rows = await db.select().from(kitComponents).where(eq(kitComponents.kitProductId, kitProductId));
  return expandKit(
    rows.map((row) => ({ productId: row.productId, quantity: row.quantity })),
    kits,
  );
}

export async function addTaxExemption(customerId: number, code: string) {
  const row = await db.insert(taxExemptions).values({ customerId, code, createdAt: nowIso() }).returning();
  return requireInserted(row[0], "tax_exemption");
}

export async function evaluateTax(input: {
  merchant_country: string;
  customer_country: string;
  digital?: boolean;
  amount: string;
  exemption_code?: string;
}) {
  return {
    regime: resolveTaxRegime({
      merchantCountry: input.merchant_country,
      customerCountry: input.customer_country,
      digitalGood: Boolean(input.digital),
      orderMinor: toMinorUnits(input.amount),
      iossThresholdMinor: 15000,
      exemptionCode: input.exemption_code,
    }),
  };
}

export async function buyLabel(input: { order_id: number; weight_grams: number; zone: "domestic" | "eu" | "world" }) {
  const quote = quoteCarrier(input.weight_grams, input.zone);
  const tracking = `AVL${nanoid(10).toUpperCase()}`;
  const row = await db
    .insert(shippingLabels)
    .values({
      orderId: input.order_id,
      carrier: quote.carrier,
      trackingNumber: tracking,
      amountCents: quote.amountMinor,
      createdAt: nowIso(),
    })
    .returning();
  const label = requireInserted(row[0], "label");
  return { ...label, tracking_url: trackingUrl(label.carrier, label.trackingNumber), days: quote.days };
}

const LABEL_STATUSES = ["pending", "in_transit", "delivered", "cancelled"] as const;

export async function updateLabelTracking(id: number, status: string) {
  if (!(LABEL_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(400, "labels.invalid_status", "Unknown tracking status.");
  }
  const row = (await db.select().from(shippingLabels).where(eq(shippingLabels.id, id)).limit(1))[0];
  if (!row) {
    throw new ApiError(404, "labels.not_found", "Shipping label not found.");
  }
  await db.update(shippingLabels).set({ trackingStatus: status }).where(eq(shippingLabels.id, id));
  if (status === "in_transit") {
    const { queueOrderNotice } = await import("./order-notify");
    await queueOrderNotice(row.orderId, "order_shipped", { tracking: row.trackingNumber });
  }
  return { ...row, trackingStatus: status, tracking_url: trackingUrl(row.carrier, row.trackingNumber) };
}

export async function scoreFraud(input: {
  order_id?: number;
  street_match: boolean;
  postcode_match: boolean;
  orders_in_window: number;
  amount: string;
}) {
  const avs = avsResult(input.street_match, input.postcode_match);
  const held = shouldHoldOrder({
    avs,
    velocityHit: input.orders_in_window > 5,
    amountMinor: toMinorUnits(input.amount),
    holdAboveMinor: 200_000,
  });
  const row = await db
    .insert(fraudSignals)
    .values({ orderId: input.order_id ?? null, avs, held, createdAt: nowIso() })
    .returning();
  return requireInserted(row[0], "fraud");
}

export async function transferStock(input: {
  from_location_id: number;
  to_location_id: number;
  product_id: number;
  quantity: number;
  from_atp: number;
}) {
  if (!canTransfer(input.from_atp, input.quantity)) {
    throw new ApiError(409, "inventory.transfer_denied", "ATP too low to transfer.");
  }
  const row = await db
    .insert(stockTransfers)
    .values({
      fromLocationId: input.from_location_id,
      toLocationId: input.to_location_id,
      productId: input.product_id,
      quantity: input.quantity,
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "transfer");
}

export async function createPurchaseOrder(productId: number, ordered: number) {
  const row = await db.insert(purchaseOrders).values({ productId, ordered, createdAt: nowIso() }).returning();
  return requireInserted(row[0], "purchase_order");
}

export async function receivePurchaseOrder(id: number, quantity: number) {
  const po = (await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1))[0];
  if (!po || !poReceivable(po.ordered, po.received, quantity)) {
    throw new ApiError(409, "po.receive_denied", "Cannot receive this quantity.");
  }
  await db.update(purchaseOrders).set({ received: po.received + quantity }).where(eq(purchaseOrders.id, id));
  return { ...po, received: po.received + quantity };
}

export async function computeAtp(onHand: number, reserved: number, incoming: number, outgoing: number) {
  return { atp: availableToPromise(onHand, reserved, incoming, outgoing) };
}

export async function installApp(slug: string, scopes: string[]) {
  if (!isAppSlug(slug)) {
    throw new ApiError(400, "apps.invalid_slug", "App slug is invalid.");
  }
  const row = await db
    .insert(installedApps)
    .values({ slug, scopesJson: JSON.stringify(scopes), createdAt: nowIso() })
    .returning();
  return requireInserted(row[0], "app");
}

export async function listApps() {
  return db.select().from(installedApps);
}
