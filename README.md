# E-Katalog Komputer

Production-oriented e-catalog foundation for computer products and electronic accessories.

This app is intentionally not a checkout, payment, shipping, cart, wallet, bidding, ERP, or multi-seller marketplace system. The core flow remains:

`browse products -> view product detail -> contact seller through WhatsApp`

## Phase 1 Scope

- Next.js App Router with TypeScript and Tailwind CSS.
- Prisma ORM configured for MySQL through the MariaDB driver adapter.
- Better Auth email/password foundation with Prisma-backed users, sessions, accounts, and verification records.
- Role and retail status foundation for guest, user, retail pending, retail active, admin, and super admin.
- Database-backed feature flags with required default keys.
- Admin activity log model and helper.
- Hostinger Managed Node.js deployment notes and GitHub Actions CI.

## Local Setup

1. Copy `.env.example` to `.env` and replace local values if needed.
2. Start MySQL:

```bash
docker compose up -d mysql
```

3. Install dependencies and prepare the database:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Run the app:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Hostinger Managed Node.js

Use the GitHub deployment flow in Hostinger hPanel.

- Node.js version: `24.x`
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Required environment variables:
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_STORE_WHATSAPP_NUMBER`

Hostinger Managed Node.js currently supports MySQL for managed databases. Use a connection string shaped like:

```text
mysql://USER:PASSWORD@HOST:3306/DATABASE
```

Do not commit production database passwords, auth secrets, GitHub tokens, Hostinger tokens, SMTP passwords, API secrets, or private keys.

## Design Guardrail

All UI work must follow `desain.md`, including the official palette:

- Primary Maroon: `#6E1A37`
- Accent Rose: `#AE2448`
- Soft Teal: `#72BAA9`
- WhatsApp buttons only: `#25D366`
