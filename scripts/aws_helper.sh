#!/bin/bash

# ALS AWS Deployment Helper Script
# This script handles git pull conflicts and creates users

set -e

echo "🚀 ALS AWS Deployment Helper"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_status "Project root: $PROJECT_ROOT"

# Function to handle git pull with .env preservation
git_pull_with_env_preservation() {
    print_step "Handling git pull with .env preservation..."
    
    # Check if back/.env exists
    if [ -f "back/.env" ]; then
        print_status "Found back/.env file, preserving it..."
        
        # Backup the current .env
        cp back/.env back/.env.backup
        print_status "Backed up back/.env to back/.env.backup"
        
        # Reset the files that are causing conflicts
        git checkout -- back/.env front/package-lock.json front/package.json
        
        # Now do the git pull
        print_status "Performing git pull..."
        git pull
        
        # Restore the .env file
        mv back/.env.backup back/.env
        print_status "Restored back/.env file"
        
    else
        print_warning "No back/.env file found, doing normal git pull..."
        git pull
    fi
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd "$PROJECT_ROOT/back"
    
    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d "../venv" ]; then
        source ../venv/bin/activate
    else
        print_error "Virtual environment not found. Please run setup first."
        return 1
    fi
    
    pip install -r requirements.txt
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd "$PROJECT_ROOT/front"
    npm install
    
    cd "$PROJECT_ROOT"
}

# Function to create users
create_users() {
    print_step "Creating ALS users..."
    
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
        fi
        
        # Start backend in background
        nohup python start.py > backend.log 2>&1 &
        
        # Wait for backend to start
        print_status "Waiting for backend to start..."
        for i in {1..30}; do
            if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
                print_status "Backend started successfully!"
                break
            fi
            sleep 2
        done
        
        cd "$PROJECT_ROOT"
    else
        print_status "Backend is already running"
    fi
    
    # Create users
    python3 scripts/create_users.py
}

# Main menu
show_menu() {
    echo ""
    echo "Seleccione una opción:"
    echo "1. Hacer git pull (preservando back/.env)"
    echo "2. Instalar dependencias"
    echo "3. Crear usuarios ALS"
    echo "4. Hacer todo (git pull + dependencias + usuarios)"
    echo "5. Salir"
    echo ""
}

# Main execution
main() {
    while true; do
        show_menu
        read -p "Opción: " choice
        
        case $choice in
            1)
                git_pull_with_env_preservation
                ;;
            2)
                install_dependencies
                ;;
            3)
                create_users
                ;;
            4)
                git_pull_with_env_preservation
                install_dependencies
                create_users
                print_status "✅ Todo completado exitosamente!"
                ;;
            5)
                print_status "Saliendo..."
                exit 0
                ;;
            *)
                print_error "Opción inválida. Por favor seleccione 1-5."
                ;;
        esac
        
        echo ""
        read -p "¿Desea realizar otra operación? (s/n): " continue
        if [[ $continue != "s" && $continue != "S" ]]; then
            break
        fi
    done
}

# Run main function
main