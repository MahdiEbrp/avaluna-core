import { eq, inArray, sql } from "drizzle-orm";
import { averageRating } from "../../src/domain/reviews";
import { db } from "../../src/lib/db/client";
import {
  categories,
  productCategories,
  productImages,
  productTags,
  products,
  reviews,
  tags,
} from "../../src/lib/db/schema";
import { CATEGORIES, PRODUCTS, REVIEWS, SEED_MIN_PRODUCTS, TAGS } from "./catalog-data";
import { mustRow } from "./util";

function imageSrc(slug: string) {
  return `/img/products/${slug}.svg`;
}

export async function productCount() {
  const row = await db.select({ c: sql<number>`count(*)` }).from(products);
  return Number(row[0]?.c ?? 0);
}

export async function seedProductCount() {
  const slugs = PRODUCTS.map((item) => item.slug);
  if (!slugs.length) return 0;
  const found = await db.select({ id: products.id }).from(products).where(inArray(products.slug, slugs));
  return found.length;
}

export async function hasFullCatalog() {
  return (await seedProductCount()) >= SEED_MIN_PRODUCTS;
}

async function ensureCategories() {
  const map = new Map<string, number>();
  for (const cat of CATEGORIES) {
    const existing = (await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1))[0];
    if (existing) {
      map.set(cat.slug, existing.id);
      continue;
    }
    const inserted = await db
      .insert(categories)
      .values({ name: cat.name, slug: cat.slug, description: cat.description })
      .returning();
    map.set(cat.slug, mustRow(inserted[0], `category:${cat.slug}`).id);
  }
  return map;
}

async function ensureTags() {
  const map = new Map<string, number>();
  for (const tag of TAGS) {
    const existing = (await db.select().from(tags).where(eq(tags.slug, tag.slug)).limit(1))[0];
    if (existing) {
      map.set(tag.slug, existing.id);
      continue;
    }
    const inserted = await db.insert(tags).values({ name: tag.name, slug: tag.slug }).returning();
    map.set(tag.slug, mustRow(inserted[0], `tag:${tag.slug}`).id);
  }
  return map;
}

async function ensureProducts(created: string, catIds: Map<string, number>, tagIds: Map<string, number>) {
  const productIds = new Map<string, number>();
  for (const item of PRODUCTS) {
    let row = (await db.select().from(products).where(eq(products.slug, item.slug)).limit(1))[0];
    if (!row) {
      const sale = item.saleIrr && item.saleIrr < item.regularIrr ? item.saleIrr : null;
      const inserted = await db
        .insert(products)
        .values({
          name: item.name,
          nameFa: item.nameFa,
          slug: item.slug,
          slugFa: item.slugFa,
          type: "simple",
          status: "publish",
          description: item.description,
          descriptionFa: item.descriptionFa,
          shortDescription: item.short,
          sku: item.sku,
          regularPriceCents: item.regularIrr,
          salePriceCents: sale,
          onSale: sale !== null,
          manageStock: true,
          stockQuantity: item.stock,
          stockStatus: item.stock > 0 ? "instock" : "outofstock",
          featured: item.featured ?? false,
          averageRating: item.avgRating ?? 0,
          ratingCount: item.ratingCount ?? 0,
          createdAt: created,
          updatedAt: created,
        })
        .returning();
      row = mustRow(inserted[0], `product:${item.slug}`);
    }
    productIds.set(item.slug, row.id);

    const categoryId = catIds.get(item.categorySlug);
    if (categoryId) {
      const linked = (await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.productId, row.id))
        .limit(1))[0];
      if (!linked) {
        await db.insert(productCategories).values({ productId: row.id, categoryId });
      }
    }

    const src = imageSrc(item.slug);
    const hasImage = (await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.id))
      .limit(1))[0];
    if (!hasImage) {
      await db
        .insert(productImages)
        .values({ productId: row.id, src, alt: item.nameFa, position: 0 });
    }

    const linkRows = await db.select().from(productTags).where(eq(productTags.productId, row.id));
    for (const tagSlug of item.tagSlugs) {
      const tagId = tagIds.get(tagSlug);
      if (!tagId) continue;
      if (linkRows.some((link) => link.tagId === tagId)) continue;
      await db.insert(productTags).values({ productId: row.id, tagId });
    }
  }
  return productIds;
}

async function ensureReviews(productIds: Map<string, number>) {
  const existing = (await db.select({ c: sql<number>`count(*)` }).from(reviews))[0];
  if (Number(existing.c ?? 0) > 0) return;

  for (const item of REVIEWS) {
    const productId = productIds.get(item.productSlug);
    if (!productId) continue;
    await db.insert(reviews).values({
      productId,
      reviewer: item.reviewer,
      reviewerEmail: item.email,
      review: item.review,
      rating: item.rating,
      verified: true,
      status: "approved",
      createdAt: new Date().toISOString(),
    });
  }

  for (const [slug, productId] of productIds) {
    const approved = (await db.select().from(reviews).where(eq(reviews.productId, productId))).filter(
      (row) => row.status === "approved",
    );
    if (!approved.length) continue;
    const stats = averageRating(approved.map((row) => row.rating));
    await db
      .update(products)
      .set({ averageRating: stats.average, ratingCount: stats.count })
      .where(eq(products.slug, slug));
  }
}

export async function seedCatalog(created: string) {
  const catIds = await ensureCategories();
  const tagIds = await ensureTags();
  const productIds = await ensureProducts(created, catIds, tagIds);
  await ensureReviews(productIds);
  return { categories: catIds.size, products: productIds.size, tags: tagIds.size };
}
