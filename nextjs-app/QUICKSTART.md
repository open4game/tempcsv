# Quick Start Guide

## Development Setup

### 1. Install Dependencies

```bash
cd nextjs-app
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the `nextjs-app` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DOWNLOAD_HOST=http://localhost:3000
```

For production, update these values to your actual API and download URLs.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Backend Setup

The backend is already configured in the `backend` directory. To run it locally:

```bash
cd backend
npm install
npm run dev:local
```

The backend will run on `http://localhost:3000`.

## Project Structure

```
tempcsv/
├── nextjs-app/          # Next.js frontend (NEW)
│   ├── src/
│   │   ├── app/        # Pages
│   │   ├── components/ # React components
│   │   └── lib/        # Utilities
│   └── package.json
├── backend/             # Hono API (EXISTING)
│   ├── src/
│   │   └── index.ts
│   └── wrangler.jsonc
└── frontend/            # Vue.js frontend (OLD - can be removed)
```

## Key Features Implemented

✅ File upload with drag-and-drop
✅ CSV viewing with pagination
✅ File sharing with shareable links
✅ Mobile-responsive design
✅ Modern UI with shadcn/ui
✅ TypeScript for type safety
✅ Optimized for mobile devices

## Removed Features

❌ CSV editing (as per requirements - not suitable for R2)

## Mobile Optimization

The application is fully optimized for mobile:
- Responsive breakpoints using Tailwind CSS
- Mobile navigation menu
- Touch-friendly buttons and inputs
- Native share API support
- Optimized table viewing on small screens

## Deployment

### Frontend (Cloudflare Pages)

1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Set build command: `npm run build`
4. Set build output: `.next`
5. Add environment variables

### Backend (Cloudflare Workers)

The backend deployment remains unchanged:

```bash
cd backend
npm run deploy
```

## Testing

Test the application locally:

1. Start backend: `cd backend && npm run dev:local`
2. Start frontend: `cd nextjs-app && npm run dev`
3. Open http://localhost:3000
4. Upload a CSV file
5. View the file in the viewer
6. Test sharing functionality

## Common Issues

### CORS Errors

Make sure the backend CORS configuration includes your frontend URL:

```typescript
// backend/src/index.ts
app.use('*', cors({
  origin: [
    'https://tempcsv.com',
    'http://localhost:3000'  // Add your local URL
  ],
  // ...
}))
```

### API Connection Issues

Check that `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend URL.

### Build Errors

If you encounter build errors, try:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

1. Test all features locally
2. Deploy to staging environment
3. Test on mobile devices
4. Deploy to production
5. Update DNS records if needed

## Support

For issues or questions:
- GitHub Issues: https://github.com/open4game/tempcsv/issues
- Documentation: See README.md
