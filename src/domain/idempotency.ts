export type IdempotencyDecision = "accept" | "replay" | "conflict";

export function decideIdempotency(
  storedFingerprint: string | undefined,
  incomingFingerprint: string,
): IdempotencyDecision {
  if (!storedFingerprint) {
    return "accept";
  }
  return storedFingerprint === incomingFingerprint ? "replay" : "conflict";
}

import { IDEMPOTENCY } from "../config/constants";

export function isIdempotencyKeyValid(key: string): boolean {
  return (
    key.length >= IDEMPOTENCY.MIN_KEY_LENGTH &&
    key.length <= IDEMPOTENCY.MAX_KEY_LENGTH &&
    /^[\w.:-]+$/.test(key)
  );
}
