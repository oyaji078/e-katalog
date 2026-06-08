# PHASE 30.2 — Role-Aware Mobile Navigation, WhatsApp Price Message, and Mobile Product Card Fix

## 1. Executive Verdict

**PHASE 30.2 PASSED WITH MINOR BACKLOG**

All critical acceptance criteria are met:
- ✅ WA message shows only one visible price per user role
- ✅ Admin/Super Admin redirected from public catalog pages
- ✅ Public/Retail/Admin/SuperAdmin bottom navs are role-correct
- ✅ Mobile product cards are readable (1-column grid on small screens)
- ✅ No horizontal overflow
- ✅ Build/typecheck/lint/prisma all pass

The backlog consists of non-blocking UX polish items noted below.

---

## 2. WhatsApp Price Message Fix

### Files Modified

**`src/lib/whatsapp.ts` — `buildInquiryMessage` function (core fix)**

| Before | After |
|--------|-------|
| Showed `Harga Retail: Rp xxx` + `Harga Publik: Rp xxx` in every message | Shows single `Harga: Rp xxx` based on viewer role |
| Admin greeting: `"Halo Admin, inquiry dari sistem admin:"` | Always uses `"Halo Admin, saya ingin bertanya tentang produk berikut:"` |
| Retail greeting: `"Halo Admin, saya adalah pelanggan retail..."` | Guest/retail unified greeting + `Tipe Akun: Retail` line for retail users |

**Behavior by role:**
- **Guest**: `Harga: {publicPrice}` — no brand mention
- **Active Retail**: `Harga: {retailPrice}` + `Tipe Akun: Retail` — no public price leak
- **Admin/Super Admin**: Blocked at API layer (cannot reach this function)

**`src/app/api/inquiries/whatsapp/route.ts` — Admin guard added**

Early return with HTTP 403 if user role is `ADMIN` or `SUPER_ADMIN`:
```ts
if (currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") {
  return NextResponse.json(
    { error: "Admin tidak dapat menggunakan inquiry publik. Gunakan dashboard." },
    { status: 403 },
  );
}
```

### Acceptance Verification
- ✅ Guest inquiry contains only one `Harga:`
- ✅ Retail inquiry contains only one `Harga:`
- ✅ No message contains both `Harga Publik` and `Harga Retail`
- ✅ Admin/Super Admin cannot send normal public inquiry (403)

---

## 3. Role-Aware Public Access Rules

### Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Added `redirect("/admin")` / `redirect("/super-admin")` for admin users |
| `src/app/products/page.tsx` | Same redirect guard |
| `src/app/products/[id]/page.tsx` | Same redirect guard |
| `src/app/vouchers/page.tsx` | Same redirect guard |
| `src/app/produk-tersimpan/page.tsx` | Same redirect guard |
| `src/app/layout.tsx` | Root layout hides public bottom nav for admin users (`showPublicBottomNav`) |

### Redirect Rules

| User Role | Home | Products | Product Detail | Vouchers | Saved |
|-----------|------|----------|----------------|----------|-------|
| Guest | ✅ | ✅ | ✅ | ✅ | ✅ |
| Retail (active) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | → `/admin` | → `/admin` | → `/admin` | → `/admin` | → `/admin` |
| Super Admin | → `/super-admin` | → `/super-admin` | → `/super-admin` | → `/super-admin` | → `/super-admin` |

### Login/Register Redirect

`src/app/login/page.tsx` and `register/page.tsx` redirect after login:
- Super Admin → `/super-admin`
- Admin → `/admin`
- Active Retail → `/products`
- Pending Retail → `/retail/activate`
- Registered → `/retail/request-token`
- Other → `/`

---

## 4. Mobile Header Repair

### Files Modified

**`src/components/layout/FigmaSiteHeader.tsx`**

Refactored to separate desktop and mobile layouts:

**Desktop (md+):** Unchanged — logo + search + icons inline row.

**Mobile (< md):** Two-row layout:
- **Row 1**: Logo (left) + action icons (right): WhatsApp, account/login, dashboard link for admin
- **Row 2**: Full-width compact search bar below

**Key changes:**
- Removed cramped `flex-row` layout that pushed icons off-screen
- Search no longer consumes full mobile width permanently (icons always visible)
- Logout for non-admin users moved to an icon-only button
- Added bottom padding via `pb-16` on mobile body (root layout)
- No public header rendered on admin/super-admin routes (redirect handles this)

**Component extraction:**
- `DesktopHeaderIcons` — desktop icon set
- `MobileHeaderIcons` — mobile icon set (compact, icon-only)

---

## 5. Bottom Navigation Role Fix

### Files Modified

**`src/components/ui/FigmaMobileBottomNav.tsx`** — Complete rewrite

| User Role | Nav Items |
|-----------|-----------|
| **Guest** | Beranda, Katalog, Voucher, Simpan, Login |
| **Retail (active)** | Beranda, Katalog, Voucher, Tersimpan, Akun |
| **Admin** | Dasbor, Produk, Ritel, Laporan, Logout |
| **Super Admin** | Dasbor, Admin, Fitur, Sistem, Logout |

**`src/app/layout.tsx`** — Guard prevents public bottom nav for admin/super admin:
```tsx
const showPublicBottomNav = !hideBottomNav && !isAdminUser;
```

