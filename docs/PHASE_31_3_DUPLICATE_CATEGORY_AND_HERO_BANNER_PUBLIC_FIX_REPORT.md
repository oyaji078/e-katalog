# PHASE 31.3 — Duplicate Category Navigation Removal + Hero Banner Admin→Public Fix

Date: 2026-06-04
Branch: `wip/phase27-recovery`

---

## 1. Executive Verdict

**PHASE 31.3 PASSED WITH MINOR BACKLOG**

Both reported defects were root-caused and fixed at the logic level (not just styling):

- **A — Duplicate category navigation:** The public header (`PublicNavbar`) rendered a second full category row beneath the navbar, duplicating the homepage "Kategori Produk" grid and the `/products` filter. The navbar category bar was removed. Category navigation now appears exactly once per public view.
- **B — Hero banner not displaying:** The public homepage was querying the **wrong model** — `db.promoBanner` — while feeding the result into the `HeroBanner` component. It now queries `db.heroBanner`. An active admin HeroBanner now drives the public hero (title/subtitle/image), and the static fallback only shows when no active HeroBanner exists.

Static gates all pass: `prisma validate`, `prisma generate`, `tsc --noEmit` (typecheck), `eslint` (lint), and `next build`.

**Minor backlog (environment, not code):** The MySQL database at `127.0.0.1:3307` is **not reachable** in this environment (Docker daemon not running). Therefore `prisma migrate status` and the live browser runtime test (open `/admin/hero-banners`, then `/`) could **not** be executed here. The data-flow fix is verified by code audit + successful production build. Live confirmation must be run once the DB is up. See sections 8 and 10.

---

## 2. Duplicate Category Root Cause

Categories were rendered in **three** places on public pages, two of which overlapped:

1. `src/components/layout/PublicNavbar.tsx` — a dedicated "Category Bar" block (`overflow-x-auto` row of category links) rendered directly under the navbar on **every** public page that used the header (`/`, `/products`, `/products/[id]`, `/vouchers`, `/produk-tersimpan`, `not-found`).
2. `src/app/page.tsx` — the homepage "Kategori Produk" icon grid section.
3. `src/app/products/page.tsx` — the catalog "Kategori" filter (`FilterPanel`).

