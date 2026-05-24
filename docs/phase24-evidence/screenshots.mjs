import { chromium } from '@playwright/test';
import { join } from 'path';

const BASE = 'http://localhost:3002';
const DIR = 'D:/e-katalog/docs/phase24-evidence';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Intercept sign-in request to add origin
  await page.route('**/api/auth/sign-in/**', async (route) => {
    const headers = {
      ...route.request().headers(),
      'origin': 'http://localhost:3002',
    };
    await route.continue({ headers });
  });

  // Go to login page
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[name="email"]', { timeout: 5000 });

  // Use evaluate to sign in via fetch
  const result = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3002' },
        body: JSON.stringify({
          email: 'admin@demo.ekatalog',
          password: 'Demo1234!',
          callbackURL: '/admin',
        }),
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data: JSON.stringify(data).slice(0, 300) };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Sign in result:', JSON.stringify(result));

  // If sign-in succeeded, navigate to admin
  if (result.ok) {
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 15000 });
    console.log('After login URL:', page.url());
  }

  await page.screenshot({ path: join(DIR, '0-after-login.png'), fullPage: true });

  // Admin pages
  const adminPages = [
    { name: '2-admin-products', path: '/admin/products' },
    { name: '3-promo-vouchers', path: '/admin/promo-vouchers' },
    { name: '4-vouchers-new', path: '/admin/vouchers/new' },
    { name: '5-banners-new', path: '/admin/promo-banners/new' },
    { name: '6-flash-sales-new', path: '/admin/flash-sales/new' },
  ];

  for (const { name, path } of adminPages) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
      console.log(`At ${path}, URL:`, page.url());
      await page.screenshot({ path: join(DIR, `${name}.png`), fullPage: true });
    } catch (err) {
      console.log(`✗ Failed ${name}: ${err.message}`);
    }
  }

  // Public pages
  await page.goto(`${BASE}/vouchers`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(DIR, '7-public-vouchers.png'), fullPage: true });

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(DIR, '1-home.png'), fullPage: true });

  await browser.close();
  console.log('Done');
}

main().catch(console.error);
