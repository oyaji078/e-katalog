# desain.md — E-Katalog UI/UX Design Guardrail

## 1. Purpose

This file is the official UI/UX and interaction guardrail for the e-katalog project.

Every AI coding agent, developer, or refactor task must follow this file before editing public UI, admin UI, voucher UI, pricing UI, product cards, navigation, layouts, or role-based screens.

If another prompt conflicts with this file, follow this file unless the project owner explicitly approves a design change.

---

## 2. Product Context

This application is a computer and electronic accessories e-catalog.

Core business flow:

```text
User browses products → User opens product detail → User contacts seller via WhatsApp
```

This app is NOT:

```text
Cart system
Checkout system
Payment gateway system
Shipping/logistics system
Order management system
Multi-seller marketplace
```

Do not add cart, checkout, payment, shipping, order, or multi-seller behavior.

---

## 3. Visual Design Direction

The public UI should follow a modern Indonesian marketplace-style layout inspired by the provided Figma Make reference, but adapted for a single-store computer and electronics e-catalog.

Use these design patterns:

```text
Sticky gradient marketplace header
Large rounded search bar
Category chips/grid
Hero banner carousel
Service badges
Voucher banner strip
Promo/voucher cards
Responsive product grid
Role-aware user menu
WhatsApp-first CTA
Mobile bottom navigation
Rounded cards and soft shadows
```

Do NOT copy unrelated Figma business elements such as:

```text
Shopping cart
Cart count
Checkout CTA
Payment flow
Fashion/beauty/food category copy
Multi-seller copy
Seller onboarding copy
```

Replace cart-related UI with:

```text
WhatsApp inquiry
Voucher claim
Retail access
User account/logout
```

---

## 4. Brand Colors

Use the official project colors:

```text
Primary Maroon: #6E1A37
Accent Rose:   #AE2448
Soft Teal:     #72BAA9
```

Recommended usage:

| Color | Usage |
|---|---|
| `#6E1A37` | Main brand, header gradient start, primary buttons, retail price emphasis |
| `#AE2448` | Accent, promo labels, warnings, voucher highlight, active states |
| `#72BAA9` | Support color, service badges, voucher background, success/soft emphasis |
| White | Cards, search input, clean content areas |
| Light gray | Page background, section separation |
| Dark text | Product name, price, admin table text |

Header gradient:

```css
linear-gradient(135deg, #6E1A37 0%, #AE2448 100%)
```

Do not use Tokopedia green or exact Tokopedia branding.

---

## 5. Typography and Spacing

Use clean, readable marketplace-style typography.

Recommended font direction:

```text
Inter
Nunito
Plus Jakarta Sans
system sans-serif fallback
```

General UI rules:

```text
Use readable text sizes.
Use strong visual hierarchy.
Use rounded cards.
Use consistent spacing.
Avoid cramped product cards.
Avoid excessive text in cards.
Mobile-first layout is required.
```

---

## 6. Public Layout Structure

The public homepage should use this structure:

```text
Sticky Header
Category Navigation
Hero Banner Carousel
Service Badges
Voucher Banner Strip
Featured Categories
Promo/Voucher Cards
Recommended Products
New Products
Footer
Mobile Bottom Navigation
```

The product catalog page should use this structure:

```text
Sticky Header
Search / Sort / Filter Controls
Filter Sidebar on desktop
Filter Drawer on mobile
Product Grid
Voucher/Promo Highlight when relevant
```

The product detail page should use this structure:

```text
Sticky Header
Breadcrumb or Back to Catalog
Product Image Gallery
Product Name + SKU + Stock
Public/Retail Price Block
Applicable Voucher Section
Specification Section
Warranty Info
Primary WhatsApp Inquiry CTA
Related Products
```

---

## 7. Header / Navbar Rules

The header must be role-aware.

### Guest Navbar

Show:

```text
Logo
Search bar
Categories
Voucher
Login
Daftar Ritel / Retail Login
WhatsApp / Tanya Admin
```

Do not show logout.
Do not show admin dashboard link.

### Logged-in REGISTERED User

Show:

```text
Logo
Search bar
Voucher
Request Token / Aktivasi Ritel
Logout
```

Do not show Retail Login.

### PENDING_RETAIL User

Show:

```text
Aktivasi Token
Logout
```

Show a clear path to `/retail/activate`.

### RETAIL_ACTIVE User

Show:

```text
Harga Ritel Aktif badge
Voucher Ritel
Katalog
Logout
```

