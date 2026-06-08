/**
 * Phase 17: Demo verification checks.
 * Tests route guards, WhatsApp flow, and admin product edit behavior.
 */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = "http://localhost:3000";
const REPORT = [];
const PASS = [];
const FAIL = [];

function report(category, test, passed, detail) {
  const label = passed ? "PASS" : "FAIL";
  console.log(`  [${label}] ${test}`);
  REPORT.push({ category, test, passed, detail });
  if (passed) PASS.push(test);
  else FAIL.push(test);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});

console.log("=== Route Guard Tests ===\n");

// 1. Guest opens /admin/products → login redirect
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/admin/products`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);
  const currentUrl = page.url();
  const onLoginPage = currentUrl.includes("/login");
  report("route-guard", "Guest → /admin/products redirects to login", onLoginPage,
    onLoginPage ? `Redirected to: ${currentUrl}` : `Stayed at: ${currentUrl}`);
  await page.close();
}

// 2. Guest opens /super-admin → login redirect
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/super-admin`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);
  const currentUrl = page.url();
  const onLoginPage = currentUrl.includes("/login");
  report("route-guard", "Guest → /super-admin redirects to login", onLoginPage,
    onLoginPage ? `Redirected to: ${currentUrl}` : `Stayed at: ${currentUrl}`);
  await page.close();
}

// 3. Admin opens /super-admin → denied/redirect
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  // Login as admin
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await sleep(500);
  await page.type('input[name="email"]', "admin@demo.ekatalog", { delay: 10 });
  await page.type('input[name="password"]', "Demo1234!", { delay: 10 });
  await sleep(200);
  await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
  await sleep(3000);

  // Try super-admin
  const resp = await page.goto(`${BASE}/super-admin`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);
  const bodyText = await page.evaluate(() => document.body?.innerText?.toLowerCase() ?? "");
  const denied = bodyText.includes("tidak memiliki akses") || bodyText.includes("forbidden") || bodyText.includes("unauthorized") || resp?.status() === 403;
  // Admin should get redirected or see forbidden message (not the super-admin dashboard)
  const currentUrl = page.url();
  const notOnSuperAdmin = !currentUrl.includes("/super-admin") || denied;
  report("route-guard", "Admin → /super-admin denied/redirected", notOnSuperAdmin,
    notOnSuperAdmin ? `Status: ${resp?.status()}, URL: ${currentUrl}` : `Admin accessed super-admin!`);
  await page.close();
}

// 4. Super-admin opens /super-admin → allowed
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await sleep(500);
  await page.type('input[name="email"]', "superadmin@demo.ekatalog", { delay: 10 });
  await page.type('input[name="password"]', "Demo1234!", { delay: 10 });
  await sleep(200);
  await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
  await sleep(3000);

  const resp = await page.goto(`${BASE}/super-admin`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);
  const currentUrl = page.url();
  const allowed = currentUrl.includes("/super-admin");
  report("route-guard", "Super-admin → /super-admin allowed", allowed,
    allowed ? `Status: ${resp?.status()}, URL: ${currentUrl}` : `Denied: ${currentUrl}`);
  await page.close();
}

// 5. Retail user → /admin/products denied
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await sleep(500);
  await page.type('input[name="email"]', "retail@demo.ekatalog", { delay: 10 });
  await page.type('input[name="password"]', "Demo1234!", { delay: 10 });
  await sleep(200);
  await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
  await sleep(3000);

  await page.goto(`${BASE}/admin/products`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);
  const currentUrl = page.url();
  const notOnAdmin = !currentUrl.includes("/admin");
  report("route-guard", "Retail → /admin/products denied/redirected", notOnAdmin,
    notOnAdmin ? `Redirected to: ${currentUrl}` : `Retail accessed admin!`);
  await page.close();
}

