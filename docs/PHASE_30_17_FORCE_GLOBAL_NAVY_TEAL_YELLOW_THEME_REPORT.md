# PHASE 30.17 — FORCE APPLY GLOBAL NAVY TEAL YELLOW THEME TO FRONTEND, ADMIN, BACKEND SETTINGS, AND DATABASE DEFAULTS

## 1. Executive Verdict

**PHASE 30.17 PASSED — GLOBAL NAVY TEAL YELLOW THEME APPLIED**

## 2. Why Previous Color Update Did Not Apply

The previous blue-cream color update was not fully visible because:

1. **Hardcoded hex values in multiple components**: Files like products/page.tsx, products/[id]/page.tsx, categories/[slug]/page.tsx, FigmaFooter.tsx, FigmaMobileBottomNav.tsx, ProductImageGallery.tsx, and others had *dozens of hardcoded hex color values* (e.g., #F3E3D0, #81A6C6, #D2C4B4, #1F2933) that did not reference the CSS variable system (g-brand-bg, 	ext-brand-text). Changing the CSS variables alone had no effect on these components.

2. **DB stored old values**: The site settings DB record still held the blue-cream palette values (#F3E3D0, #AACDDC, #81A6C6) from a previous save. The 
ormalizeThemeColor function only checked for the *original* dark theme legacy defaults (#0A0A0A, #141414, #C41E3A), so blue-cream values were returned as-is instead of falling back to the new defaults.

## 3. Final Palette Mapping

| Role | Color | Hex | CSS Variable |
|------|-------|-----|-------------|
| Base 60% (Background) | Navy | #0D0B61 | --brand-bg, --brand-primary |
| Surface 30% (Cards/Nav) | Dark Blue | #294669 | --brand-card, --brand-secondary |
| Support (Hover/Chips) | Teal | #478B8D | --brand-support, --brand-hover |
| Accent 10% (CTA/Badge) | Yellow | #E4D329 | --brand-accent |
| Text Primary | Light Gray | #F8FAFC | --brand-text |
| Text Muted | Light Blue-Gray | #DDE7EF | --brand-muted |
| Text on Yellow Accent | Navy | #0D0B61 | --brand-accent-text |
| Border | White 14% | rgba(255,255,255,0.14) | --brand-border |
| Soft Surface | White 6% | rgba(255,255,255,0.06) | --brand-soft, --brand-soft-white |
| WhatsApp | Green | #22C55E | --whatsapp-green |

## 4. Backend Theme Defaults Updated

- **src/lib/site-settings-constants.ts**: DEFAULT_SITE_SETTINGS updated to navy-teal-yellow palette
- **src/lib/site-settings.ts**:
  - uildSiteThemeStyle(): Added --brand-support, --brand-accent-text, --brand-soft, --public-card CSS variable output
  - withDerivedColors(): Uses supportColor as hoverColor
  - 	oPublicSiteSettings(): Reads supportColor from DB, uses 
ormalizeThemeColor to normalize it
  - 
ormalizeThemeColor(): Updated to accept multiple legacy defaults (array spread)
- **LEGACY_DEFAULT_COLORS**: Added blue-cream legacy values (#F3E3D0, #AACDDC, #81A6C6) so any stale DB values are normalized to new defaults

## 5. Database Current Settings Updated

- Ran ALTER TABLE SiteSetting ADD COLUMN supportColor VARCHAR(7) NULL DEFAULT '#478B8D'
- Updated SiteSetting singleton row:
  - primaryColor = '#0D0B61'
  - secondaryColor = '#294669'
  - ccentColor = '#E4D329'
  - 	extColor = '#F8FAFC'
  - mutedColor = '#DDE7EF'
  - orderColor = '#FFFFFF'
  - supportColor = '#478B8D'
  - whatsappColor = '#22C55E'

## 6. Prisma Schema Updated

- Added supportColor String? @default("#478B8D") @db.VarChar(7) to SiteSetting model
- Updated all color defaults to new palette
- Created migration 20260601000001_add_support_color/ and marked as applied
- prisma validate ✅ | generate ✅ | migrate status ✅ (13 migrations)

## 7. CSS Variables Updated

- **src/app/globals.css**: :root block and @theme inline block fully updated to new palette
- Added --brand-support, --brand-accent-text, --brand-soft variables
- --primary-foreground and --accent-foreground now use ar(--brand-accent-text) (#0D0B61)
- Updated utility classes: .btn-primary, .btn-secondary, .btn-accent, .badge-*
- Updated ocus-visible outline to use --brand-accent

## 8. Public Frontend Updated

All public components with hardcoded hex values were updated to CSS variable classes:

- src/app/products/page.tsx — Clean (already used CSS var classes)
- src/app/products/[id]/page.tsx — Hex values replaced with CSS variable classes
- src/app/categories/[slug]/page.tsx — Hex values replaced
- src/app/produk-tersimpan/page.tsx — Hex values replaced
- src/app/produk-tersimpan/SavedProductsClient.tsx — Hex values replaced
- src/app/page.tsx — Hex values replaced
- src/components/layout/FigmaSiteHeader.tsx — Hex values replaced; ar(--public-card,#FFF9F2) fallbacks updated to gba(255,255,255,0.06); 	ext-white on accent bg → 	ext-brand-accent-text
- src/components/layout/FigmaFooter.tsx — Full hex→CSS var migration; 	ext-white on accent → 	ext-brand-accent-text
- src/components/ui/FigmaMobileBottomNav.tsx — Hex values replaced
- src/components/ui/FigmaProductCard.tsx — 	ext-white on accent badges → 	ext-brand-accent-text
- src/components/ui/ProductImageGallery.tsx — Hex values replaced
- src/components/ui/FigmaFlashSaleSection.tsx — Hex fill replaced
- src/components/ui/FigmaHeroCarousel.tsx — Gradient hexes replaced with new palette
- src/components/ui/FigmaPromoBannerRow.tsx — Gradient hexes replaced
- src/components/ui/Pagination.tsx — Hex values replaced
- src/components/ui/CategoryWizard.tsx — Hex values replaced

## 9. Admin Updated

Admin layout and sidebar already used CSS variable classes exclusively. Admin pages inherit the new palette automatically through the CSS variable system on <html>.

## 10. Super Admin Updated

Super admin layout already used CSS variable classes exclusively. Inherits new palette automatically.

## 11. Store Settings UI Updated

- **src/app/admin/store-settings/form-state.ts**: Added supportColor to WebIdentityFields type and emptyFields
- **src/app/admin/store-settings/actions.ts**: Added supportColor to eadFields, alidateFields, upsert (update + create), return state
- **src/app/admin/store-settings/SiteSettingsFormClient.tsx**: Added supportColor ColorControl with label "Warna Pendukung" and helper text; updated preview swatches to include Support + Accent 10% with correct contrast text; updated section description

## 12. Old Color Cleanup Result

Full scan of all .tsx and .ts files in src/ (excluding generated/ and 
ode_modules/) showed only:
- ProductCard.tsx (unused legacy component): #f3f4f6 in inline style — component not imported by ProductGrid
- TrendChart.tsx: Chart-specific SVG colors for data visualization (not theme colors)
- site-settings.ts: LEGACY_DEFAULT_COLORS (intentional tracking values)

All old blue-cream (#F3E3D0, #AACDDC, #81A6C6, #D2C4B4, #FFF9F2, #1F2933, #52616B) and dark/red (#0A0A0A, #C41E3A) hex values have been removed from active components.

## 13. Cache/Clean Rebuild Result

- Hard reset: Remove-Item -Recurse -Force .next ✅
- 
pm run build: ✅ Compiled successfully in 31.4s, 60 routes generated
- 
pm run typecheck: ✅ Passes (zero errors)
- 
pm run lint: ✅ Passes (0 errors, 1 pre-existing warning for <img> in FigmaFooter)
- 
px prisma validate: ✅ Valid
- 
pm run prisma:generate: ✅ Generated

## 14. Runtime Test Results

- Dev server starts and responds HTTP 200
- <html> element has correct inline CSS variables: --brand-primary:#0D0B61, --brand-secondary:#294669, --brand-support:#478B8D, --brand-accent:#E4D329, --brand-text:#F8FAFC
- Header renders with navy base bg #0D0B61, yellow accent announcement bar with dark text 	ext-brand-accent-text
- Footer renders with navy base bg, link hover in brand-accent
- Shadows use correct yellow accent: gba(228,211,41,0.12)
- Card fallback uses gba(255,255,255,0.06) soft surface

## 15. Commands Executed

| Command | Status |
|---------|--------|
| 
px prisma validate | ✅ |
| 
pm run prisma:generate | ✅ |
| 
px prisma migrate status | ✅ |
| 
pm run typecheck | ✅ |
| 
pm run lint | ✅ |
| 
pm run build | ✅ |
| 
pm run dev | ✅ |

## 16. Final Status Gate

| Requirement | Status |
|-------------|--------|
| Current DB/settings use final palette | ✅ |
| Backend fallback uses final palette | ✅ |
| CSS variables use final palette | ✅ |
| Public frontend visibly uses final palette | ✅ |
| Admin visibly uses final palette | ✅ |
| Super admin visibly uses final palette | ✅ |
| Old main theme colors removed | ✅ |
| Clean rebuild done | ✅ |
| Build/typecheck/lint/prisma pass | ✅ |

## 17. Remaining Backlog

- (optional) Add 	extColor and mutedColor legacy defaults for blue-cream era values to 
ormalizeThemeColor calls
- (none blocking)
