# `/products` Performance Analysis

Date: 2026-06-08 · Branch: `wip/phase27-recovery` · Stack: Next.js 16.2.6 (App Router), Prisma + MariaDB

## Executive summary

The supplied DevTools report (LCP 2,571 ms, render delay 1,909 ms, JS compilation 549 ms,
render-blocking CSS chunk) was captured on the **dev server** (`npm run dev`). **Most of those
numbers are dev-mode artifacts that do not exist in a production build.** The codebase's server
data layer is already well-optimized. Two genuine, production-relevant improvements were applied;
a third (DB index) is recommended but deferred.

## What is dev-only noise (don't chase these)

| Reported item | Why it's a dev artifact |
|---|---|
| **JS compilation 549 ms**, `react-dom` eval 167 ms | Dev serves unminified React + unbundled per-module chunks via Turbopack. Production ships minified, tree-shaken bundles. |
| **`runWithFiberInDEV`, `initializeElement` hydration overhead** | `*InDEV` functions are stripped from production React entirely. |
| **Render-blocking CSS `[root-of-the-server]__0sxa36a._.css` (246 ms)** | Turbopack dev emits per-segment CSS chunks. `next build` inlines/optimizes critical CSS automatically. |
| **TTFB 662 ms (first hit)** | Dev compiles the route on first request. A warm production server has no compile step. |
| Report's `ssr:false` Footer example | Would not help LCP (the `<h1>` is the LCP element, not the footer) — not applied. |

➡️ **Action: re-measure on `npm run build && npm run start`** before trusting any of the above
numbers. Expect LCP/JS to drop sharply.

## What was already optimized (no change needed)

- **Feature flags** (`src/lib/feature-flags.ts`): the 5 `isFeatureEnabled(...)` calls on `/products`
  share **one** `findMany`, memoized per-request via React `cache()` — not 5 queries.
- **Site settings** (`src/lib/site-settings.ts`): `getPublicSiteSettings` is `unstable_cache`
  (cross-request, 300 s, tag-invalidated) wrapped in React `cache()` — served from the data cache,
  not the DB, on each request.
- **Product query**: already paginated (`take: 20 / skip`) with a narrow `productCardSelect`.
- **`ProductGrid`** is a **server component** — no avoidable client-hydration cost for the grid.

## Changes applied (real, production-relevant)

File: `src/app/products/page.tsx`

### 1. Streaming SSR for the product results (the legitimate LCP fix)
Previously the page `await`ed **all ~14 queries** (incl. the heavy `product.findMany` + vouchers +
flash-sale) before emitting **any** HTML — so the `<h1>` LCP candidate was blocked on the slowest
query. Now:
- The parent fetches only **lightweight shell data** (`user`, cached flags, cached settings,
  `categories`, `brands`, `count`) and streams the navbar + hero + `<h1>` + filter panels
  immediately.
- The expensive `product.findMany` + `voucher.findMany` + `flashSaleProduct.findMany` + card
  mapping moved into a new async server component **`ProductResults`**, wrapped in `<Suspense>`
  with a `ProductResultsFallback` skeleton that mirrors the grid (keeps CLS ~0).

Net effect: the LCP shell paints without waiting for the catalog query; products stream in.

### 2. Removed a redundant uncached DB read
The page called both `getStoreWhatsappNumberFromDB()` (live, **uncached**) **and**
`getPublicSiteSettings()` (cached). The cached settings already expose the resolved
`whatsappNumber` from the same `SiteSetting` singleton, so the separate call was a redundant
round-trip on the critical path. Now the WhatsApp URL uses `settings.whatsappNumber`; the
`getStoreWhatsappNumberFromDB` import was dropped. (Behavior is identical for any normally
configured store; the only divergence is the unreachable edge case of a `SiteSetting` singleton
with an empty `whatsappNumber` plus a populated legacy `store_whatsapp_number` key.)

## Verification
- `npm run typecheck` → **PASS** (0 errors)
- `npm run build` → **PASS**; `/products` builds as a dynamic route with the streamed boundary.

## Recommended but NOT applied (needs sign-off)

- **Composite DB index for the default sort.** The default ordering is
  `inquiryCount desc, clickCount desc, viewCount desc, createdAt desc` over all `ACTIVE` products;
  without a matching index this is a filesort that grows with catalog size. Adding
  `@@index([status, inquiryCount, clickCount, viewCount, createdAt])` (and an index supporting the
  `publicPrice` sort) to `prisma/schema.prisma` would help the heaviest query in production. Not
  applied here because it requires a Prisma migration against the DB, and `schema.prisma` is already
  part of the in-flight phase-27 changes — this should land deliberately with a migration.
- **Search (`contains`) on `name/sku/brand.name/category.name`.** `LIKE %term%` cannot use a
  standard B-tree index. If product search latency becomes an issue at scale, consider a FULLTEXT
  index or a search service. Not a concern for the default (unfiltered) listing.

## Notes
Changes are uncommitted in the working tree alongside the broader phase-27 WIP. No commit/PR was
created (not requested).
