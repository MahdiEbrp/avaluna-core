import { and, asc, desc, eq, gte, inArray, like, lte, sql } from "drizzle-orm";
import { fromMinorUnits, toMinorUnits } from "../../domain/money";
import { moneyProfile } from "../money/profile";
import { loadSettings } from "../settings/store";
import { offsetOf, parsePage } from "../../domain/pagination";
import { sanitizeLikeTerm } from "../../domain/slug";
import { db } from "../db/client";
import {
  categories,
  productCategories,
  productImages,
  productTags,
  productVariations,
  products,
  tags,
} from "../db/schema";
import { ApiError } from "../errors";
import { parseJsonColumn } from "../safety";
import {
  toApiBackorder,
  toApiStatus,
  toApiStock,
  toDbStatus,
  toDbStock,
  unitPriceMinor,
} from "./catalog-map";

export { productWriteSchema, type ProductWrite } from "./catalog-schema";

export async function serializeProduct(id: number) {
  const row = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
  if (!row) {
    throw new ApiError(404, "catalog.product_not_found", "Product not found.");
  }
  const images = await db.select().from(productImages).where(eq(productImages.productId, id));
  const categoryRows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(eq(productCategories.productId, id));
  const tagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(productTags)
    .innerJoin(tags, eq(productTags.tagId, tags.id))
    .where(eq(productTags.productId, id));
  const variations = await db.select().from(productVariations).where(eq(productVariations.productId, id));
  const priceMinor = unitPriceMinor(row);
  const profile = moneyProfile(await loadSettings());
  return {
    id: row.id,
    name: row.name,
    name_fa: row.nameFa,
    slug: row.slug,
    slug_fa: row.slugFa,
    type: row.type,
    status: toApiStatus(row.status),
    description: row.description,
    description_fa: row.descriptionFa,
    summary: row.shortDescription,
    sku: row.sku,
    pricing: {
      currency: profile.currency,
      amount: fromMinorUnits(priceMinor, profile.scale, profile.decimalPlaces),
      regular_amount: fromMinorUnits(row.regularPriceCents, profile.scale, profile.decimalPlaces),
      sale_amount:
        row.salePriceCents !== null ? fromMinorUnits(row.salePriceCents, profile.scale, profile.decimalPlaces) : null,
      on_sale: row.onSale,
      display_unit: profile.displayUnit,
    },
    virtual: row.virtual,
    downloadable: row.downloadable,
    downloads: parseJsonColumn<unknown[]>(row.downloadsJson, []),
    tax_class: row.taxClass,
    inventory: {
      tracked: row.manageStock,
      quantity: row.stockQuantity,
      status: toApiStock(row.stockStatus),
      backorders: toApiBackorder(row.backorders),
    },
    shipping: {
      weight: row.weight,
      dimensions: { length: row.length, width: row.width, height: row.height },
    },
    featured: row.featured,
    catalog_visibility: row.catalogVisibility,
    external_url: row.externalUrl,
    button_text: row.buttonText,
    rating: { average: row.averageRating, count: row.ratingCount },
    categories: categoryRows,
    tags: tagRows,
    images: images.map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.alt,
      position: image.position,
    })),
    variation_ids: variations.map((variation) => variation.id),
    variations: variations.map((variation) => ({
      id: variation.id,
      sku: variation.sku,
      quantity: variation.stockQuantity,
      attributes: parseJsonColumn<Record<string, string>>(variation.attributesJson, {}),
      image_url: variation.imageUrl,
    })),
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export async function listProducts(search: URLSearchParams) {
  const { page, pageSize } = parsePage(search);
  const filters = [];
  const query = search.get("search") ?? search.get("q");
  if (query) {
    filters.push(like(products.name, `%${sanitizeLikeTerm(query)}%`));
  }
  const status = search.get("status");
  if (status && status !== "any") {
    filters.push(eq(products.status, toDbStatus(status)));
  }
  const type = search.get("type");
  if (type) {
    filters.push(eq(products.type, type));
  }
  const sku = search.get("sku");
  if (sku) {
    filters.push(eq(products.sku, sku));
  }
  if (search.get("featured") === "true") {
    filters.push(eq(products.featured, true));
  }
  const stock = search.get("stock_status");
  if (stock) {
    filters.push(eq(products.stockStatus, toDbStock(stock)));
  }
  if (search.get("on_sale") === "true") {
    filters.push(eq(products.onSale, true));
  }
  if (search.get("in_stock") === "true") {
    filters.push(eq(products.stockStatus, "instock"));
  }
  const minPrice = search.get("min_price");
  if (minPrice) {
    filters.push(gte(products.regularPriceCents, toMinorUnits(minPrice)));
  }
  const maxPrice = search.get("max_price");
  if (maxPrice) {
    filters.push(lte(products.regularPriceCents, toMinorUnits(maxPrice)));
  }
  const visibility = search.get("catalog_visibility");
  if (visibility) {
    filters.push(eq(products.catalogVisibility, visibility));
  }
  const categorySlug = search.get("category");
  if (categorySlug) {
    const categoryRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    const categoryId = categoryRows[0]?.id;
    if (categoryId === undefined) {
      return { data: [], total: 0, page, pageSize, perPage: pageSize };
    }
    const linkRows = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId));
    const productIds = linkRows.map((row) => row.productId);
    if (productIds.length === 0) {
      return { data: [], total: 0, page, pageSize, perPage: pageSize };
    }
    filters.push(inArray(products.id, productIds));
  }

  const where = filters.length ? and(...filters) : undefined;
  const totalRow = await db.select({ c: sql<number>`count(*)` }).from(products).where(where);
  const total = Number(totalRow[0]?.c ?? 0);
  const sort = search.get("sort") ?? search.get("orderby") ?? "created_at";
  const direction = search.get("order") === "asc" ? asc : desc;
  const column =
    sort === "price"
      ? products.regularPriceCents
      : sort === "name" || sort === "title"
        ? products.name
        : sort === "id"
          ? products.id
          : sort === "rating"
            ? products.averageRating
            : products.createdAt;
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(where)
    .orderBy(direction(column))
    .limit(pageSize)
    .offset(offsetOf(page, pageSize));
  const data = await Promise.all(rows.map((row) => serializeProduct(row.id)));
  return { data, total, page, pageSize, perPage: pageSize };
}

