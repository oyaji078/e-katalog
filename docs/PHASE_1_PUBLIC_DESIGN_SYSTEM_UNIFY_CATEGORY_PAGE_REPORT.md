# PHASE 1 — Unify Public Design System: Category Page Migration

Date: 2026-06-04
Branch: `wip/phase27-recovery`
Scope: **Phase 1 only** (of the approved multi-phase plan). No other phases were touched.

---

## 1. Executive Verdict

**PHASE 1 PASSED — CATEGORY PAGE UNIFIED, NO DUPLICATE CATEGORY ROW, NO OVERFLOW, HERO VERIFIED**

`src/app/categories/[slug]/page.tsx` was migrated from the divergent `FigmaSiteHeader`/`FigmaFooter` design system to the standard `PublicNavbar`/`PublicFooter` used by the rest of the public site. The duplicate horizontal category row that lived in the Figma header (and was the one real mobile-overflow source) is gone. All static gates and live runtime tests pass against a reachable database.

---

## 2. What Changed

**File edited:** `src/app/categories/[slug]/page.tsx`

- Replaced `FigmaSiteHeader` → `PublicNavbar`, `FigmaFooter` → `PublicFooter`.
- Added the standard public-page data context used by sibling pages (`/products`): `getPublicSiteSettings()`, `getStoreWhatsappNumberFromDB()`, and `buildWhatsappUrl()`.
- Added a `topCategories` query (active categories, `sortOrder` then `name`) to feed `PublicFooter` — categories now appear only in the footer + homepage grid + `/products` filter, never as a header row.
- Re-themed the category header card and empty-state from Figma tokens (`brand-*`, `text-[10px] uppercase tracking`) to the standard public tokens (`--color-border`, `--color-text`, `--color-accent`, white cards, `max-w-7xl`).
- Preserved: user/session logic, `notFound()` on inactive/missing category, product query + flash-sale/voucher mapping, retail price gating, `overflow-x-hidden` safety on `<main>`.

**No other files were edited.** No components were deleted (see §6).

---

## 3. Preservation Checklist (adjustment #5)

| Requirement | Status | Notes |
|---|---|---|
| User/session logic | ✅ | `getCurrentUser().catch(() => null)` retained; same admin/retail gating via `canSeeRetailPrice` |
| Store settings | ✅ | `getPublicSiteSettings()` now wired into navbar + footer |
| WhatsApp number | ✅ | `getStoreWhatsappNumberFromDB()` → `buildWhatsappUrl()` with category-specific message |
| Announcement bar | ✅ | Rendered by `PublicNavbar` via `settings.announcementEnabled ? settings.announcementText : ""` |
| Search behavior | ✅ | `PublicNavbar` search form (`action="/products" method="get"`) preserved |
| Mobile layout | ✅ | `overflow-x-hidden` main; responsive `max-w-7xl`; verified at 360/390/414/768px |

---

## 4. Product URL Safety (adjustment #4)

- Homepage product card hrefs all use **slug** (e.g. `/products/p141-test-laptop-18`, `/products/m-riski-fahrurrozi`) — verified by scraping rendered HTML. No internal cuid appears in any public href.
- Product detail resolves by `slug` or `sku` only (`OR: [{ slug: id }, { sku: id }]`).
- Hitting an internal cuid URL directly (`/products/cmpgac6nc000ktcihdao6thlo`) returns **"Produk tidak ditemukan"** (no product data leaked).
- `productCardSelect` / `productDetailSelect` continue to exclude cost price, margin, and internal notes (unchanged in this phase).

**Pre-existing note (out of Phase 1 scope, logged for Phase 3):** the legacy-ID redirect branch (`products/[id]/page.tsx:111–123`) is intended to 302 a cuid to its slug, but a direct cuid URL currently renders the not-found page instead of redirecting. This does not expose data and does not affect any real link (all links use slugs). Will be addressed in Phase 3 (product card/detail cleanup) along with the `revalidatePath` cuid fix.

---

## 5. Hero Banner Re-Test (adjustment #3)

The homepage hero queries **`db.heroBanner`** (confirmed by the server diagnostic line `[hero-banner] ...`), not `PromoBanner`.

Current DB state: 2 HeroBanner rows, both `isActive: true`, **both `endsAt` = 2026-05-31** — i.e. expired as of today (2026-06-04). Therefore the schedule-aware query correctly returns none, and the fallback hero ("Komputer & Aksesoris…") is the *correct* output. Diagnostic logged: `[hero-banner] fallback used — no active HeroBanner matched current schedule`.

**Positive-path proof (reversible test):** I temporarily extended one banner's `endsAt` to 2026-12-31, then reloaded `/`:
- Fallback heading disappeared.
- Admin banner image rendered (`/uploads/promo-banners/4c2d5a586720ba7547fc79eca4fa7b81-1269d53d.jpg`).
- Diagnostic flipped to `[hero-banner] using HeroBanner`.

