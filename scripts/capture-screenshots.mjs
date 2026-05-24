import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "ui-audit", "screenshots-phase15-2");
const BASE = "http://localhost:3000";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const PAGES = [
  { page: "/", role: "public", file: "home" },
  { page: "/products", role: "public", file: "products" },
  { page: "/products?page=1&pageSize=24", role: "public", file: "products-paged" },
  { page: "/products/p141-test-laptop-30", role: "public", file: "product-detail" },
  { page: "/vouchers", role: "public", file: "vouchers" },
  { page: "/login", role: "public", file: "login" },
  { page: "/register", role: "public", file: "register" },
  { page: "/retail/request-token", role: "public", file: "retail-request-token" },
  { page: "/retail/activate", role: "public", file: "retail-activate" },
  { page: "/admin/products", role: "admin", file: "admin-products" },
  { page: "/super-admin", role: "super-admin", file: "super-admin" },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (!existsSync(OUT)) {
  mkdirSync(OUT, { recursive: true });
}

const evidence = [];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

console.log("Browser launched");

for (const { page, role, file } of PAGES) {
  for (const vp of VIEWPORTS) {
    const url = `${BASE}${page}`;
    const filename = `${file}-${vp.name}.png`;
    const filepath = join(OUT, filename);
    const entry = {
      page,
      viewport: vp.name,
      role,
      statusCode: null,
      screenshotPath: `screenshots-phase15-2/${filename}`,
      horizontalOverflow: false,
      missingAltCount: 0,
      badHttpResponses: 0,
      p141SvgRequestCount: 0,
      forbiddenTermScan: { found: false, matches: [] },
      error: null,
    };

    try {
      const pageObj = await browser.newPage();
      await pageObj.setViewport(vp);
      let navResponse = await pageObj.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
      entry.statusCode = navResponse?.status() ?? 0;

      await sleep(1000);

      const overflow = await pageObj.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      entry.horizontalOverflow = overflow;

      const missingAlt = await pageObj.evaluate(() => {
        return document.querySelectorAll("img:not([alt])").length;
      });
      entry.missingAltCount = missingAlt;

      const forbiddenTerms = ["cart", "checkout", "payment", "shipping", "order", "buy now", "wishlist", "heart"];
      const bodyText = await pageObj.evaluate(() => document.body?.innerText ?? "");
      const lowerText = bodyText.toLowerCase();
      const matches = forbiddenTerms.filter((term) => {
        if (term === "heart") {
          return lowerText.includes("add to heart") || lowerText.includes("my heart") || lowerText.includes("heart this");
        }
        if (term === "order") {
          const idx = lowerText.indexOf("order");
          if (idx >= 0) {
            const ctx = lowerText.slice(Math.max(0, idx - 20), idx + 30);
            return /order\s+(now|id|number|status|detail|history|placed)/.test(ctx) && !/sort\s+order/.test(ctx);
          }
          return false;
        }
        return lowerText.includes(term);
      });
      entry.forbiddenTermScan = { found: matches.length > 0, matches };

      let p141Count = 0;
      let badCount = 0;
      const client = await pageObj.createCDPSession();
      await client.send("Network.enable");
      client.on("Network.responseReceived", (params) => {
        const respUrl = params?.response?.url ?? "";
        const respStatus = params?.response?.status ?? 0;
        if (respUrl.includes("p141-test.svg")) p141Count++;
        if (respStatus >= 400) badCount++;
      });

      await pageObj.reload({ waitUntil: "networkidle0", timeout: 20000 });
      await sleep(1000);
      entry.p141SvgRequestCount = p141Count;
      entry.badHttpResponses = badCount;

      await pageObj.screenshot({ path: filepath, fullPage: true });
      console.log(`OK  ${filename} (${vp.name}) — ${entry.statusCode}`);
      await pageObj.close();
    } catch (err) {
      entry.error = err.message;
      console.log(`ERR ${filename} — ${err.message}`);
    }

    evidence.push(entry);
  }
}

await browser.close();

writeFileSync(join(OUT, "_audit-evidence.json"), JSON.stringify(evidence, null, 2));
console.log(`\nDone. ${evidence.length} entries. Evidence saved.`);
