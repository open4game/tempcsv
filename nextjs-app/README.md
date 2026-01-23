# Temp CSV - Next.js Version

A modern web application for uploading, viewing, and sharing CSV files online. Built with Next.js, React, and TypeScript.

## Features

- **Upload CSV Files**: Drag-and-drop or select CSV files to upload
- **View CSV Data**: View CSV files in a clean, paginated table format
- **Share Files**: Get shareable links to your uploaded files
- **Mobile Friendly**: Fully responsive design optimized for mobile devices
- **No Registration**: Use the service without any login or registration
- **Auto Delete**: Files are automatically deleted after 7 days

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Icon library
- **PapaCSV** - CSV parsing library

### Backend
- **Hono** - Lightweight web framework (Cloudflare Workers)
- **Cloudflare R2** - Object storage
- **Cloudflare Workers** - Serverless compute

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/open4game/tempcsv.git
cd tempcsv/nextjs-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DOWNLOAD_HOST=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx        # Home page
│   │   ├── viewer/         # CSV viewer page
│   │   ├── about/          # About page
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── csv-uploader.tsx
│   │   └── csv-viewer.tsx
│   └── lib/               # Utility functions
│       ├── api.ts         # API client
│       └── utils.ts       # Helper functions
├── public/                # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your API endpoint
   - `NEXT_PUBLIC_DOWNLOAD_HOST`: Your R2 download host

### Vercel

1. Import your GitHub repository to Vercel
2. Vercel will auto-detect Next.js and configure build settings
3. Add environment variables in Vercel dashboard

## Backend Setup

The backend uses the existing Hono API deployed on Cloudflare Workers. No changes are needed to the backend code.

Ensure your backend is configured with:
- CORS enabled for your frontend domain
- R2 bucket properly configured
- Environment variables set in `wrangler.jsonc`

## Mobile Optimization

This application is fully optimized for mobile devices:
- Responsive layout using Tailwind CSS breakpoints
- Touch-friendly UI elements
- Mobile-first design approach
- Optimized table viewing on small screens
- Native share API support on mobile browsers

## API Endpoints

The frontend connects to these backend endpoints:

- `POST /api/upload` - Upload a CSV file
- `POST /api/update/:folder/:fileName` - Update an existing file
- `GET /files/:folder/:fileName` - Download a file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- CSV parsing by [PapaCSV](https://www.papaparse.com/)

## Migration from Vue

This is a complete rewrite of the original Vue.js version. Key changes:

- **Framework**: Vue 3 → Next.js 14 with React
- **UI Library**: Vuetify → shadcn/ui + Tailwind CSS
- **Routing**: Vue Router → Next.js App Router
- **State Management**: Vue Composition API → React Hooks
- **Removed Features**: Editing functionality (as per requirements)
- **Enhanced**: Better mobile responsiveness and modern UI

## Support

For issues, questions, or contributions, please visit:
- GitHub: https://github.com/open4game/tempcsv
- Issues: https://github.com/open4game/tempcsv/issues
