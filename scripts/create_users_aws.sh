#!/bin/bash

# ALS AWS User Creation Script
# This script creates all ALS users in the AWS environment

set -e

echo "🚀 Creating ALS users in AWS environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_status "Project root: $PROJECT_ROOT"

# Check if backend is running
if ! curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    print_warning "Backend is not running. Starting it now..."
    
    # Start backend
    cd "$PROJECT_ROOT/back"
    
    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d "../venv" ]; then
        source ../venv/bin/activate
    else
        print_error "Virtual environment not found. Please run the setup script first."
        exit 1
    fi
    
    # Start backend in background
    nohup python start.py > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
            print_status "Backend started successfully!"
            break
        fi
        sleep 2
    done
    
    # Check if backend started
    if ! curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        print_error "Backend failed to start. Check backend.log for details."
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
else
    print_status "Backend is already running"
fi

# Create users using the Python script
print_status "Creating users..."
python3 scripts/create_users.py

print_status "✅ All users created successfully!"
echo ""
echo "📋 Summary:"
echo "   - All ALS users have been created with password: als12325"
echo "   - Users can login with their email and the default password"
echo "   - Backend is running at: http://localhost:8000"
echo ""
echo "📝 To check the backend logs: tail -f back/backend.log"