import { eq } from "drizzle-orm";
import { RATE_LIMIT } from "@/config/constants";
import { db } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { carts, categories, reviews, tags } from "@/lib/db/schema";
import { ApiError } from "@/lib/errors";
import { assertNoCredentialQuery, parseResourceId } from "@/lib/safety";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  addItem,
  applyCoupon,
  assertCartNonce,
  getOrCreateCart,
  removeCoupon,
  serializeCart,
  updateItem,
} from "@/lib/services/cart";
import { listProducts, serializeProduct } from "@/lib/services/catalog";
import { checkoutFromCart } from "@/lib/services/orders";
import { addWishlistItem, listRelated, listWishlist, redeemCard, searchCatalog } from "@/lib/services/commerce";
import { assertShopOrigin } from "@/lib/csrf";
import { listCatalogFacets } from "@/lib/services/catalog-facets";
import { handleStorefrontExtra } from "../storefront-extra";

async function cartResponse(cartId: number) {
  const view = await serializeCart(cartId);
  const { _cart, ...rest } = view;
  const response = jsonOk(rest);
  response.headers.set("X-Avaluna-Cart", _cart.token);
  response.headers.set("X-Avaluna-Nonce", _cart.nonce);
  return response;
}

async function handle(request: Request, path: string[]): Promise<Response> {
  await migrate();
  if (!(await rateLimit(`store:${clientIp(request)}`, RATE_LIMIT.STOREFRONT_PER_WINDOW, RATE_LIMIT.WINDOW_MS))) {
    throw new ApiError(429, "rate_limited", "Too many requests.");
  }
  const [resource, action] = path;
  const method = request.method;
  const url = new URL(request.url);
  assertNoCredentialQuery(url);
  const mutating = method !== "GET";
  if (mutating) {
    await assertShopOrigin(request);
  }
  const body = mutating ? ((await readJson(request)) as Record<string, unknown>) : {};
  const extra = await handleStorefrontExtra(method, resource, action, url, body, request);
  if (extra) {
    return extra;
  }

  if (resource === "products" && !action) {
    const result = await listProducts(url.searchParams);
    return jsonOk(
      result.data.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        pricing: product.pricing,
        images: product.images,
        categories: product.categories,
        in_stock: product.inventory.status === "in_stock",
      })),
      result,
    );
  }
  if (resource === "products" && action === "categories") {
    return jsonOk(await db.select().from(categories));
  }
  if (resource === "products" && action === "tags") {
    return jsonOk(await db.select().from(tags));
  }
  if (resource === "products" && action === "reviews") {
    return jsonOk(await db.select().from(reviews));
  }
  if (resource === "products" && action === "facets") {
    return jsonOk(await listCatalogFacets());
  }
  if (resource === "products" && action) {
    const product = await serializeProduct(parseResourceId(action));
    const related = await listRelated(product.id);
    return jsonOk({
      id: product.id,
      name: product.name,
      pricing: product.pricing,
      description: product.description,
      images: product.images,
      in_stock: product.inventory.status === "in_stock",
      merchandising: related,
    });
  }

  if (resource === "search" && method === "GET") {
    return jsonOk(await searchCatalog(url.searchParams.get("q") ?? ""));
  }

  if (resource === "wishlists") {
    const customerId = Number(url.searchParams.get("customer_id") ?? body.customer_id);
    if (method === "GET") return jsonOk(await listWishlist(customerId));
    if (method === "POST") {
      return jsonOk(await addWishlistItem(customerId, Number(body.product_id)));
    }
  }

  if (resource === "gift-cards" && action === "redeem" && method === "POST") {
    return jsonOk(await redeemCard(String(body.code), String(body.amount_due)));
  }

  if (resource === "cart") {
    const cart = await getOrCreateCart(request);
    if (mutating) {
      assertCartNonce(request, cart, true);
    }
    if (!action && method === "GET") {
      return cartResponse(cart.id);
    }
    if (action === "items" && method === "POST") {
      await addItem(
        cart.id,
        Number(body.product_id ?? body.id),
        Number(body.quantity ?? 1),
        body.variation_id as number | undefined,
      );
      return cartResponse(cart.id);
    }
    if (action === "items" && method === "PATCH") {
      await updateItem(cart.id, String(body.key), Number(body.quantity));
      return cartResponse(cart.id);
    }
    if (action === "items" && method === "DELETE") {
      if (body.key) {
        await updateItem(cart.id, String(body.key), 0);
      } else {
        const { cartItems } = await import("@/lib/db/schema");
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
      return cartResponse(cart.id);
    }
    if (action === "promotions" && method === "POST") {
      await applyCoupon(cart.id, String(body.code));
      return cartResponse(cart.id);
    }
    if (action === "promotions" && method === "DELETE") {
      await removeCoupon(cart.id, String(body.code));
      return cartResponse(cart.id);
    }
    if (action === "customer" && method === "PATCH") {
      await db
        .update(carts)
        .set({
          billingJson: JSON.stringify(body.billing_address ?? {}),
          shippingJson: JSON.stringify(body.shipping_address ?? body.billing_address ?? {}),
        })
        .where(eq(carts.id, cart.id));
      return cartResponse(cart.id);
    }
    if (action === "shipping" && method === "POST") {
      await db.update(carts).set({ selectedShipping: String(body.rate_id) }).where(eq(carts.id, cart.id));
      return cartResponse(cart.id);
    }
  }

  if (resource === "checkout") {
    const cart = await getOrCreateCart(request);
    if (method === "GET") {
      return cartResponse(cart.id);
    }
    assertCartNonce(request, cart, true);
    if (method === "PATCH") {
      await db
        .update(carts)
        .set({
          billingJson: JSON.stringify(body.billing_address ?? {}),
          shippingJson: JSON.stringify(body.shipping_address ?? {}),
        })
        .where(eq(carts.id, cart.id));
      return cartResponse(cart.id);
    }
    const order = await checkoutFromCart(
      cart.id,
      {
        billing_address: body.billing_address as Record<string, string> | undefined,
        shipping_address: body.shipping_address as Record<string, string> | undefined,
        payment_method: body.payment_method as string | undefined,
        customer_note: body.customer_note as string | undefined,
      },
      request.headers.get("idempotency-key") ?? undefined,
    );
    return jsonOk(
      {
        order_id: order.id,
        number: order.number,
        status: order.status,
        totals: order.totals,
        payment: order.payment,
      },
      { status: 201 },
    );
  }

  throw new ApiError(404, "routing.not_found", "No storefront route matched.");
}

async function run(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  try {
    return await handle(request, (await ctx.params).path ?? []);
  } catch (error) {
    return jsonError(error);
  }
}

export const GET = run;
export const POST = run;
export const PUT = run;
export const PATCH = run;
export const DELETE = run;
