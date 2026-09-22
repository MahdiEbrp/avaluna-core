import { REVIEW } from "../config/constants";

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

export function isReviewRating(value: number): boolean {
  return Number.isInteger(value) && value >= REVIEW.RATING_MIN && value <= REVIEW.RATING_MAX;
}

export function averageRating(ratings: number[]): { average: number; count: number } {
  const valid = ratings.filter(isReviewRating);
  if (valid.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = valid.reduce((acc, n) => acc + n, 0);
  return { average: Math.round((sum / valid.length) * 10) / 10, count: valid.length };
}