Do not show Retail Login.

### ADMIN User

Show:

```text
Dashboard Admin
Logout
```

Admin must not see Super Admin menu.

### SUPER_ADMIN User

Show:

```text
Super Admin
Dashboard Admin if useful
Logout
```

Super Admin may access all admin-level routes.

### Technical Rule

Navbar state should come from a safe server-side current user lookup where possible.
Do not rely on stale `session.user.role` for protected role decisions.
Do not use `useSession` in Server Components.

---

## 8. Mobile Bottom Navigation

Mobile bottom navigation should include:

```text
Beranda
Kategori
Voucher
Produk
Akun/Login
```

Role-aware behavior:

```text
Guest: Akun/Login
REGISTERED: Request Token or Akun
PENDING_RETAIL: Aktivasi Token
RETAIL_ACTIVE: Akun Ritel
ADMIN: Admin
SUPER_ADMIN: Super Admin
```

Do not include cart.

---

## 9. Category Rules

Only use computer/electronics-related categories.

Recommended categories:

```text
Laptop
PC Rakitan
Monitor
Keyboard
Mouse
Printer
Networking
CCTV
Storage
Aksesoris
Sparepart
Software
```

Do not use unrelated categories such as:

```text
Fashion
Beauty
Food
Books
Household
Sports
Automotive
```

Unless the project owner explicitly changes the store domain.

---

## 10. Product Card Rules

Product cards must show:

```text
Product image
Product badge if available
Product name
Short specification
Public price
Retail price only when allowed
Voucher badge if applicable
Stock status
WhatsApp inquiry button
```

Product cards must NOT show:

```text
Add to Cart
Checkout
Payment
Shipping option
Order button
```

Primary CTA:

```text
Tanya via WhatsApp
Hubungi via WhatsApp
```

### Product Card Pricing

For Guest / USER / PENDING_RETAIL:

```text
Show public price only.
Optionally show helper: Aktifkan akun ritel untuk melihat harga khusus.
```

For RETAIL_ACTIVE when `enable_retail_price` is ON:

```text
Public price: smaller, muted, crossed out.
Retail price: larger, dominant, Primary Maroon.
Badge: Harga Ritel or Harga Khusus Ritel Aktif.
```

For RETAIL_ACTIVE when `enable_retail_price` is OFF:

```text
Show public price only.
Do not show retail price.
```

Never expose `costPrice` outside Admin/Super Admin pages.

---

## 11. Product Detail Rules

Product detail must use the same pricing and role logic as product cards.

For RETAIL_ACTIVE users with retail price enabled:

```text
Show public price crossed out.
Show retail price as the main price.
Show badge: Harga Khusus Ritel Aktif.
```

Product detail must include:

```text
Image/gallery
Product name
SKU
Stock status
Public/retail price block
Applicable vouchers
Specifications
Warranty info
WhatsApp inquiry CTA
Back to catalog link
```

Product detail must NOT include:

```text
Cart panel
Checkout panel
Payment method
Shipping calculation
Order summary
```

---

## 12. Catalog Filter and Return Behavior

The product catalog must always show filter controls.

Desktop:

```text
Filter sidebar + product grid
```

Mobile:

```text
Filter drawer or collapsible filter section
```

Filter state should use URL query params where possible.

Example:

```text
/products?category=laptop&brand=asus&sort=latest
```

Product detail links should preserve a safe `returnUrl` when possible.

Example:

```text
/products/asus-vivobook?returnUrl=/products?category=laptop&brand=asus
```

Safe `returnUrl` rules:

```text
Must start with /
Must not start with //
Must not contain http://
Must not contain https://
```

Product detail should show:

```text
Kembali ke Katalog
```

using safe `returnUrl`, or fallback to `/products`.

---

## 13. Voucher Design Direction

Voucher must look like a marketplace promo element, but must match the e-catalog WhatsApp-first business model.

Voucher is NOT a checkout discount.
Voucher is a claimable promo that is included in WhatsApp inquiry for admin verification.

Voucher flow:

```text
User sees voucher banner/card
User clicks Klaim Voucher
Voucher is saved as claimed
Product card/detail shows applicable claimed voucher
User clicks WhatsApp inquiry
WhatsApp message includes claimed voucher info
Admin verifies voucher manually during WhatsApp transaction
```

---

## 14. Voucher Banner Rules

Voucher banner must be visually prominent.

VoucherBanner should show:

