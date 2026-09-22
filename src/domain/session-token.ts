import { createHmac, timingSafeEqual } from "node:crypto";

export function signSession(customerId: number, expiresAtMs: number, secret: string): string {
  if (!secret) {
    throw new Error("session.secret_required");
  }
  const payload = `${customerId}.${expiresAtMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function readSession(token: string | null, nowMs: number, secret: string): number | null {
  if (!token || !secret) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [idRaw, expRaw, sig] = parts;
  const payload = `${idRaw}.${expRaw}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig ?? "", "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  const expires = Number(expRaw);
  if (!Number.isFinite(expires) || expires < nowMs) {
    return null;
  }
  const id = Number(idRaw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
