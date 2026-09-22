export function canonicalUrl(origin: string, path: string): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/$/, "")}${trimmed}`;
}

export function productJsonLd(input: { name: string; url: string; amount: string; currency: string }): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    url: input.url,
    offers: {
      "@type": "Offer",
      price: input.amount,
      priceCurrency: input.currency,
    },
  };
}

export function sitemapUrlset(urls: { loc: string; lastmod?: string }[]): string {
  const body = urls
    .map((entry) => `<url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}</url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}
