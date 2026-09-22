import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("base64");
}

export function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
