/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://tempcsv.com/api',
    NEXT_PUBLIC_DOWNLOAD_HOST: process.env.NEXT_PUBLIC_DOWNLOAD_HOST || 'https://my.tempcsv.com',
  },
  async rewrites() {
    // Only proxy in development when backend is running on localhost:3000
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*',
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig
