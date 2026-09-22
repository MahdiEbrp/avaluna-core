import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { SECURITY } from "@/config/constants";
import { legalSettingError } from "@/domain/legal-validate";
import { SETTING_DEFINITIONS, settingsForGroup } from "@/domain/settings-catalog";
import { hashSecret } from "@/lib/auth";
import { auditEvents } from "@/lib/db/schema";
import { maskSecret, sealSecret } from "@/lib/settings/secrets";
import { db } from "@/lib/db/client";
import { apiKeys, paymentGateways, settings, shippingMethods, shippingZones, taxRates, webhooks } from "@/lib/db/schema";
import { ApiError } from "@/lib/errors";
import { jsonOk } from "@/lib/http";
import { assertSafeWebhookUrl, parseJsonObject } from "@/lib/safety";
import { nowIso } from "@/lib/time";
import type { ServiceContext } from "./service-context";

export async function handlePlatformOps(ctx: ServiceContext): Promise<Response | null> {
  const { method, resource, idOrAction, nested, body, auth } = ctx;

  if (resource === "settings") {
    if (idOrAction === "catalog" && method === "GET") {
      return jsonOk(SETTING_DEFINITIONS);
    }
    const rows = await db.select().from(settings);
    if (!idOrAction) {
      const groups = [...new Set([...rows.map((row) => row.group), ...SETTING_DEFINITIONS.map((row) => row.group)])];
      return jsonOk(groups.map((group) => ({ id: group, label: group })));
    }
    if (method === "PUT") {
      const rec = parseJsonObject(body);
      const settingId = String(rec.id ?? "");
      const value = String(rec.value ?? "");
      const def = settingsForGroup(idOrAction).find((row) => row.id === settingId);
      if (!def) {
        throw new ApiError(400, "settings.unknown", "Unknown setting id for this group.");
      }
      const legal = legalSettingError(settingId, value);
      if (legal) {
        throw new ApiError(400, legal, "Legal identifier is invalid.");
      }
      const stored = def.type === "secret" ? sealSecret(value) : value;
      const existing = rows.find((row) => row.group === idOrAction && row.id === settingId);
      if (existing) {
        await db
          .update(settings)
          .set({ value: stored })
          .where(and(eq(settings.group, idOrAction), eq(settings.id, settingId)));
      } else {
        await db
          .insert(settings)
          .values({ group: idOrAction, id: settingId, label: def.label, type: def.type, value: stored });
      }
      await db.insert(auditEvents).values({
        actorId: auth.userId,
        action: "settings.update",
        entity: "settings",
        entityId: `${idOrAction}.${settingId}`,
        createdAt: nowIso(),
      });
      return jsonOk({ ...def, value: def.type === "secret" ? maskSecret(value) : value });
    }
    const merged = settingsForGroup(idOrAction).map((def) => {
      const hit = rows.find((row) => row.group === def.group && row.id === def.id);
      const row = hit ?? def;
      return def.type === "secret" ? { ...row, value: maskSecret(row.value) } : row;
    });
    return jsonOk(merged.length ? merged : rows.filter((row) => row.group === idOrAction));
  }

  if (resource === "shipping-zones") {
    if (method === "GET" && !idOrAction) return jsonOk(await db.select().from(shippingZones));
    if (method === "POST" && !idOrAction) {
      const rec = body as { name: string };
      const row = await db.insert(shippingZones).values({ name: rec.name }).returning();
      return jsonOk(row[0], { status: 201 });
    }
    if (nested === "methods") {
      return jsonOk(await db.select().from(shippingMethods).where(eq(shippingMethods.zoneId, Number(idOrAction))));
    }
  }

  if (resource === "tax-rates") {
    if (method === "GET") return jsonOk(await db.select().from(taxRates));
    if (method === "POST") {
      const rec = body as { country?: string; rate: string; name: string; class?: string };
      const row = await db
        .insert(taxRates)
        .values({
          country: rec.country ?? "",
          rate: Number(rec.rate),
          name: rec.name,
          taxClass: rec.class ?? "standard",
        })
        .returning();
      return jsonOk(row[0], { status: 201 });
    }
  }

  if (resource === "payment-methods") {
    const rows = await db.select().from(paymentGateways);
    if (!idOrAction) return jsonOk(rows);
    const gateway = rows.find((row) => row.id === idOrAction);
    if (!gateway) throw new ApiError(404, "payments.not_found", "Payment method not found.");
    if (method === "PUT") {
      const rec = body as { enabled?: boolean };
      await db
        .update(paymentGateways)
        .set({ enabled: rec.enabled ?? gateway.enabled })
        .where(eq(paymentGateways.id, idOrAction));
      return jsonOk({ ...gateway, enabled: rec.enabled ?? gateway.enabled });
    }
    return jsonOk(gateway);
  }

  if (resource === "webhooks") {
    if (method === "GET") {
      const rows = await db.select().from(webhooks);
      return jsonOk(rows.map(({ secret: _secret, ...rest }) => rest));
    }
    if (method === "POST") {
      const rec = parseJsonObject(body);
      const deliveryUrl = String(rec.delivery_url ?? "");
      assertSafeWebhookUrl(deliveryUrl);
      const row = await db
        .insert(webhooks)
        .values({
          name: String(rec.name ?? ""),
          topic: String(rec.topic ?? ""),
          deliveryUrl,
          secret: typeof rec.secret === "string" ? rec.secret : nanoid(SECURITY.API_SECRET_BYTES),
          createdAt: nowIso(),
        })
        .returning();
      const created = row[0];
      if (!created) {
        throw new ApiError(500, "webhooks.create_failed", "Webhook was not created.");
      }
      const { secret: _s, ...safe } = created;
      return jsonOk(safe, { status: 201 });
    }
  }

  if (resource === "api-keys" && method === "POST") {
    const rec = body as { description: string; permissions?: string; user_id?: number };
    const keyId = `ak_${nanoid(SECURITY.API_KEY_ID_BYTES)}`;
    const keySecret = `as_${nanoid(SECURITY.API_SECRET_BYTES)}`;
    await db.insert(apiKeys).values({
      userId: rec.user_id ?? auth.userId,
      description: rec.description,
      consumerKey: keyId,
      secretHash: await hashSecret(keySecret),
      permissions: rec.permissions ?? "read_write",
      createdAt: nowIso(),
    });
    return jsonOk({ key_id: keyId, key_secret: keySecret }, { status: 201 });
  }

  return null;
}
