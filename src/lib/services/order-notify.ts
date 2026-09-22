import { eq } from "drizzle-orm";
import { renderTemplate } from "../../domain/templates";
import { parseJsonColumn } from "../safety";
import { db } from "../db/client";
import { messageOutbox, orders } from "../db/schema";
import { loadSettings, readMerged } from "../settings/store";
import { nowIso } from "../time";

export async function queueOrderNotice(
  orderId: number,
  template: "order_placed" | "order_paid" | "order_shipped",
  extra?: Record<string, string>,
) {
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) {
    return;
  }
  const map = await loadSettings();
  const billing = parseJsonColumn<Record<string, string>>(order.billingJson, {});
  const mobile = billing.mobile || billing.phone || "";
  const email = order.customerEmail;
  const vars = { number: order.number, amount: String(order.totalCents), tracking: extra?.tracking ?? "", ...extra };
  const fa = renderTemplate(template, "fa", vars);
  const en = renderTemplate(template, "en", vars);
  if (mobile) {
    await db.insert(messageOutbox).values({
      channel: "sms",
      provider: readMerged(map, "sms", "provider") || "kavenegar",
      recipient: mobile,
      subject: template,
      body: fa,
      createdAt: nowIso(),
    });
  }
  if (email && !email.endsWith("@avaluna.local")) {
    await db.insert(messageOutbox).values({
      channel: "email",
      provider: readMerged(map, "email", "provider") || "smtp",
      recipient: email,
      subject: en,
      body: fa,
      createdAt: nowIso(),
    });
  }
}
