# Deployment Environment Variables

Required environment variables for Hostinger Managed Node.js (or any production deployment).

---

## Required Variables

### `DATABASE_URL`

- **Description:** MySQL connection string for Prisma.
- **Required:** Yes
- **Example:**
  ```
  DATABASE_URL="mysql://username:password@host:3306/database_name"
  ```
- **Notes:**
  - Hostinger provides MySQL credentials in the hosting panel.
  - Use the internal hostname (usually `localhost` or a private network host) for best performance.

### `BETTER_AUTH_SECRET`

- **Description:** Secret key used by Better Auth to sign session tokens and cookies.
- **Required:** Yes
- **Example:** (generate a real random 32-byte hex string)
  ```
  BETTER_AUTH_SECRET="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
  ```
- **Notes:**
  - Generate with: `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Keep this secret. Do not commit to Git. Do not share in logs or support tickets.
  - Changing this after deployment will invalidate all existing sessions.

### `BETTER_AUTH_URL`

- **Description:** Public-facing URL of the application.
- **Required:** Yes
- **Example:**
  ```
  BETTER_AUTH_URL="https://katalog.example.com"
  ```
- **Notes:**
  - Must match `NEXT_PUBLIC_APP_URL`.
  - Includes protocol (`https://`) and no trailing slash.

### `NEXT_PUBLIC_APP_URL`

- **Description:** Public-facing URL exposed to the browser.
- **Required:** Yes
- **Example:**
  ```
  NEXT_PUBLIC_APP_URL="https://katalog.example.com"
  ```
- **Notes:**
  - Must match `BETTER_AUTH_URL`.
  - This is the only `NEXT_PUBLIC_` variable — it is intentionally visible to the client.

### `STORE_WHATSAPP_NUMBER`

- **Description:** Default WhatsApp number used in inquiry messages. Only used as fallback — the `store_whatsapp_number` entry in the `StoreSetting` table takes precedence.
- **Required:** Recommended
- **Example:**
  ```
  STORE_WHATSAPP_NUMBER="6281234567890"
  ```
- **Notes:**
  - Format: country code + number (e.g., `62812...` for Indonesia). No `+` or `-` characters.
  - This variable is **server-only** (no `NEXT_PUBLIC_` prefix). It is never exposed to the client.
  - The app checks the `StoreSetting` table first; if missing, it falls back to this env variable.

---

## Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Next.js runtime mode | `production` (set automatically by Hostinger) |
| `PORT` | HTTP listen port | `3000` (set automatically by Hostinger) |

---

## Hostinger Setup Steps

1. Go to **Hostinger Panel** → your domain → **Environment Variables**.
2. Add each variable from the Required list above.
3. Save and redeploy.

---

## Security Rules

| ❌ Do not | Why |
|-----------|-----|
| Commit `.env` or `.env.local` to Git | `.gitignore` blocks `.env*` except `.env.example` |
| Log `DATABASE_URL`, `BETTER_AUTH_SECRET`, or DB passwords | Full credential exposure |
| Share secrets via email, chat, or support tickets | Unauthorised access risk |
| Use `NEXT_PUBLIC_` prefix for secrets | Exposed to every browser that loads the site |

---

## Verification Checklist

- [ ] `DATABASE_URL` is set and points to a reachable MySQL database
- [ ] `BETTER_AUTH_SECRET` is a fresh random 32-byte hex string
- [ ] `BETTER_AUTH_URL` matches the site's public URL
- [ ] `NEXT_PUBLIC_APP_URL` matches `BETTER_AUTH_URL`
- [ ] `STORE_WHATSAPP_NUMBER` is set (or `store_whatsapp_number` in `StoreSetting`)
- [ ] No `NEXT_PUBLIC_` variables contain secrets
- [ ] `.env` is in `.gitignore` and NOT committed
- [ ] Migration applied: `npx prisma migrate deploy`
- [ ] Seed run: `npm run prisma:seed`
- [ ] Admin user promoted (see `ADMIN_SETUP.md`)
- [ ] Public catalog loads without errors
- [ ] WhatsApp inquiry opens correct chat number