// 6. Logged-in user should not see Login/Register in header
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await sleep(500);
  await page.type('input[name="email"]', "retail@demo.ekatalog", { delay: 10 });
  await page.type('input[name="password"]', "Demo1234!", { delay: 10 });
  await sleep(200);
  await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
  await sleep(3000);

  await page.goto(`${BASE}/products`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);
  const body = await page.evaluate(() => document.body?.innerText ?? "");
  const hasLoginLink = body.includes("Masuk") && !body.includes("Logout");
  // Logged-in retail user should NOT see "Masuk" link (they should see logout)
  report("route-guard", "Logged-in user header does not show Login", !hasLoginLink,
    hasLoginLink ? "Login link found in header" : "No login link (correct)");
  await page.close();
}

console.log("\n=== WhatsApp Flow Tests ===\n");

// 7. Guest product page - WhatsApp CTA works
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/products/p141-test-laptop-30`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);

  // Check WhatsApp CTA exists
  const hasCTA = await page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    return text.includes("Tanya") && text.includes("WhatsApp");
  });
  report("whatsapp", "Guest product detail has WhatsApp CTA", hasCTA,
    hasCTA ? "WhatsApp CTA found" : "No WhatsApp CTA found");
  await page.close();
}

// 8. Retail-active product page - WhatsApp CTA works
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await sleep(500);
  await page.type('input[name="email"]', "retail@demo.ekatalog", { delay: 10 });
  await page.type('input[name="password"]', "Demo1234!", { delay: 10 });
  await sleep(200);
  await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
  await sleep(3000);

  await page.goto(`${BASE}/products/p141-test-laptop-30`, { waitUntil: "load", timeout: 15000 });
  await sleep(1000);

  const hasCTA = await page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    return text.includes("Tanya") && text.includes("WhatsApp");
  });
  report("whatsapp", "Retail product detail has WhatsApp CTA", hasCTA,
    hasCTA ? "WhatsApp CTA found" : "No WhatsApp CTA found");

  // Check no costPrice in visible text
  const body = await page.evaluate(() => document.body?.innerText ?? "");
  const noCostPrice = !body.includes("costPrice") && !body.includes("Harga Modal") && !body.includes("Harga Beli");
  report("whatsapp", "Retail view does not leak costPrice", noCostPrice,
    noCostPrice ? "No costPrice leak" : "costPrice found in text!");

  // Check no tokenHash
  const noTokenHash = !body.includes("tokenHash");
  report("whatsapp", "Retail view does not leak tokenHash", noTokenHash,
    noTokenHash ? "No tokenHash leak" : "tokenHash found!");
  await page.close();
}

// 9. Admin product edit page test
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 15000 });
  await sleep(500);
  await page.type('input[name="email"]', "admin@demo.ekatalog", { delay: 10 });
  await page.type('input[name="password"]', "Demo1234!", { delay: 10 });
  await sleep(200);
  await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
  await sleep(3000);

  const resp = await page.goto(`${BASE}/admin/products/cmpgmi26g000vsoihmnhhbdrb/edit`,
    { waitUntil: "load", timeout: 20000 });
  await sleep(3000);

  const statusCode = resp?.status() ?? 0;
  report("admin-edit", "Admin product edit page returns 200", statusCode === 200,
    `Status: ${statusCode}`);

  // Check form exists with editable fields
  const hasForm = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea, select');
    return inputs.length > 5;
  });
  report("admin-edit", "Product edit has editable form fields", hasForm,
    hasForm ? `Found form fields` : "No form fields found");

  await page.close();
}

await browser.close();

console.log(`\n=== Results ===`);
console.log(`Passed: ${PASS.length}/${PASS.length + FAIL.length}`);
for (const f of FAIL) console.log(`  FAIL: ${f}`);

writeFileSync(join(__dirname, "..", "docs", "ui-audit", "screenshots-phase17", "_verify-results.json"),
  JSON.stringify({ results: REPORT, passed: PASS.length, failed: FAIL.length, total: PASS.length + FAIL.length }, null, 2));
console.log("Results saved.");
