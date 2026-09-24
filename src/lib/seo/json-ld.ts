export function escapeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function storeJsonLd(input: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: input.name,
    description: input.description,
    url: input.url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${input.url}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function itemListJsonLd(input: { name: string; url: string; items: { name: string; url: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
