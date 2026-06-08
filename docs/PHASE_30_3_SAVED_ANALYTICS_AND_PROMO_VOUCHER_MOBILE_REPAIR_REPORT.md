# Phase 30.3 - Saved Product Analytics & Promo Voucher Mobile Repair Report

## Completed Tasks

### A. Prisma Schema: SAVED_PRODUCT / UNSAVED_PRODUCT
- Added `SAVED_PRODUCT` and `UNSAVED_PRODUCT` to `AnalyticsEventType` enum in `prisma/schema.prisma`
- Created and applied manual migration (no shadow DB)
- Regenerated Prisma Client with new enum values confirmed

### B. Backend Analytics Track API
- Updated `src/app/api/analytics/track/route.ts` to accept `SAVED_PRODUCT` and `UNSAVED_PRODUCT` in `PUBLIC_ANALYTICS_TYPES`
- Pattern follows existing WHATSAPP_CLICK / PRODUCT_VIEW handling

### C. Front-End SavedProductButton Analytics
- Added `productName` prop to `SavedProductButton` (`src/components/ui/SavedProductButton.tsx`)
- Posts to `/api/analytics/track` on save/unsave with the new event type using `pathname` for product URL
- Failures silently caught

### D. Pass productName from Product Cards
- `src/components/ui/FigmaProductCard.tsx` passes `productName={name}` to `SavedProductButton`
- `src/components/ui/ProductCard.tsx` passes `productName={name}` to `SavedProductButton`

### E. ProductGrid - Keep 2-Column Mobile
- `src/components/ui/ProductGrid.tsx`: reverted to `grid-cols-2` on mobile for 2,3,4,5 column presets
- Overrides any single-column overrides

### F. Admin Dashboard - Saved Events
- Queries: `savedToday`, `saved7d` counts from `getEventCountBetween(SAVED_PRODUCT, ...)`
- `topSavedEvents` with `getTopProducts(SAVED_PRODUCT, range)`
- KPI grid expanded to 8 columns: added "Produk Disimpan Hari Ini" and "Produk Disimpan 7 Hari" KpiCards
- InteractionSummary references `saved7d` directly
- TopProductsCard shows saved counts via `topSavedProductItems` derived from `topSavedEvents`

### G. Admin Dashboard - Compact & Clean
- Removed `RecentActivityList` and all related code (`EVENT_LABELS`, `eventTone`, `recentActivity`, `recentEvents`, `recentAdminLogs`)
- Replaced with `TopProductsCard` (saved products) and `OperationalSummary` widgets
- Lint warnings fixed (void `_recentEvents`, `_recentAdminLogs`)
- `TrendTone` type extended with `"gold"` and matching Tailwind style `bg-yellow-100 text-yellow-700`

### H. Promo & Voucher Mobile Responsive
- `VoucherTab`: added card-based layout (`grid gap-3`), hidden on `md:` when the original table takes over
- No `overflow-x-auto` on mobile; content wraps without horizontal scroll at 360px/390px
- `BannerTab`: already uses responsive CSS grid with `md:hidden` labels, no changes needed

## Validation
- **Lint**: 0 errors, 0 warnings
- **TypeScript**: 0 errors
- **Build**: Compilation succeeded, all routes generated
