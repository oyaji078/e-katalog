# desain.md — AI Design Guardrail for Computer & Electronics E-Catalog

This file is the official UI/UX design guardrail for this project. Every AI coding agent, developer, UI designer, and contributor MUST follow this document before creating or modifying any page, layout, component, dashboard, or role-based interface.

The goal of this file is to keep the product design consistent, marketplace-like, responsive, and aligned with the business model.

---

## 1. Project Design Identity

### Product Type
Computer and electronics e-catalog website.

### Design Concept
Marketplace-style electronics catalog.

### Main UX Reference
Use the general UX pattern of large Indonesian marketplace websites: strong search bar, category navigation, promo banner, voucher cards, product grids, filter sidebar, and product detail pages.

Do NOT copy Tokopedia branding, logo, icons, exact layout, illustrations, color identity, spacing, or visual assets.

### Visual Personality
The interface must feel:

- Modern
- Clean
- Fast
- Professional
- Product-focused
- Mobile-first
- Easy to scan
- Suitable for computer and electronic accessories
- Optimized for WhatsApp inquiry conversion

The interface must NOT feel like:

- A personal blog
- A wedding invitation
- A generic landing page
- A copied marketplace clone
- A checkout-heavy e-commerce platform

---

## 2. Business Model Rules

This app is NOT a full marketplace.

This app is NOT a checkout/payment system.

This app is an e-catalog for one computer/electronics store. Users browse products, view prices, view vouchers, see retail pricing if eligible, and contact the seller through WhatsApp.

### Main Conversion Flow

```text
User browses product
→ User opens product detail
→ User checks price/specification/voucher
→ User clicks WhatsApp button
→ WhatsApp opens with a prefilled product inquiry message
```

### Forbidden Business Features Unless Explicitly Requested

Do NOT add these features unless the project owner explicitly asks for them:

- Internal checkout
- Payment gateway
- Shopping cart system
- Courier/logistics system
- Multi-seller marketplace
- Seller dashboard
- Product bidding
- Wallet system
- Complex ERP modules

---

## 3. Official Color Palette

Use these colors as the official design system colors.

| Token | Hex | Usage |
|---|---|---|
| `primary-maroon` | `#6E1A37` | Main brand color, header accents, admin sidebar, primary buttons |
| `accent-rose` | `#AE2448` | Promo badge, voucher, highlight, secondary action |
| `soft-teal` | `#72BAA9` | Tech accent, success-friendly accent, light highlight, hover accent |
| `white` | `#FFFFFF` | Card background, page surfaces |
| `soft-bg` | `#F7F8FA` | Main page background |
| `border-gray` | `#E5E7EB` | Borders, tables, inputs |
| `text-dark` | `#1F2937` | Primary text |
| `text-muted` | `#6B7280` | Secondary text |
| `danger` | `#DC2626` | Delete, error, dangerous status |
| `warning` | `#F59E0B` | Warning, low stock, pending |
| `success` | `#16A34A` | Success, active status |
| `whatsapp-green` | `#25D366` | WhatsApp buttons only |

### Color Rules

- The website must mainly use `#6E1A37`, `#AE2448`, and `#72BAA9`.
- Do NOT use Tokopedia green as the main brand color.
- Do NOT introduce a new primary color without updating this file.
- Use `#25D366` only for WhatsApp-related buttons.
- Use `#AE2448` for promotions, vouchers, and price highlights.
- Use `#72BAA9` for light technology accents, soft labels, hover states, and supporting UI.
- Keep product areas bright and readable with white cards and light backgrounds.

---

## 4. Typography

Use a modern sans-serif font.

Recommended stack:

