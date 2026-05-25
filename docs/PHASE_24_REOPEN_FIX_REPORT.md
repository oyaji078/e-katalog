# Phase 24 Reopen Fix Report

Date: 2026-05-25

Verdict: PASSED — USER REQUEST IMPLEMENTED

## Scope Guard

No cart, checkout, payment, shipping, order, wishlist, or marketplace flow was added or changed for this phase. The changes stayed inside catalog promotion display, admin promo/voucher/flash-sale management, WhatsApp inquiry promo metadata, schema migration, and admin sidebar UI.

## Implementation Summary

- Promo banners now use `linkType` and nullable `voucherId`; manual voucher code input was removed.
- Linked promo banners hide CTA/link fields, show linked voucher facts in admin, and are suppressed publicly when the linked voucher is missing or not live.
- `/admin/promo-vouchers` now only renders `Voucher` and `Banner Promo`.
- Voucher, promo banner, and flash sale forms no longer expose active/status controls; active toggles live in table actions only.
- Voucher edit preserves `isActive` and `status`, and successful edits redirect to `/admin/promo-vouchers`.
- Voucher eligibility is centralized for catalog cards, homepage/products/category/product-detail, and WhatsApp inquiry metadata.
- Badge priority is `Flash Sale` > `Promo` > `Baru`; active flash sale suppresses voucher promo display.
- Flash sale now supports Public/Retail audiences with separate public/retail flash prices.
- Optional `Gunakan Potongan Pukul Rata` controls flat-discount visibility and calculation.
- Flash sale money inputs format while typing, including `6011000` to `6.011.000`.
- Admin/Super Admin sidebar collapse now toggles by clicking the `E-Katalog` brand area; the separate floating arrow was removed.

## Database

- Added migration: `prisma/migrations/20260525000000_phase_24_reopen_fix/migration.sql`.
- Applied migration with `npx prisma migrate deploy --schema prisma/schema.prisma` before runtime verification.
- `PromoBanner.voucherCode` was backfilled to `voucherId` where possible and then removed.
- `FlashSale.showForPublic`, `FlashSale.showForRetail`, and `FlashSaleProduct.flashSaleRetailPrice` were added.
- Existing `FlashSaleProduct.flashSalePrice` is now mapped as `flashSalePublicPrice`.

## Static Verification

| Command | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | PASS | Exit 0. |
| `npm run build` | PASS | Exit 0. Existing warning remains: Turbopack NFT tracing warning from `src/lib/upload/storage.ts` via promo banner upload paths; existing middleware-to-proxy deprecation warning also shown. |
| `npm run lint` | PASS | Exit 0 with 10 existing warnings in `scripts/*.mjs`; no lint errors. |
| `npx prisma validate` | PASS | Schema valid. |
| `npm run prisma:generate` | PASS | Prisma Client generated. |
| `npx prisma migrate status --schema prisma/schema.prisma` | PASS | Database schema is up to date; 5 migrations found. |

## Runtime Evidence

Evidence was captured with a production server on `http://localhost:3002`, matching local `BETTER_AUTH_URL`. The stale dev server on `3000` was not used for the final runtime proof.

Evidence files:

- `docs/phase24-reopen-evidence/runtime-evidence.json`
- `docs/phase24-reopen-evidence/admin-promo-vouchers-tabs.png`
- `docs/phase24-reopen-evidence/banner-form-initial.png`
- `docs/phase24-reopen-evidence/banner-linked-voucher-hides-cta.png`
- `docs/phase24-reopen-evidence/voucher-edit-no-active-controls.png`
- `docs/phase24-reopen-evidence/flash-sale-table-actions.png`
- `docs/phase24-reopen-evidence/flash-sale-form-initial.png`
- `docs/phase24-reopen-evidence/sidebar-collapsed.png`
- `docs/phase24-reopen-evidence/homepage-linked-banner.png`
- `docs/phase24-reopen-evidence/product-detail-voucher-promo.png`
- `docs/phase24-reopen-evidence/product-detail-public-flash.png`
- `docs/phase24-reopen-evidence/product-detail-retail-flash.png`

Runtime checks passed:

1. Banner form uses voucher dropdown labeled `Hubungkan dengan Voucher`.
2. Linked banner hides `Teks Tombol` and `Link Tombol`.
3. Promo banner, voucher, and flash sale forms have no active/status controls; table actions expose active/disable.
4. Promo & Voucher page only has `Voucher` and `Banner Promo`.
5. Voucher scope edit preserves `isActive` and `status`.
6. Voucher edit redirects to `/admin/promo-vouchers`.
7. Voucher product badge stays `Promo`, not `Baru`.
8. Active flash sale product hides voucher promo applicability.
9. Public flash sale displays public source price and public flash price.
10. Retail flash sale displays retail source price and retail flash price.
11. `Potongan Pukul Rata (Rp)` input is hidden until `Gunakan Potongan Pukul Rata` is checked.
12. Flash sale money input formats `6011000` as `6.011.000`.
13. Sidebar collapses by clicking `E-Katalog` and shows compact `EK`.
14. Public linked banner displays linked voucher code, discount, minimum price, and schedule-derived data.
15. Flash sale table exposes `Aktifkan`/`Nonaktifkan`.

All 20 browser runtime assertions in `runtime-evidence.json` passed.
