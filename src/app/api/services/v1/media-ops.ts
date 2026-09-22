import { jsonOk } from "@/lib/http";
import { parseResourceId } from "@/lib/safety";
import { attachProductImage, parseMediaForm, storeMediaFile } from "@/lib/services/media";
import { createReview, listReviews, moderateReview } from "@/lib/services/reviews";
import { createSqliteBackup, listSqliteBackups } from "@/lib/services/backups";
import { invoiceForOrder } from "@/lib/services/invoices";
import { submitOrderToMoadian } from "@/lib/services/moadian-submit";
import { db } from "@/lib/db/client";
import { attributes, attributeTerms } from "@/lib/db/schema";
import { slugify } from "@/lib/time";
import type { ServiceContext } from "./service-context";

export async function handleMediaOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, nested, body, request, url } = ctx;

  if (resource === "media" && method === "POST" && !idOrAction) {
    const file = await parseMediaForm(request);
    return jsonOk(await storeMediaFile(file), { status: 201 });
  }
  if (resource === "products" && nested === "images" && idOrAction && method === "POST") {
    const rec = body as { media_id: number; position?: number };
    return jsonOk(await attachProductImage(parseResourceId(idOrAction), rec.media_id, rec.position ?? 0), { status: 201 });
  }
  if (resource === "reviews") {
    if (method === "GET") {
      return jsonOk(await listReviews(Number(url.searchParams.get("product_id") ?? 0)));
    }
    if (method === "POST" && !idOrAction) {
      return jsonOk(await createReview(body as never), { status: 201 });
    }
    if (method === "PATCH" && idOrAction) {
      const rec = body as { status: string };
      return jsonOk(await moderateReview(parseResourceId(idOrAction), rec.status));
    }
  }
  if (resource === "attributes") {
    if (method === "GET" && !idOrAction) return jsonOk(await db.select().from(attributes));
    if (method === "POST" && !idOrAction) {
      const rec = body as { name: string; type?: string };
      const row = await db
        .insert(attributes)
        .values({ name: rec.name, slug: slugify(rec.name), type: rec.type ?? "select" })
        .returning();
      return jsonOk(row[0], { status: 201 });
    }
    if (method === "POST" && nested === "terms" && idOrAction) {
      const rec = body as { name: string };
      const row = await db
        .insert(attributeTerms)
        .values({ attributeId: parseResourceId(idOrAction), name: rec.name, slug: slugify(rec.name) })
        .returning();
      return jsonOk(row[0], { status: 201 });
    }
  }
  if (resource === "backups") {
    if (method === "GET") return jsonOk(await listSqliteBackups());
    if (method === "POST") return jsonOk(await createSqliteBackup(), { status: 201 });
  }
  if (resource === "orders" && nested === "invoice" && idOrAction && method === "GET") {
    return jsonOk(await invoiceForOrder(parseResourceId(idOrAction)));
  }
  if (resource === "orders" && nested === "moadian" && idOrAction && method === "POST") {
    const row = await submitOrderToMoadian(parseResourceId(idOrAction));
    return jsonOk(row ?? { skipped: true });
  }
  return null;
}
