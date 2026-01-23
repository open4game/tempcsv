# Project File Structure

## Configuration Files

- `.env.local` - Environment variables (local development)
- `.gitignore` - Git ignore rules
- `next.config.js` - Next.js configuration
- `package.json` - Project dependencies and scripts
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## Documentation

- `README.md` - Main project documentation
- `QUICKSTART.md` - Quick start guide
- `MIGRATION.md` - Vue to Next.js migration guide
- `PROJECT_SUMMARY_CN.md` - Project summary (Chinese)
- `FILES.md` - This file

## Scripts

- `setup.sh` - Automated setup script

## Source Code

### Pages (`src/app/`)

- `layout.tsx` - Root layout component
- `page.tsx` - Home page
- `globals.css` - Global styles
- `about/page.tsx` - About page
- `viewer/page.tsx` - CSV viewer page

### Components (`src/components/`)

#### Feature Components
- `csv-uploader.tsx` - File upload component with drag-and-drop
- `csv-viewer.tsx` - CSV table viewer with pagination
- `mobile-nav.tsx` - Mobile navigation menu

#### UI Components (`src/components/ui/`)
- `alert.tsx` - Alert/notification component
- `button.tsx` - Button component with variants
- `card.tsx` - Card container component
- `input.tsx` - Input field component
- `table.tsx` - Table component for data display

### Library (`src/lib/`)

- `api.ts` - API client for backend communication
- `utils.ts` - Utility functions (cn helper)

## File Count Summary

- **Configuration**: 7 files
- **Documentation**: 5 files
- **Scripts**: 1 file
- **Pages**: 5 files
- **Components**: 8 files
- **Library**: 2 files

**Total**: 28 files (excluding node_modules and build artifacts)

## Key Features by File

### Upload Flow
1. `csv-uploader.tsx` - Handles file selection and upload
2. `api.ts` - Sends file to backend
3. Backend API - Stores file in R2

### View Flow
1. `viewer/page.tsx` - Viewer page with URL input
2. `csv-viewer.tsx` - Fetches and displays CSV data
3. `api.ts` - Fetches file from backend
4. `table.tsx` - Renders data in table format

### Share Flow
1. `csv-uploader.tsx` or `page.tsx` - Share button
2. Browser Share API or Clipboard API
3. Generates shareable URL with file parameter

## Component Dependencies

```
page.tsx
├── csv-uploader.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── alert.tsx
│   └── api.ts
├── mobile-nav.tsx
│   └── button.tsx
└── card.tsx

viewer/page.tsx
├── csv-viewer.tsx
│   ├── table.tsx
│   ├── card.tsx
│   ├── alert.tsx
│   └── api.ts
├── input.tsx
├── button.tsx
└── mobile-nav.tsx

about/page.tsx
├── card.tsx
└── mobile-nav.tsx
```

## Styling Architecture

- **Global Styles**: `globals.css` - CSS variables and base styles
- **Component Styles**: Tailwind utility classes
- **Theme**: Defined in `tailwind.config.ts`
- **Responsive**: Mobile-first breakpoints (sm, md, lg, xl)

## API Integration

All API calls go through `lib/api.ts`:

```typescript
uploadCsvFile(file: File) → UploadResponse
updateCsvFile(fileUrl: string, file: File) → UpdateResponse
fetchCsvFile(fileUrl: string) → string
```

## Build Output

When you run `npm run build`, Next.js generates:

- `.next/` - Build output directory
- `.next/static/` - Static assets
- `.next/server/` - Server-side code

## Development Files (Not in Git)

- `node_modules/` - Dependencies
- `.next/` - Build output
- `.env.local` - Local environment variables

## Adding New Files

### New Page
1. Create `src/app/[name]/page.tsx`
2. Add navigation link in header
3. Update mobile navigation

### New Component
1. Create `src/components/[name].tsx`
2. Import and use in pages
3. Add to this documentation

### New UI Component
1. Create `src/components/ui/[name].tsx`
2. Follow shadcn/ui patterns
3. Export from component

## File Naming Conventions

- **Pages**: `page.tsx` (Next.js convention)
- **Components**: `kebab-case.tsx` (e.g., `csv-uploader.tsx`)
- **UI Components**: `kebab-case.tsx` (e.g., `button.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `api.ts`)
- **Types**: `PascalCase` interfaces/types
- **Functions**: `camelCase`

## Import Aliases

- `@/` - Maps to `src/` directory
- Example: `import { Button } from '@/components/ui/button'`

## Code Organization Best Practices

1. **One component per file**
2. **Group related components in folders**
3. **Keep components small and focused**
4. **Use TypeScript for type safety**
5. **Follow React hooks best practices**
6. **Use Tailwind for styling**
7. **Document complex logic**

## Maintenance

### Regular Updates
- Dependencies: `npm update`
- Security: `npm audit fix`
- Types: Check for @types updates

### Code Quality
- Linting: `npm run lint`
- Type checking: `tsc --noEmit`
- Formatting: Use Prettier (recommended)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript](https://www.typescriptlang.org)
