import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/services/v1/[...path]/route";
import { GET as storefrontGet, POST as storefrontPost } from "@/app/api/storefront/v1/[...path]/route";
import { HTTP, KEY_PERMISSIONS, ROLES } from "@/config/constants";
import { hashSecret } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { apiKeys, products, users } from "@/lib/db/schema";
import { nowIso } from "@/lib/time";

const KEY_ID = "ak_checkout_stock_itest";
const KEY_SECRET = "as_checkout_stock_itest";
const START_QTY = 8;
const BUY_QTY = 2;

function opsAuth(): string {
  return `${HTTP.BASIC_PREFIX}${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
}

async function ops(method: string, path: string[], body?: unknown) {
  const request = new Request(`http://avaluna.test/api/services/v1/${path.join("/")}`, {
    method,
    headers: { authorization: opsAuth(), "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const params = Promise.resolve({ path });
  const response = method === "GET" ? await GET(request, { params }) : await POST(request, { params });
  return { status: response.status, json: (await response.json()) as Record<string, unknown> };
}

async function shop(method: string, path: string[], headers: Record<string, string>, body?: unknown) {
  const request = new Request(`http://avaluna.test/api/storefront/v1/${path.join("/")}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const params = Promise.resolve({ path });
  const response = method === "GET" ? await storefrontGet(request, { params }) : await storefrontPost(request, { params });
  return {
    status: response.status,
    json: (await response.json()) as Record<string, unknown>,
    cart: response.headers.get("X-Avaluna-Cart") ?? "",
    nonce: response.headers.get("X-Avaluna-Nonce") ?? "",
  };
}

describe("HTTP checkout decrements stock", () => {
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
        email: "checkout-stock@avaluna.test",
        passwordHash: "n/a",
        role: ROLES.ADMINISTRATOR,
        username: "checkout_stock_itest",
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
      description: "checkout stock itest",
      consumerKey: KEY_ID,
      secretHash: await hashSecret(KEY_SECRET),
      permissions: KEY_PERMISSIONS.READ_WRITE,
      createdAt: created,
    });
  });

  it("COD checkout takes inventory over HTTP", async () => {
    const created = await ops("POST", ["products"], {
      name: `Stock Tee ${Date.now()}`,
      name_fa: "تی‌شرت موجودی",
      slug: `stock-tee-${Date.now()}`,
      regular_price: "100000",
      status: "published",
      stock_quantity: START_QTY,
      track_inventory: true,
    });
    expect(created.status).toBe(201);
    const productId = Number((created.json as { id: number }).id);

    const empty = await shop("GET", ["cart"], {});
    expect(empty.status).toBe(200);
    const cartHeaders = { "x-avaluna-cart": empty.cart, "x-avaluna-nonce": empty.nonce };

    const added = await shop("POST", ["cart", "items"], cartHeaders, {
      product_id: productId,
      quantity: BUY_QTY,
    });
    expect(added.status).toBe(200);
    expect((added.json.items as unknown[]).length).toBe(1);

    const order = await shop(
      "POST",
      ["checkout"],
      cartHeaders,
      {
        payment_method: "cash_on_delivery",
        billing_address: { mobile: "09123456789", email: "buyer@avaluna.test" },
      },
    );
    expect(order.status).toBe(201);
    expect(order.json.status).toBe("on_hold");
    expect(Number(order.json.order_id)).toBeGreaterThan(0);

    const after = await ops("GET", ["products", String(productId)]);
    expect(after.status).toBe(200);
    const inventory = after.json.inventory as { quantity: number; status: string };
    expect(inventory.quantity).toBe(START_QTY - BUY_QTY);

    const row = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
    expect(row?.stockQuantity).toBe(START_QTY - BUY_QTY);
  });
});
