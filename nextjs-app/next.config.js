/** @type {import('next').NextConfig} */
// 仅在生产构建时使用静态导出（Cloudflare）；dev 时不用，否则 next dev 会 404 _next/static
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: {
    unoptimized: true, // Cloudflare Pages doesn't support Next.js Image Optimization
  },
  trailingSlash: true, // Ensure routes work correctly
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://tempcsv.com/api',
    NEXT_PUBLIC_DOWNLOAD_HOST: process.env.NEXT_PUBLIC_DOWNLOAD_HOST || 'https://my.tempcsv.com',
  },
}

module.exports = nextConfig
