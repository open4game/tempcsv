#!/bin/bash

# Cloudflare Workers 部署脚本
# 将 Next.js 前端和 Hono 后端一起部署到同一个 Worker

set -e

echo "🚀 Starting Cloudflare Workers deployment..."
echo ""

# Check if we're in the right directory
if [ ! -d "nextjs-app" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build Next.js frontend
echo "📦 Building Next.js frontend..."
cd nextjs-app
npm install
npm run build

if [ ! -d "out" ]; then
    echo "❌ Error: Build failed, out/ directory not found"
    exit 1
fi

echo "✅ Frontend build complete"
echo ""

# Step 2: Deploy to Cloudflare Workers
echo "🌐 Deploying to Cloudflare Workers..."
cd ../backend

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler not found, installing..."
    npm install -g wrangler
fi

# Deploy
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your application should be available at:"
echo "   https://csv-manager.your-subdomain.workers.dev"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure custom domain in Cloudflare Dashboard"
echo "   2. Test all features (upload, view, share)"
echo "   3. Monitor logs: wrangler tail"
echo ""
