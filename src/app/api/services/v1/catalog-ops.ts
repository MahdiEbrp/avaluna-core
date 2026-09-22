import { db } from "@/lib/db/client";
import { categories, tags } from "@/lib/db/schema";
import { jsonOk } from "@/lib/http";
import { listProducts, serializeProduct } from "@/lib/services/catalog";
import {
  createProduct,
  createVariation,
  deleteProduct,
  listVariations,
  updateProduct,
} from "@/lib/services/catalog-write";
import { slugify } from "@/lib/time";
import type { ServiceContext } from "./service-context";

export async function handleCatalogOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, nested, url, body } = ctx;

  if (resource === "products" && !idOrAction) {
    if (method === "GET") {
      const result = await listProducts(url.searchParams);
      return jsonOk(result.data, result);
    }
    if (method === "POST") {
      return jsonOk(await createProduct(body as never), { status: 201 });
    }
  }

  if (resource === "products" && idOrAction === "batch" && method === "POST") {
    const payload = body as {
      create?: unknown[];
      update?: { id: number }[];
      delete?: number[];
    };
    const created = [];
    for (const item of payload.create ?? []) created.push(await createProduct(item as never));
    const updated = [];
    for (const item of payload.update ?? []) updated.push(await updateProduct(item.id, item as never));
    const deleted = [];
    for (const id of payload.delete ?? []) deleted.push(await deleteProduct(id, true));
    return jsonOk({ created, updated, deleted });
  }

  if (resource === "categories") {
    if (method === "GET") return jsonOk(await db.select().from(categories));
    if (method === "POST") {
      const rec = body as { name: string; slug?: string; parent_id?: number; description?: string };
      const row = await db
        .insert(categories)
        .values({
          name: rec.name,
          slug: rec.slug || slugify(rec.name),
          parentId: rec.parent_id,
          description: rec.description ?? "",
        })
        .returning();
      return jsonOk(row[0], { status: 201 });
    }
  }

  if (resource === "tags") {
    if (method === "GET") return jsonOk(await db.select().from(tags));
    if (method === "POST") {
      const rec = body as { name: string };
      const row = await db.insert(tags).values({ name: rec.name, slug: slugify(rec.name) }).returning();
      return jsonOk(row[0], { status: 201 });
    }
  }

  if (resource === "products" && idOrAction && idOrAction !== "batch") {
    const id = Number(idOrAction);
    if (nested === "variations") {
      if (method === "GET") return jsonOk(await listVariations(id));
      if (method === "POST") return jsonOk(await createVariation(id, body as never), { status: 201 });
    }
    if (!nested) {
      if (method === "GET") return jsonOk(await serializeProduct(id));
      if (method === "PUT" || method === "PATCH") return jsonOk(await updateProduct(id, body as never));
      if (method === "DELETE") {
        return jsonOk(await deleteProduct(id, url.searchParams.get("force") === "true"));
      }
    }
  }

  return null;
}
