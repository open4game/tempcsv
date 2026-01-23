/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Static export for Cloudflare Pages
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
