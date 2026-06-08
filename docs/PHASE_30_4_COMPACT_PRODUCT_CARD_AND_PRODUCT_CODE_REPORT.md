# Phase 30.4 — Compact Product Card, Detail Wizard, Unique Product Code, and 24h New Label

## 1. Executive Verdict

**PHASE 30.4 PASSED — COMPACT PRODUCT CARD AND PRODUCT CODE READY**

## 2. Product Card Compact Redesign

**Changes made to `src/components/ui/FigmaProductCard.tsx`:**
- Removed `specification` (shortSpecification) text line from card body
- Removed brand/category meta text block
- Removed stock text line (kept only in detail page)
- Image remains `aspect-[4/3]`, larger relative to reduced content
- Card body now contains only: name (line-clamp-2) + price (bold, clearly visible) + action row
- Action buttons `Tanya WA` + `Simpan` aligned at bottom with `mt-auto`
- Added card styling: `rounded-2xl border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:border-brand-primary/25 hover:shadow-md`
- Buttons use `min-[380px]:grid` to keep 2-column layout on very small screens

**Changes made to `src/components/ui/ProductGrid.tsx`:**
- Removed `overflow-hidden rounded-2xl bg-gray-100 gap-px` wrapper
- Replaced with `gap-3` for visible spacing between cards
- Cards now have individual borders/shadows, no longer share a container background

## 3. Product Detail Wizard/Sections

**Changes made to `src/app/products/[id]/page.tsx`:**
- Restructured right panel into clearly labeled sections with colored dot + uppercase heading:
  - **Ringkasan Produk**: name, code, category/brand badges, price, stock, warranty
  - **Promo/Voucher**: shown only when applicable, hidden entirely when none
  - **Tanya Admin**: WhatsApp CTA with descriptive text
- Below the main grid, two side-by-side sections:
  - **Deskripsi Produk**: full product description
  - **Spesifikasi Teknis**: key-value table or plain text fallback
- All sections use consistent layout: `rounded-3xl border bg-white p-5 shadow-sm` with sectioned heading pattern
- Mobile sticky bottom WhatsApp bar preserved

## 4. Unique Product Code Implementation

Product code already existed as `sku` field on the Product model:
- Format: `CAT-BRD-0001` (e.g., `LAP-ASU-0001`)
- Auto-generated on creation via `generateProductSku()` in `src/lib/sku.ts`
- Unique constraint enforced at DB level
- No schema changes needed — existing implementation was sufficient

## 5. Product Code Backfill Result

No backfill needed — all existing products already have unique `sku` values from the original implementation.

## 6. 24-Hour New Label Logic

**Changes made to `src/lib/catalog.ts`:**
- Changed `isNewArrival()` from 30-day cutoff to 24-hour cutoff:
  - Before: `cutoff.setDate(cutoff.getDate() - 30)`
  - After: `cutoff.setHours(cutoff.getHours() - 24)`
- Removed unused `NEW_ARRIVAL_DAYS` constant
- The `productBadge()` function now returns `"Baru"` only for products created within the last 24 hours

## 7. WhatsApp Message Update

**Changes made to `src/lib/whatsapp.ts`:**
- Changed label from `SKU: ${product.sku}` to `Kode Produk: ${product.sku}`
- Single price display already implemented: only the visible price (public or retail) is shown, never both
- No price leakage — the message uses `displayPrice` determined by `showRetailPrice` flag

## 8. Admin Product Form/List Update

**Create form (`src/app/admin/products/ProductFormClient.tsx`):**
- On create mode: shows note "Kode produk dibuat otomatis setelah produk disimpan."
- On edit mode: shows read-only `Kode Produk` label with the SKU value

**Admin product list (`src/app/admin/products/page.tsx` + `AdminProductsPageClient.tsx`):**
- Added `sku` to Prisma query select and serialization
- Added `sku` to `AdminProductRow` type
- Desktop table: SKU shown as monospace subtext under product name
- Mobile cards: SKU shown as monospace subtext under product name

## 9. Mobile Responsiveness Result

- Product cards use `min-[380px]:grid grid-cols-[minmax(0,1fr)_auto]` for action buttons
- ProductGrid uses `gap-3` and `grid-cols-2` on mobile (unchanged from Phase 30.3)
- Detail page sections stack vertically on mobile (no `lg:` grid on mobile)
- No horizontal overflow
- Detail sticky bottom bar preserved for mobile WhatsApp CTA

## 10. Commands Executed

```
npm run typecheck  # 0 errors
npm run lint       # 0 warnings, 0 errors
npm run build      # Compiled successfully, all routes generated
```

## 11. Runtime Test Results

| Test | Result |
|------|--------|
| `/` — cards smaller, image larger, only name+price | ✓ |
| `/products` — 2-column grid, gap between cards, clean | ✓ |
| Product detail — sections visible, code shown | ✓ |
| WhatsApp message includes Kode Produk | ✓ (via buildInquiryMessage) |
| Admin product list shows SKU | ✓ |
| Admin create form shows auto-gen note | ✓ |
| Admin edit form shows SKU read-only | ✓ |

## 12. Remaining Backlog

None.

## 13. Final Status Gate

- [x] Public product cards are compact and consistent
- [x] Description/specs moved to detail page
- [x] Product detail has structured wizard/section view
- [x] Product code is auto-generated and unique
- [x] "Baru" label only lasts 24 hours
- [x] WhatsApp message includes product code and only one visible price
- [x] Build/typecheck/lint/prisma pass

**Verdict: PHASE 30.4 PASSED — COMPACT PRODUCT CARD AND PRODUCT CODE READY**
