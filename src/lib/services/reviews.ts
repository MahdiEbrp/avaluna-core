import { and, eq } from "drizzle-orm";
import { averageRating, isReviewRating, isReviewStatus, type ReviewStatus } from "../../domain/reviews";
import { db } from "../db/client";
import { products, reviews } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";

export async function createReview(input: {
  product_id: number;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
}) {
  if (!isReviewRating(input.rating)) {
    throw new ApiError(400, "reviews.invalid_rating", "Rating must be an integer from 1 to 5.");
  }
  const product = (await db.select().from(products).where(eq(products.id, input.product_id)).limit(1))[0];
  if (!product) {
    throw new ApiError(404, "products.not_found", "Product not found.");
  }
  const row = await db
    .insert(reviews)
    .values({
      productId: input.product_id,
      reviewer: input.reviewer.trim(),
      reviewerEmail: input.reviewer_email.trim(),
      review: input.review.trim(),
      rating: input.rating,
      verified: false,
      status: "pending",
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "review");
}

export async function listReviews(productId: number, status?: ReviewStatus) {
  if (status) {
    return db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.status, status)));
  }
  return db.select().from(reviews).where(eq(reviews.productId, productId));
}

export async function moderateReview(id: number, status: string) {
  if (!isReviewStatus(status)) {
    throw new ApiError(400, "reviews.invalid_status", "Status must be pending, approved, or rejected.");
  }
  const row = (await db.select().from(reviews).where(eq(reviews.id, id)).limit(1))[0];
  if (!row) {
    throw new ApiError(404, "reviews.not_found", "Review not found.");
  }
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  if (status === "approved") {
    const approved = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, row.productId), eq(reviews.status, "approved")));
    const stats = averageRating(approved.map((item) => item.rating));
    await db
      .update(products)
      .set({ averageRating: stats.average, ratingCount: stats.count })
      .where(eq(products.id, row.productId));
  }
  return { ...row, status };
}
