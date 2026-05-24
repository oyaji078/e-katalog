import { readFileSync } from "node:fs";
import * as mariadb from "mariadb";
import puppeteer from "puppeteer-core";

const baseUrl = "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const title = "Promo Laptop Mingguan";
const updatedTitle = "Promo Laptop Mingguan Update";
const password = "Demo1234!";

function loadEnvFile() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

function dbConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  const url = new URL(process.env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

async function getFlag(conn) {
  const rows = await conn.query("SELECT id, enabled FROM FeatureFlag WHERE `key` = ?", [
    "enable_promo_banner",
  ]);
  return rows[0] ?? null;
}

async function setFlag(conn, enabled) {
  await conn.query("UPDATE FeatureFlag SET enabled = ? WHERE `key` = ?", [
    enabled ? 1 : 0,
    "enable_promo_banner",
  ]);
}

async function latestBanner(conn) {
  const rows = await conn.query(
    "SELECT id, title, isActive, startsAt, endsAt FROM PromoBanner WHERE title IN (?, ?) ORDER BY createdAt DESC LIMIT 1",
    [title, updatedTitle],
  );
  return rows[0] ?? null;
}

async function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function textIncludes(page, value) {
  return page.evaluate((needle) => document.body.innerText.includes(needle), value);
}

async function clearAndType(page, selector, value) {
  await page.focus(selector);
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  if (value) {
    await page.type(selector, value);
  }
}

async function setInputValue(page, selector, value) {
  await page.$eval(
    selector,
    (element, nextValue) => {
      element.value = nextValue;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

async function submitAndWait(page, expectedPath) {
  await Promise.all([
    page.click('button[type="submit"]'),
    page
      .waitForFunction(
        (path) => window.location.pathname === path,
        { timeout: 10000 },
        expectedPath,
      )
      .catch(() => null),
  ]);
}

async function login(page, email, callbackUrl = "/admin/promo-banners") {
  await page.goto(`${baseUrl}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
    waitUntil: "networkidle0",
  });
  await clearAndType(page, 'input[name="email"]', email);
  await clearAndType(page, 'input[name="password"]', password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 12000 }).catch(() => null),
  ]);
}

async function fillValidBanner(page, nextTitle = title) {
  await clearAndType(page, 'input[name="title"]', nextTitle);
  await clearAndType(page, 'input[name="subtitle"]', "Diskon produk pilihan minggu ini");
  await clearAndType(page, 'input[name="ctaLabel"]', "Lihat Produk");
  await clearAndType(page, 'input[name="ctaHref"]', "/products");
  await page.select('select[name="status"]', "ACTIVE");
  await page.select('select[name="audience"]', "PUBLIC");
  await clearAndType(page, 'input[name="sortOrder"]', "1");
  await setInputValue(page, 'input[name="startsAt"]', "");
  await setInputValue(page, 'input[name="endsAt"]', "");
}

async function main() {
  loadEnvFile();
  const conn = await mariadb.createConnection(dbConfig());
  const originalFlag = await getFlag(conn);
  const results = [];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    if (originalFlag) {
      await setFlag(conn, true);
    }

    const guestPage = await browser.newPage();
    await guestPage.goto(`${baseUrl}/admin/promo-banners`, { waitUntil: "networkidle0" });
    await assert(
      guestPage.url().includes("/login"),
      "Guest was not redirected away from /admin/promo-banners.",
    );
    results.push("Guest guard redirected /admin/promo-banners to login.");
    await guestPage.close();

    const adminPage = await browser.newPage();
    await login(adminPage, "admin@demo.ekatalog", "/admin/promo-banners");
    await assert(
      adminPage.url().includes("/admin/promo-banners"),
      "Admin did not land on /admin/promo-banners.",
    );
    await assert(await textIncludes(adminPage, "Banner Promo"), "Banner list did not render.");
    results.push("Admin /admin/promo-banners loaded.");

    await adminPage.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
    await assert(await textIncludes(adminPage, "Tambah Banner Promo"), "New banner page did not render.");
    results.push("Admin /admin/promo-banners/new loaded.");

    await adminPage.$eval('input[name="title"]', (element) => element.removeAttribute("required"));
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForFunction(
      () => document.body.innerText.includes("Judul Banner wajib diisi."),
      { timeout: 10000 },
    );
    results.push("Empty submit returned Indonesian validation error.");

    await fillValidBanner(adminPage, title);
    await clearAndType(adminPage, 'input[name="ctaHref"]', "javascript:alert(1)");
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForFunction(
      () => document.body.innerText.includes("Link Tombol hanya boleh"),
      { timeout: 10000 },
    );
    results.push("Unsafe javascript: CTA was rejected.");

    await fillValidBanner(adminPage, title);
    await submitAndWait(adminPage, "/admin/promo-banners");
    await adminPage.waitForFunction(
      (needle) => document.body.innerText.includes(needle),
      { timeout: 10000 },
      title,
    );
    const created = await latestBanner(conn);
    await assert(created?.id, "Created banner was not found in the database.");
    results.push(`Create submit redirected and listed banner ${created.id}.`);

    await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await assert(await textIncludes(adminPage, title), "Active banner was not visible on homepage.");
    results.push("Active banner appeared on homepage with feature flag ON.");

    await adminPage.goto(`${baseUrl}/admin/promo-banners/${created.id}/edit`, {
      waitUntil: "networkidle0",
    });
    await fillValidBanner(adminPage, updatedTitle);
    await submitAndWait(adminPage, "/admin/promo-banners");
    results.push("Edit submit redirected to banner list.");

    await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await assert(
      await textIncludes(adminPage, updatedTitle),
      "Updated active banner was not visible on homepage.",
    );
    results.push("Homepage reflected edited banner.");

    await adminPage.goto(`${baseUrl}/admin/promo-banners/${created.id}/edit`, {
      waitUntil: "networkidle0",
    });
    await fillValidBanner(adminPage, updatedTitle);
    await setInputValue(adminPage, 'input[name="startsAt"]', "2026-05-01");
    await setInputValue(adminPage, 'input[name="endsAt"]', "2026-05-02");
    await submitAndWait(adminPage, "/admin/promo-banners");
    await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await assert(
      !(await textIncludes(adminPage, updatedTitle)),
      "Expired banner was still visible on homepage.",
    );
    results.push("Expired banner was hidden on homepage.");

    await adminPage.goto(`${baseUrl}/admin/promo-banners/${created.id}/edit`, {
      waitUntil: "networkidle0",
    });
    await fillValidBanner(adminPage, updatedTitle);
    await setInputValue(adminPage, 'input[name="startsAt"]', "2026-05-25");
    await setInputValue(adminPage, 'input[name="endsAt"]', "2026-05-31");
    await submitAndWait(adminPage, "/admin/promo-banners");
    await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await assert(
      !(await textIncludes(adminPage, updatedTitle)),
      "Future scheduled banner was visible too early.",
    );
    results.push("Future scheduled banner was hidden on homepage.");

    await adminPage.goto(`${baseUrl}/admin/promo-banners/${created.id}/edit`, {
      waitUntil: "networkidle0",
    });
    await fillValidBanner(adminPage, updatedTitle);
    await submitAndWait(adminPage, "/admin/promo-banners");

    if (originalFlag) {
      await setFlag(conn, false);
      await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(
        !(await textIncludes(adminPage, updatedTitle)),
        "Promo banner was visible while enable_promo_banner was OFF.",
      );
      await setFlag(conn, true);
      await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(
        await textIncludes(adminPage, updatedTitle),
        "Promo banner was hidden while enable_promo_banner was ON.",
      );
      results.push("Feature flag OFF hid banners and ON restored active banners.");
    } else {
      results.push("Feature flag toggle skipped because enable_promo_banner row is missing.");
    }

    await adminPage.goto(`${baseUrl}/admin/promo-banners`, { waitUntil: "networkidle0" });
    const deleteButtonSelector = await adminPage.evaluate((needle) => {
      const articles = Array.from(document.querySelectorAll("article"));
      const target = articles.find((article) => article.textContent?.includes(needle));
      if (!target) return null;
      const buttons = Array.from(target.querySelectorAll("button"));
      const button = buttons.find((item) => item.textContent?.includes("Hapus / Nonaktifkan"));
      if (!button) return null;
      button.setAttribute("data-phase20-delete", "true");
      return '[data-phase20-delete="true"]';
    }, updatedTitle);
    await assert(deleteButtonSelector, "Delete button for created banner was not found.");

    await adminPage.click(deleteButtonSelector);
    await adminPage.waitForFunction(
      () => document.body.innerText.includes("Hapus Banner Promo?"),
      { timeout: 5000 },
    );
    await adminPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const cancel = buttons.find((button) => button.textContent?.trim() === "Batal");
      cancel?.click();
    });
    await adminPage.waitForFunction(
      () => !document.body.innerText.includes("Hapus Banner Promo?"),
      { timeout: 5000 },
    );
    let afterCancel = await latestBanner(conn);
    await assert(Boolean(afterCancel?.isActive), "Cancel unexpectedly disabled the banner.");
    results.push("Delete confirmation cancel kept banner active.");

    await adminPage.click(deleteButtonSelector);
    await adminPage.waitForFunction(
      () => document.body.innerText.includes("Hapus Banner Promo?"),
      { timeout: 5000 },
    );
    await adminPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const confirm = buttons.find((button) => button.textContent?.includes("Ya, Hapus"));
      confirm?.click();
    });
    await adminPage.waitForFunction(
      () => !document.body.innerText.includes("Hapus Banner Promo?"),
      { timeout: 10000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    const afterDelete = await latestBanner(conn);
    await assert(!afterDelete?.isActive, "Delete did not soft-disable the banner.");
    await adminPage.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
    await assert(
      !(await textIncludes(adminPage, updatedTitle)),
      "Disabled banner was still visible on homepage.",
    );
    results.push("Delete soft-disabled banner and homepage no longer showed it.");

    const retailPage = await browser.newPage();
    await login(retailPage, "retail@demo.ekatalog", "/admin/promo-banners/new");
    await retailPage.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
    await assert(
      retailPage.url().includes("/login"),
      "Retail user was able to open /admin/promo-banners/new.",
    );
    results.push("Retail user was denied create page access.");
    await retailPage.close();

    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } finally {
    if (originalFlag) {
      await setFlag(conn, Boolean(originalFlag.enabled));
    }
    await browser.close();
    await conn.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, stack: error.stack }, null, 2));
  process.exit(1);
});
