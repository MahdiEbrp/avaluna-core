import { eq } from "drizzle-orm";
import { SECURITY } from "../config/constants";
import { signPayload } from "../domain/hmac";
import { db } from "./db/client";
import { webhookDeliveries, webhooks } from "./db/schema";
import { nowIso } from "./time";

export async function dispatchWebhook(topic: string, resource: unknown): Promise<void> {
  const hooks = await db.select().from(webhooks).where(eq(webhooks.status, "active"));
  const matching = hooks.filter((hook) => hook.topic === topic);
  const body = JSON.stringify({ topic, resource, occurred_at: nowIso() });
  await Promise.all(
    matching.map(async (hook) => {
      if (!hook.deliveryUrl.startsWith("https://")) {
        return;
      }
      const signature = signPayload(hook.secret, body);
      try {
        const response = await fetch(hook.deliveryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Avaluna-Topic": topic,
            "X-Avaluna-Signature": signature,
          },
          body,
          signal: AbortSignal.timeout(SECURITY.WEBHOOK_TIMEOUT_MS),
        });
        await db.insert(webhookDeliveries).values({
          webhookId: hook.id,
          requestBody: body,
          responseCode: response.status,
          success: response.ok,
          createdAt: nowIso(),
        });
        if (!response.ok) {
          const failures = hook.failureCount + 1;
          await db
            .update(webhooks)
            .set({
              failureCount: failures,
              status: failures >= SECURITY.WEBHOOK_DISABLE_AFTER_FAILURES ? "disabled" : hook.status,
            })
            .where(eq(webhooks.id, hook.id));
        }
      } catch {
        await db.insert(webhookDeliveries).values({
          webhookId: hook.id,
          requestBody: body,
          responseCode: 0,
          success: false,
          createdAt: nowIso(),
        });
      }
    }),
  );
}
