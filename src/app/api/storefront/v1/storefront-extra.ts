import { RATE_LIMIT } from "@/config/constants";
import { readSession } from "@/domain/session-token";
import { ApiError } from "@/lib/errors";
import { jsonOk } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseResourceId } from "@/lib/safety";
import { convertPresentment, portalOrders, portalReturnAllowed, seoProduct, seoSitemap } from "@/lib/services/portal";
import { confirmOtp, requestOtp } from "@/lib/services/otp";
import { loadRuntimeSecret } from "@/lib/runtime-secret";
import { loadSettings, readMerged } from "@/lib/settings/store";

export async function handleStorefrontExtra(
  method: string,
  resource: string | undefined,
  action: string | undefined,
  url: URL,
  body: Record<string, unknown> = {},
  request?: Request,
): Promise<Response | null> {
  if (resource === "media" && action && method === "GET") {
    const { readMediaFile } = await import("@/lib/services/media");
    const file = await readMediaFile(parseResourceId(action));
    return new Response(new Uint8Array(file.body), {
      headers: { "Content-Type": file.mime, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" },
    });
  }
  if (resource === "reviews" && method === "POST") {
    const { createReview } = await import("@/lib/services/reviews");
    return jsonOk(await createReview(body as never), { status: 201 });
  }
  if (resource === "reviews" && method === "GET") {
    const { listReviews } = await import("@/lib/services/reviews");
    return jsonOk(await listReviews(Number(url.searchParams.get("product_id") ?? 0), "approved"));
  }
  if (resource === "auth" && action === "otp" && method === "POST") {
    if (request && !(await rateLimit(`otp:${clientIp(request)}`, RATE_LIMIT.OTP_PER_WINDOW))) {
      throw new ApiError(429, "rate_limited", "Too many OTP requests.");
    }
    return jsonOk(await requestOtp(String(body.mobile ?? "")), { status: 201 });
  }
  if (resource === "auth" && action === "session" && method === "POST") {
    if (request && !(await rateLimit(`otp-verify:${clientIp(request)}`, RATE_LIMIT.VERIFY_PER_WINDOW))) {
      throw new ApiError(429, "rate_limited", "Too many verify attempts.");
    }
    return jsonOk(confirmOtp(String(body.mobile ?? ""), String(body.code ?? "")));
  }
  if (resource === "invoices" && action && method === "GET") {
    const { invoiceForOrder } = await import("@/lib/services/invoices");
    return jsonOk(await invoiceForOrder(parseResourceId(action)));
  }
  if (resource === "legal" && method === "GET") {
    const map = await loadSettings();
    return jsonOk({
      enamad_code: readMerged(map, "legal", "enamad_code"),
      samandehi_code: readMerged(map, "legal", "samandehi_code"),
      return_days: Number(readMerged(map, "legal", "return_days") || 7),
      moadian_enabled: readMerged(map, "legal", "moadian_enabled"),
      sheba: readMerged(map, "legal", "sheba"),
    });
  }
  const sessionId = readSession(
    request?.headers.get("x-avaluna-session") ?? null,
    Date.now(),
    loadRuntimeSecret("AVALUNA_SESSION_SECRET", "session"),
  );
  if (resource === "account" && action === "orders" && method === "GET") {
    const customerId = sessionId ?? parseResourceId(url.searchParams.get("customer_id") ?? undefined, "customer_id");
    return jsonOk(await portalOrders(customerId));
  }
  if (resource === "account" && action === "returns" && method === "GET") {
    const customerId = sessionId ?? parseResourceId(url.searchParams.get("customer_id") ?? undefined, "customer_id");
    return jsonOk(
      await portalReturnAllowed(customerId, parseResourceId(url.searchParams.get("order_id") ?? undefined, "order_id")),
    );
  }
  if (resource === "seo" && action === "sitemap" && method === "GET") {
    const xml = await seoSitemap(url.origin);
    return new Response(xml, { headers: { "Content-Type": "application/xml" } });
  }
  if (resource === "seo" && action && method === "GET") {
    return jsonOk(await seoProduct(url.origin, parseResourceId(action)));
  }
  if (resource === "payments" && action === "callback" && method === "GET") {
    const { verifyOrderPayment } = await import("@/lib/services/pay-session");
    return jsonOk(
      await verifyOrderPayment({
        provider: url.searchParams.get("provider") ?? "zarinpal",
        authority: url.searchParams.get("Authority") ?? url.searchParams.get("authority") ?? "",
      }),
    );
  }
  if (resource === "presentment" && method === "GET") {
    return jsonOk(
      convertPresentment(
        Number(url.searchParams.get("amount_minor") ?? 0),
        Number(url.searchParams.get("from_rate") ?? 1),
        Number(url.searchParams.get("to_rate") ?? 1),
      ),
    );
  }
  return null;
}
