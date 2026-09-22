import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { CART, SECURITY, TAX } from "../../config/constants";
import { moneyProfile } from "../money/profile";
import { isYes, loadSettings, readMerged } from "../settings/store";
import { cartLineKey } from "../../domain/cart-key";
import { evaluateCoupon } from "../../domain/discounts";
import { canFulfill, lineTotal } from "../../domain/inventory";
import { fromMinorUnits, toMinorUnits } from "../../domain/money";
import { quoteCartShipping } from "./cart-shipping";
import { extractInclusiveTax } from "../../domain/tax";
import { db } from "../db/client";
import {
  cartItems,
  carts,
  coupons,
  productVariations,
  products,
  shippingMethods,
  taxRates,
} from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { parseJsonColumn } from "../safety";
import { daysFromNowIso, nowIso } from "../time";

export async function getOrCreateCart(request: Request) {
  const token = request.headers.get("x-avaluna-cart");
  if (token) {
    const existing = (await db.select().from(carts).where(eq(carts.token, token)).limit(1))[0];
    if (existing && existing.expiresAt > nowIso()) {
      return existing;
    }
  }
  const created = await db
    .insert(carts)
    .values({
      token: randomBytes(SECURITY.CART_TOKEN_BYTES).toString("hex"),
      nonce: randomBytes(SECURITY.CART_NONCE_BYTES).toString("hex"),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      expiresAt: daysFromNowIso(CART.TTL_DAYS),
    })
    .returning();
  return requireInserted(created[0], "cart");
}

export function assertCartNonce(request: Request, cart: { nonce: string }, mutating: boolean) {
  if (!mutating) {
    return;
  }
  const nonce = request.headers.get("x-avaluna-nonce");
  if (nonce !== cart.nonce) {
    throw new ApiError(401, "cart.invalid_nonce", "Cart nonce is missing or invalid.");
  }
}

async function unitPriceMinor(productId: number, variationId?: number | null): Promise<number> {
  if (variationId) {
    const variation = (
      await db.select().from(productVariations).where(eq(productVariations.id, variationId)).limit(1)
    )[0];
    if (!variation || variation.productId !== productId) {
      throw new ApiError(400, "catalog.invalid_variation", "Variation does not belong to this product.");
    }
    return variation.salePriceCents ?? variation.regularPriceCents;
  }
  const product = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!product) {
    throw new ApiError(400, "catalog.product_not_found", "Product not found.");
  }
  if (product.status !== "publish" && product.status !== "published") {
    throw new ApiError(400, "catalog.not_purchasable", "Product is not available for purchase.");
  }
  return product.onSale && product.salePriceCents !== null ? product.salePriceCents : product.regularPriceCents;
}

async function assertStock(productId: number, variationId: number | null | undefined, quantity: number) {
  if (variationId) {
    const variation = (
      await db.select().from(productVariations).where(eq(productVariations.id, variationId)).limit(1)
    )[0];
    if (!variation || variation.stockQuantity < quantity) {
      throw new ApiError(409, "inventory.insufficient", "Not enough stock for this variation.");
    }
    return;
  }
  const product = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!product) {
    throw new ApiError(400, "catalog.product_not_found", "Product not found.");
  }
  const policy = product.backorders === "no" ? "none" : product.backorders === "yes" ? "allow" : "notify";
  if (
    !canFulfill({
      manageStock: product.manageStock,
      quantityOnHand: product.stockQuantity,
      requested: quantity,
      backorderPolicy: policy,
    })
  ) {
    throw new ApiError(409, "inventory.insufficient", "Not enough stock.");
  }
}

export async function addItem(cartId: number, productId: number, quantity: number, variationId?: number) {
  if (quantity < CART.MIN_QUANTITY) {
    throw new ApiError(400, "cart.invalid_quantity", "Quantity must be at least 1.");
  }
  await assertStock(productId, variationId, quantity);
  const key = cartLineKey(cartId, productId, variationId);
  const existing = (
    await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.key, key)))
      .limit(1)
  )[0];
  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    await assertStock(productId, variationId, nextQuantity);
    await db.update(cartItems).set({ quantity: nextQuantity }).where(eq(cartItems.id, existing.id));
    return;
  }
  await db.insert(cartItems).values({
    cartId,
    key,
    productId,
    variationId: variationId ?? null,
    quantity,
  });
}

export async function updateItem(cartId: number, key: string, quantity: number) {
  const item = (
    await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.key, key)))
      .limit(1)
  )[0];
  if (!item) {
    throw new ApiError(404, "cart.item_not_found", "Cart line not found.");
  }
  if (quantity < CART.MIN_QUANTITY) {
    await db.delete(cartItems).where(eq(cartItems.id, item.id));
    return;
  }
  await assertStock(item.productId, item.variationId, quantity);
  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, item.id));
}