The navbar bar (#1) was the redundant element: it duplicated #2 on the homepage and sat above #3 on the catalog. It was also a horizontal-scroll element directly under the header — a mobile overflow risk.

---

## 3. Category Placement Fix

**Decision applied:** keep categories in the catalog/filter area near product listings; remove the category row from the public header.

Changes:

- `src/components/layout/PublicNavbar.tsx`
  - Removed the entire "Category Bar" JSX block (the second row under the navbar).
  - Removed the `categories` prop from `PublicNavbarProps` and the `topCategories` slice.
  - Header now contains only: Logo (Beranda link), Search, Tersimpan (saved), WhatsApp, and Masuk/Akun + Daftar Retail.
- Removed the now-unused `categories={...}` / `categories={topCategories}` prop from every `PublicNavbar` caller:
  - `src/app/page.tsx`
  - `src/app/products/page.tsx`
  - `src/app/products/[id]/page.tsx`
  - `src/app/vouchers/page.tsx`
  - `src/app/produk-tersimpan/page.tsx`
  - `src/app/not-found.tsx`
  - (Callers still pass `topCategories`/`categories` to `PublicFooter` and `/products` `FilterPanel`, which is intended and unchanged.)

Resulting placement:

- Homepage `/`: category grid appears **once** (the "Kategori Produk" section).
- Catalog `/products`: category filter appears **once** (in `FilterPanel`, desktop sidebar + mobile `<details>`).
- Mobile bottom nav (`MobileBottomNav`): unchanged — it has **no** category chip list, only Beranda/Katalog/(Voucher)/Simpan/Akun shortcuts, so no duplication was introduced.

---

## 4. Hero Banner Data Flow Audit

| Layer | Before | After |
|---|---|---|
| Admin model | `HeroBanner` (managed at `/admin/hero-banners`, `actions.ts` writes `isActive`, `imageUrl`, `sortOrder`, `startsAt`, `endsAt`) | unchanged |
| Public query (`src/app/page.tsx`) | **`db.promoBanner.findFirst(...)`** — wrong model | **`db.heroBanner.findMany(...)`** with `take: 1` |
| Component | `HeroBanner` (`src/components/ui/HeroBanner.tsx`) — fine, supports `priority`, `sizes="100vw"`, stable min-height, gradient fallback | unchanged |
| Image validation | none in homepage path | `isRenderablePromoBannerImageUrl()` applied; invalid/missing path → gradient fallback with title/subtitle |

**Root cause:** the homepage was reading from `PromoBanner` (a different admin feature) and rendering it as the hero. Because no active `PromoBanner` matched, `activeBanner` was null and the hardcoded fallback hero ("Komputer & Aksesoris untuk Kebutuhan Kerja…") always showed — regardless of the admin HeroBanner state.

**Active selection rules now implemented (Section B spec):**
- `isActive: true` required.
- Schedule window honored via `OR` of: (start ≤ now ≤ end) | (start null & end null) | (start null & end ≥ now) | (start ≤ now & end null). So null dates still qualify.
- Multiple matches: `orderBy [{ sortOrder: "asc" }, { updatedAt: "desc" }]` → lowest sortOrder first, then latest updated. `take: 1`.
- CTA is **not** required; hero renders with image + text only.
- Image: if present and a renderable `/uploads/...` path → used with Next `<Image priority fill sizes="100vw">`. If missing/invalid → gradient fallback retaining title/subtitle.

Resolver added: `resolveHeroBanner()` in `src/app/page.tsx`.

---

## 5. Hero Banner Selected for Public

Selection is deterministic: the first row returned by the active-window query ordered by `sortOrder asc, updatedAt desc`.

Because the DB is unreachable in this environment, the concrete selected `id`/`title`/`imageUrl` cannot be printed here. The server-side debug logging (Section C, see §6) will emit the selected banner's `id`, `title`, `imageUrl`, renderability, and fallback reason to the server console in development on the next live run.

---

## 6. Why Fallback Was Previously Showing

The fallback hero (`"Komputer & Aksesoris untuk Kebutuhan Kerja, Gaming, dan Toko Retail"`) showed because:

> The homepage queried the **wrong model (`PromoBanner`)** instead of `HeroBanner`. The `HeroBanner` table — where the admin's active banner lives — was never queried, so `activeBanner` resolved to `null` and the static fallback branch always rendered.

This is now fixed. Additionally, **dev-only** diagnostic logging was added (no public exposure — guarded by `process.env.NODE_ENV !== "production"` and written via `console.info` server-side only):

- When fallback is used: logs `"fallback used — no active HeroBanner matched current schedule"`.
- When a banner is selected: logs `source: "HeroBanner"`, `id`, `title`, `imageUrl`, `imageRenderable` (bool), and `imageReason` (`ok` / `missing image — gradient fallback` / `invalid path — gradient fallback`).

This proves at runtime (a) which model is used (`HeroBanner`), (b) total/active selection, (c) selected id/title/imageUrl, and (d) the exact reason for any fallback.

---

## 7. Public Hero UI Result

- Uses active admin banner image as the background visual (`object-cover`, `opacity 0.45`) when a renderable image exists.
- Renders banner `title` and `subtitle` (subtitle as an uppercase pill above the title).
- No forced CTA button.
- No category row around the hero (the duplicate navbar bar is gone).
- Dark/navy gradient overlay over the image keeps text readable; gradient-only fallback when no image.
- `clamp()` title sizing + `min-h-[300px] sm:min-h-[420px]` for stable, readable mobile rendering without overcropping.
- Full-bleed (edge to edge), blending into the light catalog section below.

---

## 8. Mobile Check

**Code-level:** the removed navbar category bar was an `overflow-x-auto` horizontal strip directly under the header — removing it eliminates a known overflow/clutter source. The hero uses `w-full` + `clamp()` text and the catalog filter is the single category surface.

**Live viewport test (360/390/414/768px) + `document.documentElement.scrollWidth <= window.innerWidth`:** **NOT executed** — blocked by the unreachable database (the dev server returns 500 on `/` and `/products` because Prisma cannot connect to `127.0.0.1:3307`). Must be run once the DB is available. Logged as backlog.

---

## 9. Commands Executed

| Command | Result |
|---|---|
| `npx prisma validate` | ✅ Schema valid |
| `npm run prisma:generate` | ✅ Client generated (Prisma 7.8.0) |
| `npx prisma migrate status --schema prisma/schema.prisma` | ⚠️ **Blocked** — `P1001: Can't reach database server at 127.0.0.1:3307` (Docker daemon down) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ No errors |
| `npm run lint` (`eslint`) | ✅ 0 errors (1 pre-existing warning in `FigmaFooter.tsx`, unrelated) |
| `npm run build` (`prisma generate && next build`) | ✅ Compiled successfully in ~14s |
| `npx prisma migrate reset` | ❌ Not run (forbidden) |

---

## 10. Runtime Test Results

Live runtime test (Section E) could **not** be completed in this environment:

- `npm run dev` starts, but every DB-backed page (`/`, `/products`) returns a Prisma `DriverAdapterError` / pool timeout because `127.0.0.1:3307` refuses connections (`ECONNREFUSED`). Docker daemon is not running and `docker compose up -d mysql` fails to reach the Docker API.

What **was** verified:
- `next build` compiles `/` and `/products` (and all routes) with the new `heroBanner` query and the navbar without the category bar — no type or build errors.

To complete acceptance once the DB is up, run:
1. `docker compose up -d mysql` (or start MySQL on `127.0.0.1:3307`).
2. `npm run dev`.
3. Open `/admin/hero-banners`, ensure ≥1 banner `Aktif`; note title/subtitle/image.
4. Open `/`; confirm the same banner title/subtitle/image renders and the old fallback text is gone.
5. Confirm category list appears once on `/` and once on `/products`.
6. Check the server console for the `[hero-banner]` diagnostic line.
7. At 360/390/414/768px, run `document.documentElement.scrollWidth <= window.innerWidth` → expect `true`.

---

## 11. Remaining Backlog

1. **Live DB runtime verification** (blocked here): execute Section E steps and the mobile overflow check against a running MySQL instance.
2. **`prisma migrate status`**: re-run once DB reachable to confirm no pending migrations.
3. Consider deleting stray `*.before_*` backup files noted in the repo root (out of scope for this phase).

---

## 12. Final Status Gate

| Gate | Status |
|---|---|
| 1. Category list appears only once | ✅ Code-verified (navbar bar removed; homepage grid + catalog filter are the single surfaces) |
| 2. Public header no longer has duplicate category row | ✅ Removed from `PublicNavbar` and all callers |
| 3. Active admin HeroBanner appears on public homepage | ✅ Code-verified (now queries `db.heroBanner`); ⚠️ live confirmation pending DB |
| 4. Fallback hero not shown when active banner exists | ✅ Logic-verified (fallback only when resolver returns null); ⚠️ live confirmation pending DB |
| 5. Mobile has no horizontal overflow | ⚠️ Overflow-prone navbar strip removed; live 360/390/414/768 check pending DB |
| 6. build / typecheck / lint / prisma validate+generate pass | ✅ All pass (`migrate status` blocked by env, not code) |

**Verdict: PHASE 31.3 PASSED WITH MINOR BACKLOG** — code fixes complete and statically verified; the only outstanding item is live runtime confirmation, which is blocked solely by the unavailable database in this environment.
