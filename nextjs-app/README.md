# Temp CSV - Next.js App

Web app for uploading, viewing, and sharing table files (CSV, TSV, Excel, ODS) online. Built with Next.js, React, and TypeScript.

**Try online:** [https://tempcsv.com](https://tempcsv.com)

## Features

- **Upload**: CSV, TSV, Excel (.xlsx, .xls), ODS — drag-and-drop or file picker
- **View**: Paginated table; multi-sheet Excel with sheet switcher; max 100 columns shown to avoid browser overload
- **Share**: Shareable links; no registration
- **Auto delete**: Files removed after 7 days
- **Mobile**: Responsive layout, touch-friendly

## Tech Stack

### Frontend

- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS, shadcn/ui, Lucide React
- PapaParse (CSV/TSV), SheetJS / xlsx (Excel, ODS)

### Backend

- Hono on Cloudflare Workers, Cloudflare R2

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone and enter the app:

```bash
git clone https://github.com/open4game/tempcsv.git
cd tempcsv/nextjs-app
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DOWNLOAD_HOST=http://localhost:3000
```

4. Run the dev server:

```bash
npm run dev
```

5. Open **http://localhost:3001** in your browser (frontend). Use port 3001; the API runs on 3000.

To run both frontend and backend from repo root: `./start-dev.sh`.

## Project Structure

```
nextjs-app/
├── src/
│   ├── app/              # App Router
│   │   ├── page.tsx      # Home
│   │   ├── viewer/       # Table viewer (by URL)
│   │   ├── about/        # About & contact
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/           # shadcn/ui
│   │   ├── csv-uploader.tsx
│   │   └── csv-viewer.tsx
│   └── lib/
│       ├── api.ts        # API client
│       ├── tableFormats.ts
│       ├── tableParser.ts
│       └── utils.ts
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Build & Deploy

```bash
npm run build
npm start
```

- **Cloudflare Pages**: Build command `npm run build`, output `.next` (or use static export per `next.config.js`). Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DOWNLOAD_HOST`.
- **Vercel**: Import repo; set env vars in dashboard.

## Backend

Backend is the Hono API in `../backend`, deployed to Cloudflare Workers. Ensure CORS, R2 bucket, and `wrangler.jsonc` vars are set.

## API (used by this app)

- `POST /api/upload` – Upload file; returns `{ fileUrl }`.
- `GET /files/:folder/:fileName` – Download file.

## Contact & Feedback

- **Email**: service@tempcsv.com  
- **GitHub Issues**: https://github.com/open4game/tempcsv/issues  

## License

MIT.

## Acknowledgments

- [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), [Lucide](https://lucide.dev/)
- [PapaParse](https://www.papaparse.com/) (CSV/TSV), [SheetJS](https://sheetjs.com/) (Excel/ODS)
