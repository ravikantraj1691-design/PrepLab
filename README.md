# Mock Tracker

A web app for tracking mock interview candidates, built with Next.js 16, Prisma, and shadcn/ui.

## Features

- **Candidate tracking**: 54 candidates with resume status, scores, and mock interview rounds (1-3)
- **Role-based access**: Admins see everything; experts only see their assigned candidates
- **Mock delay reasons**: When mock 2 or 3 is overdue, experts must record a reason via popup
- **Dashboard**: Visual summary of pipeline status
- **SOP guide**: Built-in standard operating procedures for interviewers
- **Import/Export**: TSV import, JSON backup/restore, Excel export

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Database**: Prisma ORM (SQLite for local dev, Postgres for production)
- **Runtime**: Bun
- **Deployment**: Vercel (serverless)

## Quick Start (Local Dev)

```bash
bun install
bun run dev
```

The app uses SQLite by default. The database file is created automatically at `db/custom.db`.

## Deploy to Vercel

See [DEPLOY.md](./DEPLOY.md) for the full guide. Summary:

1. Push this repo to GitHub
2. Create a free Postgres DB on [Neon](https://neon.tech)
3. Set `DATABASE_URL` env var to the Postgres connection string
4. Import this repo on Vercel and deploy
5. Seed the DB: `DATABASE_URL=postgresql://... bun scripts/seed-postgres.ts`

## License

Private project.
