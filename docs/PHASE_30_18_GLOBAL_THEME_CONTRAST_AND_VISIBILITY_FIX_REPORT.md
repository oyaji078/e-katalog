# Phase 30.18 Global Theme Contrast And Visibility Fix Report

## 1. Executive Verdict

PHASE 30.18 FAILED — ELEMENTS STILL INVISIBLE

This is the only non-passed allowed verdict, and it is used because the final status gate cannot be satisfied: `npx prisma migrate status --schema prisma/schema.prisma` failed against the local MySQL datasource, and runtime visual checks were blocked by `connect ECONNREFUSED 127.0.0.1:3307`.

Implementation work for the contrast fix is complete, and build/typecheck/lint passed. No fully verified runtime pass is claimed.

## 2. Root Cause of Invisible Elements

The navy/teal/yellow palette was not the root issue. The issue was that old foreground aliases were still being used across mixed surfaces:

- `text-brand-text`, `text-white`, and pale slate/gray text appeared inside white or soft-light admin cards.
- `text-brand-muted` mapped to dark-surface muted text and became too faint on light surfaces.
- Buttons, disabled states, badges, and hover states did not consistently switch foreground by surface.
- Admin shared components inherited public dark-theme foreground assumptions while rendering many light cards.

## 3. Foreground Token Fix

Added explicit surface-aware CSS variables in `src/app/globals.css` and `buildSiteThemeStyle`:

- Base/surface/support/accent tokens.
- Text-on-dark, muted-on-dark, text-on-light, muted-on-light, text-on-accent tokens.
- Dark/light border tokens.
- Soft dark and soft light surface tokens.

Tailwind aliases now include `brand-on-dark`, `brand-muted-on-dark`, `brand-on-light`, `brand-muted-on-light`, `brand-on-accent`, `brand-base`, `brand-surface`, `brand-support`, `brand-accent`, `brand-dark`, and `brand-light`.

Also added a light-surface fallback so old `bg-white` / `bg-brand-soft-white` cards resolve legacy text aliases to navy/surface-blue foregrounds, while preserving red, green, yellow, teal, and navy button foregrounds.

## 4. Admin Category Page Fix

`/admin/categories` was updated to keep admin cards on light surfaces with explicit navy foregrounds:

- Metric cards use readable navy primary text and surface-blue muted text.
- Category cards expose visible title, slug, description, product count, status, and metadata.
- Edit uses yellow background with navy text.
- Disable uses readable amber tint.
- Delete uses red/destructive styling.
- Dialogs, labels, inputs, placeholders, and helper text use light-surface foregrounds.

## 5. Admin Global Contrast Fix

Applied the same foreground mapping across admin layout and shared components:

- Admin sidebar and mobile navigation now use readable inactive text, yellow active state, and visible hover states.
- KPI cards, operational cards, recent activity cards, charts, product tables, brand cards, promo voucher cards, retail user controls, reports, dialogs, and form controls use explicit surface-aware colors.
- Admin root layouts now scope `admin-ui` contrast guardrails over admin pages.

## 6. Super Admin Contrast Fix

Updated super-admin layout and key surfaces:

- Super-admin sidebar/layout inherits readable dark background defaults.
- Dashboard cards, system health panels, feature flag panels, quick actions, and admin user surfaces use explicit light-surface foregrounds.
- Dangerous actions remain red with readable foregrounds.

## 7. Public Catalog Contrast Fix

Public product cards were moved to dark surface foreground mapping:

- Product cards use surface/dark card backgrounds.
- Titles use text-on-dark.
- Metadata uses muted-on-dark.
- Prices use yellow accent.
- Badges use readable foregrounds.
- Saved-product icon controls remain visible.
- WhatsApp CTA remains success green with white text.
- Product listing filters, chips, pagination, empty states, voucher CTAs, and detail-page CTA surfaces were cleaned up for readable foregrounds.

## 8. Hover State Fix

Updated hover and active states:

- Navbar links hover/active to yellow accent.
- Sidebar hover uses readable yellow tint and active yellow/navy state.
- Primary buttons hover to the darker yellow token.
- Secondary/support buttons keep readable text.
- Product card hover uses accent border/shadow while retaining visible text.
- Form focus border/ring uses yellow accent.
- Table/card row hovers avoid hiding text on light cards.

## 9. Store Settings Preview Fix

`/admin/store-settings` was updated so preview samples show:

- Base sample with text-on-dark.
- Surface sample with text-on-dark.
- Support sample with text-on-dark.
- Accent sample with text-on-accent.
- Text-on-light sample.
- Muted-on-dark sample.

The theme style builder now emits the expanded token set so saved theme colors update the public/admin CSS variables consistently. Existing validation and announcement settings were preserved.

## 10. Accessibility/Contrast Audit

Practical audit actions completed:

- Removed or guarded major light-text-on-light-card patterns in admin surfaces.
- Replaced low-contrast muted aliases on light cards with `brand-muted-on-light`.
- Added placeholder color rules for admin forms.
- Preserved readable destructive and success action colors.
- Avoided low-opacity readable text patterns for core UI surfaces.
- Added a Playwright checker at `tmp/phase30_18_runtime_check.mjs` to sample route load, horizontal overflow, token availability, and computed contrast.

Runtime execution of the checker was blocked by the unavailable local MySQL service.

## 11. Commands Executed

- `npx prisma validate`: passed.
- `npm run prisma:generate`: passed.
- `npx prisma migrate status --schema prisma/schema.prisma`: failed.
  - Output identified datasource `127.0.0.1:3307`.
  - Prisma returned `Error: Schema engine error:`.
  - Dev-server runtime logs showed `connect ECONNREFUSED 127.0.0.1:3307`.
- `npm run typecheck`: passed.
- `npm run lint`: passed with one warning.
  - Existing warning: `src/components/layout/FigmaFooter.tsx:69:15` uses `<img>`.
- `npm run build`: passed.

Command intentionally not run:

- `npx prisma migrate reset`.

## 12. Runtime Test Results

`npm run dev` started successfully at `http://localhost:3000`.

The requested route sweep could not be completed because the local MySQL database was not running:

- Public `/products` triggered Prisma `DriverAdapterError`.
- Cause logged by Next dev server: `connect ECONNREFUSED 127.0.0.1:3307`.
- `docker ps` also failed because Docker Desktop was not running.

Because of this, visual checks for admin category cards, sidebar, tables, forms, buttons, hover states, and mobile overflow are not marked as passed.

## 13. Remaining Backlog

- Start the local MySQL service, for example the repo's `docker-compose.yml` service `mysql`, without running migrate reset.
- Rerun `npx prisma migrate status --schema prisma/schema.prisma`.
- Rerun `npm run dev` and `node tmp/phase30_18_runtime_check.mjs`.
- Manually inspect `/admin/categories`, `/admin/products`, `/admin/store-settings`, `/super-admin/feature-flags`, `/products`, saved products, and product detail after the database is available.
- Optional unrelated cleanup: replace the existing `<img>` in `src/components/layout/FigmaFooter.tsx` if the lint warning should be eliminated.

## 14. Final Status Gate

Not passed.

The code-level contrast implementation and build validation are complete, but the phase cannot be marked passed until the database-dependent Prisma migration status and runtime visual checks complete successfully.