```text
Banner title
Banner subtitle
Discount label
Voucher code if safe
Audience badge: Umum / Ritel
Expiry date
CTA: Klaim Voucher
```

Recommended visual style:

```text
Soft Teal gradient background
Rounded card
Accent Rose discount label
Primary Maroon CTA
```

Voucher banners should be database-driven when voucher records exist.
Avoid hardcoded-only voucher banners.

---

## 15. Voucher Card Rules

VoucherCard should show:

```text
Voucher code
Title
Description
Discount value
Minimum purchase
Applicable product/category
Audience: Public/Retail
Expiry date
Claim button
Claimed state
```

Claim button states:

```text
Klaim Voucher
Sudah Diklaim
Login untuk Klaim
Tidak Berlaku
Kuota Habis
Expired
```

---

## 16. Voucher Claim Logic

Voucher claim must be server-side validated.

Rules:

```text
Logged-in user can claim public voucher.
Retail voucher can only be claimed by RETAIL_ACTIVE user.
Guest should be asked to login before claiming voucher.
Voucher must be active.
Voucher must be within startDate/endDate.
Voucher quota must not be exceeded.
Duplicate claim by same user must be blocked.
Missing feature flag defaults false.
Claiming voucher must not create checkout/order/payment.
```

Feature flags:

```text
enable_public_voucher
enable_retail_voucher
```

Voucher claim must not trust client-submitted role, retail status, discount value, or userId.

---

## 17. VoucherClaim Model Direction

If voucher claim is implemented, use a model similar to:

```text
VoucherClaim
- id
- voucherId
- userId nullable
- sessionId nullable
- status: CLAIMED / USED / EXPIRED / CANCELLED
- claimedAt
- usedAt nullable
- createdAt
- updatedAt
```

For MVP, prefer requiring login to claim voucher.
Guest voucher claim via anonymous session can be added later.

---

## 18. WhatsApp Inquiry + Voucher Rules

WhatsApp inquiry must remain the conversion path.

When user clicks WhatsApp inquiry:

```text
Server resolves product.
Server resolves current user.
Server resolves allowed price.
Server resolves applicable claimed vouchers.
Server builds WhatsApp message.
Server returns waUrl.
```

Client must not submit:

```text
Final price
User role
Retail status
Discount value
Seller WhatsApp number
```

If claimed voucher applies, message should include:

```text
Voucher: [code/title] - [discount label]
```

If voucher exists but is not claimed:

```text
Voucher tersedia. Klaim voucher sebelum menghubungi admin.
```

Do not create checkout discount calculation.

---

## 19. Retail Account UX Rules

Retail activation flow:

```text
Register account
Request retail token via WhatsApp
Admin verifies user
Admin generates token
User inputs token at /retail/activate
Account becomes RETAIL_ACTIVE
Retail price becomes visible if enable_retail_price is ON
```

Required pages:

```text
/retail/request-token
/retail/activate
/retail/activate/success
/retail/activate/failed
```

Request token page must show:

```text
Minta Token via WhatsApp
Sudah punya token? Aktifkan Akun Ritel
```

Activation page must show:

```text
Token input form
Clear error/success state
Helper: Masukkan token lengkap yang dikirim admin, bukan token preview atau token hash dari database.
```

---

## 20. Admin UI Rules

Admin pages should use a clean dashboard style.

Admin can manage:

```text
Products
Categories
Brands
Prices and margins
Vouchers
Retail users
Retail token generation
Promo banners
WhatsApp inquiries
Reports
Store settings
```

Admin must not access:

```text
Feature flags
Deployment center
CI/CD status
Environment secrets
System logs if Super Admin only
Admin account management
```

Admin dashboard should use:

```text
Sidebar
Metric cards
Data tables
Status badges
Clear action buttons
Safe empty states
```

---

## 21. Super Admin UI Rules

Super Admin can access:

```text
All Admin features
Admin users
Roles and permissions
Feature flags
Deployment center
CI/CD status
Maintenance mode
System logs
Security settings
Environment info
```

Super Admin pages must never display secrets.

Allowed environment info:

```text
NODE_ENV
App environment
Node version
Runtime target
Database connected/not connected
App version
Build version
Domain if configured
CDN status if configured
```

Forbidden:

```text
DATABASE_URL
BETTER_AUTH_SECRET
GitHub token
Hostinger credentials
SMTP password
API secrets
Private keys
```

---

## 22. Login / Logout UX Rules

