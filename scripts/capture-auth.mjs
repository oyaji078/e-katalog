import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "ui-audit", "screenshots-phase16");
const BASE = "http://localhost:3000";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "1366x768", width: 1366, height: 768 },
];

const evidence = [];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});

console.log("Browser launched");

async function loginAs(pageObj, email, password) {
  await pageObj.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 500));
  await pageObj.type('input[name="email"]', email, { delay: 15 });
  await pageObj.type('input[name="password"]', password, { delay: 15 });
  await new Promise((r) => setTimeout(r, 300));
  await pageObj.evaluate(() => { document.querySelector('button[type="submit"]')?.click(); });
  await new Promise((r) => setTimeout(r, 2000));
}

async function capture(pageObj, url, vp, role, file) {
  const filename = `${file}-${vp.name}.png`;
  const filepath = join(OUT, filename);
  const entry = {
    page: url.replace(BASE, ""),
    viewport: vp.name,
    role,
    statusCode: null,
    screenshotPath: `screenshots-phase16/${filename}`,
    horizontalOverflow: false,
    missingAltCount: 0,
    badHttpResponses: 0,
    p141SvgRequestCount: 0,
    error: null,
  };
  try {
    const resp = await pageObj.goto(url, { waitUntil: "load", timeout: 15000 });
    entry.statusCode = resp?.status() ?? 0;
    await new Promise((r) => setTimeout(r, 1000));

    entry.horizontalOverflow = await pageObj.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    entry.missingAltCount = await pageObj.evaluate(() => document.querySelectorAll("img:not([alt])").length);

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
    await pageObj.reload({ waitUntil: "load", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
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

// Admin session
const adminPage = await browser.newPage();
await adminPage.setViewport(VIEWPORTS[0]);
await loginAs(adminPage, "admin@demo.ekatalog", "Demo1234!");
for (const vp of VIEWPORTS) {
  await adminPage.setViewport(vp);
  await capture(adminPage, `${BASE}/admin/products`, vp, "admin", "admin-products");
}
await adminPage.close();

// Super-admin session (capture login guard for /super-admin)
const superPage = await browser.newPage();
await superPage.setViewport(VIEWPORTS[0]);
await loginAs(superPage, "superadmin@demo.ekatalog", "Demo1234!");
for (const vp of VIEWPORTS) {
  await superPage.setViewport(vp);
  await capture(superPage, `${BASE}/super-admin`, vp, "super-admin", "super-admin");
}
await superPage.close();

// Retail session
const retailPage = await browser.newPage();
await retailPage.setViewport(VIEWPORTS[0]);
await loginAs(retailPage, "retail@demo.ekatalog", "Demo1234!");
for (const vp of VIEWPORTS) {
  await retailPage.setViewport(vp);
  await capture(retailPage, `${BASE}/products`, vp, "retail-active", "products-retail");
  await capture(retailPage, `${BASE}/products/p141-test-laptop-30`, vp, "retail-active", "product-detail-retail");
  await capture(retailPage, `${BASE}/vouchers`, vp, "retail-active", "vouchers-retail");
}
await retailPage.close();

await browser.close();

writeFileSync(join(OUT, "_audit-evidence.json"), JSON.stringify(evidence, null, 2));
console.log(`\nDone. ${evidence.length} entries.`);
