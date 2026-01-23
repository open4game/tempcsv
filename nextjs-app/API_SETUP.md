# API Configuration Guide

## Backend API Setup

This Next.js frontend connects to the existing Hono backend API. The backend should be running separately.

## Option 1: Use Existing Backend (Recommended)

### Start the Backend Server

```bash
cd backend
npm install
npm run dev:local
```

The backend will run on `http://localhost:3000`.

### Update Frontend Environment

Since the backend runs on port 3000, the frontend needs to run on a different port.

Update `nextjs-app/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  }
}
```

Update `nextjs-app/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DOWNLOAD_HOST=http://localhost:3000
```

### Start the Frontend

```bash
cd nextjs-app
npm run dev
```

Frontend will run on `http://localhost:3001`.

## Option 2: Proxy API Requests (Alternative)

If you want to run only the frontend during development, you can proxy API requests.

### Update `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://tempcsv.com/api',
    NEXT_PUBLIC_DOWNLOAD_HOST: process.env.NEXT_PUBLIC_DOWNLOAD_HOST || 'https://my.tempcsv.com',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*', // Proxy to backend
      },
    ];
  },
}

module.exports = nextConfig
```

### Update `.env.local`

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_DOWNLOAD_HOST=http://localhost:3000
```

## Option 3: Use Production API

For quick testing without running the backend locally:

Update `nextjs-app/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://tempcsv.com/api
NEXT_PUBLIC_DOWNLOAD_HOST=https://my.tempcsv.com
```

**Note:** This will use the production backend, so uploaded files will be stored in production.

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
next dev -p 3002
```

### CORS Errors

Make sure the backend CORS configuration includes your frontend URL:

```typescript
// backend/src/index.ts
app.use('*', cors({
  origin: [
    'https://tempcsv.com',
    'http://localhost:3000',
    'http://localhost:3001',  // Add frontend port
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}))
```

### Hot Reload Issues

If you see "Failed to find Server Action" errors:

1. Stop the dev server (Ctrl+C)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   ```
3. Restart:
   ```bash
   npm run dev
   ```

## Recommended Development Setup

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev:local
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd nextjs-app
   npm run dev
   ```

3. **Access:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/api

## Production Deployment

### Frontend (Cloudflare Pages or Vercel)

Environment variables:
```env
NEXT_PUBLIC_API_URL=https://tempcsv.com/api
NEXT_PUBLIC_DOWNLOAD_HOST=https://my.tempcsv.com
```

### Backend (Cloudflare Workers)

No changes needed - continue using existing deployment:
```bash
cd backend
npm run deploy
```

## API Endpoints

The frontend uses these backend endpoints:

- `POST /api/upload` - Upload CSV file
- `POST /api/update/:folder/:fileName` - Update existing file
- `GET /files/:folder/:fileName` - Download file

All endpoints are implemented in `backend/src/index.ts`.
