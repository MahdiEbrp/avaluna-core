import { eq } from "drizzle-orm";
import { buildFacets } from "../../domain/catalog-facets";
import { db } from "../db/client";
import { productCategories, products } from "../db/schema";
import { unitPriceMinor } from "./catalog-map";

export async function listCatalogFacets() {
  const rows = await db.select().from(products);
  const links = await db.select().from(productCategories);
  const byProduct = new Map<number, number[]>();
  for (const link of links) {
    const list = byProduct.get(link.productId) ?? [];
    list.push(link.categoryId);
    byProduct.set(link.productId, list);
  }
  return buildFacets(
    rows.map((row) => ({
      categoryIds: byProduct.get(row.id) ?? [],
      priceRial: unitPriceMinor(row),
      inStock: row.stockStatus === "instock",
    })),
  );
}

export async function categoryIdsForProduct(productId: number) {
  const rows = await db.select().from(productCategories).where(eq(productCategories.productId, productId));
  return rows.map((row) => row.categoryId);
}
