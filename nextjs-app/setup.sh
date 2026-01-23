#!/bin/bash

# Temp CSV Next.js Setup Script
# This script helps you quickly set up the development environment

set -e

echo "🚀 Setting up Temp CSV Next.js project..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DOWNLOAD_HOST=http://localhost:3000
EOF
    echo "✅ .env.local created"
else
    echo "ℹ️  .env.local already exists, skipping..."
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Review and update .env.local if needed"
echo "   2. Start the development server: npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📖 For more information, see:"
echo "   - README.md - Full documentation"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - MIGRATION.md - Migration from Vue"
echo ""
echo "Happy coding! 🎉"
