# Phase 31 Bugfix Report

Date: 2026-06-03
Branch/worktree: existing dirty worktree preserved

## 1. Hero Full-Width Fix

Files:
- `src/app/page.tsx`
- `src/components/ui/HeroBanner.tsx`

Changes:
- Kept the hero outside the `max-w-7xl` content container.
- Removed the standalone spacer below the hero and moved the content spacing into the content container via `pt-6`.
- Updated the inline fallback hero outer node to `relative min-h-[380px] w-full overflow-hidden ... sm:min-h-[440px]`.
- Made fallback hero text bottom-aligned with an absolutely positioned content wrapper.
- Verified `HeroBanner` remains full width with no radius, no container, `priority`, `fill`, `sizes="100vw"`, and image opacity `0.45`.

Browser result:
- `/` hero geometry: left `0`, right `1440`, width `1440`, viewport width `1440`, border radius `0px`, overflow `hidden`.

## 2. Sidebar Text Visibility Fix

Files:
- `src/components/layout/AdminSidebar.tsx`
- `src/app/globals.css`

Changes:
- Kept inactive nav text at `rgba(255,255,255,0.65)`.
- Kept hover text at `rgba(255,255,255,0.92)` and hover bg at `rgba(255,255,255,0.07)`.
- Kept active text `#FFFFFF`, active bg `rgba(59,130,246,0.18)`, and 3px left accent `#3B82F6`.
- Kept icons at `18px`, inheriting parent color.
- Set section label tracking to exact `tracking-[0.10em]`.
- Preserved brand text as `text-white/95` and version text as `text-white/20`.

Browser note:
- `/admin` redirects to `/login?callbackUrl=%2Fadmin` without an authenticated admin session, so sidebar visibility was code-verified rather than live-browser-verified.

## 3. Admin Typography Fix

File:
- `src/app/globals.css`
- `src/app/admin/DashboardTabs.tsx`

Changes:
- Removed the broad `.admin-ui p, .admin-ui span, .admin-ui div { color: #111827; }` override so muted/helper classes can render correctly.
- Set admin defaults to `13px`, `#334155`, and line-height `1.6`.
- Set h1 to `20px`, `700`, `#0F172A`, `-0.01em`.
- Set h2/h3 to `15px`, `600`, `#1E293B`.
- Set table headers to `11px`, `600`, uppercase, `0.06em`, `#64748B`.
- Set table body cells to `13px`, `500`, `#0F172A`.
- Set muted brand text mappings to `#64748B` and helper text to `12px`, `#94A3B8`.
- Updated dashboard tabs to `13px`; inactive `500/#64748B`, active `600/#3B82F6`.
- Updated KPI labels to `11px/600/uppercase/0.05em/#64748B`; KPI numbers remain `30px/800/#0F172A`.

## 4. Font Loading Fix

File:
- `src/app/layout.tsx`
- `src/app/globals.css`

Result:
- Inter was already configured through `next/font/google` with weights `300`, `400`, `500`, `600`, `700`, and `800`, `display: "swap"`, and variable `--font-inter`.
- `metadataBase` was already configured with `NEXT_PUBLIC_APP_URL` fallback to `http://localhost:3000`.
- Simplified the CSS font stack to `var(--font-inter), "Inter", system-ui, -apple-system, sans-serif`.

## 5. Router Error Fix

Files:
- `src/app/admin/products/ProductFormClient.tsx`
- `src/app/admin/flash-sales/FlashSaleFormClient.tsx`
- `src/app/retail/activate/activation-form.tsx`

Changes:
- Replaced post-success `router.push()` calls inside effects with `window.location.href`.
- Removed now-unused `useRouter` imports and component-level router instances from those files.
- Preserved valid event-handler navigation and `router.refresh()` usage elsewhere.
- Confirmed there is no `src/components/layout/TopBar.tsx`; existing `AdminTopbar.tsx` and `LogoutButton.tsx` already use `signOut()` followed by `window.location.href = "/login"`.

Browser result:
- Public route and admin login redirect produced no browser console errors and no Next.js error overlay.
- No `Router action dispatched before initialization` was observed in the checked routes.

## 6. LCP Image Fix

Files:
- `src/components/ui/FigmaProductCard.tsx`
- `src/components/ui/ProductCard.tsx`
- `src/components/ui/ProductGrid.tsx`
- `src/components/ui/HeroBanner.tsx`

Changes:
- `ProductGrid` already passes `isFirst={index < 5}` and this was preserved.
- Added conditional image loading to `FigmaProductCard`: `loading={eager ? "eager" : "lazy"}` with `priority={eager}`.
- Added conditional image loading to legacy `ProductCard`: `loading={isFirst ? "eager" : "lazy"}` with `priority={isFirst}`.
- Verified hero image keeps `priority`, `fill`, and `sizes="100vw"`.

Browser result:
- The detected above-fold image loaded with `loading="eager"`.

## 7. Build Result

Commands:
- `npm run typecheck`: exit `0`
- `npm run lint`: exit `0` with one warning
- `npm run build`: exit `0`

Build output:
- Compiled successfully in 64s.
- TypeScript during build finished successfully.
- Static page generation completed: 11/11.

Lint warning:
- Pre-existing warning remains in `src/components/layout/FigmaFooter.tsx:69` for `<img>` usage.

## 8. TypeScript Errors

TypeScript errors: `0`

## 9. Visual Checklist Results

PASS:
- Hero is 100% viewport width, no rounded corners, no side margins.
- Hero text keeps internal padding and is bottom-aligned in fallback.
- Admin content typography rules match the requested hierarchy in code.
- Table headers are muted gray uppercase in shared `.admin-ui` rules.
- Table body cell defaults are dark and readable in shared `.admin-ui` rules.
- KPI label and number styles match the requested values.
- No router initialization error was observed in checked browser routes.
- Hero image priority/eager behavior is preserved.
- First product-card image path supports eager loading via `isFirst`.
- TypeScript exit 0.
- Build exit 0.

CODE-VERIFIED:
- Admin sidebar menu labels, brand text, section labels, active item, and version text use the requested readable colors.
- Inter is configured through Next.js font optimization and mapped through `--font-inter`.

LIMITED:
- Live `/admin` sidebar visual verification requires an authenticated admin session. The browser was redirected to login, so sidebar checks were code-verified.
- `agent-browser` was not available on PATH; Playwright was used as the browser verification fallback.

## 10. Final Verdict

PASSED WITH MINOR BACKLOG

Reason:
- All required code changes are implemented.
- `npm run typecheck`, `npm run lint`, and `npm run build` are green.
- Public browser verification passed with no console errors and correct hero geometry.
- Minor backlog remains only for authenticated admin sidebar visual verification and the pre-existing `FigmaFooter.tsx` lint warning.
