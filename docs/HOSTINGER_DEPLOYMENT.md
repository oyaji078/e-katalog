# Hostinger Managed Node.js Deployment Guide

This guide covers deploying the e-katalog application to Hostinger Managed Node.js hosting.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Hosting plan** | Hostinger Managed Node.js (or any Node.js hosting with MySQL) |
| **Node.js** | Version 24 (matching `engines.node` in `package.json`) |
| **MySQL** | Database created in Hostinger MySQL panel |
| **GitHub** | Repository connected to Hostinger |
| **Domain** | Connected to Hostinger with SSL enabled |
| **SSL** | HTTPS certificate active |

---

## Step 1: Create MySQL Database

1. Log in to your Hostinger panel.
2. Go to **MySQL Databases**.
3. Create a new database.
4. Create a database user and grant all privileges.
5. Note the **host**, **port**, **database name**, **username**, and **password**.

---

## Step 2: Set Environment Variables

In the Hostinger panel, navigate to your Node.js application's **Environment Variables** section and add:

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/db_name` | Use the internal MySQL hostname for best performance |
| `BETTER_AUTH_SECRET` | (32-byte random hex) | Generate via `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `https://katalog.example.com` | Must match the public domain |
| `NEXT_PUBLIC_APP_URL` | `https://katalog.example.com` | Must match `BETTER_AUTH_URL` |
| `STORE_WHATSAPP_NUMBER` | `6281234567890` | Server-only, no `+` or `-` characters |

> **Never** commit these values to Git. Use the Hostinger env var panel.

---

## Step 3: Connect GitHub Repository

1. In Hostinger, go to **Node.js** → your app → **Git Deploy** (or similar).
2. Connect your GitHub repository.
3. Select the **main** branch.
4. Enable automatic deployment on push.

---

## Step 4: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Build command** | `npm run build` |
| **Start command** | `npm start` |
| **Node version** | 24 |
| **Production branch** | `main` |
| **Install command** | `npm ci` (Hostinger usually auto-detects) |

---

## Step 5: Run Production Migration

After the first build completes, run the production migration via Hostinger's terminal/SSH or deployment hooks:

```bash
npx prisma migrate deploy
```

This applies only pending migrations to the production database. It does **not** create new migrations.

---

## Step 6: Run Seed

```bash
npm run prisma:seed
```

This seeds:
- Feature flags (12 flags with defaults)
- Store settings (default WhatsApp number)

> The seed is **idempotent** — it uses `upsert` and can be run multiple times safely.

---

## Step 7: Create First Admin

See `docs/ADMIN_SETUP.md` for detailed instructions.

Summary:
1. Register a normal user via `/register`.
2. Promote the user to `SUPER_ADMIN` in the database using a MySQL query.
3. Log in at `/login` and verify `/super-admin` access.

> Admin promotion is intentionally manual — do not auto-seed admin accounts.

---

## Step 8: Post-Deployment Verification

- [ ] Homepage loads at the public domain
- [ ] Product catalog loads
- [ ] Product detail page loads
- [ ] WhatsApp inquiry opens the correct number
- [ ] `/register` page works
- [ ] `/login` works
- [ ] Admin login at `/admin` works
- [ ] Super Admin login at `/super-admin` works
- [ ] Feature flags can be toggled
- [ ] Maintenance mode works

---

## Troubleshooting

### Build fails
- Verify all environment variables are set.
- Check `DATABASE_URL` is reachable from the Hostinger Node.js container.
- Run `npx prisma validate` manually.

### Migration fails
- Ensure the MySQL user has `ALTER` and `CREATE` privileges.
- Check `npx prisma migrate status` for the current state.
- Never run `prisma migrate reset` in production.

### WhatsApp inquiry not working
- Verify `STORE_WHATSAPP_NUMBER` env var is set.
- Check the `store_whatsapp_number` entry in the `StoreSetting` table.
- Confirm the number format (country code, no `+`).

### Session / login not working
- Verify `BETTER_AUTH_SECRET` is set and matches across all app instances.
- Verify `BETTER_AUTH_URL` matches `NEXT_PUBLIC_APP_URL`.
- Clear browser cookies and try again.

---

## Maintenance

### Update the app
1. Push changes to the `main` branch on GitHub.
2. Hostinger auto-deploys (or trigger a manual redeploy).
3. Migrate the database if the schema changed:
   ```bash
   npx prisma migrate deploy
   ```

### Backup
- Regularly back up the MySQL database via Hostinger's backup feature.
- Store `BETTER_AUTH_SECRET` in a secure password manager — without it, all sessions are invalidated if redeployed.
