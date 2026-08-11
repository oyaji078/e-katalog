import "dotenv/config";
import { createHash } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/generated/prisma/client";

const PENDING_EMAIL = "p2test-pending@demo.ekatalog";
const TOKEN = "654321";

function tokenHash(t: string) {
  return createHash("sha256").update(t.trim()).digest("hex");
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "load" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  const redirect = page.waitForURL((url) => url.pathname !== "/login", { timeout: 8000 }).catch(() => null);
  await page.click('button[type="submit"]');
  await redirect;
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  return new URL(page.url()).pathname !== "/login";
}

function newDb() {
  return new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!, { useTextProtocol: true }) });
}

async function purge(db: ReturnType<typeof newDb>) {
  await db.session.deleteMany({ where: { user: { email: PENDING_EMAIL } } }).catch(() => {});
  await db.retailToken.deleteMany({ where: { assignedTo: { email: PENDING_EMAIL } } }).catch(() => {});
  await db.account.deleteMany({ where: { user: { email: PENDING_EMAIL } } }).catch(() => {});
  await db.user.deleteMany({ where: { email: PENDING_EMAIL } }).catch(() => {});
}

test.describe("phase2 retail activation (end-to-end)", () => {
  test("valid token activates the pending account and is consumed (single-use)", async ({ page, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "run once on desktop");
    const db = newDb();
    try {
      await purge(db);
      // Create a real PENDING_RETAIL user with a known UI password.
      const signup = await page.request.post("/api/auth/sign-up/email", {
        data: { email: PENDING_EMAIL, password: "Demo1234!", name: "P2 Pending" },
        headers: { origin: baseURL ?? "http://127.0.0.1:3000" },
      });
      expect(signup.ok(), "signup pending user").toBeTruthy();
      const user = await db.user.update({ where: { email: PENDING_EMAIL }, data: { retailStatus: "PENDING_RETAIL" } });
      await db.retailToken.create({
        data: {
          tokenHash: tokenHash(TOKEN), tokenPreview: TOKEN, status: "ACTIVE",
          assignedToUserId: user.id, generatedByUserId: user.id,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const loggedIn = await loginViaUi(page, PENDING_EMAIL, "Demo1234!");
      expect(loggedIn, "pending user logged in").toBeTruthy();

      await page.goto("/retail/activate", { waitUntil: "load" });
      await page.fill('input[name="token"]', TOKEN);
      const toSuccess = page.waitForURL(/\/retail\/activate\/success/, { timeout: 12000 }).catch(() => null);
      await page.click('button[type="submit"]');
      await toSuccess;

      // Assert the REAL DB outcome regardless of redirect rendering.
      const after = await db.user.findUnique({ where: { email: PENDING_EMAIL } });
      expect(after?.retailStatus, "user becomes RETAIL_ACTIVE").toBe("RETAIL_ACTIVE");
      const tok = await db.retailToken.findFirst({ where: { assignedToUserId: user.id } });
      expect(tok?.status, "token consumed").toBe("USED");
      expect(tok?.usedAt, "token usedAt set").toBeTruthy();
    } finally {
      await purge(db);
      await db.$disconnect();
    }
  });
});

test.describe("phase2 retail price display", () => {
  test("retail user sees retail price with struck-through public price on cards", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "run once on desktop");
    const ok = await loginViaUi(page, "retail@demo.ekatalog", "Demo1234!");
    expect(ok, "retail demo user logged in").toBeTruthy();
    await page.goto("/products", { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    // Flow 5 + 7: retail label present and the public price is rendered struck through.
    await expect(page.getByText("Harga retail").first(), "retail label shown").toBeVisible();
    await expect(page.locator(".line-through").first(), "public price struck through").toBeVisible();
    await expect(page.getByText(/harga umum/i).first(), "harga umum note shown").toBeVisible();
  });
});

test.describe("phase2 mobile product filter", () => {
  test("mobile filter drawer is visible and expands to show controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile viewport only");
    await page.goto("/products", { waitUntil: "load" });
    const details = page.locator('details', { has: page.locator('summary', { hasText: "Filter produk" }) }).first();
    await expect(details, "mobile filter present").toBeVisible();
    await details.locator("summary").click();
    // After expanding, real interactive controls must be visible & usable.
    await expect(details.locator("select").first(), "category select visible when expanded").toBeVisible();
    await expect(details.getByRole("button", { name: /Terapkan Filter/i }), "apply button visible").toBeVisible();
  });
});
