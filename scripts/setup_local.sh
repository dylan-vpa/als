#!/bin/bash

# ALS Local Setup Script
# This script sets up the ALS system locally with all dependencies

set -e

echo "🚀 Starting ALS local setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
print_status "Python version: $PYTHON_VERSION"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
print_status "Node.js version: $NODE_VERSION"

# Backend setup
print_status "Setting up backend..."
cd "$PROJECT_ROOT/back"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate || source venv/Scripts/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Check if alembic is available
if ! command -v alembic &> /dev/null; then
    print_status "Installing alembic..."
    pip install alembic
fi

# Frontend setup
print_status "Setting up frontend..."
cd "$PROJECT_ROOT/front"

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

# Build frontend for development
print_status "Building frontend for development..."
npm run build

# Create environment files if they don't exist
print_status "Setting up environment files..."

# Backend .env file
if [ ! -f "$PROJECT_ROOT/back/.env" ]; then
    print_status "Creating backend .env file..."
    cat > "$PROJECT_ROOT/back/.env" << EOF
# Backend Configuration
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
API_PREFIX=/api/v1

# Database Configuration (SQLite for local development)
DATABASE_URL=sqlite:///./als_dev.db

# CORS Origins
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"]

# Email Configuration (Optional)
RESEND_API_KEY=
RESEND_FROM=
EOF
    print_warning "Backend .env file created. Please review and update the SECRET_KEY!"
else
    print_status "Backend .env file already exists"
fi

# Frontend .env file
if [ ! -f "$PROJECT_ROOT/front/.env" ]; then
    print_status "Creating frontend .env file..."
    cat > "$PROJECT_ROOT/front/.env" << EOF
# Frontend Configuration
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=ALS System
EOF
    print_status "Frontend .env file created"
else
    print_status "Frontend .env file already exists"
fi

# Initialize database
print_status "Initializing database..."
cd "$PROJECT_ROOT/back"

# Run alembic migrations if alembic.ini exists
if [ -f "alembic.ini" ]; then
    print_status "Running database migrations..."
    alembic upgrade head || print_warning "Alembic migrations failed or no migrations found"
else
    print_warning "No alembic.ini found, skipping migrations"
fi

# Create startup script
print_status "Creating startup script..."
cat > "$PROJECT_ROOT/scripts/start_local.sh" << 'EOF'
#!/bin/bash

# ALS Local Startup Script

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Starting ALS system locally..."

# Start backend
echo "Starting backend server..."
cd "$PROJECT_ROOT/back"
source venv/bin/activate || source venv/Scripts/activate
python start.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd "$PROJECT_ROOT/front"
npm run dev &
FRONTEND_PID=$!

echo "✅ ALS system started successfully!"
echo "📊 Backend running at: http://localhost:8000"
echo "🌐 Frontend running at: http://localhost:5173"
echo ""
echo "To stop the system, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for processes
wait
EOF

chmod +x "$PROJECT_ROOT/scripts/start_local.sh"

