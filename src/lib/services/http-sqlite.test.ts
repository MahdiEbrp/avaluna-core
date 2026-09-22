import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/services/v1/[...path]/route";
import { GET as storefrontGet } from "@/app/api/storefront/v1/[...path]/route";
import { HTTP, KEY_PERMISSIONS, ROLES } from "@/config/constants";
import { hashSecret } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { apiKeys, cronJobs, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";

const KEY_ID = "ak_http_sqlite_itest";
const KEY_SECRET = "as_http_sqlite_itest";

function opsRequest(method: string, path: string[], body?: unknown): Request {
  const suffix = path.join("/");
  return new Request(`http://avaluna.test/api/services/v1/${suffix}`, {
    method,
    headers: {
      authorization: `${HTTP.BASIC_PREFIX}${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function ops(method: string, path: string[], body?: unknown) {
  const request = opsRequest(method, path, body);
  const params = Promise.resolve({ path });
  const response = method === "GET" ? await GET(request, { params }) : await POST(request, { params });
  const json = (await response.json()) as Record<string, unknown>;
  return { status: response.status, json };
}

describe("HTTP + SQLite services", () => {
  beforeAll(async () => {
    await migrate();
    const existing = (await db.select().from(apiKeys).where(eq(apiKeys.consumerKey, KEY_ID)).limit(1))[0];
    if (existing) {
      return;
    }
    const created = nowIso();
    const user = await db
      .insert(users)
      .values({
        email: "http-sqlite@avaluna.test",
        passwordHash: "n/a",
        role: ROLES.ADMINISTRATOR,
        username: "http_sqlite_itest",
        createdAt: created,
        updatedAt: created,
      })
      .returning();
    const owner = user[0];
    if (!owner) {
      throw new Error("database.user_insert_failed");
    }
    await db.insert(apiKeys).values({
      userId: owner.id,
      description: "http sqlite itest",
      consumerKey: KEY_ID,
      secretHash: await hashSecret(KEY_SECRET),
      permissions: KEY_PERMISSIONS.READ_WRITE,
      createdAt: created,
    });
  });

  it("health, catalog, and cron last_run_at are UTC ISO", async () => {
    const health = await ops("GET", ["health"]);
    expect(health.status).toBe(200);
    expect(health.json.status).toBe("ok");

    const created = await ops("POST", ["products"], {
      name: `HTTP SQLite Tee ${Date.now()}`,
      name_fa: "تی‌شرت تست",
      slug: `http-sqlite-tee-${Date.now()}`,
      regular_price: "250000",
      status: "published",
    });
    expect(created.status).toBe(201);
    const product = created.json as { id: number; created_at: string };
    expect(product.id).toBeGreaterThan(0);
    expect(product.created_at).toContain("Z");

    const listed = await ops("GET", ["products"]);
    expect(listed.status).toBe(200);

    const shop = await storefrontGet(new Request("http://avaluna.test/api/storefront/v1/products"), {
      params: Promise.resolve({ path: ["products"] }),
    });
    expect(shop.status).toBe(200);

    const cron = await ops("POST", ["cron-jobs"], {
      name: "itest-outbox",
      expression: "0 0 * * *",
      handler: "noop.none",
    });
    expect(cron.status).toBe(201);
    const job = cron.json as { id: number };
    const ran = await ops("POST", ["cron-jobs", String(job.id)]);
    expect(ran.status).toBe(200);
    expect(String((ran.json as { ran_at: string }).ran_at)).toContain("Z");
    const row = (await db.select().from(cronJobs).where(eq(cronJobs.id, job.id)).limit(1))[0];
    expect(row?.lastRunAt).toContain("Z");
  });
});