Login behavior:

```text
SUPER_ADMIN → /super-admin
ADMIN → /admin
RETAIL_ACTIVE → /products
PENDING_RETAIL → /retail/activate or /retail/request-token
REGISTERED → /retail/request-token
USER/default → /
```

If a safe `callbackUrl` exists, use it.

Safe callback URL rules:

```text
Must start with /
Must not start with //
Must not include http://
Must not include https://
```

Logout:

```text
Admin and Super Admin dashboards must show Logout.
Public navbar must show Logout for logged-in users.
Logout clears session and redirects to /login or /.
Navbar must update after logout.
```

---

## 23. Server / Client Component Rules

Do not pass raw Prisma objects with unsupported values to Client Components.

Before passing to Client Components:

```text
Convert Prisma Decimal to string.
Convert Date to ISO string.
Convert BigInt to string if any.
```

Do not import these in Client Components:

```text
Prisma
getDb
next/headers
next/cache
server auth helpers
```

Client Components may handle:

```text
Mobile menu
Carousel state
Filter drawer
Voucher claim loading state
WhatsApp button loading state
Logout click
Copy-to-clipboard
```

Server Components should handle:

```text
Current user lookup
Role/retail status
Price visibility
Voucher visibility
Database queries
Protected route checks
```

---

## 24. Security Rules

Always enforce these rules:

```text
Do not expose secrets.
Do not expose DATABASE_URL.
Do not expose BETTER_AUTH_SECRET.
Do not expose Hostinger credentials.
Do not expose GitHub tokens.
Do not expose SMTP passwords.
Do not expose costPrice to public/retail users.
Do not trust client-submitted price.
Do not trust client-submitted role.
Do not trust client-submitted retailStatus.
Do not trust client-submitted seller WhatsApp number.
Do not log passwords.
Do not log plain activation tokens.
Do not store plain activation tokens in the database.
```

---

## 25. Feature Flag Rules

Feature flags must be checked server-side.

Standard flags:

```text
enable_retail_registration
enable_retail_token_activation
enable_retail_whatsapp_request
enable_retail_price
enable_public_voucher
enable_retail_voucher
enable_margin_management
enable_inquiry_tracking
enable_product_import
enable_promo_banner
enable_maintenance_mode
enable_admin_activity_log
```

Missing feature flags must not crash the app.

For feature access:

```text
Missing flag → false
Database error → fail closed
```

For logging:

```text
Logging error → do not break main mutation
```

---

## 26. Figma Reference Adaptation Rules

From the Figma reference, take:

```text
Gradient navbar
Large search bar
Hero carousel
Category chips/grid
Flash sale / promo strip style
Voucher banner cards
Product grid rhythm
Bottom mobile navigation
Rounded card style
Soft shadow
Compact mobile-first layout
```

Replace:

```text
ShoppingCart → WhatsApp / Voucher / Inquiry icon
cartCount → claimed voucher count or no counter
Belanja Sekarang → Lihat Produk / Tanya Admin / Klaim Voucher
Jual di eKatalog → Login Ritel / Daftar Ritel
Fashion/beauty/food copy → computer/electronics copy
```

Never add:

```text
Cart
Checkout
Payment
Shipping
Order
Multi-seller seller portal
```

---

## 27. Manual UI Test Checklist

After any UI/UX update, manually test:

```text
Guest homepage
Guest product catalog
Guest product detail
Guest voucher page
Logged-in registered user navbar
Pending retail user navbar
Retail active user navbar
Admin navbar/dashboard link
Super Admin navbar/dashboard link
Logout behavior
Retail price display
Public price crossed out for retail active users
Product detail retail pricing
Voucher banner display
Voucher claim button
Voucher claimed state
WhatsApp inquiry with claimed voucher
Catalog filter visibility
Back to catalog returnUrl
Mobile bottom navigation
```

---

## 28. Required Verification Commands

After implementation, run:

```bash
npm run lint
npm run typecheck
npm run build
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Do not claim success unless all required commands pass.

---

## 29. Final Implementation Rule

Every UI/UX change must preserve these core decisions:

```text
E-katalog only
Single-store product catalog
Computer and electronic accessories domain
WhatsApp-first inquiry
Role-aware navbar
Retail token activation
Retail price visibility by role and feature flag
Voucher claim as WhatsApp promo, not checkout discount
Admin vs Super Admin separation
No secrets exposed
No cart/checkout/payment/shipping/order
```
