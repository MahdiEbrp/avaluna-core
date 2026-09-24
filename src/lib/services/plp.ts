import { and, asc, eq, sql } from "drizzle-orm";
import { fromMinorUnits, toMinorUnits } from "../../domain/money";
import { pageCount } from "../../domain/pagination";
import { plpToSearchParams, type PlpQueryState } from "../../domain/plp";
import type { UiLocale } from "../../domain/ui-locale";
import { db } from "../db/client";
import { categories, productCategories, products } from "../db/schema";
import { loadSettings } from "../settings/store";
import { moneyProfile, type MoneyProfile } from "../money/profile";
import { listProducts, type serializeProduct } from "./catalog";
import { toDbStock } from "./catalog-map";
import type { HomeCard, HomeCategory } from "./home";

export type PlpFacetCategory = HomeCategory & { count: number };

export type PlpData = {
  products: HomeCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  profile: MoneyProfile;
  categories: PlpFacetCategory[];
  priceRange: { minDisplay: number; maxDisplay: number };
  category: HomeCategory | null;
  query: PlpQueryState;
};

type Serialized = Awaited<ReturnType<typeof serializeProduct>>;

function toCard(product: Serialized, locale: UiLocale, profile: MoneyProfile): HomeCard {
  const image = product.images[0];
  const regularMinor = toMinorUnits(product.pricing.regular_amount, profile.scale);
  const saleMinor =
    product.pricing.sale_amount !== null ? toMinorUnits(product.pricing.sale_amount, profile.scale) : null;
  const name = locale === "fa" && product.name_fa ? product.name_fa : product.name;
  return {
    id: product.id,
    name,
    slug: product.slug,
    imageSrc: image?.src ?? null,
    imageAlt: image?.alt ?? "",
    onSale: product.pricing.on_sale,
    regularMinor,
    saleMinor,
    stockStatus: toDbStock(product.inventory.status),
    ratingAverage: product.rating.average,
    ratingCount: product.rating.count,
  };
}

async function loadFacetCategories(): Promise<PlpFacetCategory[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(${productCategories.productId})`,
    })
    .from(categories)
    .innerJoin(productCategories, eq(productCategories.categoryId, categories.id))
    .innerJoin(products, eq(products.id, productCategories.productId))
    .where(and(eq(products.status, "publish"), eq(products.catalogVisibility, "visible")))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(asc(categories.id));
  return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, count: Number(row.count) }));
}

async function loadCategoryBySlug(slug: string): Promise<HomeCategory | null> {
  if (!slug) return null;
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

function displayFromMinor(minor: number, profile: MoneyProfile): number {
  if (profile.scale === 1) return minor;
  return Number(fromMinorUnits(minor, profile.scale, profile.decimalPlaces));
}

async function loadPriceRangeDisplay(profile: MoneyProfile): Promise<{ minDisplay: number; maxDisplay: number }> {
  const rows = await db
    .select({
      min: sql<number | null>`min(${products.regularPriceCents})`,
      max: sql<number | null>`max(${products.regularPriceCents})`,
    })
    .from(products)
    .where(and(eq(products.status, "publish"), eq(products.catalogVisibility, "visible")));
  return {
    minDisplay: displayFromMinor(Number(rows[0]?.min ?? 0), profile),
    maxDisplay: displayFromMinor(Number(rows[0]?.max ?? 0), profile),
  };
}

export async function loadPlp(query: PlpQueryState, locale: UiLocale): Promise<PlpData> {
  const settings = await loadSettings();
  const profile = moneyProfile(settings);
  const params = plpToSearchParams(query);
  const [result, facetCategories, category, priceRange] = await Promise.all([
    listProducts(params),
    loadFacetCategories(),
    loadCategoryBySlug(query.category),
    loadPriceRangeDisplay(profile),
  ]);
  return {
    products: result.data.map((product) => toCard(product, locale, profile)),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: pageCount(result.total, result.pageSize),
    profile,
    categories: facetCategories,
    priceRange,
    category,
    query: { ...query, pageSize: result.pageSize },
  };
}

export async function loadCategoryName(slug: string): Promise<string | null> {
  const row = await loadCategoryBySlug(slug);
  return row?.name ?? null;
}
