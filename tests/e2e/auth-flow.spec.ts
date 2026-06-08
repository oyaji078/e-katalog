import { test, expect, type Page } from "@playwright/test";

// Seeded demo retail user (role USER, RETAIL_ACTIVE) — see scripts/capture-auth.mjs.
const RETAIL_USER = { email: "retail@demo.ekatalog", password: "Demo1234!" };

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "load" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // LoginForm: signIn.email -> fetch /api/auth/current-user -> window.location redirect.
  await page.waitForTimeout(2500);
}

test.describe("auth flow", () => {
  test("login then logout clears the session (current-user 401)", async ({ page }) => {
    await loginViaUi(page, RETAIL_USER.email, RETAIL_USER.password);

    const before = await page.request.get("/api/auth/current-user");
    test.skip(before.status() === 401, "Demo retail user not seeded; skipping");
    expect(before.ok()).toBeTruthy();

    // P1B: logout uses authClient.signOut() -> better-auth /api/auth/sign-out.
    // Issue it as a same-origin BROWSER fetch so the Origin header satisfies
    // better-auth's CSRF check (a Node-side request context omits Origin -> 403)
    // and Content-Type/body satisfy the handler (no body -> 415).
    const status = await page.evaluate(async () => {
      const r = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
      return r.status;
    });
    expect(status).toBe(200);

    const after = await page.request.get("/api/auth/current-user");
    expect(after.status()).toBe(401);
  });

  test("regular user cannot reach /admin", async ({ page }) => {
    await loginViaUi(page, RETAIL_USER.email, RETAIL_USER.password);

    const probe = await page.request.get("/api/auth/current-user");
    test.skip(probe.status() === 401, "Demo retail user not seeded; skipping");

    await page.goto("/admin", { waitUntil: "load" });
    await page.waitForTimeout(1000);
    expect(new URL(page.url()).pathname).not.toBe("/admin");
  });

  test("GET /categories is not 404", async ({ page }) => {
    const res = await page.goto("/categories", { waitUntil: "load" });
    expect(res?.status()).not.toBe(404);
    expect(res?.status() ?? 500).toBeLessThan(400);
  });
});
