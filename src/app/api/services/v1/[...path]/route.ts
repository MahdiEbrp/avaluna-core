import { RATE_LIMIT } from "@/config/constants";
import { authenticateService } from "@/lib/auth";
import { migrate } from "@/lib/db/migrate";
import { ApiError } from "@/lib/errors";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { assertNoCredentialQuery } from "@/lib/safety";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { handleCatalogOps } from "../catalog-ops";
import { handleCommerceOps } from "../commerce-ops";
import { handlePlatformOps } from "../platform-ops";
import { handleGatewayOps } from "../gateway-ops";
import { handleGrowthOps } from "../growth-ops";
import { handleSalesOps } from "../sales-ops";

const RESOURCES = [
  "products",
  "categories",
  "tags",
  "orders",
  "customers",
  "promotions",
  "reports",
  "settings",
  "shipping-zones",
  "tax-rates",
  "payment-methods",
  "webhooks",
  "setup",
  "health",
  "api-keys",
  "locations",
  "inventory",
  "collections",
  "relations",
  "wishlists",
  "gift-cards",
  "customer-groups",
  "addresses",
  "currencies",
  "fulfillments",
  "returns",
  "search",
  "abandoned-carts",
  "loyalty",
  "notifications",
  "audit",
  "payment-intents",
  "reservations",
  "openapi",
  "payment-sessions",
  "payment-charges",
  "email",
  "sms",
  "cron-jobs",
  "subscriptions",
  "draft-orders",
  "companies",
  "quotes",
  "price-lists",
  "kits",
  "tax",
  "labels",
  "fraud",
  "discounts",
  "transfers",
  "purchase-orders",
  "atp",
  "apps",
  "media",
  "reviews",
  "attributes",
  "backups",
];

async function handle(request: Request, path: string[]): Promise<Response> {
  await migrate();
  if (!(await rateLimit(`services:${clientIp(request)}`, RATE_LIMIT.SERVICES_PER_WINDOW, RATE_LIMIT.WINDOW_MS))) {
    throw new ApiError(429, "rate_limited", "Too many requests.");
  }

  const method = request.method;
  const write = method !== "GET" && method !== "HEAD";
  const [resource, idOrAction, nested] = path;
  const url = new URL(request.url);
  assertNoCredentialQuery(url);
  if (resource === "setup") {
    const { handlePublicSetup } = await import("../setup-ops");
    const setupBody = write ? await readJson(request) : {};
    const setupResponse = await handlePublicSetup(method, resource, setupBody);
    if (setupResponse) {
      return setupResponse;
    }
  }
  if (resource === "health") {
    const { loadSettings, readMerged } = await import("@/lib/settings/store");
    const map = await loadSettings();
    const zarinpal = readMerged(map, "payments", "zarinpal_merchant_id")
      ? readMerged(map, "payments", "sandbox") === "yes"
        ? "sandbox"
        : "ok"
      : "unconfigured";
    const { healthConnectors, pingConnectors } = await import("@/lib/db/registry");
    const { registry } = await import("@/lib/db/client");
    const pings = await pingConnectors(registry);
    return jsonOk({
      service: "avaluna",
      status: pings.primary ? "ok" : "degraded",
      database: healthConnectors(registry),
      pings,
      adapters: { zarinpal },
    });
  }
  if (resource === "openapi" && method === "GET") {
    const { openApiDocument } = await import("@/lib/openapi");
    return jsonOk(openApiDocument);
  }
  const auth = await authenticateService(request, write);
  const skipJson = resource === "media" && method === "POST";
  const body = write && !skipJson ? await readJson(request) : {};

  if (!resource) {
    return jsonOk({ service: "avaluna-services", version: "1", resources: RESOURCES });
  }

  const ctx = { method, resource, idOrAction, nested, url, body, auth, request };
  const { handleMediaOps } = await import("../media-ops");
  const matched =
    (await handleCatalogOps(ctx)) ??
    (await handleSalesOps(ctx)) ??
    (await handlePlatformOps(ctx)) ??
    (await handleCommerceOps(ctx)) ??
    (await handleGatewayOps(ctx)) ??
    (await handleGrowthOps(ctx)) ??
    (await handleMediaOps(ctx));
  if (matched) {
    return matched;
  }
  throw new ApiError(404, "routing.not_found", "No service route matched.");
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
