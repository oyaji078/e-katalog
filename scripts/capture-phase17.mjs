import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "ui-audit", "screenshots-phase17");
const BASE = "http://localhost:3000";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const TASKS = [
  // 1. Admin product edit page (was slow with networkidle0, use load + fixed wait)
  ...VIEWPORTS.map((vp) => ({
    session: { email: "admin@demo.ekatalog", password: "Demo1234!", role: "admin" },
    page: "/admin/products/cmpgmi26g000vsoihmnhhbdrb/edit",
    file: "admin-product-edit",
    vp,
  })),
  // 2. Super-admin dashboard - all 4 viewports
  ...VIEWPORTS.map((vp) => ({
    session: { email: "superadmin@demo.ekatalog", password: "Demo1234!", role: "super-admin" },
    page: "/super-admin",
    file: "super-admin",
    vp,
  })),
  // 3. Retail active - products, product detail, vouchers
  ...VIEWPORTS.map((vp) => ({
    session: { email: "retail@demo.ekatalog", password: "Demo1234!", role: "retail-active" },
    page: "/products",
    file: "products-retail",
    vp,
  })),
  ...VIEWPORTS.map((vp) => ({
    session: { email: "retail@demo.ekatalog", password: "Demo1234!", role: "retail-active" },
    page: "/products/p141-test-laptop-30",
    file: "product-detail-retail",
    vp,
  })),
  ...VIEWPORTS.map((vp) => ({
    session: { email: "retail@demo.ekatalog", password: "Demo1234!", role: "retail-active" },
    page: "/vouchers",
    file: "vouchers-retail",
    vp,
  })),
];

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const evidence = [];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});

console.log("Browser launched");

// Track which sessions we've already logged in
const loginCache = {};

for (const task of TASKS) {
  const { session, page, file, vp } = task;
  const url = `${BASE}${page}`;
  const filename = `${file}-${vp.name}.png`;
  const filepath = join(OUT, filename);
  const cacheKey = `${session.email}:${session.password}`;

  const entry = {
    page,
    viewport: vp.name,
    role: session.role,
    statusCode: null,
    screenshotPath: `screenshots-phase17/${filename}`,
    horizontalOverflow: false,
    missingAltCount: 0,
    badHttpResponses: 0,
    p141SvgRequestCount: 0,
    error: null,
  };

  try {
    let pageObj;
    if (loginCache[cacheKey]) {
      // Reuse an existing page for this session
      pageObj = loginCache[cacheKey];
    } else {
      pageObj = await browser.newPage();
      loginCache[cacheKey] = pageObj;

      // Login via the login page
      await pageObj.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
      await sleep(500);
      // Fill email/password and submit
      await pageObj.type('input[name="email"]', session.email, { delay: 10 });
      await pageObj.type('input[name="password"]', session.password, { delay: 10 });
      await sleep(200);
      await pageObj.evaluate(() => {
        document.querySelector('button[type="submit"]')?.click();
      });
      // Wait for login to complete
      await sleep(3000);
    }

    // Navigate to target page
    await pageObj.setViewport(vp);
    const resp = await pageObj.goto(url, { waitUntil: "load", timeout: 20000 });
    entry.statusCode = resp?.status() ?? 0;
    // Wait for async data to settle
    await sleep(3000);

    // Check horizontal overflow
    entry.horizontalOverflow = await pageObj.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );

    // Check missing alt attributes
    entry.missingAltCount = await pageObj.evaluate(
      () => document.querySelectorAll("img:not([alt])").length,
    );

    // Monitor network for p141-test.svg and bad responses
    let p141Count = 0;
    let badCount = 0;
    const client = await pageObj.createCDPSession();
    await client.send("Network.enable");
    client.on("Network.responseReceived", (params) => {
      const u = params?.response?.url ?? "";
      const s = params?.response?.status ?? 0;
      if (u.includes("p141-test.svg")) p141Count++;
      if (s >= 400) badCount++;
    });

    await pageObj.reload({ waitUntil: "load", timeout: 20000 });
    await sleep(2000);
    entry.p141SvgRequestCount = p141Count;
    entry.badHttpResponses = badCount;

    await pageObj.screenshot({ path: filepath, fullPage: true });
    console.log(`OK  ${filename} — ${entry.statusCode}`);
  } catch (err) {
    entry.error = err.message;
    console.log(`ERR ${filename} — ${err.message}`);
  }

  evidence.push(entry);
}

// Close all cached pages
for (const key of Object.keys(loginCache)) {
  try { await loginCache[key].close(); } catch {}
}

await browser.close();

writeFileSync(join(OUT, "_audit-evidence.json"), JSON.stringify(evidence, null, 2));
console.log(`\nDone. ${evidence.length} entries.`);
