# PHASE 30.11 Load Test Results

Date: 2026-05-30  
Project: E-katalog computer/electronics catalog  
Mode: Local production server

## Test Environment

- OS: Windows, PowerShell
- App runtime: Next.js production server
- Server command: `npm run start -- -p 3001`
- Port used: `3001`
- Port note: `3000` was occupied, so the production server was started on `3001`
- Base URL: `http://localhost:3001`
- Database: MySQL reachable
- Prisma status: schema up to date after normal migration deploy
- Load script: `scripts/load-test.mjs`
- Result artifact: `tmp/phase30_11_load_test_results.json`

## Test Method

- Safe routes only
- GET requests only
- No destructive admin actions
- Concurrency: `10`
- Total requests per route: `50`
- Timeout per request: `10000ms`
- Total routes tested: `15`
- Total requests: `750`
- Failure definition: network error, timeout, status `0`, or HTTP `5xx`
- Slow route threshold: average or p95 greater than `2000ms`

## Routes Tested

| Route | Requests | Statuses | Average | p95 | Failures |
| --- | ---: | --- | ---: | ---: | ---: |
| `/` | 50 | 200: 50 | 339ms | 460ms | 0 |
| `/products` | 50 | 200: 50 | 572ms | 1064ms | 0 |
| `/products?search=laptop` | 50 | 200: 50 | 597ms | 666ms | 0 |
| `/products?page=2` | 50 | 200: 50 | 500ms | 685ms | 0 |
| `/produk-tersimpan` | 50 | 200: 50 | 553ms | 1046ms | 0 |
| `/admin` | 50 | 200: 50 | 132ms | 185ms | 0 |
| `/admin/products` | 50 | 200: 50 | 128ms | 227ms | 0 |
| `/admin/categories` | 50 | 200: 50 | 121ms | 159ms | 0 |
| `/admin/promo-vouchers` | 50 | 200: 50 | 94ms | 109ms | 0 |
| `/admin/retail-users` | 50 | 200: 50 | 100ms | 114ms | 0 |
| `/admin/reports` | 50 | 200: 50 | 138ms | 207ms | 0 |
| `/super-admin` | 50 | 200: 50 | 104ms | 140ms | 0 |
| `/super-admin/system` | 50 | 200: 50 | 95ms | 106ms | 0 |
| `/super-admin/feature-flags` | 50 | 200: 50 | 96ms | 107ms | 0 |
| `/products/phase24-voucher-runtime-product` | 50 | 200: 50 | 203ms | 243ms | 0 |

## Summary

- Total requests: `750`
- Total failures: `0`
- HTTP 500 errors: `0`
- Pool-timeout-like failures: `0`
- Slow routes above 2000ms: `0`
- Highest average response time: `/products?search=laptop` at `597ms`
- Highest p95 response time: `/products` at `1064ms`

## Notes

- The admin and super-admin load-test requests were unauthenticated GET requests. The app resolved them through the auth flow without crashing, returning successful login-protected page responses.
- Authenticated admin and super-admin flows were separately verified in the runtime Playwright pass.
- No POST destructive endpoints were load tested.

## Recommendations

- Keep `/products` query paths indexed around product status, category, search-relevant fields, and pagination columns as the catalog grows.
- Add an authenticated load-test profile later if admin dashboards become data-heavy.
- Keep the load script in `scripts/load-test.mjs` so future phases can re-run the same baseline without extra dependencies.

## Verdict

PHASE 30.11 load test passed: no 500 errors, no pool timeout failures, and no severe slow route was observed.