```css
font-family: Inter, "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Font Size Guidelines

| Element | Size |
|---|---|
| Page title | 24–32px |
| Section title | 20–24px |
| Product card title | 14–16px |
| Product price | 16–20px, bold |
| Short description | 13–14px |
| Badge text | 11–12px |
| Body text | 14–16px |
| Admin table text | 13–14px |

### Typography Rules

- Product names inside cards must be limited to 2 lines.
- Price must be visually stronger than description.
- Do not use decorative fonts.
- Do not use tiny text on mobile.
- Do not use invitation/poster-style typography.

---

## 5. Global Layout Rules

Use a marketplace-style page structure.

```text
Top Bar
Main Header
Search Bar
Category Navigation
Hero Banner
Voucher / Promo Section
Category Grid
Product Grid
Brand Section
Footer
```

### Container Width

- Desktop max width: `1200px` to `1280px`
- Tablet padding: `24px`
- Mobile padding: `16px`

### Spacing

- Desktop section spacing: `32px` to `48px`
- Mobile section spacing: `20px` to `28px`
- Card padding: `12px` to `16px`
- Button padding: `10px` to `16px`
- Card border radius: `12px` to `16px`

### Card Style

Cards must use:

- White background
- Light border
- Soft shadow or hover shadow
- Rounded corners
- Consistent image ratio
- Clear spacing

---

## 6. Public Website Pages

### 6.1 Homepage

The homepage must look like a modern marketplace catalog homepage.

Required section order:

1. Top bar with store information
2. Main header with logo, category menu, search bar, retail login, and WhatsApp
3. Hero promo banner
4. Quick category menu
5. Active voucher and promo cards
6. Recommended products
7. New products
8. Best-selling or featured products
9. Featured brands
10. Footer

Homepage wireframe:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Promo | Warranty | Help | Retail Login | WhatsApp  │
├─────────────────────────────────────────────────────────────┤
│ Logo | Category | Product Search | Voucher | Login | WA      │
├─────────────────────────────────────────────────────────────┤
│ Hero Banner: Computer & Accessories Promo                   │
├─────────────────────────────────────────────────────────────┤
│ Categories: Laptop | PC | Monitor | Keyboard | Mouse        │
├─────────────────────────────────────────────────────────────┤
│ Voucher & Promo Cards                                       │
├─────────────────────────────────────────────────────────────┤
│ Recommended Products                                        │
│ [Card] [Card] [Card] [Card] [Card]                          │
├─────────────────────────────────────────────────────────────┤
│ New Products                                                │
│ [Card] [Card] [Card] [Card] [Card]                          │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.2 Product Catalog Page

The catalog page must focus on search, filter, sorting, and product grid browsing.

Required elements:

- Sticky or always-visible search header
- Breadcrumb
- Category title or search result title
- Desktop filter sidebar
- Mobile filter drawer
- Sorting control
- Product grid
- Empty state when no product is found

Required filters:

- Category
- Brand
- Price range
- Stock status
- Promo
- Voucher
- Retail price availability
- Category-specific technical specifications

Example technical filters:

- Processor
- RAM
- Storage
- Screen size
- Printer type
- Connection type
- Capacity

Catalog wireframe:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header + Search Bar                                         │
├───────────────┬─────────────────────────────────────────────┤
│ Filter        │ Search result or category title             │
│ - Category    │ Sort: Newest | Lowest Price | Promo         │
│ - Brand       │ [Card] [Card] [Card] [Card]                 │
│ - Price       │ [Card] [Card] [Card] [Card]                 │
│ - Stock       │ [Card] [Card] [Card] [Card]                 │
│ - Promo       │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

---

### 6.3 Product Detail Page

The product detail page must highlight image gallery, price, specifications, stock, vouchers, and WhatsApp inquiry.

Required elements:

1. Breadcrumb
2. Product image gallery
3. Product name
4. SKU / product code
5. Status badges: promo, ready stock, low stock, retail
6. Public price
7. Retail price if user is active retail user
8. Retail login prompt if user is not logged in
9. Available vouchers
10. Stock status
11. Warranty information
12. Technical specifications
13. Product description
14. WhatsApp inquiry button
15. Related products

Product detail wireframe:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header + Search Bar                                         │
├──────────────┬───────────────────────────┬──────────────────┤
│ Image Gallery│ Product Name              │ Action Panel      │
│ Thumbnails   │ SKU                       │ Price             │
│ Thumbnails   │ Public Price              │ Stock             │
│ Thumbnails   │ Retail Price/Login Prompt │ Voucher           │
│              │ Short specification       │ [Ask via WA]      │
├──────────────┴───────────────────────────┴──────────────────┤
│ Product Specifications                                      │
│ Product Description                                         │
│ Related Products                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.4 Promo and Voucher Page

This page displays public vouchers and retail-only vouchers.

Rules:

- Show vouchers as cards.
- Clearly separate public vouchers and retail vouchers.
- Locked retail vouchers must show login/retail activation prompt.
- Show minimum purchase, applicable category/product, validity period, and status.

---

## 7. Retail User Flow and Pages

Retail access is NOT automatic.

A user must register first, contact admin via WhatsApp, receive a token generated by admin, and enter the token to activate retail access.

### 7.1 Account Registration Page

Required fields:

- Full name
- Email
- WhatsApp number
- Password
- Confirm password
- Store / institution name, optional
- Address, optional

After successful registration, show this instruction:

```text
Your account has been created. To activate retail access, contact admin through WhatsApp and request a retail activation token.
```

---

### 7.2 Request Retail Token via WhatsApp

Show a clear WhatsApp button:

```text
Contact Admin for Retail Token
```

Prefilled WhatsApp message:

```text
Hello Admin, I want to activate my retail account.

