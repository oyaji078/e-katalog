# CHANGELOG — E-Katalog Fix Batch (P0–P7)

Date: 2026-06-08. Branch: `wip/phase27-recovery`. Executed sequentially in the working tree (corrected & ground-truthed from the pasted P0–P7 list). No cart/checkout/payment/shipping/order. No internal id / cost / margin exposed. No `prisma migrate reset`.

> Several pasted prompts were already-done, intentional, or based on wrong field/model names; each is marked **SKIPPED** or **CORRECTED** below with the reason.

## P0 — Backup + sanity check
- [x] **SKIPPED (file copy)** — git is the safety net; work done in-tree with diff review. `prisma validate` ✅ passed.

## P1A — Retail price leak to guests
- [x] `src/app/produk-tersimpan/SavedProductsClient.tsx` — now fetches the **role-gated** `/api/products/saved` (body `{ productIds }`) and consumes the pre-mapped `ProductCardProps[]` directly. Removed the local `SavedProduct` interface + inline `Rp ${}` mapping that had surfaced `retailPrice` for guests.
- [x] `src/app/api/products/batch/route.ts` — removed `retailPrice` from the `select` (defense-in-depth; this public endpoint must never expose retail pricing).
- ProductCard already guards `retailPrice &&` — no change needed.
- **Why it was real:** `/batch` selected `retailPrice` with no role check and the saved page fetched `/batch`; `/api/products/saved` (already present) gates retail price via `canSeeRetailPrice` + `toProductCardProps`.

## P1B — Public logout returned 404
- [x] `src/components/layout/PublicNavbar.tsx` — replaced the `<form action="/api/auth/signout" method="POST">` (no such route) with a button calling `handleLogout` → `signOut()` from `@/lib/auth-client` + redirect to `/login`, mirroring `LogoutButton.tsx`.

## P1C — `/categories` index was 404
- [x] Created `src/app/categories/page.tsx` (server, `force-dynamic`): active-category grid with per-category **active** product counts (via `product.groupBy`), each card linking to `/categories/[slug]`. Reuses `PublicNavbar`/`PublicFooter`/`getPublicSiteSettings`. The footer "Kategori" link (`PublicFooter.tsx:71`) now resolves.

## P2 — High batch
- **[A] Login redirect — SKIPPED:** already role-aware via `getRoleRedirect` in `src/app/login/page.tsx` (with safe-callbackUrl handling). The prompt's target `/admin/dashboard` does **not exist** (would 404); applying it would regress.
- [x] **[B] Mask OTP in reports** — new `src/lib/mask.ts` → `maskToken()` (reveals at most the last 2 chars; the prompt's `slice(0,3)+'***'+slice(-2)` would expose 5/6 digits of a 6-digit OTP). Applied in `src/app/admin/reports/page.tsx` (table) and `src/app/admin/reports/export/route.ts` (CSV).
- **[C] Inquiry error handling — SKIPPED (per decision):** `/api/inquiries/whatsapp` returns 200 with a fallback WhatsApp link on unexpected errors **by design** (explicit code comment). Kept.
- **[D] formatRupiah helper — SKIPPED:** already exists in `src/lib/currency.ts`. The P1A rewrite also removed the only inline `Rp ${}` in the saved page.

## P3 — Upload security hardening
- [x] `src/lib/upload/storage.ts` — added `assertImageMagicBytes(buffer, mime)` (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WEBP `RIFF`) and call it on the read buffer in `saveImageFile` / `saveSiteImage` / `saveCategoryImage` / `saveBrandImage` (covers product + promo-banner via `saveImageFile`) before sharp/write. Extends the existing MIME+size validation; sharp re-encode remains a second line of defense.

## P4 — Missing DB indexes (CORRECTED)
- [x] `prisma/schema.prisma` — added **only the 2 valid+new** indexes: `User @@index([retailStatus])` and `Voucher @@index([isActive, status, startsAt, endsAt])`.
- [x] Migration `prisma/migrations/20260608000000_add_retailstatus_voucher_indexes/` — hand-authored (SQL from `prisma migrate diff`) and applied via `prisma migrate deploy` (15 migrations, "Database schema is up to date!"). `migrate dev` is unusable here: the legacy history is not cleanly replayable on a shadow DB (`20260525000000_phase_24_reopen_fix` references `FlashSale` out of order) — a pre-existing issue, same reason the prior catalog-index migration was hand-authored.
- **SKIPPED (would break `prisma validate`):** `Product @@index([categoryId, isActive])` / `([isActive, createdAt])` → Product has `status`, not `isActive` (equivalents `[categoryId, status]` / `[status, createdAt]` already exist); `Analytics …` → model is `AnalyticsEvent` (already has `[createdAt]`, `[productId]`); `RetailToken @@index([status, userId])` → field is `assignedToUserId`, not `userId`.

## P5 — Flash-sale flag ignored on category page (CORRECTED)
- [x] `src/app/categories/[slug]/page.tsx` — added `isFeatureEnabled("enable_flash_sale")`; the `flashSaleProduct.findMany` only runs (and flash pricing is only applied) when the flag is on. Used `isFeatureEnabled` (boolean), **not** the prompt's `getFeatureFlag` (which returns a record/null and is always truthy).

## P6 — Playwright E2E
- [x] `playwright.config.ts` (testDir `tests/e2e`, baseURL `:3000`, desktop+mobile, `webServer` reuses `npm run dev`); `package.json` script `test:e2e`.
- [x] `tests/e2e/retail-price-leak.spec.ts` — guest `POST /api/products/saved` returns no `retailPrice`; `/produk-tersimpan` shows no `Retail:` (uses the real `ekatalog_saved_products_v1` localStorage key — the prompt's `savedProducts` was wrong).
- [x] `tests/e2e/auth-flow.spec.ts` — login→logout→`current-user` 401; regular user blocked from `/admin`; `GET /categories` ≠ 404.
- Requires `npx playwright install chromium`.

## P7 — Verification (all gates green ✅)

- [x] `npm run typecheck` — pass (0 errors)
- [x] `npm run lint` — pass (0 warnings)
- [x] `npm run build` — pass (`BUILD_ID isHB3LVTzd--AKVfr9-04`; new `ƒ /categories` route + `ƒ Proxy (Middleware)` present)
- [x] `npx prisma validate` — valid 🚀
- [x] `npx prisma migrate status` — clean, "Database schema is up to date!" (15 migrations)
- [x] `npm run test:e2e` — **10/10 passed** (desktop + mobile), after `npx playwright install chromium`
- [x] Runtime smoke `node tmp/recovery_runtime_check.mjs` — **13/13 routes 200** (public + admin + super-admin); **0** 500s / hydration / overflow at 360/390/414/768

### Verification notes
- **Logout e2e fix:** the sign-out assertion was corrected to issue a same-origin **browser** `fetch` (like `authClient.signOut()`). better-auth `/api/auth/sign-out` enforces CSRF via the `Origin` header (a Node-side request omits it → 403) and requires a JSON body (no body → 415). Sign-in returns 200 — auth is fully functional.
- **Environmental, not a regression:** a stale/wedged dev server first produced a transient product-page 500 (`jest-worker child process exceptions`) and `/api/auth/*` 404s after `next build` polluted `.next`. Clearing `.next` + restarting dev resolved both (no auth code was touched). After the clean restart sign-in is 200 and all 13 routes pass.
- 6 of the earlier e2e runs initially skipped because the demo **retail** user login couldn't establish a session on the polluted server; after the clean restart all 10 run and pass.
