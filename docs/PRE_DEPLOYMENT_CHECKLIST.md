# Pre-Deployment Checklist

Check every item before deploying to production.

---

## Source Code Checks

- [ ] `npm run lint` passes with zero errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] `npx prisma validate` — schema is valid
- [ ] `npx prisma generate` — client generated
- [ ] `npx prisma migrate status` — database schema is up to date
- [ ] All new migration files are committed to Git
- [ ] CI workflow passes on the target branch (`.github/workflows/ci.yml`)

---

## Security Checks

- [ ] `.env` is listed in `.gitignore` and NOT committed
- [ ] `.env.example` contains no real secrets — only placeholders
- [ ] `DATABASE_URL` is NOT hardcoded in any source file
- [ ] `BETTER_AUTH_SECRET` is NOT hardcoded or leaked
- [ ] No Hostinger / VPS credentials committed anywhere
- [ ] No GitHub tokens or SMTP passwords committed
- [ ] `STORE_WHATSAPP_NUMBER` is server-side only (no `NEXT_PUBLIC_` prefix)
- [ ] `NEXT_PUBLIC_STORE_WHATSAPP_NUMBER` does **not** exist in any file
- [ ] `process.env` is NOT used in any client component (`"use client"` file)
- [ ] No `NEXT_PUBLIC_` variables contain secrets

---

## Scope Checks

The application must remain a pure e-catalog for computer and electronic accessories.

- [ ] No cart system
- [ ] No checkout system
- [ ] No payment gateway
- [ ] No shipping/logistics
- [ ] No order management
- [ ] No multi-seller marketplace

The only conversion flow is: **Product browsing → Product detail → WhatsApp inquiry**.

---

## Infrastructure Checks

- [ ] MySQL database is created and reachable
- [ ] All environment variables are set in Hostinger panel:
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `STORE_WHATSAPP_NUMBER`
- [ ] GitHub repository is connected to Hostinger
- [ ] Production branch (`main`) is selected
- [ ] Node version is set to 24
- [ ] Build command is `npm run build`
- [ ] Start command is `npm start`
- [ ] Domain is connected with active SSL certificate
- [ ] No Docker dependency required
- [ ] No Redis dependency required
- [ ] No WebSocket dependency required
- [ ] No VPS/root access requirement

---

## Database Checks

- [ ] Production migration applied: `npx prisma migrate deploy`
- [ ] Seed data loaded: `npm run prisma:seed`
- [ ] First admin user promoted (see `docs/ADMIN_SETUP.md`)
- [ ] Migration status confirms: `Database schema is up to date!`
- [ ] Production database backed up

---

## Post-Deployment Verification

### Public pages
- [ ] Homepage loads at the public domain
- [ ] Product catalog page loads
- [ ] Product detail page loads
- [ ] Category filtering works
- [ ] Voucher page loads
- [ ] WhatsApp inquiry opens correct chat with product info

### Authentication
- [ ] `/register` page works
- [ ] New user can register
- [ ] `/login` page works
- [ ] Existing user can log in
- [ ] Session persists across page navigation

### Retail flow
- [ ] Registered user can request WhatsApp token at `/retail/request-token`
- [ ] Admin can generate retail token at `/admin/generate-token`
- [ ] Retail token activation at `/retail/activate` works
- [ ] Retail price is visible to RETAIL_ACTIVE users

### Admin
- [ ] `/admin` dashboard loads
- [ ] Product CRUD works
- [ ] Retail users page shows grouped statuses
- [ ] Token generation works

### Super Admin
- [ ] `/super-admin` dashboard loads
- [ ] Feature flags can be toggled
- [ ] Feature flag toggle is enforced server-side
- [ ] Environment page does NOT expose secrets
- [ ] System logs page loads

### Maintenance mode
- [ ] Enabling maintenance mode blocks public access
- [ ] Admin / Super Admin can still access the site
- [ ] Disabling maintenance mode restores public access