Name:
Email:
WhatsApp Number:
Store/Institution Name:
User Code:

Please help me get a retail activation token.
```

---

### 7.3 Retail Token Activation Page

This page is used to enter the token given by admin.

Required elements:

- Short explanation
- Token input
- Activate Retail button
- Success/error status
- Contact admin button if token fails

Success message:

```text
Your retail account has been activated. You can now view retail prices and retail vouchers.
```

Error message:

```text
The token is invalid, already used, expired, revoked, or not assigned to your account.
```

---

### 7.4 Retail Price Display Rules

If user is not logged in:

```text
Retail price is available. Log in as a retail user to view special pricing.
```

If user is logged in but not retail-active:

```text
Retail access is not active yet. Contact admin to request a retail activation token.
```

If user is active retail user:

```text
Public Price: Rp x.xxx.xxx
Retail Price: Rp x.xxx.xxx
Badge: Special Retail Price
```

---

## 8. Admin Dashboard

Admin manages store operations only.

Admin must NOT access system-level technical features.

### Admin Menu

```text
Dashboard
Products
Categories
Brands
Price & Margin
Vouchers
Retail Users
Generate Retail Token
Promo Banners
WhatsApp Inquiries
Reports
Store Settings
```

### Admin Dashboard Required Content

- Total products
- Active products
- Low-stock products
- Total retail users
- Total WhatsApp inquiries
- Active vouchers
- Most viewed products
- Latest activity

### Admin UI Rules

- Use fixed sidebar on desktop.
- Use drawer menu on mobile.
- Use clean tables.
- Use status badges.
- Important actions require confirmation.
- Forms must be clear and not overcrowded.

Admin must NOT see these menus:

```text
Admin Management
Role & Permission
Feature Flags
Deployment Center
CI/CD Status
Maintenance Mode
System Logs
Security Settings
Environment Info
```

---

## 9. Super Admin Dashboard

Super Admin controls system-level features.

### Super Admin Menu

```text
Dashboard
Products
Categories
Brands
Price & Margin
Vouchers
Retail Users
Generate Retail Token
Promo Banners
WhatsApp Inquiries
Reports
Store Settings

