import { eq, like } from "drizzle-orm";
import { GIFT_CARD } from "../../config/constants";
import { formatGiftCardCode, redeemGiftCard } from "../../domain/gift-cards";
import { fromMinorUnits, toMinorUnits } from "../../domain/money";
import { scoreMatch, searchTokens } from "../../domain/search";
import { sanitizeLikeTerm } from "../../domain/slug";
import { db, withWriteTransaction } from "../db/client";
import {
  addresses,
  collectionProducts,
  collections,
  currencies,
  customerGroupMembers,
  customerGroups,
  giftCards,
  productRelations,
  products,
  wishlistItems,
  wishlists,
} from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso, slugify } from "../time";

export async function relateProducts(productId: number, relatedId: number, relationType: string) {
  const row = await db
    .insert(productRelations)
    .values({ productId, relatedProductId: relatedId, relationType })
    .returning();
  return row[0];
}

export async function listRelated(productId: number) {
  return db.select().from(productRelations).where(eq(productRelations.productId, productId));
}

export async function createCollection(name: string, description = "") {
  const row = await db.insert(collections).values({ name, slug: slugify(name), description }).returning();
  return row[0];
}

export async function addToCollection(collectionId: number, productId: number, position = 0) {
  await db.insert(collectionProducts).values({ collectionId, productId, position });
  return { collection_id: collectionId, product_id: productId };
}

export async function addWishlistItem(customerId: number, productId: number) {
  let list = (await db.select().from(wishlists).where(eq(wishlists.customerId, customerId)).limit(1))[0];
  if (!list) {
    const created = await db
      .insert(wishlists)
      .values({ customerId, name: "Default", createdAt: nowIso() })
      .returning();
    list = requireInserted(created[0], "wishlist");
  }
  await db.insert(wishlistItems).values({ wishlistId: list.id, productId });
  return listWishlist(customerId);
}

export async function listWishlist(customerId: number) {
  const list = (await db.select().from(wishlists).where(eq(wishlists.customerId, customerId)).limit(1))[0];
  if (!list) {
    return { id: null, items: [] };
  }
  const items = await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, list.id));
  return { id: list.id, name: list.name, items };
}

export async function issueGiftCard(amount: string, rawCode: string) {
  const code = formatGiftCardCode(GIFT_CARD.CODE_PREFIX, rawCode);
  const row = await db
    .insert(giftCards)
    .values({ code, balanceCents: toMinorUnits(amount), createdAt: nowIso() })
    .returning();
  const card = requireInserted(row[0], "gift_card");
  return { id: card.id, code: card.code, balance: fromMinorUnits(card.balanceCents) };
}

export async function redeemCard(code: string, amountDue: string) {
  return withWriteTransaction(async () => {
    const card = (await db.select().from(giftCards).where(eq(giftCards.code, code.toUpperCase())).limit(1))[0];
    if (!card) {
      throw new ApiError(404, "gift_cards.not_found", "Gift card not found.");
    }
    const decision = redeemGiftCard({
      balanceMinor: card.balanceCents,
      amountDueMinor: toMinorUnits(amountDue),
      disabled: card.disabled,
      expiresAt: card.expiresAt,
      nowIso: nowIso(),
    });
    if (!decision.ok) {
      throw new ApiError(400, `gift_cards.${decision.reason}`, "Gift card cannot be redeemed.");
    }
    await db.update(giftCards).set({ balanceCents: decision.remainingMinor }).where(eq(giftCards.id, card.id));
    return { redeemed: fromMinorUnits(decision.redeemMinor), remaining: fromMinorUnits(decision.remainingMinor) };
  });
}

export async function createCustomerGroup(name: string, discountPercent: number) {
  const row = await db.insert(customerGroups).values({ name, discountPercent }).returning();
  return row[0];
}

export async function assignCustomerGroup(groupId: number, customerId: number) {
  await db.insert(customerGroupMembers).values({ groupId, customerId });
  return { group_id: groupId, customer_id: customerId };
}

export async function addAddress(input: {
  customer_id: number;
  kind?: string;
  line1: string;
  city?: string;
  postcode?: string;
  country?: string;
}) {
  const row = await db
    .insert(addresses)
    .values({
      customerId: input.customer_id,
      kind: input.kind ?? "shipping",
      line1: input.line1,
      city: input.city ?? "",
      postcode: input.postcode ?? "",
      country: input.country ?? "",
    })
    .returning();
  return row[0];
}

export async function listAddresses(customerId: number) {
  return db.select().from(addresses).where(eq(addresses.customerId, customerId));
}

export async function upsertCurrency(code: string, name: string, rate: number) {
  const existing = (await db.select().from(currencies).where(eq(currencies.code, code)).limit(1))[0];
  if (existing) {
    await db.update(currencies).set({ name, rate }).where(eq(currencies.code, code));
    return { code, name, rate };
  }
  await db.insert(currencies).values({ code, name, rate });
  return { code, name, rate };
}

export async function listCurrencies() {
  return db.select().from(currencies);
}

export async function searchCatalog(query: string) {
  const tokens = searchTokens(query);
  const firstToken = tokens[0];
  if (!firstToken) {
    return [];
  }
  const { ftsMatchQuery } = await import("../../domain/search");
  const { connector } = await import("../db/client");
  try {
    const fts = await connector.execute({
      sql: "SELECT rowid FROM products_fts WHERE products_fts MATCH ? LIMIT 50",
      args: [ftsMatchQuery(query)],
    });
    const ids = fts.rows.map((row) => Number((row as { rowid?: number }).rowid ?? (row as unknown[])[0]));
    if (ids.length) {
      const rows = await db.select().from(products);
      return rows
        .filter((row) => ids.includes(row.id))
        .map((row) => ({
          id: row.id,
          name: row.name,
          name_fa: row.nameFa,
          sku: row.sku,
          score: scoreMatch(`${row.name} ${row.nameFa} ${row.sku ?? ""} ${row.description}`, tokens),
        }))
        .sort((a, b) => b.score - a.score);
    }
  } catch {
    // LIKE fallback
  }
  const rows = await db
    .select()
    .from(products)
    .where(like(products.name, `%${sanitizeLikeTerm(firstToken)}%`));
  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      name_fa: row.nameFa,
      sku: row.sku,
      score: scoreMatch(`${row.name} ${row.nameFa} ${row.sku ?? ""} ${row.description} ${row.descriptionFa}`, tokens),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
}
