# TMSS Internship Portal

React + Vite frontend and Express API, deployed on **Vercel** (Hobby) with a **Turso** (libSQL) database and **Vercel Blob** for PDF uploads.

Live: https://internship.tmsoftware.online

## Stack

- Frontend: React 19 + Vite (built into `public/`, served by Vercel CDN)
- API: Express exported from `server.ts` (Vercel auto-detects it as the function entry)
- Database: Turso via `@libsql/client` (`submissions`, `settings`, `certificates`)
- Uploads: browser → Vercel Blob via `POST /api/blob-upload` (PDF, 10 MB max)

## Local development

```bash
npm install
npm run dev        # tsx server.ts, Vite middleware on http://localhost:3000
```

Without env vars the app uses a local `local.db` file. To use the real database:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## Build

```bash
npm run build      # vite build -> public/
```

## Deployment

- Repo: `jagdish-ai-hub/tmss-certissuer` (branch `main`)
- `vercel.json` builds with `npm run build` and rewrites non-API routes to `/index.html`
- Required Vercel env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`
- The old Oracle VPS stack (SQLite + multer + local uploads) was removed on Nov 18, 2026; see `OCI 01 server DEPLOYMENT.md` for history