Admin Management
Role & Permission
Feature Flags
Deployment Center
CI/CD Status
Maintenance Mode
System Logs
Backup Info
Security Settings
Environment Info
```

### Super Admin Rules

Super Admin can:

- Create admin accounts
- Manage admin role and permission
- Manage feature flags
- View deployment status
- View CI/CD status
- Enable maintenance mode
- View system logs
- View safe environment information

Super Admin must NOT see raw secrets.

Never display:

- Database password
- Auth secret
- GitHub token
- Hostinger token
- SMTP password
- API private key
- Any raw secret value

---

## 10. Role-Based UI Rules

### Roles

```text
guest
user
retail_pending
retail_active
admin
super_admin
```

### Access Summary

| Feature | Guest | User | Retail Pending | Retail Active | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| Browse catalog | Yes | Yes | Yes | Yes | Yes | Yes |
| View product detail | Yes | Yes | Yes | Yes | Yes | Yes |
| WhatsApp inquiry | Yes | Yes | Yes | Yes | Yes | Yes |
| Register account | Yes | No | No | No | No | No |
| Request retail token | No | Yes | Yes | No | No | No |
| Enter retail token | No | Yes | Yes | No | No | No |
| View retail price | No | No | No | Yes | Yes | Yes |
| Manage products | No | No | No | No | Yes | Yes |
| Manage vouchers | No | No | No | No | Yes | Yes |
| Generate retail token | No | No | No | No | Yes | Yes |
| Manage admin accounts | No | No | No | No | No | Yes |
| Feature flags | No | No | No | No | No | Yes |
| Deployment center | No | No | No | No | No | Yes |
| CI/CD status | No | No | No | No | No | Yes |
| Maintenance mode | No | No | No | No | No | Yes |
| System logs | No | No | No | No | No | Yes |

---

## 11. Product Card Component

ProductCard is the most important public UI component.

Required elements:

1. Product image
2. Promo/stock/retail badges if available
3. Product name, maximum 2 lines
4. Short specification
5. Public price
6. Retail price if user is retail-active
7. Voucher badge if available
8. Stock status
9. WhatsApp inquiry button

Product card wireframe:

```text
┌──────────────────────┐
│ Product Image         │
│ [PROMO] [READY]       │
├──────────────────────┤
│ ASUS Vivobook 14      │
│ i5 / 8GB / SSD 512GB  │
│ Rp 7.450.000          │
│ Voucher available     │
│ [Ask via WhatsApp]    │
└──────────────────────┘
```

Product card rules:

- Use consistent image ratio, preferably 1:1.
- Use light hover effect on desktop.
- Do not make cards too tall.
- Do not show overly long specifications.
- WhatsApp button must be clear.
- Product card must work in 2-column mobile grid.

---

## 12. Button System

### Primary Button

Color: `#6E1A37`

Use for:

- Save
- Login
- View products
- Activate token
- Main admin action

### Secondary Button

Color: `#AE2448`

Use for:

- View promo
- Use voucher
- Supporting action

### Teal Accent Button

Color: `#72BAA9`

Use for:

- Active filter
- Light labels
- Minor action

### WhatsApp Button

Color: `#25D366`

Use only for:

- Ask via WhatsApp
- Contact admin
- Request retail token

Button rules:

- Do not use WhatsApp green for non-WhatsApp actions.
- Do not use too many button colors on one page.
- Use one main primary action per section when possible.

---

## 13. Badge System

Use small badges for status and labels.

| Badge | Color |
|---|---|
| Promo | `#AE2448` |
| Ready Stock | `#16A34A` |
| Low Stock | `#F59E0B` |
| Retail | `#72BAA9` |
| Inactive | `#6B7280` |
| Pending | `#F59E0B` |
| Expired | `#DC2626` |

---

## 14. Form Design

Form rules:

- Labels must be visible.
- Placeholder must not replace label.
- Required fields must be marked.
- Error message must appear below the field.
- Price input must support Rupiah formatting.
- Margin input must support percent and nominal modes if needed.
- Product image upload must show preview.

Important forms:

- Login
- Register
- Retail token input
- Add product
- Edit product
- Add voucher
- Generate retail token
- Store settings
- Feature flag settings

---

## 15. Admin Table Design

Admin tables must be clean and easy to scan.

Required table features:

- Search
- Filter
- Sorting
- Pagination
- Status badge
- Action menu
- Bulk action only if needed

Common actions:

- Detail
- Edit
- Enable/disable
- Delete

Sensitive actions must require confirmation.

---

## 16. Feature Flag UI

Feature Flag UI must be visible only to Super Admin.

Table columns:

```text
Feature Name | Key | Scope | Status | Last Updated | Action
```

Required elements:

- Enable/disable toggle
- Scope badge: global, role, user
- Feature description
- Change log
- Confirmation before changing important flags

Important feature flags:

```text
enable_retail_registration
enable_retail_token_activation
enable_retail_price
enable_public_voucher
enable_retail_voucher
enable_margin_management
enable_inquiry_tracking
enable_product_import
enable_maintenance_mode
```

---

## 17. Deployment Center UI

Deployment Center must be visible only to Super Admin.

Allowed information:

- Active environment
- Production branch
- Last commit
- Last deployment time
- Build status
- App status
- Safe repository link
- App version

Forbidden information:

- Database password
- Auth secret
- GitHub token
- Hostinger token
- SMTP password
- API private key
- Raw secret values

---

## 18. CI/CD Status UI

CI/CD Status must be visible only to Super Admin.

Required display:

```text
Build Status: Passed/Failed
Branch: main/develop
Last Commit: commit message
Last Deploy: date time
Deployment Provider: Hostinger
CI Provider: GitHub Actions
```

If status fails, show a safe general message and direct Super Admin to check GitHub Actions or Hostinger dashboard.

Do not expose raw logs if they contain secrets.

---

## 19. Responsive Design Rules

The app must be mobile-first.

### Mobile

- Product grid: 2 columns
- Header becomes sticky search bar
- Filter becomes drawer
- Admin sidebar becomes drawer
- WhatsApp button must be easy to reach
- Bottom navigation may be used for public pages

Public bottom navigation:

```text
Home | Category | Promo | Retail | WhatsApp
```

### Tablet

- Product grid: 3 columns
- Filter may become collapsible sidebar

### Desktop

- Product grid: 4–5 columns
- Filter sidebar visible
- Full header visible
- Admin sidebar visible

---

## 20. Required Reusable Components

Create and reuse these components consistently:

```text
AppHeader
TopBar
SearchBar
CategoryDropdown
CategoryGrid
HeroBanner
PromoBanner
VoucherCard
ProductCard
ProductGrid
ProductFilterSidebar
ProductFilterDrawer
ProductDetailGallery
RetailPriceBadge
WhatsAppButton
BottomNavigationMobile
AdminSidebar
AdminHeader
AdminDataTable
AdminStatsCard
FeatureFlagToggle
DeploymentStatusCard
CICDStatusCard
MaintenanceModePanel
RetailTokenInput
RetailTokenGenerator
```

---

## 21. Design Restrictions

Do NOT:

1. Copy Tokopedia UI exactly.
2. Use Tokopedia logo, icon, color identity, or visual assets.
3. Build a blog-like interface.
4. Build invitation-style visuals.
5. Add checkout/payment gateway without explicit instruction.
6. Add full shopping cart without explicit instruction.
7. Use colors outside the official palette as primary colors.
8. Remove WhatsApp button from product card or product detail.
9. Show Super Admin menus to Admin.
10. Show technical secrets in the dashboard.
11. Make user become retail automatically without admin-generated token.
12. Build high-risk features without feature flag control.
13. Make UI too crowded with too many colors.
14. Use unreadably small text.
15. Create products without category, brand, price, and stock status.

---

## 22. AI Coding Agent Rules

AI coding agent MUST:

1. Read this `desain.md` file before creating or modifying UI.
2. Follow the official colors: `#6E1A37`, `#AE2448`, `#72BAA9`.
3. Keep marketplace-style experience without copying Tokopedia.
4. Use mobile-first responsive design.
5. Build reusable components.
6. Separate Public, Retail, Admin, and Super Admin interfaces.
7. Implement correct role-based rendering.
8. Keep retail access controlled by admin-generated token.
9. Keep WhatsApp as the main conversion flow.
10. Show feature flag, deployment, CI/CD, and admin management only to Super Admin.
11. Avoid creating out-of-scope features.
12. Update this file if the global design direction changes.

If there is conflict between this file and an AI assumption, follow this file.

---

## 23. UI Merge Checklist

Before merging any UI change, verify:

- [ ] Colors follow the official palette.
- [ ] Header and search bar follow marketplace-style UX.
- [ ] Product cards are consistent.
- [ ] Product detail has WhatsApp inquiry button.
- [ ] Catalog has filter and sorting.
- [ ] Mobile layout is clean.
- [ ] Admin cannot see Super Admin menus.
- [ ] Super Admin can see technical menus.
- [ ] Retail token activation flow exists.
- [ ] Feature Flag UI is Super Admin only.
- [ ] Deployment Center does not show secrets.
- [ ] No checkout/payment gateway was added without instruction.
- [ ] No exact visual copying from Tokopedia.

---

## 24. Final Design Direction

The final design direction is:

```text
Marketplace-style catalog
+ computer and electronic accessories focus
+ search-first experience
+ product card grid
+ public price and retail price
+ voucher system
+ WhatsApp-first inquiry
+ professional admin dashboard
+ Super Admin system control
```

This file is the primary design reference. All UI work must follow it.
