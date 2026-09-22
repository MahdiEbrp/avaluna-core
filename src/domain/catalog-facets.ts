export type FacetProduct = {
  categoryIds: number[];
  priceRial: number;
  inStock: boolean;
};

export function buildFacets(rows: FacetProduct[]) {
  const categories = new Map<number, number>();
  let inStock = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const row of rows) {
    if (row.inStock) {
      inStock += 1;
    }
    if (row.priceRial < min) {
      min = row.priceRial;
    }
    if (row.priceRial > max) {
      max = row.priceRial;
    }
    for (const id of row.categoryIds) {
      categories.set(id, (categories.get(id) ?? 0) + 1);
    }
  }
  return {
    categories: [...categories.entries()].map(([id, count]) => ({ id, count })),
    price_rial: { min: Number.isFinite(min) ? min : 0, max },
    in_stock_count: inStock,
    total: rows.length,
  };
}
