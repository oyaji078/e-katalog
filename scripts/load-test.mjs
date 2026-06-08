// Safe local load test: GET routes only, no destructive endpoints.
// Usage: node scripts/load-test.mjs [baseUrl] [extraRoute...]

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.argv[2] || "http://localhost:3000";
const EXTRA_ROUTES = process.argv.slice(3).filter((route) => route.startsWith("/"));
const CONCURRENCY = 10;
const REQUESTS_PER_ROUTE = 50;
const TIMEOUT_MS = 10000;

const DEFAULT_ROUTES = [
  "/",
  "/products",
  "/products?search=laptop",
  "/products?page=2",
  "/produk-tersimpan",
  "/admin",
  "/admin/products",
  "/admin/categories",
  "/admin/promo-vouchers",
  "/admin/retail-users",
  "/admin/reports",
  "/super-admin",
  "/super-admin/system",
  "/super-admin/feature-flags",
];

const ROUTES = Array.from(new Set([...DEFAULT_ROUTES, ...EXTRA_ROUTES]));

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const elapsed = performance.now() - start;
    let error = "";

    if (res.status >= 500) {
      error = (await res.text().catch(() => "")).slice(0, 500);
    }

    return {
      status: res.status,
      elapsed,
      failed: res.status >= 500,
      error,
    };
  } catch (err) {
    const elapsed = performance.now() - start;
    return {
      status: 0,
      elapsed,
      failed: true,
      error: err instanceof Error ? err.message : "Unknown fetch error",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function loadTestRoute(route) {
  const url = `${BASE_URL}${route}`;
  const results = [];

  for (let i = 0; i < REQUESTS_PER_ROUTE; i += CONCURRENCY) {
    const batchSize = Math.min(CONCURRENCY, REQUESTS_PER_ROUTE - i);
    const batch = Array.from({ length: batchSize }, () => fetchWithTimeout(url, TIMEOUT_MS));
    results.push(...await Promise.all(batch));
  }

  const statuses = results.map((result) => result.status);
  const elapsed = results.map((result) => result.elapsed).sort((a, b) => a - b);
  const failures = results.filter((result) => result.failed);
  const avgTime = elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length;
  const p95Index = Math.ceil(elapsed.length * 0.95) - 1;
  const p95 = elapsed[p95Index] || 0;

  return {
    route,
    total: results.length,
    status200: statuses.filter((status) => status === 200).length,
    status3xx: statuses.filter((status) => status >= 300 && status < 400).length,
    status4xx: statuses.filter((status) => status >= 400 && status < 500).length,
    status5xx: statuses.filter((status) => status >= 500).length,
    failures: failures.length,
    avgTimeMs: Math.round(avgTime),
    p95TimeMs: Math.round(p95),
    slowOver2s: elapsed.filter((value) => value > 2000).length,
    minTimeMs: Math.round(elapsed[0] || 0),
    maxTimeMs: Math.round(elapsed[elapsed.length - 1] || 0),
    sampleErrors: Array.from(new Set(failures.map((failure) => failure.error).filter(Boolean))).slice(0, 3),
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log("=== LOAD TEST ===");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Requests/route: ${REQUESTS_PER_ROUTE}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms`);
  console.log(`Routes: ${ROUTES.length}`);
  console.log(`Total requests: ${ROUTES.length * REQUESTS_PER_ROUTE}`);
  console.log("");

  const routeResults = [];

  for (const route of ROUTES) {
    const result = await loadTestRoute(route);
    routeResults.push(result);

    const statusLine = `${result.status200} x 200, ${result.status3xx} x 3xx, ${result.status4xx} x 4xx, ${result.status5xx} x 5xx`;
    console.log(
      `${route.padEnd(42)} avg ${String(result.avgTimeMs).padStart(5)}ms ` +
      `p95 ${String(result.p95TimeMs).padStart(5)}ms ` +
      `fail ${String(result.failures).padStart(2)} ` +
      `slow ${String(result.slowOver2s).padStart(2)} | ${statusLine}`,
    );
  }

  const totalFailures = routeResults.reduce((sum, result) => sum + result.failures, 0);
  const total500 = routeResults.reduce((sum, result) => sum + result.status5xx, 0);
  const slowRoutes = routeResults.filter((result) => result.avgTimeMs > 2000 || result.p95TimeMs > 2000);
  const poolTimeoutRoutes = routeResults.filter((result) =>
    result.sampleErrors.some((error) => /pool|timeout/i.test(error)),
  );

  const payload = {
    startedAt,
    baseUrl: BASE_URL,
    concurrency: CONCURRENCY,
    requestsPerRoute: REQUESTS_PER_ROUTE,
    timeoutMs: TIMEOUT_MS,
    routes: routeResults,
    totals: {
      routes: ROUTES.length,
      requests: ROUTES.length * REQUESTS_PER_ROUTE,
      failures: totalFailures,
      status5xx: total500,
      slowRoutes: slowRoutes.length,
      poolTimeoutRoutes: poolTimeoutRoutes.length,
    },
  };

  mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
  writeFileSync(
    path.join(process.cwd(), "tmp", "phase30_11_load_test_results.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`Total failures: ${totalFailures}`);
  console.log(`Total 5xx errors: ${total500}`);
  console.log(`Routes with pool timeout-like failures: ${poolTimeoutRoutes.length}`);
  console.log(`Slow routes over 2000ms avg or p95: ${slowRoutes.length}`);
  console.log("JSON: tmp/phase30_11_load_test_results.json");

  process.exit(totalFailures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Load test crashed:", err);
  process.exit(1);
});
