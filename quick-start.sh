#!/bin/bash

# BudgetMaster Quick Start Script
# This script quickly installs dependencies and starts the application

set -e

echo "🚀 BudgetMaster Quick Start"
echo "==========================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm ci

# Install backend dependencies
print_status "Installing backend dependencies..."
cd server
npm ci
cd ..

# Start PostgreSQL with Docker if available
if command -v docker &> /dev/null; then
    print_status "Starting PostgreSQL with Docker..."
    docker run --name budgetmaster-db \
        -e POSTGRES_DB=budgetmaster \
        -e POSTGRES_USER=budgetuser \
        -e POSTGRES_PASSWORD=budgetpass \
        -p 5432:5432 \
        -d postgres:13
    
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
else
    print_status "Docker not available. Please ensure PostgreSQL is running on localhost:5432"
fi

# Start backend server
print_status "Starting backend server..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
sleep 5

# Check backend health
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    print_success "Backend is running!"
else
    print_error "Backend failed to start. Check the logs above."
    exit 1
fi

# Start frontend
print_status "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

print_success "BudgetMaster is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5001"
echo "🗄️  Database: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    print_status "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    print_success "Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait 