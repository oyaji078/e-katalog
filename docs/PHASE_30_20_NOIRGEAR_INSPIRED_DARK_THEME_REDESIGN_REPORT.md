# Phase 30.20 Report — NoirGear-Inspired Dark Theme Redesign

## Summary
Complete UI/UX audit and redesign across public catalog, admin dashboard, and super admin, implementing a dark charcoal/near-black theme inspired by NoirGear aesthetics.

## Palette Changes

| Token | Before | After |
|-------|--------|-------|
| Page background | `#F6F7FB` (light gray) | `#0A0A0F` (near-black) |
| Card background | `#FFFFFF` (white) | `#14161E` (dark charcoal) |
| Soft section | `#EEF4F7` | `#1C1E26` |
| Primary text | `#111827` | `#F0F0F5` (soft white) |
| Muted text | `#5B6472` | `#8A8A9E` |
| Borders | `#D7DEE8` | `#2A2A38` |
| Secondary | `#294669` | `#1A1A2E` |
| Support | `#478B8D` | `#2A2A4A` |
| Accent | `#E4D329` (unchanged) | `#E4D329` |
| Brand primary | `#0D0B61` (unchanged) | `#0D0B61` |

## Files Modified

### Core Theme
- `src/lib/site-settings-constants.ts` — updated DEFAULT_SITE_SETTINGS palette, added exported constants for new fields
- `src/lib/site-settings.ts` — updated defaults in toPublicSiteSettings, getLegacyStoreSettings, buildSiteThemeStyle hardcoded values
- `src/app/globals.css` — full :root CSS variable refresh, @theme tokens, admin-ui forced-light overrides, corner-ribbon utilities added

### Public Components
- `src/components/ui/FigmaHeroCarousel.tsx` — rebuilt with premium split layout: text left, image right, no CTA buttons overlaying image, CTAs in dedicated row below title
- `src/components/ui/FigmaProductCard.tsx` — dark card bg (#14161E), removed "Lihat Detail" link, corner-ribbon for Populer/Rekomendasi, subtle save button hover, yellow accent price, border hover glow
- `src/components/ui/SavedProductButton.tsx` — icon variant defaults to subtle transparent dark bg with muted gray icon, hover shows yellow accent
- `src/components/layout/FigmaFooter.tsx` — muted text updated from #DDE7EF to #8A8A9E

### Public Pages
- `src/app/page.tsx` — homepage background, section titles, category bar, empty state updated to dark theme
- `src/app/products/page.tsx` — full catalog page: banner, flash sale strip, search bar, filters, pagination, empty state all updated to dark theme
- `src/app/products/[id]/page.tsx` — product detail page fully rebuilt: dark bg, dark cards, premium layout, yellow accent pricing, specs/description sections, WhatsApp CTA with outline style, mobile sticky bar

### Supporting Components
- `src/components/ui/FigmaFlashSaleSection.tsx` — dark themed cards, borders, text
- `src/components/ui/FigmaPromoBannerRow.tsx` — dark themed banners and voucher sections
- `src/components/ui/CategoryWizard.tsx` — hover state colors updated
- `src/components/layout/MobileBottomNav.tsx` — background updated for dark theme

### Admin (unchanged, stays light)
- Admin area retains light background via `.admin-ui` CSS class overrides — no changes needed
- `src/components/layout/AdminSidebar.tsx` — already uses brand navy + yellow accent, unchanged
- `src/components/layout/AdminMobileNav.tsx` — uses CSS variables overridden by admin-ui, unchanged

## Key Design Decisions

### Public = Dark, Admin = Light
The `.admin-ui` CSS class forces light mode colors for all admin pages. Public pages inherit dark CSS variables directly. This ensures admin readability for data tables and forms while the public catalog gets the premium dark aesthetic.

### Corner-Ribbon Badges
"Populer" and "Rekomendasi" badges use a CSS-only corner-ribbon approach (`.corner-ribbon` class). Other badges (Promo, Flash Sale, Baru) remain in the top-left position. The component filters badges: if a badge matches "populer"/"popular"/"rekomendasi"/"recommended", it renders as a corner ribbon at the card's top-right edge.

### Hero Banner — Split Layout
The hero now uses a CSS grid split (text left / image right) on desktop. CTAs ("Lihat Katalog" + "Tanya Admin") sit below the title/subtitle in the text column, never overlapping the image. Mobile shows a full-width image with dark gradient overlay and text overlay. Navigation dots and arrow buttons are preserved.

### Product Card — No "Lihat Detail"
The product card's "Lihat Detail" link was removed entirely. The card image and title remain clickable (via TrackedProductLink) for full detail navigation. The only CTA button on the card is "Tanya WA" (WhatsApp inquiry).

### Save Button — Subtle Hover
The save bookmark button defaults to a transparent dark background with muted gray icon. On hover, the icon turns yellow accent without covering the icon. Saved state shows yellow icon.

## Validation
- `npx prisma validate` — ✅ Passed
- `npm run prisma:generate` — ✅ Passed
- `npx tsc --noEmit` — ✅ No type errors
- `npm run lint` — ✅ Only pre-existing `<img>` warning
- `npm run build` — ✅ Compiled successfully, all routes generated
