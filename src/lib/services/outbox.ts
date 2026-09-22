import { eq } from "drizzle-orm";
import { getEmailAdapter, getSmsAdapter } from "../../adapters/registry";
import { db } from "../db/client";
import { messageOutbox } from "../db/schema";
import { loadSettings } from "../settings/store";

export async function drainOutbox(limit = 20) {
  const map = await loadSettings();
  const rows = (await db.select().from(messageOutbox)).filter((row) => row.status === "queued").slice(0, limit);
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      if (row.channel === "sms") {
        const id = (await getSmsAdapter(map).send({ toE164: row.recipient, body: row.body })).providerMessageId;
        await db.update(messageOutbox).set({ status: `sent:${id}` }).where(eq(messageOutbox.id, row.id));
      } else {
        const id = (await getEmailAdapter(map).send({ to: row.recipient, subject: row.subject, body: row.body }))
          .providerMessageId;
        await db.update(messageOutbox).set({ status: `sent:${id}` }).where(eq(messageOutbox.id, row.id));
      }
      sent += 1;
    } catch {
      await db.update(messageOutbox).set({ status: "failed" }).where(eq(messageOutbox.id, row.id));
      failed += 1;
    }
  }
  return { sent, failed, scanned: rows.length };
}
