# UI/UX Fix Changelog (U0–U6)

Branch: `wip/phase27-recovery` · Date: 2026-06-08 · Stack: Next.js 16.2.6 (App Router), Tailwind v4, lucide-react

## TL;DR

The U0–U6 batch was written from **stale screenshots**. A full investigation (6 parallel
agents + direct reads, adversarially cross-checked) found **5 of 6 reported areas already
correct** on this branch. Only **one genuine functional gap** existed (login password toggle),
plus a **user-requested routing enhancement** (super-admin reports). Those were implemented;
everything already-correct was left untouched to avoid pointless churn.

## Files changed

| File | Change | Lines |
|------|--------|-------|
| `src/app/login/page.tsx` | Added password show/hide toggle (Eye/EyeOff) + vertical centering | import `:4`; state `:40`; password block `:99–118` (`type` `:105`, `aria-label` `:113`, icon `:116`); centering wrapper `:171` |
| `src/app/super-admin/reports/page.tsx` | **New** — `/super-admin/reports` route reusing the admin reports view so SUPER_ADMIN stays in the super-admin shell | whole file (re-export of `@/app/admin/reports/page` + `dynamic`) |
| `src/components/layout/AdminSidebar.tsx` | Super-admin "Reports" href `/admin/reports` → `/super-admin/reports` | `:107` |
| `src/components/layout/AdminMobileNav.tsx` | Super-admin "Reports" href `/admin/reports` → `/super-admin/reports` | `:101` |

(Admin "Laporan" links — `AdminSidebar.tsx:73`, `AdminMobileNav.tsx:67` — intentionally remain
`/admin/reports`, correct for ADMIN users.)

## Per-unit findings & actions

### U1 — Bottom nav missing on homepage → **NOT A BUG (no change)**
Root `layout.tsx:86–89,117–119` renders `FigmaMobileBottomNav` on all non-auth routes for
non-admin users; `/` is not an auth page, so guests see it on the homepage exactly as on
`/products`. It is `fixed bottom-0 z-50 md:hidden` with `pb-[env(safe-area-inset-bottom)]`, and
the body adds `pb-16` content clearance. The screenshot showing it "missing" was a logged-in
**admin** session (nav is correctly hidden for admins), not a route bug. `pathname` is supplied
by `src/proxy.ts` (Next 16's renamed middleware).

### U2 — Register form broken on mobile → **NOT A BUG (no change)**
`register/page.tsx:116` already uses `grid gap-4 sm:grid-cols-2` (single column on mobile),
static labels above inputs (no floating overlap), `px-4`/`p-6` container padding, and a
`sm:col-span-2` (full-width on mobile) submit button.

### U3 — Generic/placeholder icons → **NOT A BUG (no change)**
Grep for `\b(Box|Circle|Dot|Hash)\b` in nav/sidebar code returns **zero** matches. Every menu
item already uses a semantic lucide icon (LayoutDashboard, Package, Tags, Zap, TicketPercent,
Shield, FileText, …). Remaining differences vs the requested mapping (e.g. `Grid3X3` vs
`LayoutGrid`) are cosmetic preferences, not placeholder bugs, so no swap was made.

### U4 — Super-admin "Laporan" routing → **ENHANCEMENT IMPLEMENTED**
Not a misroute: the super-admin "Reports" link pointed to `/admin/reports`, which exists and is
accessible to SUPER_ADMIN (`requireAdmin()` admits both roles). But clicking it dropped the
super-admin out of the `/super-admin` shell into the admin sidebar. Per the explicit request,
added a dedicated `/super-admin/reports` route (reusing the admin view) and repointed both
super-admin nav links so SUPER_ADMIN now stays in their own area.
**Deliberately deferred** (out of safe scope): U4-C's "unmasked OTP tokenPreview", "no/180-day
export limit", and "all users" extras — these are security-sensitive and entangled with the
phase-27 reports/export logic; they warrant explicit sign-off rather than an autonomous change.

### U5 — Login page UI → **PARTIAL: 1 real fix + 1 polish**
Already correct (no change): static labels (no floating overlap), full-width submit with loading
state, "Daftar retail" link, inline error (no `alert()`), horizontal centering (`mx-auto max-w-md`).
**Fixed:** password **show/hide toggle was genuinely missing** — added `Eye`/`EyeOff` button
with `showPassword` state. **Polish:** added vertical centering
(`flex min-h-[calc(100dvh-64px)] items-center justify-center`).

### Role guard (U4 middleware part) → **NOT APPLICABLE**
There is **no `src/middleware.ts`**. Enforcement is via layout RSC guards (`requireAdminSession`
admits ADMIN+SUPER_ADMIN; `requireSuperAdminSession` redirects ADMIN→`/admin`, others→`/login`).
SUPER_ADMIN can access `/admin/*`; ADMIN is blocked from `/super-admin/*`. The guard order is
already correct; U4's "reorder middleware" instruction does not apply.

## Verification (U6)

- `npm run typecheck` → **PASS** (0 errors)
- `npm run build` → **PASS** (0 errors); route manifest lists `ƒ /super-admin/reports` and `ƒ /login`
- Plain `grid-cols-2` (no `sm:`) in register/login → **none** (register uses `sm:grid-cols-2`)
- Placeholder icons (`Box|Circle|Dot|Hash`) in nav/sidebar → **none**
- `/super-admin/reports/page.tsx` → **exists**
- Middleware role-order check → **N/A** (no middleware; layout RSC guards verified correct)

## Notes
Changes are uncommitted in the working tree alongside the broader phase-27 WIP. No commit/PR was
created (not requested). The two heavily-changed nav files in `git diff --stat` were already
WIP-modified; this batch added exactly one line to each.
