import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { HTTP, KEY_PERMISSIONS, SECURITY } from "../config/constants";
import { db } from "./db/client";
import { apiKeys, users } from "./db/schema";
import { ApiError } from "./errors";
import { nowIso } from "./time";

export type Permission = "read" | "write" | "read_write";
export type AuthContext = {
  userId: number;
  role: string;
  permissions: Permission;
};

const PERMISSIONS = new Set<string>(Object.values(KEY_PERMISSIONS));

function asPermission(value: string): Permission {
  if (PERMISSIONS.has(value)) {
    return value as Permission;
  }
  return KEY_PERMISSIONS.READ;
}

let dummyHash: string | null = null;

async function timingSafeReject(secret: string): Promise<never> {
  dummyHash ??= await bcrypt.hash("avaluna-timing-pad", SECURITY.API_SECRET_HASH_ROUNDS);
  await bcrypt.compare(secret, dummyHash);
  throw new ApiError(401, "auth.invalid_key", "Unknown API key.");
}

function parseBasic(header: string | null): { user: string; pass: string } | null {
  if (!header?.startsWith(HTTP.BASIC_PREFIX)) {
    return null;
  }
  const decoded = Buffer.from(header.slice(HTTP.BASIC_PREFIX.length), "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx < 0) {
    return null;
  }
  return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
}

export async function authenticateService(request: Request, needWrite: boolean): Promise<AuthContext> {
  const basic = parseBasic(request.headers.get("authorization"));
  const keyId = basic?.user;
  const keySecret = basic?.pass;
  if (!keyId || !keySecret) {
    throw new ApiError(401, "auth.missing_credentials", "API key is required in the Authorization header.");
  }

  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.consumerKey, keyId), isNull(apiKeys.revokedAt)))
    .limit(1);
  const key = rows[0];
  if (!key) {
    await timingSafeReject(keySecret);
  }

  const matches = await bcrypt.compare(keySecret, key.secretHash);
  if (!matches) {
    throw new ApiError(401, "auth.invalid_secret", "Invalid API secret.");
  }

  if (needWrite && key.permissions === KEY_PERMISSIONS.READ) {
    throw new ApiError(403, "auth.forbidden", "This key cannot modify resources.");
  }

  const user = (await db.select().from(users).where(eq(users.id, key.userId)).limit(1))[0];
  if (!user) {
    throw new ApiError(401, "auth.key_orphaned", "API key owner no longer exists.");
  }

  await db.update(apiKeys).set({ lastUsedAt: nowIso() }).where(eq(apiKeys.id, key.id));

  return {
    userId: user.id,
    role: user.role,
    permissions: asPermission(key.permissions),
  };
}

export async function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, SECURITY.API_SECRET_HASH_ROUNDS);
}
