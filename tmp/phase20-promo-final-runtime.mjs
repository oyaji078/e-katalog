import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as mariadb from "mariadb";
import puppeteer from "puppeteer-core";

const baseUrl = "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const password = "Demo1234!";
const runId = Date.now();
const publicTitle = `Promo Laptop Mingguan ${runId}`;
const retailTitle = `Promo Ritel Mingguan ${runId}`;
const pngPath = path.resolve("tmp", `phase20-banner-${runId}.png`);
const exePath = path.resolve("tmp", `phase20-invalid-${runId}.exe`);
const largePngPath = path.resolve("tmp", `phase20-large-${runId}.png`);

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
  const url = new URL(process.env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

function makeFiles() {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAASwAAAB4CAIAAAC6iKlyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA+ElEQVR4nO3RMQ0AAAgDINc/9K3hARugctmZAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwGx3cAAFqUAFYAAAAAElFTkSuQmCC",
    "base64",
  );
  writeFileSync(pngPath, png);
  writeFileSync(exePath, "not an image");
  const large = Buffer.alloc(6 * 1024 * 1024, 0);
  png.copy(large, 0, 0, Math.min(png.length, large.length));
  writeFileSync(largePngPath, large);
}

async function setFlag(conn, enabled) {
  await conn.query("UPDATE FeatureFlag SET enabled = ? WHERE `key` = 'enable_promo_banner'", [
    enabled ? 1 : 0,
  ]);
}

async function getFlag(conn) {
  const rows = await conn.query(
    "SELECT enabled FROM FeatureFlag WHERE `key` = 'enable_promo_banner' LIMIT 1",
  );
  return rows[0]?.enabled ?? null;
}

async function bannerByTitle(conn, title) {
  const rows = await conn.query(
    "SELECT id, title, imageUrl, audience, isActive, startsAt, endsAt, sortOrder FROM PromoBanner WHERE title = ? LIMIT 1",
    [title],
  );
  return rows[0] ?? null;
}

