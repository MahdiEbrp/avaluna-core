import { UI } from "../config/constants";

export type ProductSlugRow = {
  slug: string;
  slug_fa: string;
  status: string;
  catalog_visibility: string;
};

export function matchesProductSlug(row: { slug: string; slug_fa: string }, pathSlug: string): boolean {
  if (!pathSlug) return false;
  return row.slug === pathSlug || (row.slug_fa !== "" && row.slug_fa === pathSlug);
}

export function isPublicProduct(status: string, catalogVisibility: string): boolean {
  return status === "published" && catalogVisibility !== "hidden";
}

export function pdpImagePath(src: string): string {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `/${src.replace(/^\/+/, "")}`;
}

export function relatedProductLimit(): number {
  return UI.PDP.RELATED_LIMIT;
}
