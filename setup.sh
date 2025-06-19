#!/bin/bash

# BudgetMaster Setup Script
# This script sets up the BudgetMaster application for both Docker and local development

set -e  # Exit on any error

echo "🚀 BudgetMaster Setup Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is available
check_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is available"
        return 0
    else
        print_warning "Docker is not available. Local development setup will be used."
        return 1
    fi
}

# Check if Node.js is available
check_node() {
    if command -v node &> /dev/null; then
        print_success "Node.js is available (version: $(node --version))"
        return 0
    else
        print_error "Node.js is not available. Please install Node.js first."
        exit 1
    fi
}

# Check if npm is available
check_npm() {
    if command -v npm &> /dev/null; then
        print_success "npm is available (version: $(npm --version))"
        return 0
    else
        print_error "npm is not available. Please install npm first."
        exit 1
    fi
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    npm ci
    print_success "Frontend dependencies installed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd server
    npm ci
    cd ..
    print_success "Backend dependencies installed"
}

# Setup local development
setup_local() {
    print_status "Setting up local development environment..."
    
    # Install dependencies
    install_frontend_deps
    install_backend_deps
    
    # Check if PostgreSQL is running locally
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
            print_success "PostgreSQL is running locally"
        else
            print_warning "PostgreSQL is not running locally"
            print_status "You can start it with: brew services start postgresql (macOS)"
            print_status "or: sudo systemctl start postgresql (Linux)"
        fi
    else
        print_warning "PostgreSQL client not found. Please install PostgreSQL."
    fi
    
    print_success "Local development setup complete"
}

# Setup Docker environment
setup_docker() {
    print_status "Setting up Docker environment..."
    
    # Check if Docker Compose is available
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Build and start services
    print_status "Building and starting Docker services..."
    docker-compose up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
        print_success "Backend API is healthy"
    else
        print_warning "Backend API health check failed"
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
    
    print_success "Docker environment setup complete"
}

# Main setup function
main() {
    print_status "Checking prerequisites..."
    
    check_node
    check_npm
    
    if check_docker; then
        echo ""
        print_status "Docker is available. Choose setup method:"
        echo "1) Docker setup (recommended)"
        echo "2) Local development setup"
        echo "3) Both"
        read -p "Enter your choice (1-3): " choice
        
        case $choice in
            1)
                setup_docker
                ;;
            2)
                setup_local
                ;;
            3)
                setup_local
                setup_docker
                ;;
            *)
                print_error "Invalid choice. Exiting."
                exit 1
                ;;
        esac
    else
        setup_local
    fi
    
    echo ""
    print_success "Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1) If using Docker: Visit http://localhost:3000"
    echo "2) If using local development:"
    echo "   - Start backend: cd server && npm start"
    echo "   - Start frontend: npm run dev"
    echo "   - Visit http://localhost:5173"
    echo ""
    echo "For more information, see README.md"
}

# Run main function
main 