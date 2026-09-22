import { eq, sql } from "drizzle-orm";
import { fromMinorUnits, toMinorUnits } from "@/domain/money";
import { db } from "@/lib/db/client";
import { coupons, orders, users } from "@/lib/db/schema";
import { ApiError } from "@/lib/errors";
import { parseJsonColumn } from "@/lib/safety";
import { jsonOk } from "@/lib/http";
import { addNote, createRefund, listOrders, updateOrder } from "@/lib/services/order-admin";
import { serializeOrder } from "@/lib/services/orders";
import { nowIso } from "@/lib/time";
import type { ServiceContext } from "./service-context";

export async function handleSalesOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, nested, url, body } = ctx;

  if (resource === "orders" && !idOrAction) {
    if (method === "GET") {
      const result = await listOrders(url.searchParams);
      return jsonOk(result.data, result);
    }
  }

  if (resource === "orders" && idOrAction) {
    const id = Number(idOrAction);
    if (nested === "notes" && method === "POST") {
      const rec = body as { body: string; visible_to_customer?: boolean };
      return jsonOk(await addNote(id, rec.body, Boolean(rec.visible_to_customer)), { status: 201 });
    }
    if (nested === "refunds" && method === "POST") {
      const rec = body as { amount: string; reason?: string; restock?: boolean };
      return jsonOk(await createRefund(id, rec.amount, rec.reason ?? "", rec.restock !== false));
    }
    if (!nested) {
      if (method === "GET") return jsonOk(await serializeOrder(id));
      if (method === "PUT" || method === "PATCH") return jsonOk(await updateOrder(id, body as never));
    }
  }

  if (resource === "customers") {
    if (method === "GET" && !idOrAction) {
      const rows = await db.select().from(users).where(eq(users.role, "customer"));
      return jsonOk(
        rows.map((user) => ({
          id: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          username: user.username,
          billing: parseJsonColumn<object>(user.billingJson, {}),
          shipping: parseJsonColumn<object>(user.shippingJson, {}),
        })),
      );
    }
    if (method === "POST" && !idOrAction) {
      const rec = body as { email: string; first_name?: string; last_name?: string; username?: string };
      const row = await db
        .insert(users)
        .values({
          email: rec.email,
          passwordHash: "!",
          role: "customer",
          firstName: rec.first_name ?? "",
          lastName: rec.last_name ?? "",
          username: rec.username ?? rec.email.split("@")[0] ?? "customer",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })
        .returning();
      const user = row[0];
      if (!user) {
        throw new ApiError(500, "customers.write_failed", "Failed to persist customer.");
      }
      return jsonOk({ id: user.id, email: user.email, username: user.username }, { status: 201 });
    }
  }

  if (resource === "promotions") {
    if (method === "GET" && !idOrAction) {
      const rows = await db.select().from(coupons);
      return jsonOk(
        rows.map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discountType,
          amount:
            coupon.discountType === "percent"
              ? String(coupon.amountCentsOrPercent)
              : fromMinorUnits(coupon.amountCentsOrPercent),
          usage_count: coupon.usageCount,
          free_shipping: coupon.freeShipping,
        })),
      );
    }
    if (method === "POST" && !idOrAction) {
      const rec = body as { code: string; discount_type?: string; amount: string; free_shipping?: boolean };
      const discountType = rec.discount_type ?? "percent";
      const amount = discountType === "percent" ? Number(rec.amount) : toMinorUnits(rec.amount);
      const row = await db
        .insert(coupons)
        .values({
          code: rec.code.toLowerCase(),
          discountType,
          amountCentsOrPercent: amount,
          freeShipping: rec.free_shipping ?? false,
          createdAt: nowIso(),
        })
        .returning();
      return jsonOk(row[0], { status: 201 });
    }
  }

  if (resource === "reports" && idOrAction === "sales") {
    const agg = await db
      .select({
        total: sql<number>`coalesce(sum(total_cents),0)`,
        count: sql<number>`count(*)`,
      })
      .from(orders);
    return jsonOk({
      gross_sales: fromMinorUnits(Number(agg[0]?.total ?? 0)),
      order_count: Number(agg[0]?.count ?? 0),
      currency: "IRR",
    });
  }

  return null;
}
