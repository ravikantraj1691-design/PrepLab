# Deploying Mock Tracker to Vercel

This guide takes you from a local SQLite-based dev app to a live, production
deployment on Vercel backed by a hosted Postgres database.

---

## Why this needs setup

The app was originally built for a local sandbox that recycles between
sessions, so it stores data in a **SQLite file** on disk and auto-restores
from JSON backups on startup. Vercel is serverless: its filesystem is
read-only and each function invocation is short-lived. A SQLite file won't
survive there, so production needs a **hosted Postgres database** as the
single source of truth.

The code has already been migrated to support both:

- The Prisma `datasource` provider is switched automatically by
  `scripts/sync-schema-provider.mjs` based on the `DATABASE_URL` scheme.
- `src/lib/backup.ts` skips file writes on Vercel (the DB is the truth there).
- `src/instrumentation.ts` skips auto-restore on Vercel.
- A seed script copies your current candidates + users into Postgres.

---

## Step 1 — Code is on GitHub

This repo is already on GitHub. Vercel will import it directly.

---

## Step 2 — Create a free Postgres database (Neon recommended)

1. Go to https://neon.tech and sign up (free, no credit card).
2. Click **New Project** → name it `mock-tracker` → pick a region close to
   your Vercel region (default `bom1` = Mumbai).
3. Copy the **Connection string** — it looks like:
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 3 — Seed the Postgres database with your current data

Run this locally, pointing `DATABASE_URL` at your new Postgres DB:

```bash
# Set the Postgres URL temporarily:
export DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require"

# 1. Create the tables:
bunx prisma db push

# 2. Copy your data in:
bun scripts/seed-postgres.ts
```

---

## Step 4 — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Import this repo.
4. In **Environment Variables**, add:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |

5. Click **Deploy**. The first build takes ~2–3 minutes.

---

## Step 5 — Verify the live site

- Log in as admin → see all candidates in the Tracker.
- Open a candidate with a pending mock → the delay-reason popup fires.

---

## Troubleshooting

**Build fails with "Unknown argument `mock2DelayReason`"**
→ The `DATABASE_URL` env var wasn't set before the build.

**Login works locally but returns 401 on Vercel**
→ The session secret didn't seed correctly. Re-run Step 3.

**"relation \"Candidate\" does not exist"**
→ `prisma db push` didn't run against Postgres. Re-run Step 3.
