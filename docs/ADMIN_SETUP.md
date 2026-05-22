# Admin & Super Admin Setup

This document explains how to create the first admin/super admin account.

> **Why no seed script?** The project intentionally does not auto-create an admin user during seed.
> Normal registration via `/register` always creates accounts with role `USER`.
> Admin/super admin promotion is a manual, deliberate action — never automated.

---

## Step 1: Register the first user

1. Open `/register` in the browser.
2. Fill in the form and submit.
3. After successful registration, log out of the browser.

---

## Step 2: Promote to SUPER_ADMIN

### Local / development database

Use Prisma Studio or a MySQL client.

**Via Prisma Studio:**

```bash
npx prisma studio
```

1. Open the `User` table.
2. Find the newly registered user by email.
3. Change the `role` column from `USER` to `SUPER_ADMIN`.
4. Save.

**Via MySQL CLI:**

```sql
UPDATE User SET role = 'SUPER_ADMIN' WHERE email = 'user@example.com';
```

---

## Step 3: Promote to ADMIN (if needed)

Same procedure as above, but set `role = 'ADMIN'`.

---

## Production Safety

### How to promote safely in production

1. **SSH into the server** or open **phpMyAdmin** / the MySQL client provided by your hosting panel.
2. Run the UPDATE query directly:

   ```sql
   UPDATE User SET role = 'SUPER_ADMIN' WHERE email = 'admin@example.com';
   ```

3. Verify the change:
   ```sql
   SELECT email, role FROM User WHERE email = 'admin@example.com';
   ```

### CRITICAL WARNING — Do NOT do these

| ❌ Do not | Why |
|-----------|-----|
| Store plaintext passwords in scripts or documentation | Passwords are hashed by Better Auth; never log or copy them |
| Expose `BETTER_AUTH_SECRET` in logs, configs, or support tickets | This secret signs auth tokens; if leaked, anyone can forge sessions |
| Expose `DATABASE_URL` in logs, error messages, or client code | Full database access credential |
| Expose Hostinger / VPS credentials | Full server access |
| Expose GitHub tokens or SMTP secrets | Access to code repos or email relay |
| Hardcode any production secret in source files | Secrets belong in environment variables only |

### What is safe to share

- `NEXT_PUBLIC_APP_URL` (public-facing URL)
- `NODE_ENV`
- Database hostname (without credentials)

---

## Verification after promotion

1. Log in with the promoted account at `/login`.
2. Navigate to `/super-admin` — the dashboard should load.
3. If redirected to `/login` or `/admin`, the role change may not have persisted. Re-check the `role` column in the database.

---

## Rolling back

To demote a super admin back to admin or user:

```sql
UPDATE User SET role = 'ADMIN' WHERE email = 'user@example.com';
UPDATE User SET role = 'USER' WHERE email = 'user@example.com';
```

The `retailStatus` column is independent of `role` and is not affected.
