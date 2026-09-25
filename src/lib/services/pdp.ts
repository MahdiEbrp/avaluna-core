import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { isPublicProduct, matchesProductSlug, pdpImagePath, relatedProductLimit } from "../../domain/pdp";
import type { UiLocale } from "../../domain/ui-locale";
import { db } from "../db/client";
import { categories, paymentGateways, productCategories, productImages, products, reviews } from "../db/schema";
import { moneyProfile, type MoneyProfile } from "../money/profile";
import { loadSettings } from "../settings/store";
import { serializeProduct } from "./catalog";
import { toDbStock } from "./catalog-map";
import type { HomeCard } from "./home";
import { listRelated } from "./merchandising";

export type PdpReview = {
  id: number;
  reviewer: string;
  review: string;
  rating: number;
  verified: boolean;
  created_at: string;
};

export type PdpData = {
  product: Awaited<ReturnType<typeof serializeProduct>>;
  profile: MoneyProfile;
  reviews: PdpReview[];
  related: HomeCard[];
  codEnabled: boolean;
  primaryCategory: { id: number; name: string; slug: string } | null;
};

async function findProductIdBySlug(slug: string): Promise<number | null> {
  if (!slug) return null;
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      slugFa: products.slugFa,
      status: products.status,
      visibility: products.catalogVisibility,
    })
    .from(products)
    .where(or(eq(products.slug, slug), eq(products.slugFa, slug)))
    .limit(5);
  const match = rows.find(
    (row) =>
      matchesProductSlug({ slug: row.slug, slug_fa: row.slugFa }, slug) &&
      isPublicProduct(row.status === "publish" ? "published" : row.status, row.visibility),
  );
  return match?.id ?? null;
}

async function loadPrimaryCategory(productId: number) {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(eq(productCategories.productId, productId))
    .limit(1);
  return rows[0] ?? null;
}

type CardRow = {
  id: number;
  name: string;
  nameFa: string;
  slug: string;
  onSale: boolean;
  regular: number;
  sale: number | null;
  stock: string;
  rating: number;
  count: number;
};

function toCard(row: CardRow & { imageSrc: string | null; imageAlt: string }, locale: UiLocale): HomeCard {
  return {
    id: row.id,
    name: locale === "fa" && row.nameFa ? row.nameFa : row.name,
    slug: row.slug,
    imageSrc: row.imageSrc,
    imageAlt: row.imageAlt,
    onSale: row.onSale,
    regularMinor: row.regular,
    saleMinor: row.sale,
    stockStatus: toDbStock(row.stock),
    ratingAverage: row.rating,
    ratingCount: row.count,
  };
}

async function loadCardRows(ids: number[]): Promise<(CardRow & { imageSrc: string | null; imageAlt: string })[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      nameFa: products.nameFa,
      slug: products.slug,
      onSale: products.onSale,
      regular: products.regularPriceCents,
      sale: products.salePriceCents,
      stock: products.stockStatus,
      rating: products.averageRating,
      count: products.ratingCount,
    })
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.status, "publish"), eq(products.catalogVisibility, "visible")));
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
  const first = new Map<number, { src: string; alt: string }>();
  for (const image of imageRows) {
    if (!first.has(image.productId)) first.set(image.productId, { src: image.src, alt: image.alt });
  }
  return rows.map((row) => {
    const image = first.get(row.id) ?? null;
    return { ...row, imageSrc: image ? pdpImagePath(image.src) : null, imageAlt: image?.alt ?? "" };
  });
}

async function loadRelatedIds(productId: number): Promise<number[]> {
  const limit = relatedProductLimit();
  const relations = await listRelated(productId);
  const relatedIds = relations.map((row) => row.relatedProductId).filter((id) => id !== productId);
  if (relatedIds.length > 0) return relatedIds.slice(0, limit);
  const categoryLinks = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));
  const categoryIds = categoryLinks.map((link) => link.categoryId);
  if (categoryIds.length > 0) {
    const peers = await db
      .select({ id: products.id })
      .from(productCategories)
      .innerJoin(products, eq(products.id, productCategories.productId))
      .where(
        and(
          inArray(productCategories.categoryId, categoryIds),
          ne(products.id, productId),
          eq(products.status, "publish"),
          eq(products.catalogVisibility, "visible"),
        ),
      )
      .limit(limit);
    if (peers.length > 0) return peers.map((row) => row.id);
  }
  const featured = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        ne(products.id, productId),
        eq(products.status, "publish"),
        eq(products.catalogVisibility, "visible"),
      ),
    )
    .orderBy(desc(products.featured), desc(products.averageRating), desc(products.id))
    .limit(limit);
  return featured.map((row) => row.id);
}

async function codEnabled(): Promise<boolean> {
  const rows = await db
    .select({ enabled: paymentGateways.enabled })
    .from(paymentGateways)
    .where(eq(paymentGateways.id, "cash_on_delivery"))
    .limit(1);
  return Boolean(rows[0]?.enabled);
}

export async function loadPdp(slug: string, locale: UiLocale): Promise<PdpData | null> {
  const productId = await findProductIdBySlug(slug);
  if (productId === null) return null;
  const settings = await loadSettings();
  const profile = moneyProfile(settings);
  const [product, reviewRows, relatedIds, primaryCategory, cod] = await Promise.all([
    serializeProduct(productId),
    db
      .select({
        id: reviews.id,
        reviewer: reviews.reviewer,
        review: reviews.review,
        rating: reviews.rating,
        verified: reviews.verified,
        created_at: reviews.createdAt,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved"))),
    loadRelatedIds(productId),
    loadPrimaryCategory(productId),
    codEnabled(),
  ]);
  const relatedRows = await loadCardRows(relatedIds);
  return {
    product,
    profile,
    reviews: reviewRows.map((row) => ({ ...row })),
    related: relatedRows.map((row) => toCard(row, locale)),
    codEnabled: cod,
    primaryCategory,
  };
}
