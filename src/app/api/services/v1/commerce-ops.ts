import { jsonOk } from "@/lib/http";
import { parseResourceId } from "@/lib/safety";
import { toMinorUnits } from "@/domain/money";
import {
  addAddress,
  addToCollection,
  addWishlistItem,
  adjustInventory,
  assignCustomerGroup,
  createCollection,
  createCustomerGroup,
  createFulfillment,
  createLocation,
  createPaymentIntent,
  createReturnRequest,
  creditLoyalty,
  issueGiftCard,
  listAbandonedCarts,
  listAddresses,
  listAudit,
  listCurrencies,
  listInventory,
  listLocations,
  listNotifications,
  listRelated,
  listWishlist,
  queueNotification,
  recordAudit,
  redeemCard,
  relateProducts,
  reserveInventory,
  searchCatalog,
  updatePaymentIntent,
  updateReturnStatus,
  upsertCurrency,
} from "@/lib/services/commerce";
import type { ServiceContext } from "./service-context";

export async function handleCommerceOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, nested, url, body, auth } = ctx;

  if (resource === "locations") {
    if (method === "GET") return jsonOk(await listLocations());
    if (method === "POST") {
      const rec = body as { name: string; code: string; country?: string; is_default?: boolean };
      const created = await createLocation(rec);
      await recordAudit(auth.userId, "location.create", "location", String(created?.id ?? ""));
      return jsonOk(created, { status: 201 });
    }
  }

  if (resource === "inventory") {
    if (method === "GET") return jsonOk(await listInventory());
    if (method === "POST") {
      return jsonOk(
        await adjustInventory(body as { location_id: number; product_id: number; delta: number; reason: string }),
      );
    }
  }

  if (resource === "collections") {
    if (method === "POST" && !idOrAction) {
      const rec = body as { name: string; description?: string };
      return jsonOk(await createCollection(rec.name, rec.description), { status: 201 });
    }
    if (method === "POST" && nested === "products") {
      const rec = body as { product_id: number; position?: number };
      return jsonOk(await addToCollection(parseResourceId(idOrAction), rec.product_id, rec.position));
    }
  }

  if (resource === "products" && nested === "relations" && idOrAction) {
    const productId = parseResourceId(idOrAction);
    if (method === "POST") {
      const rec = body as { related_product_id: number; relation_type: string };
      return jsonOk(await relateProducts(productId, rec.related_product_id, rec.relation_type), { status: 201 });
    }
    if (method === "GET") return jsonOk(await listRelated(productId));
  }

  if (resource === "wishlists") {
    if (method === "GET") return jsonOk(await listWishlist(Number(url.searchParams.get("customer_id"))));
    if (method === "POST") {
      const rec = body as { customer_id: number; product_id: number };
      return jsonOk(await addWishlistItem(rec.customer_id, rec.product_id));
    }
  }

  if (resource === "gift-cards") {
    if (method === "POST" && !idOrAction) {
      const rec = body as { amount: string; code: string };
      return jsonOk(await issueGiftCard(rec.amount, rec.code), { status: 201 });
    }
    if (method === "POST" && idOrAction === "redeem") {
      const rec = body as { code: string; amount_due: string };
      return jsonOk(await redeemCard(rec.code, rec.amount_due));
    }
  }

  if (resource === "customer-groups") {
    if (method === "POST" && !idOrAction) {
      const rec = body as { name: string; discount_percent?: number };
      return jsonOk(await createCustomerGroup(rec.name, rec.discount_percent ?? 0), { status: 201 });
    }
    if (method === "POST" && nested === "members") {
      const rec = body as { customer_id: number };
      return jsonOk(await assignCustomerGroup(parseResourceId(idOrAction), rec.customer_id));
    }
  }

  if (resource === "addresses") {
    if (method === "GET") return jsonOk(await listAddresses(Number(url.searchParams.get("customer_id"))));
    if (method === "POST") return jsonOk(await addAddress(body as never), { status: 201 });
  }

  if (resource === "currencies") {
    if (method === "GET") return jsonOk(await listCurrencies());
    if (method === "POST") {
      const rec = body as { code: string; name: string; rate: number };
      return jsonOk(await upsertCurrency(rec.code, rec.name, rec.rate));
    }
  }

  if (resource === "fulfillments") {
    if (method === "POST") {
      return jsonOk(await createFulfillment(body as never), { status: 201 });
    }
    if (method === "PATCH" && idOrAction) {
      const { markDelivered } = await import("@/lib/services/fulfillment-flow");
      return jsonOk(await markDelivered(parseResourceId(idOrAction)));
    }
  }

  if (resource === "returns") {
    if (method === "POST" && !idOrAction) {
      return jsonOk(await createReturnRequest(body as never), { status: 201 });
    }
    if (method === "PATCH" && idOrAction) {
      const rec = body as { status: string };
      return jsonOk(await updateReturnStatus(parseResourceId(idOrAction), rec.status));
    }
  }

  if (resource === "search" && method === "GET") {
    return jsonOk(await searchCatalog(url.searchParams.get("q") ?? ""));
  }

  if (resource === "abandoned-carts" && method === "GET") {
    return jsonOk(await listAbandonedCarts());
  }

  if (resource === "loyalty" && method === "POST") {
    const rec = body as { customer_id: number; order_total: string };
    return jsonOk(await creditLoyalty(rec.customer_id, toMinorUnits(rec.order_total)));
  }

  if (resource === "notifications") {
    if (method === "GET") return jsonOk(await listNotifications());
    if (method === "POST") {
      const rec = body as { template: string; recipient: string; payload?: unknown };
      return jsonOk(await queueNotification(rec.template, rec.recipient, rec.payload ?? {}), { status: 201 });
    }
  }

  if (resource === "audit" && method === "GET") {
    return jsonOk(await listAudit());
  }

  if (resource === "reservations" && method === "POST") {
    const rec = body as { product_id: number; quantity: number; variation_id?: number; cart_id?: number };
    return jsonOk(await reserveInventory(rec), { status: 201 });
  }

  if (resource === "payment-intents") {
    if (method === "POST" && !idOrAction) {
      const rec = body as { amount: string; method: string; order_id?: number };
      return jsonOk(await createPaymentIntent(rec), { status: 201 });
    }
    if (method === "PATCH" && idOrAction) {
      const rec = body as { status: string };
      return jsonOk(await updatePaymentIntent(parseResourceId(idOrAction), rec.status));
    }
  }

  return null;
}
