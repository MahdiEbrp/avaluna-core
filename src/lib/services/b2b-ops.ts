import { eq } from "drizzle-orm";
import { draftChannel, canConvertDraft, isDraftStatus } from "../../domain/draft-orders";
import { volumeUnitMinor, type VolumeTier } from "../../domain/b2b";
import { toMinorUnits } from "../../domain/money";
import { parseJsonColumn } from "../safety";
import { db } from "../db/client";
import { companies, draftOrders, priceLists, quotes } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";

export async function createDraftOrder(input: {
  email: string;
  channel?: string;
  total?: string;
  notes?: string;
}) {
  const row = await db
    .insert(draftOrders)
    .values({
      channel: draftChannel(input.channel ?? "admin"),
      email: input.email,
      totalCents: toMinorUnits(input.total ?? "0"),
      notes: input.notes ?? "",
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "draft_order");
}

export async function convertDraftOrder(id: number) {
  const draft = (await db.select().from(draftOrders).where(eq(draftOrders.id, id)).limit(1))[0];
  if (!draft || !isDraftStatus(draft.status) || !canConvertDraft(draft.status)) {
    throw new ApiError(409, "drafts.cannot_convert", "Draft cannot be converted.");
  }
  await db.update(draftOrders).set({ status: "completed" }).where(eq(draftOrders.id, id));
  return { ...draft, status: "completed" };
}

export async function createCompany(input: { name: string; net_days?: number; credit_limit?: string }) {
  const row = await db
    .insert(companies)
    .values({
      name: input.name,
      netDays: input.net_days ?? 30,
      creditLimitCents: toMinorUnits(input.credit_limit ?? "0"),
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "company");
}

export async function createQuote(input: { company_id: number; total: string }) {
  const row = await db
    .insert(quotes)
    .values({
      companyId: input.company_id,
      totalCents: toMinorUnits(input.total),
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "quote");
}

export async function createPriceList(input: { name: string; tiers: VolumeTier[] }) {
  const row = await db
    .insert(priceLists)
    .values({ name: input.name, tiersJson: JSON.stringify(input.tiers), createdAt: nowIso() })
    .returning();
  return requireInserted(row[0], "price_list");
}

export async function quoteVolumePrice(listId: number, quantity: number, listUnit: string) {
  const list = (await db.select().from(priceLists).where(eq(priceLists.id, listId)).limit(1))[0];
  if (!list) {
    throw new ApiError(404, "price_lists.not_found", "Price list not found.");
  }
  const tiers = parseJsonColumn<VolumeTier[]>(list.tiersJson, []);
  return { unit_minor: volumeUnitMinor(quantity, toMinorUnits(listUnit), tiers) };
}

export async function listCompanies() {
  return db.select().from(companies);
}

export async function listDrafts() {
  return db.select().from(draftOrders);
}
