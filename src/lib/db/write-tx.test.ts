import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db, withWriteTransaction } from "./client";
import { migrate } from "./migrate";
import { tags } from "./schema";

describe("drizzle libSQL write transaction", () => {
  beforeAll(async () => {
    await migrate();
  });

  it("commits inserts and rolls back on throw", async () => {
    const stamp = Date.now();
    const kept = `tx-keep-${stamp}`;
    const dropped = `tx-drop-${stamp}`;

    await withWriteTransaction(async () => {
      await db.insert(tags).values({ name: kept, slug: kept });
    });
    const committed = (await db.select().from(tags).where(eq(tags.slug, kept)).limit(1))[0];
    expect(committed?.name).toBe(kept);

    await expect(
      withWriteTransaction(async () => {
        await db.insert(tags).values({ name: dropped, slug: dropped });
        throw new Error("tx.rollback_probe");
      }),
    ).rejects.toThrow("tx.rollback_probe");

    const rolled = (await db.select().from(tags).where(eq(tags.slug, dropped)).limit(1))[0];
    expect(rolled).toBeUndefined();
  });
});
