import { asc } from "drizzle-orm";
import { db } from "../db/client";
import { categories } from "../db/schema";
import { loadSettings, readMerged } from "../settings/store";

export type ShopChrome = {
  categories: { id: number; name: string; slug: string }[];
  legal: { enamad_code: string; samandehi_code: string; return_days: number };
};

export async function loadShopChrome(): Promise<ShopChrome> {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.id));
  const map = await loadSettings();
  const returnDaysRaw = Number(readMerged(map, "legal", "return_days") || 0);
  return {
    categories: rows,
    legal: {
      enamad_code: readMerged(map, "legal", "enamad_code"),
      samandehi_code: readMerged(map, "legal", "samandehi_code"),
      return_days: Number.isFinite(returnDaysRaw) && returnDaysRaw > 0 ? returnDaysRaw : 0,
    },
  };
}
