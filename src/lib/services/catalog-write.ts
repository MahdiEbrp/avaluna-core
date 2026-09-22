import { eq } from "drizzle-orm";
import { fromMinorUnits, toMinorUnits } from "../../domain/money";
import { slugify, slugifyFa } from "../../domain/slug";
import { connector, db } from "../db/client";
import { productCategories, productImages, productTags, productVariations, products } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";
import { toApiStock, toDbBackorder, toDbStatus, toDbStock } from "./catalog-map";
import { type ProductWrite, productWriteSchema } from "./catalog-schema";
import { serializeProduct } from "./catalog";

export async function createProduct(input: ProductWrite) {
  const parsed = productWriteSchema.parse(input);
  if (!parsed.name) {
    throw new ApiError(400, "catalog.name_required", "Product name is required.");
  }
  const slug = parsed.slug || slugify(parsed.name);
  const slugFa = parsed.slug_fa || slugifyFa(parsed.name_fa || parsed.name);
  const sale = parsed.sale_price ? toMinorUnits(parsed.sale_price) : null;
  const regular = toMinorUnits(parsed.regular_price ?? "0");
  const inserted = await db
    .insert(products)
    .values({
      name: parsed.name,
      nameFa: parsed.name_fa ?? "",
      slug,
      slugFa,
      type: parsed.type ?? "simple",
      status: toDbStatus(parsed.status ?? "published"),
      description: parsed.description ?? "",
      descriptionFa: parsed.description_fa ?? "",
      shortDescription: parsed.summary ?? "",
      sku: parsed.sku ?? null,
      regularPriceCents: regular,
      salePriceCents: sale,
      onSale: sale !== null && sale < regular,
      virtual: parsed.virtual ?? false,
      downloadable: parsed.downloadable ?? false,
      downloadsJson: JSON.stringify(parsed.downloads ?? []),
      taxClass: parsed.tax_class ?? "standard",
      manageStock: parsed.track_inventory ?? true,
      stockQuantity: parsed.stock_quantity ?? 0,
      stockStatus: toDbStock(parsed.stock_status ?? "in_stock"),
      backorders: toDbBackorder(parsed.backorders ?? "none"),
      weight: parsed.weight ?? "",
      length: parsed.dimensions?.length ?? "",
      width: parsed.dimensions?.width ?? "",
      height: parsed.dimensions?.height ?? "",
      featured: parsed.featured ?? false,
      catalogVisibility: parsed.catalog_visibility ?? "visible",
      externalUrl: parsed.external_url,
      buttonText: parsed.button_text,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .returning({ id: products.id });
  const id = requireInserted(inserted[0], "product").id;
  if (parsed.images) {
    for (const [index, image] of parsed.images.entries()) {
      await db.insert(productImages).values({
        productId: id,
        src: image.src,
        alt: image.alt ?? "",
        position: index,
      });
    }
  }
  if (parsed.categories) {
    for (const category of parsed.categories) {
      await db.insert(productCategories).values({ productId: id, categoryId: category.id });
    }
  }
  if (parsed.tags) {
    for (const tag of parsed.tags) {
      await db.insert(productTags).values({ productId: id, tagId: tag.id });
    }
  }
  try {
    await connector.execute({
      sql: "INSERT INTO products_fts(rowid, name, name_fa, description, sku) VALUES (?, ?, ?, ?, ?)",
      args: [id, parsed.name, parsed.name_fa ?? "", parsed.description ?? "", parsed.sku ?? ""],
    });
  } catch {
    // FTS optional
  }
  return serializeProduct(id);
}

export async function updateProduct(id: number, input: ProductWrite) {
  const existing = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
  if (!existing) {
    throw new ApiError(404, "catalog.product_not_found", "Product not found.");
  }
  const parsed = productWriteSchema.parse(input);
  const regular =
    parsed.regular_price !== undefined ? toMinorUnits(parsed.regular_price) : existing.regularPriceCents;
  const sale =
    parsed.sale_price === undefined
      ? existing.salePriceCents
      : parsed.sale_price
        ? toMinorUnits(parsed.sale_price)
        : null;
  await db
    .update(products)
    .set({
      name: parsed.name ?? existing.name,
      slug: parsed.slug ?? existing.slug,
      type: parsed.type ?? existing.type,
      status: parsed.status ? toDbStatus(parsed.status) : existing.status,
      description: parsed.description ?? existing.description,
      shortDescription: parsed.summary ?? existing.shortDescription,
      sku: parsed.sku === undefined ? existing.sku : parsed.sku,
      regularPriceCents: regular,
      salePriceCents: sale,
      onSale: sale !== null && sale < regular,
      virtual: parsed.virtual ?? existing.virtual,
      downloadable: parsed.downloadable ?? existing.downloadable,
      stockQuantity: parsed.stock_quantity ?? existing.stockQuantity,
      stockStatus: parsed.stock_status ? toDbStock(parsed.stock_status) : existing.stockStatus,
      featured: parsed.featured ?? existing.featured,
      updatedAt: nowIso(),
    })
    .where(eq(products.id, id));
  return serializeProduct(id);
}

export async function deleteProduct(id: number, force: boolean) {
  const existing = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
  if (!existing) {
    throw new ApiError(404, "catalog.product_not_found", "Product not found.");
  }
  if (!force) {
    await db.update(products).set({ status: "draft", updatedAt: nowIso() }).where(eq(products.id, id));
    return serializeProduct(id);
  }
  await db.delete(products).where(eq(products.id, id));
  return { deleted: true, id };
}

export async function createVariation(
  productId: number,
  body: {
    sku?: string;
    regular_price?: string;
    stock_quantity?: number;
    attributes?: Record<string, string>;
  },
) {
  const parent = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!parent) {
    throw new ApiError(404, "catalog.product_not_found", "Product not found.");
  }
  const quantity = body.stock_quantity ?? 0;
  const inserted = await db
    .insert(productVariations)
    .values({
      productId,
      sku: body.sku,
      regularPriceCents: toMinorUnits(body.regular_price ?? "0"),
      stockQuantity: quantity,
      stockStatus: quantity > 0 ? "instock" : "outofstock",
      attributesJson: JSON.stringify(body.attributes ?? {}),
    })
    .returning();
  const variation = requireInserted(inserted[0], "variation");
  return {
    id: variation.id,
    product_id: productId,
    sku: variation.sku,
    pricing: { amount: fromMinorUnits(variation.regularPriceCents) },
    inventory: { quantity: variation.stockQuantity, status: toApiStock(variation.stockStatus) },
    attributes: JSON.parse(variation.attributesJson) as Record<string, string>,
  };
}

export async function listVariations(productId: number) {
  const rows = await db.select().from(productVariations).where(eq(productVariations.productId, productId));
  return rows.map((variation) => ({
    id: variation.id,
    sku: variation.sku,
    pricing: { amount: fromMinorUnits(variation.regularPriceCents) },
    inventory: { quantity: variation.stockQuantity, status: toApiStock(variation.stockStatus) },
    attributes: JSON.parse(variation.attributesJson) as Record<string, string>,
  }));
}
