import { test, expect, type Page } from "@playwright/test";

// Matches SAVED_PRODUCTS_STORAGE_KEY in src/lib/saved-products.ts.
const SAVED_KEY = "ekatalog_saved_products_v1";

/** Discover a real product slug/sku from the public catalog (no hardcoded ids). */
async function discoverProductId(page: Page): Promise<string | null> {
  await page.goto("/products", { waitUntil: "load" });
  await page.waitForTimeout(800);
  const href = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a[href^="/products/"]'))
      .map((el) => el.getAttribute("href"))
      .find((h) => h && h !== "/products" && !h.startsWith("/products?"));
    return link ?? null;
  });
  if (!href) return null;
  return href.split("/products/")[1]?.split("?")[0] ?? null;
}

test.describe("retail price is never exposed to guests", () => {
  test("POST /api/products/saved returns no retailPrice for a guest", async ({ page }) => {
    const productId = await discoverProductId(page);
    test.skip(!productId, "No catalog products available to test against");

    // page.request shares the (anonymous) browser context — no auth cookie.
    const res = await page.request.post("/api/products/saved", {
      data: { productIds: [productId] },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const products: Array<Record<string, unknown>> = Array.isArray(body.products) ? body.products : [];
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(p.retailPrice, "guest card props must not include retailPrice").toBeFalsy();
    }
    expect(Boolean(body.canSeeRetailPrice)).toBeFalsy();
  });

  test("/produk-tersimpan shows no Retail: label for a guest", async ({ page }) => {
    const productId = await discoverProductId(page);
    test.skip(!productId, "No catalog products available to test against");

    await page.addInitScript(
      (data) => window.localStorage.setItem(data.key, JSON.stringify([data.id])),
      { key: SAVED_KEY, id: productId },
    );
    await page.goto("/produk-tersimpan", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await expect(page.getByText(/Retail:/i)).toHaveCount(0);
  });
});