# Create user creation script
print_status "Creating user creation script..."
cat > "$PROJECT_ROOT/scripts/create_users.py" << 'EOF'
#!/usr/bin/env python3
"""
Script to create ALS system users
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'back'))

from app.database import Base, get_db
from app.models.system_user import SystemUser
from app.services.auth_service import get_password_hash

def create_user(db_session, email, full_name, password):
    """Create a new user or update existing user"""
    try:
        # Check if user already exists
        existing_user = db_session.query(SystemUser).filter(SystemUser.email == email).first()
        
        if existing_user:
            # Update existing user
            existing_user.full_name = full_name
            existing_user.hashed_password = get_password_hash(password)
            existing_user.is_active = True
            print(f"✅ Updated user: {email}")
        else:
            # Create new user
            new_user = SystemUser(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                is_active=True
            )
            db_session.add(new_user)
            print(f"✅ Created user: {email}")
        
        db_session.commit()
        return True
        
    except Exception as e:
        print(f"❌ Error creating user {email}: {str(e)}")
        db_session.rollback()
        return False

def main():
    """Main function to create users"""
    print("🚀 Starting ALS user creation...")
    
    # Database setup
    from app.core.config import settings
    
    # Use the appropriate database URL
    if settings.database_url:
        database_url = settings.database_url
    else:
        database_url = settings.postgres_url
    
    # For SQLite, adjust the URL format
    if database_url.startswith('sqlite'):
        # SQLAlchemy 2.0+ format for SQLite
        database_url = database_url.replace('sqlite:///', 'sqlite:///')
    
    print(f"Using database: {database_url}")
    
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # User list to create
    users = [
        ("ana.melendez@alsglobal.com", "Ana Melendez"),
        ("feipe.martinez@alsglobal.com", "Andres Marinez"),
        ("Alvaroj.audivetc@gmail.com", "Audivet Castro Alvaro Jose"),
        ("Ivan.barrera@alsglobal.com", "Barrera Pérez Iván Germán"),
        ("Raul.calderon@alsglobal.com", "Calderón Hernández Raúl Adolfo"),
        ("Juandavidcd.fc@gmail.com", "Carreño Duarte Juan David"),
        ("Freddy.castro@alsglobal.com", "Castro Orellano Freddy Junior"),
        ("Yeisoncastro11@gmail.com", "Castro Peña Jeison De Jesus"),
        ("Paola.cervera@alsglobal.com", "Cervera Marmolejo Paola Andrea"),
        ("Haroldandres_144@hotmail.com", "Cid Fernández Harold Andres"),
        ("Luis.correa@alsglobal.com", "Correa Jaramillo Luis Ramon"),
        ("Jesus.delahoz@alsglobal.com", "De La Hoz Salcedo Jesus Eduardo"),
        ("Juan.garcia@alsglobal.com", "Garcia Peluffo Juan David"),
        ("Edwinguayber@hotmail.com", "Guayacundo Bernal Edwin Fernando"),
        ("Gerarguty.10@gmail.com", "Gutierrez Noya Gerardo Andres"),
        ("Eduardo.ibarra@alsglobal.com", "Ibarra Trujillo Eduardo Junior"),
        ("Emiro.martinez@alsglobal.com", "Martinez Alvarez Emiro Jose"),
        ("Ingeniero.campo10@alsglobal.com", "Martinez Del Toro Reynel David"),
        ("Danielmelendez807@gmail.com", "Melendez Monserrat Daniel Issac"),
        ("Normannarvaez888@gmail.com", "Narvaez Charris Norman Camilo"),
        ("Shirley.osorio@alsglobal.com", "Osorio Guerra Shirley Camila"),
        ("Ingeniero.campo39als@gmail.com", "Pedraza Gonzalez Cristhian Santiago"),
        ("Majopece.18@gmail.com", "Peña Cervantes Manuel Jose"),
        ("Andresfprimo@hotmail.com", "Primo Oliveros Andres Felipe"),
        ("Armandop2810@gmail.com", "Pumarejo Jimenez Armando Jesus"),
        ("Josue.trespalacios@alsglobal.com", "Trespalacios Solano Josue"),
        ("Juantrillos.so@gmail.com", "Trillos Osorio Juan Sebastian"),
        ("dayana.delaasuncion@alsglobal.com", "Dayana De La Asunción"),
        ("lorayme.bohorquez@alsglobal.com", "Bohorquez Rodriguez Lorayme Maria"),
        ("valentina.lora@alsglobal.com", "Lora Cespedes Valentina"),
        ("juan.bustamante@alsglobal.com", "Bustamante Rebollo Juan Esteban"),
        ("andrea.ruiz@alsglobal.com", "Andrea Ruiz"),
        ("Ana.Blanco@ALSGlobal.com", "Blanco Aponte Ana Maria"),
        ("Maria.Estrada@alsglobal.com", "Estrada Catalan Maria Fernanda"),
        ("dylanp.arango12@gmail.com", "Dylan Alexander Peña"),
    ]
    
    # Default password for all users
    default_password = "als12325"
    
    db = SessionLocal()
    try:
        created_count = 0
        
        for email, full_name in users:
            if create_user(db, email, full_name, default_password):
                created_count += 1
        
        print(f"\n✅ Successfully processed {created_count} users!")
        print(f"📧 Default password for all users: {default_password}")
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return 1
    finally:
        db.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
EOF

chmod +x "$PROJECT_ROOT/scripts/create_users.py"

print_status "Setup completed successfully! 🎉"
echo ""
echo "📋 Next steps:"
echo "1. Review and update the backend .env file with your configuration"
echo "2. Run ./scripts/start_local.sh to start the system"
echo "3. Run python3 scripts/create_users.py to create the user accounts"
echo ""
echo "🔗 URLs:"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:8000/docs"