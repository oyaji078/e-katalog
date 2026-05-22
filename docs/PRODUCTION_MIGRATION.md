# Production Migration Guide

This document explains how to safely manage Prisma migrations in production.

---

## Key Concepts

| Command | When to Use | Creates Migrations? | Runs Migrations? |
|---------|-------------|---------------------|-------------------|
| `npx prisma migrate dev` | **Local development only** | Yes | Yes |
| `npx prisma migrate deploy` | **Production / staging** | No | Yes |
| `npx prisma migrate status` | Any environment | No | No |
| `npx prisma migrate reset` | **Never in production** | No | Yes (drops data) |

---

## Local Development Workflow

When you change the Prisma schema during development:

```bash
npx prisma migrate dev --name describe_your_change
```

This:
1. Creates a new migration file in `prisma/migrations/`.
2. Applies it to your local database.
3. Regenerates the Prisma client.

Always review the generated migration file before committing.

---

## Production Migration Workflow

### Before deploying schema changes

1. **Run validation locally:**
   ```bash
   npx prisma validate
   npx prisma generate
   npm run build
   ```

2. **Commit the new migration file** to Git along with the schema change.

3. **Back up the production database** using Hostinger's backup tool.

4. **Deploy the code** (push to `main` → CI passes → Hostinger auto-deploys).

### After the new code is deployed

5. **Connect to Hostinger** via terminal/SSH or deployment hook.

6. **Run the production migration:**
   ```bash
   npx prisma migrate deploy
   ```

7. **Verify the migration applied successfully:**
   ```bash
   npx prisma migrate status
   ```

   Expected output: `Database schema is up to date!`

---

## CRITICAL RULES

| Rule | Why |
|------|-----|
| **Never run `prisma migrate dev` in production** | It can create new migration files on the server, causing drift |
| **Never run `prisma migrate reset` in production** | It drops all data and recreates the schema |
| **Never delete migration files from `prisma/migrations/`** | The migration history must stay intact for `migrate deploy` to work |
| **Always back up before running `migrate deploy`** | If a migration fails, you need to restore from backup |
| **Run migrations during low traffic** | Certain schema changes (e.g., adding columns to large tables) can lock the database |
| **Validate the schema before deployment** | Use `npx prisma validate` to catch errors early |

---

## Migration Status Commands

```bash
# Check current state
npx prisma migrate status

# List all migrations
npx prisma migrate status --verbose

# See which migrations are pending
npx prisma migrate status
```

A healthy production database shows:
```
1 migration found in prisma/migrations
Database schema is up to date!
```

---

## Seed After Migration

If the seed includes new data that is needed for the new schema:

```bash
npm run prisma:seed
```

This is safe to run multiple times — all seeds use `upsert` (idempotent).

---

## Rollback Strategy

Prisma does not natively support rollback of individual migrations. If a production migration fails:

1. **Do not delete the failed migration file.**
2. Restore the database from backup.
3. Fix the migration locally with `prisma migrate dev`.
4. Push the fix to `main`.
5. Re-deploy and run `prisma migrate deploy` again.

If the migration was already applied but broke functionality:
1. Create a new migration that reverses the unwanted changes.
2. Apply it via `prisma migrate deploy`.

---

## Quick Reference

```bash
# Local development
npx prisma migrate dev           # Create + apply new migration
npx prisma migrate dev --name x  # Create + apply with name

# Pre-deployment validation (run locally)
npx prisma validate
npx prisma generate
npm run build

# Production (run on server after deploy)
npx prisma migrate deploy        # Apply pending migrations
npx prisma migrate status        # Verify state
npm run prisma:seed              # Seed data (safe to re-run)
```
