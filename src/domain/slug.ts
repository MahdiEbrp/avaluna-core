export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Keep Persian letters so storefront URLs can be fa. */
export function slugifyFa(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]+/g, "")
    .replace(/(^-|-$)/g, "");
}

export function sanitizeLikeTerm(input: string): string {
  return input.replace(/[%_]/g, "");
}
