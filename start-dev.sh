#!/bin/bash

# Temp CSV Development Startup Script
# This script starts both backend and frontend servers

set -e

echo "🚀 Starting Temp CSV Development Environment..."
echo ""

# Check if we're in the right directory
if [ ! -d "nextjs-app" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected structure:"
    echo "   ├── backend/"
    echo "   └── nextjs-app/"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📦 Starting backend server on port 3000..."
cd backend
npm run dev:local &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server on port 3001..."
cd nextjs-app
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started!"
echo ""
echo "📍 Access points:"
echo "   Frontend (open this in browser): http://localhost:3001"
echo "   Backend (API only):              http://localhost:3000"
echo ""
echo "⚠️  Use port 3001 for the app. Port 3000 has no /_next/ assets (404)."
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait
