export const SUBSCRIPTION_STATUSES = ["trial", "active", "paused", "past_due", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  trial: ["active", "cancelled"],
  active: ["paused", "past_due", "cancelled"],
  paused: ["active", "cancelled"],
  past_due: ["active", "cancelled"],
  cancelled: ["cancelled"],
};

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
}

export function canTransitionSubscription(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function dunningBackoffHours(attempt: number): number {
  if (attempt <= 1) return 24;
  if (attempt === 2) return 72;
  return 168;
}

export function dunningExhausted(attempt: number, maxAttempts: number): boolean {
  return attempt >= maxAttempts;
}

export function nextBillingAtMs(fromMs: number, intervalDays: number): number {
  return fromMs + Math.max(1, intervalDays) * 86_400_000;
}
