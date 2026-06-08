# PHASE 30.9 — Unified Public Catalog, Pagination & Labels

## Goal
Replace the three separate product sections (Rekomendasi, Produk Baru, Produk Populer) on the homepage with a single unified catalog that includes:
- Category wizard chip row
- Sort dropdown (Terbaru / Populer / Promo)
- Paginated product grid
- Automatic badge labels (Promo > Baru > Populer > Rekomendasi)

## Changes

### New files
| File | Purpose |
|------|---------|
| `src/lib/product-labels.ts` | `computePrimaryLabel()`, `isNewArrival()` |
| `src/components/ui/CategoryWizard.tsx` | Compact chip row with active state, uses `<Link>` |
| `src/components/ui/Pagination.tsx` | Page numbers with ellipsis, prev/next, uses `<Link>` |
| `src/components/catalog/SortSelectClient.tsx` | Client component for sort dropdown with `useRouter` + `useSearchParams` |

### Modified files
| File | Change |
|------|--------|
| `src/lib/catalog.ts` | Added `viewCount`, `clickCount`, `inquiryCount` to `productCardSelect` and `productDetailSelect` |
| `src/lib/product-card-mapper.ts` | Flash sale & voucher → badge="Promo" |
| `src/app/page.tsx` | Rewritten: unified catalog replaces 3 old sections + "Lihat Semua" button; imports `SortSelectClient` instead of inline server `SortSelect` |
| `src/app/products/page.tsx` | Replaced inline pagination with shared `<Pagination>`; removed unused `ChevronLeft`/`ChevronRight` imports |

## Validation Results

| Command | Result |
|---------|--------|
| `npx prisma validate` | ✅ |
| `npm run typecheck` | ✅ (0 errors) |
| `npm run lint` | ✅ (0 warnings/errors) |
| `npm run build` | ✅ |

## Runtime Tests

| Route | Status |
|-------|--------|
| `/` | ✅ 200 — no "Event handlers cannot be passed" error |
| `/products` | ✅ 200 |
| `/products?search=laptop` | ✅ 200 |
| `/products?category=motherboard&page=2` | ✅ 200 |

## Hotfix (HOTFIX-1)

**Problem:** The original `SortSelect` was defined as a plain function inside `page.tsx` (a Server Component). It used `onChange={(e) => e.target.form?.submit()}`. Next.js 16 does not allow passing event handlers from Server Components to Client Component props.

**Fix:**
1. Created `src/components/catalog/SortSelectClient.tsx` with `"use client"` directive
2. Uses `useRouter`, `usePathname`, `useSearchParams` from `next/navigation`
3. On change: updates `sort` query param, resets `page` to 1, preserves all other params
4. Removes `sort` param when value is `"latest"` (default)
5. Imported `SortSelectClient` in `page.tsx`, replaced usage, removed the old inline function

No other event handlers were found in server component files. `CategoryWizard` and `Pagination` already use `<Link>` without client event handlers.

## Architecture Notes
- Homepage is `force-dynamic` (no static generation)
- `PAGE_SIZE = 12`
- Badge priority: Promo (flash sale or voucher) > Baru (< 30 days) > Populer (≥ 20 clicks or ≥ 50 views) > Rekomendasi (≥ 5 inquiries)
- `buildProductWhere()` filters by `category.slug` and, when `sort=promo`, by active vouchers/flash sales
- `SortSelectClient` uses form-like behavior via `router.push()` — avoids hydration mismatch because `value` prop comes from server-rendered `searchParams`
