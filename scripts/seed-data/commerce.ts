import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { LOG, SECURITY } from "../../src/config/constants";
import { db } from "../../src/lib/db/client";
import {
  apiKeys,
  coupons,
  cronJobs,
  currencies,
  giftCards,
  locations,
  paymentGateways,
  settings,
  shippingMethods,
  shippingZones,
  taxRates,
  users,
} from "../../src/lib/db/schema";
import { SETTING_DEFINITIONS } from "../../src/domain/settings-catalog";
import { mustRow } from "./util";

export const ADMIN_EMAIL = "ops@avaluna.local";

export async function findAdmin() {
  return (await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1))[0];
}

export async function seedIdentity(created: string) {
  const admin = await db
    .insert(users)
    .values({
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash("ChangeMeNow!", SECURITY.PASSWORD_HASH_ROUNDS),
      role: "administrator",
      firstName: "Avaluna",
      lastName: "Operator",
      username: "avaluna",
      createdAt: created,
      updatedAt: created,
    })
    .returning();
  return mustRow(admin[0], "admin");
}

export async function seedApiKey(userId: number, created: string) {
  const production = process.env.NODE_ENV === "production";
  const keyId = production ? `ak_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}` : "ak_demo_local_only";
  const keySecret = production ? `as_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}` : "as_demo_local_only";
  await db.insert(apiKeys).values({
    userId,
    description: "Local demo key — rotate before any public deploy",
    consumerKey: keyId,
    secretHash: await bcrypt.hash(keySecret, SECURITY.API_SECRET_HASH_ROUNDS),
    permissions: "read_write",
    createdAt: created,
  });
  return { keyId, keySecret };
}

export async function seedCommerce(created: string) {
  await db.insert(coupons).values({
    code: "welcome10",
    discountType: "percent",
    amountCentsOrPercent: 10,
    createdAt: created,
  });
  const zone = await db.insert(shippingZones).values({ name: "IR", order: 0 }).returning();
  const zoneRow = mustRow(zone[0], "zone");
  await db.insert(shippingMethods).values([
    { zoneId: zoneRow.id, methodId: "post_iran", title: "پست پیشتاز", costCents: 35000, enabled: true },
    { zoneId: zoneRow.id, methodId: "tipax", title: "تیپاکس", costCents: 80000, enabled: true },
    { zoneId: zoneRow.id, methodId: "chapar", title: "چاپار", costCents: 75000, enabled: true },
    { zoneId: zoneRow.id, methodId: "alopeyk", title: "الوپیک", costCents: 45000, enabled: true },
    {
      zoneId: zoneRow.id,
      methodId: "free_shipping",
      title: "ارسال رایگان",
      costCents: 0,
      minAmountCents: 5_000_000,
      enabled: true,
    },
    { zoneId: zoneRow.id, methodId: "local_pickup", title: "تحویل حضوری", costCents: 0, enabled: true },
  ]);
  await db.insert(taxRates).values({ country: "IR", rate: 9, name: "مالیات بر ارزش افزوده", taxClass: "standard" });
  await db.insert(paymentGateways).values([
    { id: "zarinpal", title: "زرین‌پال", methodTitle: "ZarinPal", enabled: true },
    { id: "idpay", title: "آیدی‌پی", methodTitle: "IDPay", enabled: false },
    { id: "nextpay", title: "نکست‌پی", methodTitle: "NextPay", enabled: false },
    { id: "zibal", title: "زیبال", methodTitle: "Zibal", enabled: false },
    { id: "payping", title: "پی‌پینگ", methodTitle: "PayPing", enabled: false },
    { id: "sadad", title: "سداد", methodTitle: "Sadad", enabled: false },
    { id: "behpardakht", title: "به‌پرداخت ملت", methodTitle: "Behpardakht", enabled: false },
    { id: "card_to_card", title: "کارت به کارت", methodTitle: "Card to card", enabled: true },
    { id: "cash_on_delivery", title: "پرداخت در محل", methodTitle: "COD", enabled: true },
  ]);
  await db.insert(locations).values({ name: "انبار تهران", code: "IR-THR", country: "IR", isDefault: true });
  await db.insert(currencies).values([
    { code: "IRR", name: "Iranian Rial", rate: 1 },
    { code: "IRT", name: "Toman (display)", rate: 0.1 },
  ]);
  await db.insert(giftCards).values({ code: "GIFT-DEMO50", balanceCents: 5000, createdAt: created });
  await db.insert(settings).values([...SETTING_DEFINITIONS]);
  await db.insert(cronJobs).values({
    name: "log-cleanup",
    expression: LOG.CLEANUP_CRON,
    handler: LOG.CLEANUP_HANDLER,
    nextRunAtMs: Date.now(),
    createdAt: created,
  });
}
