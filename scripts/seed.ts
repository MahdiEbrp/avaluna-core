import bcrypt from "bcryptjs";
import { LOG, SECURITY } from "../src/config/constants";
import { db, sqlite } from "../src/lib/db/client";
import { migrate } from "../src/lib/db/migrate";
import { SETTING_DEFINITIONS } from "../src/domain/settings-catalog";
import {
  apiKeys,
  categories,
  cronJobs,
  coupons,
  currencies,
  giftCards,
  locations,
  paymentGateways,
  productCategories,
  products,
  settings,
  shippingMethods,
  shippingZones,
  taxRates,
  users,
} from "../src/lib/db/schema";
import { nowIso } from "../src/lib/time";

async function main() {
  await migrate();
  const created = nowIso();
  const admin = await db
    .insert(users)
    .values({
      email: "ops@avaluna.local",
      passwordHash: await bcrypt.hash("ChangeMeNow!", SECURITY.PASSWORD_HASH_ROUNDS),
      role: "administrator",
      firstName: "Avaluna",
      lastName: "Operator",
      username: "avaluna",
      createdAt: created,
      updatedAt: created,
    })
    .returning();
  const production = process.env.NODE_ENV === "production";
  const keyId = production ? `ak_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}` : "ak_demo_local_only";
  const keySecret = production ? `as_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}` : "as_demo_local_only";
  await db.insert(apiKeys).values({
    userId: admin[0]!.id,
    description: "Local demo key — rotate before any public deploy",
    consumerKey: keyId,
    secretHash: await bcrypt.hash(keySecret, SECURITY.API_SECRET_HASH_ROUNDS),
    permissions: "read_write",
    createdAt: created,
  });
  const category = await db
    .insert(categories)
    .values({ name: "Apparel", slug: "apparel", description: "Clothing" })
    .returning();
  const tee = await db
    .insert(products)
    .values({
      name: "Classic Tee",
      nameFa: "تی‌شرت کلاسیک",
      slug: "classic-tee",
      slugFa: "تیشرت-کلاسیک",
      type: "simple",
      status: "publish",
      description: "Soft cotton t-shirt.",
      descriptionFa: "تی‌شرت نخی روزمره.",
      shortDescription: "Everyday tee",
      sku: "TEE-001",
      regularPriceCents: 2_499_000,
      salePriceCents: 1_999_000,
      onSale: true,
      manageStock: true,
      stockQuantity: 50,
      stockStatus: "instock",
      createdAt: created,
      updatedAt: created,
    })
    .returning();
  await db.insert(productCategories).values({ productId: tee[0]!.id, categoryId: category[0]!.id });
  await db.insert(coupons).values({
    code: "welcome10",
    discountType: "percent",
    amountCentsOrPercent: 10,
    createdAt: created,
  });
  const zone = await db.insert(shippingZones).values({ name: "IR", order: 0 }).returning();
  await db.insert(shippingMethods).values([
    { zoneId: zone[0]!.id, methodId: "post_iran", title: "پست پیشتاز", costCents: 35000, enabled: true },
    { zoneId: zone[0]!.id, methodId: "tipax", title: "تیپاکس", costCents: 80000, enabled: true },
    { zoneId: zone[0]!.id, methodId: "chapar", title: "چاپار", costCents: 75000, enabled: true },
    { zoneId: zone[0]!.id, methodId: "alopeyk", title: "الوپیک", costCents: 45000, enabled: true },
    {
      zoneId: zone[0]!.id,
      methodId: "free_shipping",
      title: "ارسال رایگان",
      costCents: 0,
      minAmountCents: 5_000_000,
      enabled: true,
    },
    { zoneId: zone[0]!.id, methodId: "local_pickup", title: "تحویل حضوری", costCents: 0, enabled: true },
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
  await db.insert(giftCards).values({
    code: "GIFT-DEMO50",
    balanceCents: 5000,
    createdAt: created,
  });
  await db.insert(settings).values([...SETTING_DEFINITIONS]);
  await db.insert(cronJobs).values({
    name: "log-cleanup",
    expression: LOG.CLEANUP_CRON,
    handler: LOG.CLEANUP_HANDLER,
    nextRunAtMs: Date.now(),
    createdAt: created,
  });
  console.log("Avaluna seeded.");
  console.log("Service key_id:", keyId);
  console.log("Service key_secret:", keySecret);
  sqlite.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
