#!/bin/bash

# Script de despliegue para AWS - Sistema ALS
# Este script prepara y despliega la aplicación en AWS

set -e

echo "🚀 Iniciando despliegue de ALS en AWS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
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

# Verificar requisitos
check_requirements() {
    print_message "Verificando requisitos..."
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI no está instalado. Por favor instálalo primero."
        exit 1
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado."
        exit 1
    fi
    
    # Verificar Python
    if ! command -v python &> /dev/null; then
        print_error "Python no está instalado."
        exit 1
    fi
    
    print_success "Requisitos verificados"
}

# Build del frontend
build_frontend() {
    print_message "Construyendo frontend..."
    cd front
    
    # Instalar dependencias
    npm install
    
    # Build para producción
    npm run build
    
    print_success "Frontend construido"
    cd ..
}

# Preparar backend
prepare_backend() {
    print_message "Preparando backend..."
    cd back
    
    # Crear archivo de requirements
    pip freeze > requirements.txt
    
    # Crear archivo de configuración para producción
    cat > config_prod.py << EOF
import os
from app.core.config import Settings

class ProductionSettings(Settings):
    # Configuración para producción
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/als_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AWS S3 Configuration
    AWS_BUCKET_NAME: str = os.getenv("AWS_BUCKET_NAME", "als-bucket")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["https://your-domain.com"]
    
    # Email
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

settings = ProductionSettings()
EOF
    
    print_success "Backend preparado"
    cd ..
}

# Crear Dockerfile
create_dockerfile() {
    print_message "Creando Dockerfiles..."
    
    # Dockerfile para backend
    cat > back/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

    # Dockerfile para frontend
    cat > front/Dockerfile << 'EOF'
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json
COPY package*.json ./
RUN npm ci --only=production

# Copiar código y construir
COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # nginx.conf para frontend
    cat > front/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Frontend routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API routes
        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
    
    print_success "Dockerfiles creados"
}

# Crear docker-compose
create_docker_compose() {
    print_message "Creando docker-compose.yml..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./back
    container_name: als-backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - AWS_BUCKET_NAME=${AWS_BUCKET_NAME}
      - AWS_REGION=${AWS_REGION}
      - SMTP_SERVER=${SMTP_SERVER}
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    ports:
      - "8000:8000"
    volumes:
      - ./back/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build: ./front
    container_name: als-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: als-nginx
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
EOF
    
    print_success "Docker Compose creado"
}

# Crear script de despliegue en EC2
create_ec2_deploy_script() {
    print_message "Creando script de despliegue EC2..."
    
    cat > scripts/deploy_ec2.sh << 'EOF'
#!/bin/bash

# Script de despliegue para EC2
set -e

echo "🚀 Desplegando ALS en EC2..."

# Actualizar sistema
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git

# Clonar repositorio (si es necesario)
if [ ! -d "als" ]; then
    git clone https://github.com/tu-usuario/als.git
fi

cd als

# Crear archivo .env
cat > .env << EOL
DATABASE_URL=postgresql://als_user:als_password@localhost:5432/als_db
SECRET_KEY=tu-secret-key-muy-segura-aqui
AWS_BUCKET_NAME=als-bucket
AWS_REGION=us-east-1
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña
EOL

# Construir y ejecutar
docker-compose down
docker-compose build
docker-compose up -d

echo "✅ Despliegue completado!"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
EOF

    chmod +x scripts/deploy_ec2.sh
    print_success "Script EC2 creado"
}

# Crear configuración de AWS ECS
create_ecs_config() {
    print_message "Creando configuración ECS..."
    
    mkdir -p aws
    
    # Task definition para ECS
    cat > aws/task-definition.json << 'EOF'
{
    "family": "als-app",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "als-backend",
            "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/als-backend:latest",
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "DATABASE_URL", "value": "postgresql://user:pass@db:5432/als"},
                {"name": "SECRET_KEY", "value": "your-secret-key"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/als-app",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        },
        {
            "name": "als-frontend",
            "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/als-frontend:latest",
            "portMappings": [
                {
                    "containerPort": 80,
                    "protocol": "tcp"
                }
            ],
            "dependsOn": [
                {
                    "containerName": "als-backend",
                    "condition": "START"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/als-app",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]
}
EOF
    
    print_success "Configuración ECS creada"
}

# Función principal
main() {
    print_message "🚀 Iniciando preparación para despliegue AWS..."
    
    check_requirements
    build_frontend
    prepare_backend
    create_dockerfile
    create_docker_compose
    create_ec2_deploy_script
    create_ecs_config
    
    print_success "✅ Preparación completada!"
    echo ""
    print_message "📋 Pasos siguientes:"
    echo "1. Sube las imágenes Docker a Amazon ECR"
    echo "2. Configura una base de datos RDS para PostgreSQL"
    echo "3. Despliega usando una de estas opciones:"
    echo "   - EC2: ejecuta ./scripts/deploy_ec2.sh en tu instancia"
    echo "   - ECS: aws ecs register-task-definition --cli-input-json file://aws/task-definition.json"
    echo "   - Elastic Beanstalk: eb create y eb deploy"
    echo ""
    print_message "📁 Archivos creados:"
    echo "- docker-compose.yml"
    echo "- back/Dockerfile"
    echo "- front/Dockerfile"
    echo "- front/nginx.conf"
    echo "- scripts/deploy_ec2.sh"
    echo "- aws/task-definition.json"
    echo ""
    print_success "¡Listo para desplegar en AWS! 🎉"
}

# Ejecutar script
main "$@"