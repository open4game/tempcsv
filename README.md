# About Temp CSV

A simple online service to upload, view, and share table files (CSV, TSV, Excel, ODS) without registration.

**Live:** [https://tempcsv.com](https://tempcsv.com)

**NOTE**  
This project is mainly developed with Cursor; it is more experimental than production-ready.

## Features

- **Upload** table files: CSV, TSV, Excel (.xlsx, .xls), ODS
- **View** tables online with pagination; multi-sheet Excel support with sheet switcher
- **Share** files via links (files auto-deleted after 7 days)
- No login or registration required

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui (see `nextjs-app/`)
- **Backend**: Hono on Cloudflare Workers
- **Storage**: Cloudflare R2 (no database)

## Frontend

Next.js app in `nextjs-app/`. Deployed on Cloudflare Pages (or Vercel).

- Entry: `https://tempcsv.com`

## Backend

Hono API on Cloudflare Workers.

- `POST /api/upload` – Upload a file to R2; returns file URL (original extension preserved).
- `GET /files/:folder/:fileName` – Download a file.

API entry: `https://tempcsv.com/api/`.

## Download

Files are served from R2. Download entry: `https://my.tempcsv.com/<file_path>`.

## Development

From repo root:

```bash
./start-dev.sh
```

- Frontend (open in browser): http://localhost:3001  
- Backend API: http://localhost:3000  

## Contact & Feedback

- Email: service@tempcsv.com  
- GitHub Issues: https://github.com/open4game/tempcsv/issues  
