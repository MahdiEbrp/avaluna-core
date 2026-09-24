import { expect, test } from "@playwright/test";

const API = "/api/storefront/v1";

function asList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "data" in body) {
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

test.describe("seed catalog", () => {
  test("products ≥24 and categories ≥8", async ({ request }) => {
    const productsRes = await request.get(`${API}/products?page_size=100`);
    expect(productsRes.ok()).toBeTruthy();
    const products = asList(await productsRes.json());
    expect(products.length).toBeGreaterThanOrEqual(24);

    const catsRes = await request.get(`${API}/products/categories`);
    expect(catsRes.ok()).toBeTruthy();
    expect(asList(await catsRes.json()).length).toBeGreaterThanOrEqual(8);
  });

  test("product image resolves with HTTP 200", async ({ request }) => {
    const productsRes = await request.get(`${API}/products?page_size=100`);
    expect(productsRes.ok()).toBeTruthy();
    const products = asList(await productsRes.json()) as { images?: { src?: string }[] }[];
    const withImage = products.find((item) => Boolean(item.images?.[0]?.src));
    const src = withImage?.images?.[0]?.src ?? "";
    expect(src).toBeTruthy();
    const imageRes = await request.get(src);
    expect(imageRes.status()).toBe(200);
    expect(imageRes.headers()["content-type"]).toContain("image/");
  });

  test("tags and approved reviews exist", async ({ request }) => {
    const tagsRes = await request.get(`${API}/products/tags`);
    expect(tagsRes.ok()).toBeTruthy();
    expect(asList(await tagsRes.json()).length).toBeGreaterThan(0);

    const reviewsRes = await request.get(`${API}/products/reviews`);
    expect(reviewsRes.ok()).toBeTruthy();
    const reviewList = asList(await reviewsRes.json()) as { status?: string }[];
    expect(reviewList.length).toBeGreaterThanOrEqual(8);
    expect(reviewList.every((row) => row.status === "approved")).toBe(true);
  });
});
