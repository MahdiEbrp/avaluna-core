import { eq } from "drizzle-orm";
import { submitMoadianInvoice } from "../../adapters/tax/moadian";
import { db } from "../db/client";
import { moadianSubmissions, orders } from "../db/schema";
import { isYes, loadSettings, readMerged } from "../settings/store";
import { nowIso } from "../time";

export async function submitOrderToMoadian(orderId: number) {
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) {
    return null;
  }
  const map = await loadSettings();
  const result = await submitMoadianInvoice({
    enabled: isYes(readMerged(map, "legal", "moadian_enabled")),
    apiUrl: readMerged(map, "legal", "moadian_api_url"),
    apiKey: readMerged(map, "legal", "moadian_api_key"),
    invoice: {
      number: order.number,
      createdAt: order.createdAt,
      totalRial: order.totalCents,
      taxRial: order.taxTotalCents,
      nationalId: readMerged(map, "legal", "national_id"),
      economicCode: readMerged(map, "legal", "economic_code"),
    },
  });
  if (!result) {
    return null;
  }
  const row = await db
    .insert(moadianSubmissions)
    .values({ orderId, status: "submitted", reference: result.reference, createdAt: nowIso() })
    .returning();
  return row[0] ?? null;
}