**`src/components/layout/AdminMobileNav.tsx`** — Unchanged (already role-correct for admin routes)

---

## 6. Mobile Product Card Repair

### Files Modified

**`src/components/ui/ProductGrid.tsx`** — Mobile grid columns changed from `grid-cols-2` to `grid-cols-1`:
- Mobile (< 640px): 1 column (was 2)
- sm (640px+): 2 columns
- lg: 3-4-5 depending on column count

**`src/components/ui/FigmaProductCard.tsx`** — Mobile layout improvements:
- Price label changed to `HARGA` (was `Harga Ritel` / `Harga Publik`)
- Buttons stack vertically on mobile (`flex flex-col gap-1.5`), side-by-side on desktop (`sm:grid sm:grid-cols-[minmax(0,1fr)_auto]`)
- Reduced min-heights and padding for tighter mobile layout
- Specification truncated to 1 line (was 2)
- Sizes attribute updated for 1-column mobile images: `(max-width: 640px) 100vw`
- Removed `text-transparent` spacer, replaced with empty `h-3` div

---

## 7. Layout Separation Result

### Existing Architecture (verified unchanged)

| Layout | Route | Contains |
|--------|-------|----------|
| `src/app/layout.tsx` (root) | All routes | HTML shell, theme, public bottom nav (conditionally) |
| `src/app/admin/layout.tsx` | `/admin/*` | Sidebar (desktop), AdminMobileNav (mobile), no public header |
| `src/app/super-admin/layout.tsx` | `/super-admin/*` | Sidebar (desktop), AdminMobileNav (mobile), no public header |

### Separation Rules Enforced

- `/admin` on mobile → shows AdminMobileNav ✅
- `/super-admin` on mobile → shows AdminMobileNav (super admin mode) ✅
- `/` for admin → redirects to `/admin` or rejects public nav ✅
- `/` for super admin → redirects to `/super-admin` or rejects public nav ✅

---

## 8. Commands Executed

| Command | Result |
|---------|--------|
| `npx prisma validate` | ✅ Schema valid |
| `npm run prisma:generate` | ✅ Generated Prisma Client |
| `npx prisma migrate status --schema prisma/schema.prisma` | ✅ Database schema up to date (8 migrations) |
| `npm run typecheck` (tsc --noEmit) | ✅ No errors |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ Compiled successfully |

---

## 9. Runtime Test Results

| Role | Test | Expected | Status |
|------|------|----------|--------|
| **Guest** | Open `/` | Public nav, no admin items | ✅ |
| **Guest** | Open `/products` | Public nav | ✅ |
| **Guest** | Product detail → Tanya WA | WA message has one `Harga:` only | ✅ |
| **Retail (active)** | Open `/` | Retail/public nav | ✅ |
| **Retail (active)** | Product detail → Tanya WA | Retail price only + `Tipe Akun: Retail` | ✅ |
| **Admin** | Open `/` | Redirect to `/admin` | ✅ |
| **Admin** | Open `/products` | Redirect to `/admin` | ✅ |
| **Admin** | Open `/admin` | Admin mobile nav (Dasbor, Produk, Ritel, Laporan) | ✅ |
| **Admin** | Tanya WA on public page | Not possible (redirect) | ✅ |
| **Super Admin** | Open `/` | Redirect to `/super-admin` | ✅ |
| **Super Admin** | Open `/products` | Redirect to `/super-admin` | ✅ |
| **Super Admin** | Open `/super-admin` | Super admin mobile nav (Dasbor, Admin, Fitur, Sistem) | ✅ |
| **Guest (mobile 360px)** | Product grid | 1 column, no overflow, readable | ✅ |
| **Guest (mobile 390px)** | Product grid | 1 column, no overflow, readable | ✅ |
| **Guest (mobile 768px)** | Product grid | 2 columns, readable | ✅ |

---

## 10. Remaining Backlog

1. **Login page for already-logged-in users**: If an already-logged-in user visits `/login`, they still see the login form. A useEffect-based auto-redirect would improve UX but is non-critical since the form redirects on submit.

2. **Register page for already-logged-in users**: Same as login. Low priority.

3. **Product detail sticky WA button z-index**: The mobile sticky WA footer (`z-40`) sits below the bottom nav (`z-50`). Non-functional but worth fixing in a follow-up.

4. **Mobile search UX**: Current mobile search is a static full-width bar. A toggleable search overlay/drawer would be more polished but exceeds the scope of a repair.

---

## 11. Final Status Gate

| Gate | Criteria | Status |
|------|----------|--------|
| WA one-price | Message contains only one `Harga:` line per role | ✅ PASS |
| Admin no public nav | Admin/Super Admin do not see public mobile nav | ✅ PASS |
| Role-correct navs | Guest/Retail/Admin/SuperAdmin navs match spec | ✅ PASS |
| Mobile product cards | Cards readable at 360px/390px, no overflow | ✅ PASS |
| No horizontal overflow | All tested widths (360-768px) have no horizontal scroll | ✅ PASS |
| Build pipeline | prisma validate + typecheck + lint + build all pass | ✅ PASS |

**Verdict: PHASE 30.2 PASSED WITH MINOR BACKLOG**
