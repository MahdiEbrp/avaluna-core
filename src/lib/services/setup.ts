import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { KEY_PERMISSIONS, ROLES, SECURITY } from "../../config/constants";
import { parseSetupDraft, type SetupDraft } from "../../domain/setup-wizard";
import { hashSecret } from "../auth";
import { db } from "../db/client";
import { apiKeys, settings, users } from "../db/schema";
import { ApiError } from "../errors";
import { isYes } from "../settings/store";
import { sealSecret } from "../settings/secrets";
import { nowIso } from "../time";

async function upsertSetting(group: string, id: string, label: string, type: string, value: string) {
  const existing = (
    await db
      .select()
      .from(settings)
      .where(and(eq(settings.group, group), eq(settings.id, id)))
      .limit(1)
  )[0];
  if (existing) {
    await db.update(settings).set({ value }).where(and(eq(settings.group, group), eq(settings.id, id)));
    return;
  }
  await db.insert(settings).values({ group, id, label, type, value });
}

export async function isSetupComplete(): Promise<boolean> {
  try {
    const rows = await db.select().from(settings);
    const flag = rows.find((row) => row.group === "setup" && row.id === "completed");
    return Boolean(flag && isYes(flag.value));
  } catch {
    return false;
  }
}

export async function completeSetup(input: unknown): Promise<{
  initialized: true;
  key_id: string;
  key_secret: string;
}> {
  if (await isSetupComplete()) {
    throw new ApiError(409, "setup.already_complete", "Store is already initialized.");
  }
  const draft: SetupDraft = parseSetupDraft(input);
  const created = nowIso();
  const username = draft.operator_email.split("@")[0] || "operator";
  const passwordHash = await bcrypt.hash(draft.operator_password, SECURITY.PASSWORD_HASH_ROUNDS);
  const inserted = await db
    .insert(users)
    .values({
      email: draft.operator_email,
      passwordHash,
      role: ROLES.ADMINISTRATOR,
      firstName: draft.operator_name,
      lastName: "",
      username,
      createdAt: created,
      updatedAt: created,
    })
    .returning();
  const owner = inserted[0];
  if (!owner) {
    throw new ApiError(500, "setup.operator_failed", "Operator account was not created.");
  }
  const keyId = `ak_${nanoid(SECURITY.API_KEY_ID_BYTES)}`;
  const keySecret = `as_${nanoid(SECURITY.API_SECRET_BYTES)}`;
  await db.insert(apiKeys).values({
    userId: owner.id,
    description: "Setup wizard key",
    consumerKey: keyId,
    secretHash: await hashSecret(keySecret),
    permissions: KEY_PERMISSIONS.READ_WRITE,
    createdAt: created,
  });
  const direction = draft.locale === "fa-IR" ? "rtl" : "ltr";
  await upsertSetting("general", "store_name", "Store name", "text", draft.store_name);
  await upsertSetting("general", "store_name_fa", "Store name (Persian)", "text", draft.store_name_fa);
  await upsertSetting("general", "city", "City", "text", draft.city);
  await upsertSetting("general", "locale", "Locale", "text", draft.locale);
  await upsertSetting("general", "direction", "Text direction", "select", direction);
  await upsertSetting("payments", "sandbox", "Sandbox gateways", "boolean", draft.sandbox ? "yes" : "no");
  if (draft.zarinpal_merchant_id) {
    await upsertSetting(
      "payments",
      "zarinpal_merchant_id",
      "ZarinPal merchant UUID",
      "secret",
      sealSecret(draft.zarinpal_merchant_id),
    );
  }
  if (draft.enamad_code) {
    await upsertSetting("legal", "enamad_code", "E-Namad code", "text", draft.enamad_code);
  }
  await upsertSetting("setup", "completed", "Setup wizard completed", "boolean", "yes");
  return { initialized: true, key_id: keyId, key_secret: keySecret };
}
