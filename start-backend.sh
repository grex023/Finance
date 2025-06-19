#!/bin/bash

# Start Backend Server Script for BudgetMaster
echo "🚀 Starting BudgetMaster Backend Server..."

# Check if we're in the right directory
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: server/package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Navigate to server directory
cd server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if PostgreSQL is running (basic check)
echo "🔍 Checking database connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  Warning: PostgreSQL might not be running"
    echo "   Make sure PostgreSQL is started on localhost:5432"
    echo "   You can start it with: brew services start postgresql (macOS)"
    echo "   or: sudo systemctl start postgresql (Linux)"
fi

# Start the server
echo "🌐 Starting server on port 5001..."
echo "   You can access the health check at: http://localhost:5001/api/health"
echo "   Press Ctrl+C to stop the server"
echo ""

npm start 