# Gong Usage Dashboard

A starter Next.js app for pulling Gong user usage metrics into a lightweight SQLite-backed dashboard.

## What it includes

- Next.js App Router project
- Gong API client using access key and secret
- SQLite storage via `better-sqlite3`
- Sync route to ingest users, calls, and activity summaries
- Overview dashboard with KPI cards, charts, and a user table
- GitHub Codespaces dev container config

## Quick start

1. Copy `.env.example` to `.env.local`
2. Fill in your Gong credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`

## First sync

Trigger a sync from another terminal:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer $SYNC_API_TOKEN"
```

Or use the `Sync now` button in the UI after you set both `SYNC_API_TOKEN` and `NEXT_PUBLIC_SYNC_API_TOKEN` to the same value.

## Notes on Gong metrics

- Calls recorded per user come from Gong call records.
- Activity comes from Gong activity stats.
- Login frequency is represented here as a placeholder metric sourced from recent activity, because true login/access events may require audit log ingestion depending on your Gong configuration.
- Extend `lib/sync.ts` to ingest Gong audit logs if you want explicit access event counts.

## Suggested next steps

- Add team filtering from Gong user metadata
- Add Gong audit log ingestion for last-login/access events
- Add a date-range picker
- Add scheduled sync via GitHub Actions or your deployment platform