I then **restored** `endsAt` to its exact original value (`2026-05-31T15:59:59.999Z`) and re-confirmed the homepage returned to the fallback state. DB left unchanged.

**Conclusion:** active admin HeroBanner → renders on `/`; fallback shows only when no banner is in-schedule. Behavior is correct. (To see a banner live without code changes, an admin simply needs an active banner whose schedule includes today.)

---

## 6. Dead-Code Audit (adjustment #2 — searched, NOT deleted)

After migration I searched all `.ts/.tsx` imports:

| Component | Imported by | Status |
|---|---|---|
| `src/components/layout/FigmaSiteHeader.tsx` | only `src/components/ui/SiteHeader.tsx` | now orphaned |
| `src/components/layout/FigmaFooter.tsx` | only `src/components/ui/Footer.tsx` | now orphaned |
| `src/components/ui/SiteHeader.tsx` | **nothing** | dead |
| `src/components/ui/Footer.tsx` | **nothing** | dead |

This 4-file chain is now zero-import outside itself. **Per your instruction, nothing was deleted.** Logged as **dead-code backlog** for a later cleanup phase, after a second confirmation pass. (Note: the single ESLint `<img>` warning in the build comes from the now-dead `FigmaFooter.tsx`; it will vanish when that file is removed.)

---

## 7. Validation Commands

| Command | Result |
|---|---|
| `npx prisma validate` | ✅ Schema valid |
| `npm run prisma:generate` | ✅ Client generated (Prisma 7.8.0) |
| `npx prisma migrate status --schema prisma/schema.prisma` | ✅ **DB reachable** — 13 migrations, "Database schema is up to date!" |
| `npm run typecheck` (`tsc --noEmit`) | ✅ No errors |
| `npm run lint` (`eslint`) | ✅ 0 errors (1 warning in dead `FigmaFooter.tsx`) |
| `npm run build` | ✅ Compiled successfully; `/categories/[slug]` builds as dynamic route |
| `npx prisma migrate reset` | ❌ Not run (forbidden) |

---

## 8. Runtime Test Results (live, DB reachable)

Pages — all HTTP 200:

| Page | Status |
|---|---|
| `/` | 200 |
| `/products` | 200 |
| `/categories/aksesoris` | 200 |
| `/produk-tersimpan` | 200 |
| `/products/test-brg` (slug detail) | 200 |
| `/products/12` (sku detail) | 200 |
| `/products/<cuid>` | 200 → "Produk tidak ditemukan" (no data leak) |

Category page checks:
- Renders `RAMA COMPUTER` PublicNavbar logo. ✅
- Figma announcement ticker (`public-announcement-track`) count = **0** (old header fully gone). ✅
- Category links present only in footer (4 links, no duplicate header row). ✅

**Mobile horizontal overflow** — `document.documentElement.scrollWidth <= window.innerWidth` (Playwright, real viewports):

| Page \ Width | 360 | 390 | 414 | 768 |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/products` | ✅ | ✅ | ✅ | ✅ |
| `/categories/aksesoris` | ✅ | ✅ | ✅ | ✅ |
| `/produk-tersimpan` | ✅ | ✅ | ✅ | ✅ |
| `/products/test-brg` | ✅ | ✅ | ✅ | ✅ |

`scrollWidth === innerWidth` on every cell → **ALL_PASS: true**. Expected `true` met.

---

## 9. Final Status Gate

| Gate | Status |
|---|---|
| Category page uses PublicNavbar/PublicFooter | ✅ |
| Duplicate category header row is gone | ✅ (Figma ticker/category-row count = 0) |
| No horizontal overflow (360/390/414/768) | ✅ (20/20 PASS) |
| build / typecheck / lint / prisma pass | ✅ (migrate status confirms DB up to date) |
| Runtime pages load | ✅ (all 200) |
| Hero uses active HeroBanner, fallback only when none in-schedule | ✅ (verified both directions) |
| Public product URL uses slug/sku, no internal ID exposed | ✅ |

**Verdict: PHASE 1 PASSED.**

---

## 10. Backlog Carried Forward (not done in Phase 1)

1. **Dead-code deletion** (after a second confirm pass): `FigmaSiteHeader.tsx`, `FigmaFooter.tsx`, `SiteHeader.tsx`, `Footer.tsx`. Removes the lone ESLint `<img>` warning.
2. **Phase 3 items:** product card/detail polish; fix `admin/products/actions.ts:582` `revalidatePath` to use `slug || sku` instead of cuid; make the legacy-cuid → slug 302 redirect actually fire; remove unused `ProductDetailTabs.tsx` / `ProductImageGallery.tsx` after import check.
3. **Phases 4–7** as per approved plan (auth redesign, admin shell polish/verify, mobile sweep, final dead-code + validation gate).

Ready to proceed to **Phase 2** on your go-ahead.
