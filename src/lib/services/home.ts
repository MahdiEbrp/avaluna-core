import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { UI } from "../../config/constants";
import { offsetOf } from "../../domain/pagination";
import { db } from "../db/client";
import { categories, productCategories, productImages, products } from "../db/schema";
import { loadSettings } from "../settings/store";
import { moneyProfile, type MoneyProfile } from "../money/profile";

export type HomeCard = {
  id: number;
  name: string;
  slug: string;
  imageSrc: string | null;
  imageAlt: string;
  onSale: boolean;
  regularMinor: number;
  saleMinor: number | null;
  stockStatus: string;
  ratingAverage: number;
  ratingCount: number;
};

export type HomeCategory = { id: number; name: string; slug: string };

export type HomeData = {
  categories: HomeCategory[];
  featured: HomeCard[];
  deals: HomeCard[];
  total: number;
  profile: MoneyProfile;
};

function baseWhere(featured?: boolean) {
  const filters = [
    eq(products.status, "publish"),
    eq(products.catalogVisibility, "visible"),
  ];
  if (featured !== undefined) {
    filters.push(eq(products.featured, featured));
  }
  return and(...filters);
}

async function loadCards(where: ReturnType<typeof baseWhere>, limit: number): Promise<HomeCard[]> {
  const totalRow = await db
    .select({ c: sql<number>`count(*)` })
    .from(products)
    .where(where);
  const total = Number(totalRow[0]?.c ?? 0);
  if (total === 0) return [];
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      onSale: products.onSale,
      regular: products.regularPriceCents,
      sale: products.salePriceCents,
      stockStatus: products.stockStatus,
      ratingAverage: products.averageRating,
      ratingCount: products.ratingCount,
    })
    .from(products)
    .where(where)
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit)
    .offset(offsetOf(1, limit));
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const imageRows = await db
    .select({
      productId: productImages.productId,
      src: productImages.src,
      alt: productImages.alt,
      position: productImages.position,
    })
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(productImages.position, productImages.id);
  const firstImage = new Map<number, { src: string; alt: string }>();
  for (const image of imageRows) {
    if (!firstImage.has(image.productId)) {
      firstImage.set(image.productId, { src: image.src, alt: image.alt });
    }
  }
  return rows.map((row) => {
    const image = firstImage.get(row.id) ?? null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageSrc: image?.src ?? null,
      imageAlt: image?.alt ?? "",
      onSale: row.onSale,
      regularMinor: row.regular,
      saleMinor: row.sale,
      stockStatus: row.stockStatus,
      ratingAverage: row.ratingAverage,
      ratingCount: row.ratingCount,
    };
  });
}

async function loadCategories(): Promise<HomeCategory[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      productCount: sql<number>`count(${productCategories.productId})`,
    })
    .from(categories)
    .leftJoin(productCategories, eq(productCategories.categoryId, categories.id))
    .innerJoin(products, eq(products.id, productCategories.productId))
    .where(and(eq(products.status, "publish"), eq(products.catalogVisibility, "visible")))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(categories.id)
    .limit(UI.HOME.CATEGORY_LIMIT);
  return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug }));
}

export async function loadHome(): Promise<HomeData> {
  const settings = await loadSettings();
  const profile = moneyProfile(settings);
  const dealWhere = and(
    eq(products.status, "publish"),
    eq(products.catalogVisibility, "visible"),
    eq(products.onSale, true),
  );
  const [categoriesRows, featured, deals, totalRow] = await Promise.all([
    loadCategories(),
    loadCards(baseWhere(true), UI.HOME.SECTION_LIMIT),
    loadCards(dealWhere, UI.HOME.SECTION_LIMIT),
    db
      .select({ c: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.status, "publish"), eq(products.catalogVisibility, "visible"))),
  ]);
  return {
    categories: categoriesRows,
    featured,
    deals,
    total: Number(totalRow[0]?.c ?? 0),
    profile,
  };
}
