import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { loadRuntimeSecret } from "../runtime-secret";

const PREFIX = "enc.v1.";

function keyBytes(): Buffer {
  const raw = loadRuntimeSecret("AVALUNA_SETTINGS_SECRET", "settings");
  return createHash("sha256").update(raw).digest();
}

export function sealSecret(plain: string): string {
  if (!plain || plain.startsWith(PREFIX)) {
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function openSecret(value: string): string {
  if (!value.startsWith(PREFIX)) {
    return value;
  }
  const parts = value.slice(PREFIX.length).split(".");
  if (parts.length !== 3) {
    return "";
  }
  const [ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(ivB64 ?? "", "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64 ?? "", "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64 ?? "", "base64url")), decipher.final()]).toString("utf8");
}

export function maskSecret(value: string): string {
  if (!value) {
    return "";
  }
  return "********";
}

export function isSealed(value: string): boolean {
  return value.startsWith(PREFIX);
}