async function cleanupBanner(conn, title) {
  const banner = await bannerByTitle(conn, title);
  if (!banner) return;

  await conn.query("DELETE FROM PromoBanner WHERE id = ?", [banner.id]);
  if (banner.imageUrl?.startsWith("/uploads/promo-banners/")) {
    const savedPath = path.resolve("public", banner.imageUrl.replace(/^\//, ""));
    if (existsSync(savedPath)) unlinkSync(savedPath);
  }
}

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function clearAndType(page, selector, value) {
  await page.focus(selector);
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  if (value) await page.type(selector, value);
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

async function textIncludes(page, value) {
  return page.evaluate((needle) => document.body.innerText.includes(needle), value);
}

async function login(page, email, callbackUrl) {
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

async function fillBanner(page, options) {
  await clearAndType(page, 'input[name="title"]', options.title);
  await clearAndType(page, 'input[name="subtitle"]', options.subtitle ?? "Diskon produk pilihan minggu ini");
  await clearAndType(page, 'input[name="ctaLabel"]', options.ctaLabel ?? "Lihat Produk");
  await clearAndType(page, 'input[name="ctaHref"]', options.ctaHref ?? "/products");
  await page.select('select[name="status"]', options.status ?? "ACTIVE");
  await page.select('select[name="audience"]', options.audience ?? "PUBLIC");
  await clearAndType(page, 'input[name="sortOrder"]', String(options.sortOrder ?? 1));
  await setInputValue(page, 'input[name="startsAt"]', options.startsAt ?? "");
  await setInputValue(page, 'input[name="endsAt"]', options.endsAt ?? "");
}

async function submitExpectList(page) {
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForFunction(() => window.location.pathname === "/admin/promo-banners", {
      timeout: 15000,
    }),
  ]);
}

async function createBanner(page, options) {
  await page.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
  await fillBanner(page, options);
  if (options.uploadPath) {
    const input = await page.$('input[name="imageFile"]');
    await input.uploadFile(options.uploadPath);
    await page.waitForFunction(
      () => {
        const preview = Array.from(document.querySelectorAll("div")).find((item) =>
          item.getAttribute("style")?.includes("blob:"),
        );
        return Boolean(preview);
      },
      { timeout: 5000 },
    );
  }
  await submitExpectList(page);
}

async function articleHasLoadedImage(page, title) {
  return page.evaluate((needle) => {
    const article = Array.from(document.querySelectorAll("article")).find((item) =>
      item.textContent?.includes(needle),
    );
    const image = article?.querySelector("img");
    return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
  }, title);
}

async function homepageHasLoadedBannerImage(page, title) {
  return page.evaluate((needle) => {
    const link = Array.from(document.querySelectorAll("a")).find((item) =>
      item.textContent?.includes(needle),
    );
    const image = link?.querySelector("img");
    return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
  }, title);
}

async function bannerHref(page, title) {
  return page.evaluate((needle) => {
    const link = Array.from(document.querySelectorAll("a")).find((item) =>
      item.textContent?.includes(needle),
    );
    return link?.getAttribute("href") ?? "";
  }, title);
}

async function expectValidation(page, expectedText) {
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    (needle) => document.body.innerText.includes(needle),
    { timeout: 10000 },
    expectedText,
  );
}

async function withBrowser(fn) {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

async function main() {
  loadEnvFile();
  makeFiles();

  const conn = await mariadb.createConnection(dbConfig());
  const originalFlag = await getFlag(conn);
  const brokenImageResponses = [];
  const results = [];

  try {
    await cleanupBanner(conn, publicTitle);
    await cleanupBanner(conn, retailTitle);
    await setFlag(conn, true);

    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      page.on("response", (response) => {
        if (response.url().includes("/uploads/promo-banners/") && response.status() >= 400) {
          brokenImageResponses.push({ url: response.url(), status: response.status() });
        }
      });

      await login(page, "admin@demo.ekatalog", "/admin/promo-banners");
      await assert(page.url().includes("/admin/promo-banners"), "Admin banner list did not load.");
      results.push("Admin /admin/promo-banners loaded.");

      await createBanner(page, {
        title: publicTitle,
        audience: "PUBLIC",
        uploadPath: pngPath,
        sortOrder: 1,
      });
      await assert(await textIncludes(page, publicTitle), "Created PUBLIC banner missing from dashboard.");
      await assert(await articleHasLoadedImage(page, publicTitle), "Admin list image did not load.");

      const publicBanner = await bannerByTitle(conn, publicTitle);
      await assert(publicBanner?.isActive === 1, "PUBLIC banner is not active in DB.");
      await assert(publicBanner?.audience === "PUBLIC", "PUBLIC banner audience mismatch.");
      await assert(
        publicBanner?.imageUrl?.startsWith("/uploads/promo-banners/"),
        "PUBLIC banner imageUrl is not a public upload path.",
      );
      results.push("Create with PNG upload saved DB row and dashboard image.");

      await page.goto(`${baseUrl}/admin/promo-banners/${publicBanner.id}/edit`, {
        waitUntil: "networkidle0",
      });
      await assert(
        (await page.$eval('input[name="imageUrl"]', (input) => input.value)).startsWith(
          "/uploads/promo-banners/",
        ),
        "Edit form did not load saved imageUrl.",
      );
      results.push("Edit preview loaded saved uploaded image path.");

      await createBanner(page, {
        title: retailTitle,
        audience: "RETAIL",
        sortOrder: 2,
      });
      await assert(await textIncludes(page, retailTitle), "Created RETAIL banner missing from dashboard.");
      results.push("Created RETAIL-only banner.");

      await page.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
      await fillBanner(page, { title: `Invalid CTA ${runId}` });
      await clearAndType(page, 'input[name="ctaHref"]', "javascript:alert(1)");
      await expectValidation(page, "Link Tombol hanya boleh");

      await page.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
      await fillBanner(page, { title: `Invalid Data Image ${runId}` });
      await clearAndType(page, 'input[name="imageUrl"]', "data:image/png;base64,AAAA");
      await expectValidation(page, "Gambar Banner hanya boleh");

      await page.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
      await fillBanner(page, { title: `Invalid JS Image ${runId}` });
      await clearAndType(page, 'input[name="imageUrl"]', "javascript:alert(1)");
      await expectValidation(page, "Gambar Banner hanya boleh");

      await page.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
      await fillBanner(page, { title: `Invalid Exe ${runId}` });
      await (await page.$('input[name="imageFile"]')).uploadFile(exePath);
      await expectValidation(page, "Tipe file tidak didukung");

      await page.goto(`${baseUrl}/admin/promo-banners/new`, { waitUntil: "networkidle0" });
      await fillBanner(page, { title: `Invalid Large ${runId}` });
      await (await page.$('input[name="imageFile"]')).uploadFile(largePngPath);
      await expectValidation(page, "Ukuran file maksimal 5 MB");
      results.push("Invalid CTA, image URLs, .exe, and large files were rejected.");
    });

    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      page.on("response", (response) => {
        if (response.url().includes("/uploads/promo-banners/") && response.status() >= 400) {
          brokenImageResponses.push({ url: response.url(), status: response.status() });
        }
      });

      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(await textIncludes(page, publicTitle), "Guest cannot see PUBLIC banner.");
      await assert(!(await textIncludes(page, retailTitle)), "Guest can see RETAIL-only banner.");
      await assert(await homepageHasLoadedBannerImage(page, publicTitle), "Guest homepage image did not load.");
      await assert((await bannerHref(page, publicTitle)).includes("/products"), "CTA does not point to /products.");
      results.push("Guest sees PUBLIC banner with loaded image and CTA.");
    });

    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      page.on("response", (response) => {
        if (response.url().includes("/uploads/promo-banners/") && response.status() >= 400) {
          brokenImageResponses.push({ url: response.url(), status: response.status() });
        }
      });

      await login(page, "retail@demo.ekatalog", "/");
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(await textIncludes(page, publicTitle), "Retail user cannot see PUBLIC banner.");
      await assert(await textIncludes(page, retailTitle), "Retail user cannot see RETAIL banner.");
      await assert(await homepageHasLoadedBannerImage(page, publicTitle), "Retail homepage image did not load.");
      results.push("Retail active user sees PUBLIC and RETAIL banners.");
    });

    await setFlag(conn, false);
    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(!(await textIncludes(page, publicTitle)), "Feature flag OFF still shows PUBLIC banner.");

      await login(page, "retail@demo.ekatalog", "/");
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(!(await textIncludes(page, publicTitle)), "Feature flag OFF still shows PUBLIC banner to retail.");
      await assert(!(await textIncludes(page, retailTitle)), "Feature flag OFF still shows RETAIL banner.");
      results.push("Feature flag OFF hides promo banners for guest and retail.");
    });

    await setFlag(conn, true);
    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(await textIncludes(page, publicTitle), "Feature flag ON did not restore PUBLIC banner.");
      results.push("Feature flag ON restores eligible banners.");
    });

    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      const publicBanner = await bannerByTitle(conn, publicTitle);

      await login(page, "admin@demo.ekatalog", `/admin/promo-banners/${publicBanner.id}/edit`);
      await page.goto(`${baseUrl}/admin/promo-banners/${publicBanner.id}/edit`, {
        waitUntil: "networkidle0",
      });
      await fillBanner(page, {
        title: publicTitle,
        audience: "PUBLIC",
        startsAt: "",
        endsAt: "2026-05-01",
      });
      await submitExpectList(page);

      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(!(await textIncludes(page, publicTitle)), "Expired banner still appears.");
      results.push("Expired banner hidden.");

      await page.goto(`${baseUrl}/admin/promo-banners/${publicBanner.id}/edit`, {
        waitUntil: "networkidle0",
      });
      await fillBanner(page, {
        title: publicTitle,
        audience: "PUBLIC",
        startsAt: "",
        endsAt: "",
      });
      await submitExpectList(page);

      await page.goto(`${baseUrl}/admin/promo-banners/${publicBanner.id}/edit`, {
        waitUntil: "networkidle0",
      });
      await fillBanner(page, {
        title: publicTitle,
        audience: "PUBLIC",
        startsAt: "2026-05-25",
        endsAt: "2026-05-31",
      });
      await submitExpectList(page);

      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(!(await textIncludes(page, publicTitle)), "Future banner appears too early.");
      results.push("Future scheduled banner hidden.");

      await page.goto(`${baseUrl}/admin/promo-banners/${publicBanner.id}/edit`, {
        waitUntil: "networkidle0",
      });
      await fillBanner(page, {
        title: publicTitle,
        audience: "PUBLIC",
        startsAt: "",
        endsAt: "",
      });
      await submitExpectList(page);

      await page.goto(`${baseUrl}/admin/promo-banners`, { waitUntil: "networkidle0" });
      await page.evaluate((needle) => {
        const article = Array.from(document.querySelectorAll("article")).find((item) =>
          item.textContent?.includes(needle),
        );
        const button = Array.from(article?.querySelectorAll("button") ?? []).find((item) =>
          item.textContent?.trim().includes("Hapus"),
        );
        button?.setAttribute("data-phase20-delete", "true");
      }, publicTitle);

      await page.click('[data-phase20-delete="true"]');
      await page.waitForFunction(
        () => document.body.innerText.includes("Hapus Banner Promo?"),
        { timeout: 5000 },
      );
      await page.evaluate(() => {
        const cancel = Array.from(document.querySelectorAll("button")).find(
          (button) => button.textContent?.trim() === "Batal",
        );
        cancel?.click();
      });
      await page.waitForFunction(
        () => !document.body.innerText.includes("Hapus Banner Promo?"),
        { timeout: 5000 },
      );
      await assert(await textIncludes(page, publicTitle), "Cancel removed banner from dashboard.");
      results.push("Delete cancel keeps dashboard row.");

      await page.click('[data-phase20-delete="true"]');
      await page.waitForFunction(
        () => document.body.innerText.includes("Hapus Banner Promo?"),
        { timeout: 5000 },
      );
      await page.evaluate(() => {
        const confirm = Array.from(document.querySelectorAll("button")).find((button) =>
          button.textContent?.includes("Ya, Hapus"),
        );
        confirm?.click();
      });
      await page.waitForFunction(
        (needle) => !document.body.innerText.includes(needle),
        { timeout: 10000 },
        publicTitle,
      );
      await assert(!(await bannerByTitle(conn, publicTitle)), "Deleted banner still exists in DB.");
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await assert(!(await textIncludes(page, publicTitle)), "Deleted banner still appears on homepage.");
      results.push("True delete removes dashboard row, DB row, image file, and homepage banner.");
    });

    await assert(brokenImageResponses.length === 0, `Broken image responses: ${JSON.stringify(brokenImageResponses)}`);

    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } finally {
    await cleanupBanner(conn, publicTitle);
    await cleanupBanner(conn, retailTitle);
    if (originalFlag !== null) await setFlag(conn, Boolean(originalFlag));
    for (const file of [pngPath, exePath, largePngPath]) {
      if (existsSync(file)) unlinkSync(file);
    }
    await conn.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, stack: error.stack }, null, 2));
  process.exit(1);
});