export async function serializeCart(cartId: number) {
  const cart = (await db.select().from(carts).where(eq(carts.id, cartId)).limit(1))[0];
  if (!cart) {
    throw new ApiError(404, "cart.not_found", "Cart not found.");
  }
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  const map = await loadSettings();
  const profile = moneyProfile(map);
  const codes = parseJsonColumn<string[]>(cart.couponsJson, []);
  let itemsSubtotal = 0;
  const lineItems = [];
  for (const item of items) {
    const product = (await db.select().from(products).where(eq(products.id, item.productId)).limit(1))[0];
    const unit = await unitPriceMinor(item.productId, item.variationId);
    const line = lineTotal(unit, item.quantity);
    itemsSubtotal += line;
    lineItems.push({
      key: item.key,
      product_id: item.productId,
      variation_id: item.variationId,
      quantity: item.quantity,
      name: product?.name ?? "Product",
      pricing: {
        unit_amount: fromMinorUnits(unit, profile.scale, profile.decimalPlaces),
        line_amount: fromMinorUnits(line, profile.scale, profile.decimalPlaces),
        currency: profile.currency,
      },
    });
  }

  let discount = 0;
  const applied = [];
  const now = nowIso();
  for (const code of codes) {
    const coupon = (await db.select().from(coupons).where(eq(coupons.code, code.toLowerCase())).limit(1))[0];
    if (!coupon) {
      continue;
    }
    const decision = evaluateCoupon(
      {
        code: coupon.code,
        discountType: coupon.discountType as "percent" | "fixed_cart" | "fixed_item",
        amount: coupon.amountCentsOrPercent,
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
        expiresAt: coupon.expiryDate,
        minimumSpendMinor: coupon.minimumAmountCents,
        maximumSpendMinor: coupon.maximumAmountCents,
      },
      itemsSubtotal,
      now,
    );
    if (!decision.ok) {
      continue;
    }
    discount += decision.discountMinor;
    applied.push({
      code: coupon.code,
      discount_amount: fromMinorUnits(decision.discountMinor, profile.scale, profile.decimalPlaces),
    });
  }

  const shippingAddress = parseJsonColumn<{ country?: string; postcode?: string }>(cart.shippingJson, {});
  const country = shippingAddress.country ?? "IR";
  const methods = await db.select().from(shippingMethods).where(eq(shippingMethods.enabled, true));
  const afterDiscount = Math.max(0, itemsSubtotal - discount);
  const quoted = await quoteCartShipping(
    map,
    methods,
    afterDiscount,
    cart.selectedShipping,
    shippingAddress.postcode ?? "",
  );
  const rates = quoted.rates;
  const selected = quoted.selected;
  const shippingMinor = selected?.costMinor ?? 0;

  const taxRow = (await db.select().from(taxRates)).find((rate) => !rate.country || rate.country === country);
  const rateBps = Number(readMerged(map, "tax", "rate_bps") || TAX.DEFAULT_RATE_BPS);
  const taxable = isYes(readMerged(map, "tax", "charge_on_shipping"))
    ? afterDiscount + shippingMinor
    : afterDiscount;
  const taxMinor = extractInclusiveTax(taxable, taxRow ? Math.round(taxRow.rate * 100) : rateBps);
  const total = afterDiscount + shippingMinor;

  return {
    items: lineItems,
    promotions: applied,
    shipping: {
      rates: rates.map((rate) => ({
        id: rate.id,
        name: rate.title,
        amount: fromMinorUnits(rate.costMinor, profile.scale, profile.decimalPlaces),
        selected: rate.id === selected?.id,
      })),
      carrier_quote: quoted.carrierQuote,
    },
    addresses: {
      shipping: shippingAddress,
      billing: parseJsonColumn<object>(cart.billingJson, {}),
    },
    totals: {
      currency: profile.currency,
      items: fromMinorUnits(itemsSubtotal, profile.scale, profile.decimalPlaces),
      discount: fromMinorUnits(discount, profile.scale, profile.decimalPlaces),
      shipping: fromMinorUnits(shippingMinor, profile.scale, profile.decimalPlaces),
      tax: fromMinorUnits(taxMinor, profile.scale, profile.decimalPlaces),
      grand: fromMinorUnits(total, profile.scale, profile.decimalPlaces),
    },
    requires_payment: total > 0,
    requires_shipping: lineItems.length > 0,
    item_count: lineItems.reduce((sum, item) => sum + item.quantity, 0),
    _cart: cart,
  };
}

export async function applyCoupon(cartId: number, code: string) {
  const cart = (await db.select().from(carts).where(eq(carts.id, cartId)).limit(1))[0];
  if (!cart) {
    throw new ApiError(404, "cart.not_found", "Cart not found.");
  }
  const coupon = (await db.select().from(coupons).where(eq(coupons.code, code.toLowerCase())).limit(1))[0];
  if (!coupon) {
    throw new ApiError(400, "promotions.invalid_code", "Unknown promotion code.");
  }
  const list = parseJsonColumn<string[]>(cart.couponsJson, []);
  if (!list.includes(coupon.code)) {
    list.push(coupon.code);
  }
  await db.update(carts).set({ couponsJson: JSON.stringify(list), updatedAt: nowIso() }).where(eq(carts.id, cartId));
}

export async function removeCoupon(cartId: number, code: string) {
  const cart = (await db.select().from(carts).where(eq(carts.id, cartId)).limit(1))[0];
  if (!cart) {
    throw new ApiError(404, "cart.not_found", "Cart not found.");
  }
  const list = parseJsonColumn<string[]>(cart.couponsJson, []).filter((entry) => entry !== code.toLowerCase());
  await db.update(carts).set({ couponsJson: JSON.stringify(list), updatedAt: nowIso() }).where(eq(carts.id, cartId));
}

export { toMinorUnits };
