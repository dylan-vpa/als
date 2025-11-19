#!/bin/bash

# Script de despliegue para Linux - Sistema ALS
# Automatiza git pull, instalación de dependencias y preparación para AWS

set -e

echo "🚀 Iniciando despliegue automático de ALS..."

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

# Verificar si estamos en el directorio correcto
check_directory() {
    print_message "Verificando directorio..."
    
    if [ ! -f "package.json" ] && [ ! -d "front" ]; then
        print_error "No estás en el directorio raíz del proyecto ALS"
        print_message "Por favor ejecuta este script desde: c:/Users/herna/Documents/Negocios/0.1. Paradixe/Dev/als"
        exit 1
    fi
    
    print_success "Directorio correcto"
}

# Actualizar código con git pull
update_code() {
    print_message "Actualizando código con git pull..."
    
    # Verificar estado de git
    if [ -d ".git" ]; then
        git fetch origin
        git pull origin main
        print_success "Código actualizado"
    else
        print_warning "No es un repositorio git, saltando actualización"
    fi
}

# Instalar dependencias del backend
install_backend_deps() {
    print_message "Instalando dependencias del backend..."
    cd back
    
    # Crear entorno virtual si no existe
    if [ ! -d "venv" ]; then
        print_message "Creando entorno virtual..."
        python3 -m venv venv
    fi
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Actualizar pip
    pip install --upgrade pip
    
    # Instalar dependencias
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        print_message "Instalando dependencias básicas..."
        pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart python-jose[cryptography] passlib[bcrypt] pydantic-settings
        pip install requests pypdf boto3 python-dotenv
    fi
    
    # Guardar requirements
    pip freeze > requirements.txt
    
    print_success "Dependencias del backend instaladas"
    cd ..
}

# Instalar dependencias del frontend
install_frontend_deps() {
    print_message "Instalando dependencias del frontend..."
    cd front
    
    # Verificar si hay package-lock.json
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencias del frontend instaladas"
    cd ..
}

# Build del frontend
build_frontend() {
    print_message "Construyendo frontend para producción..."
    cd front
    
    npm run build
    
    print_success "Frontend construido"
    cd ..
}

# Crear archivos de configuración para AWS
create_aws_config() {
    print_message "Creando configuración para AWS..."
    
    # Crear directorio para configuraciones AWS
    mkdir -p aws
    
    # Archivo de configuración de producción
    cat > back/config_prod.py << 'EOF'
import os
from app.core.config import Settings

class ProductionSettings(Settings):
    # Configuración para producción
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://als_user:als_password@localhost:5432/als_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu-secret-key-muy-segura-aqui-minimo-32-caracteres")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AWS S3 Configuration
    AWS_BUCKET_NAME: str = os.getenv("AWS_BUCKET_NAME", "als-bucket")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    
    # CORS
    BACKEND_CORS_ORIGINS: list = os.getenv("BACKEND_CORS_ORIGINS", "https://tudominio.com").split(",")
    
    # Email
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # Redis (para caché)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

settings = ProductionSettings()
EOF
    
    # Variables de entorno de ejemplo
    cat > .env.example << 'EOF'
# Configuración de Base de Datos
DATABASE_URL=postgresql://als_user:als_password@localhost:5432/als_db

# Configuración de Seguridad
SECRET_KEY=tu-secret-key-muy-segura-aqui-minimo-32-caracteres

# Configuración de AWS
AWS_BUCKET_NAME=als-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key

# Configuración de Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña

# Configuración de CORS
BACKEND_CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Configuración de Redis
REDIS_URL=redis://localhost:6379
EOF
    
    print_success "Configuración AWS creada"
}

# Crear Dockerfiles
create_dockerfiles() {
    print_message "Creando Dockerfiles para despliegue..."
    
    # Dockerfile para backend
    cat > back/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads/oit uploads/resources

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
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

# Copiar configuración nginx
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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Frontend routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API routes - proxy to backend
        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Static assets con caché
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
    
    print_success "Dockerfiles creados"
}

# Crear docker-compose para desarrollo
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
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - SMTP_SERVER=${SMTP_SERVER}
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "8000:8000"
    volumes:
      - ./back/uploads:/app/uploads
      - ./back/logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./front
    container_name: als-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: als-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
EOF
    
    print_success "Docker Compose creado"
}

# Crear script de despliegue rápido para EC2
create_ec2_deploy_script() {
    print_message "Creando script de despliegue EC2..."
    
    cat > scripts/deploy_ec2.sh << 'EOF'
#!/bin/bash

# Script de despliegue para EC2 - ALS
set -e

echo "🚀 Desplegando ALS en EC2..."

# Actualizar sistema
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git curl

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario actual a grupo docker
sudo usermod -aG docker $USER

# Clonar repositorio (si es necesario)
if [ ! -d "als" ]; then
    echo "📥 Clonando repositorio..."
    git clone https://github.com/tu-usuario/als.git
fi

cd als

# Actualizar código
echo "🔄 Actualizando código..."
git pull origin main

# Hacer scripts ejecutables
chmod +x scripts/*.sh

# Ejecutar script de preparación
echo "📦 Preparando aplicación..."
./scripts/deploy_linux.sh

# Crear archivo .env desde el ejemplo
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus configuraciones reales"
fi

# Construir y ejecutar con Docker Compose
echo "🏗️  Construyendo contenedores..."
docker-compose down
docker-compose build
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

# Obtener IP pública
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "✅ ¡Despliegue completado!"
echo ""
echo "📱 Aplicación ALS disponible en:"
echo "   Frontend: http://$PUBLIC_IP"
echo "   Backend API: http://$PUBLIC_IP:8000"
echo "   Documentación API: http://$PUBLIC_IP:8000/docs"
echo ""
echo "🔧 Para configurar SSL y dominio personalizado:"
echo "   1. Apunta tu dominio a: $PUBLIC_IP"
echo "   2. Configura SSL con Let's Encrypt"
echo "   3. Actualiza las variables de entorno en .env"
echo ""
echo "📊 Para ver logs: docker-compose logs -f"
echo "🛑 Para detener: docker-compose down"
EOF
    
    chmod +x scripts/deploy_ec2.sh
    print_success "Script EC2 creado"
}

# Crear guía de despliegue AWS
create_aws_guide() {
    print_message "Creando guía de despliegue AWS..."
    
    cat > AWS_DEPLOYMENT_GUIDE.md << 'EOF'
# 🚀 Guía de Despliegue AWS - Sistema ALS

## 📋 Requisitos Previos

### 1. AWS CLI Configurado
```bash
aws configure
# Ingresa tu Access Key ID, Secret Access Key, región y formato
```

### 2. Docker y Docker Compose
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.com

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Cuenta AWS con permisos
- EC2 Full Access
- ECR Full Access  
- RDS Full Access
- S3 Full Access
- ECS Full Access (si usas ECS)

## 🎯 Opciones de Despliegue

### Opción 1: Amazon EC2 (Recomendado para empezar)

#### Paso 1: Crear instancia EC2
1. Ve a EC2 Dashboard → Launch Instance
2. Selecciona: Ubuntu Server 22.04 LTS
3. Tipo: t3.medium (mínimo recomendado)
4. Configuración:
   - Storage: 30GB mínimo
   - Security Group: Abrir puertos 80, 443, 8000
   - Key Pair: Crear nuevo o usar existente

#### Paso 2: Conectar a la instancia
```bash
ssh -i tu-clave.pem ubuntu@tu-ip-publica
```

#### Paso 3: Ejecutar despliegue
```bash
# En la instancia EC2
wget https://raw.githubusercontent.com/tu-usuario/als/main/scripts/deploy_ec2.sh
chmod +x deploy_ec2.sh
./deploy_ec2.sh
```

### Opción 2: Amazon ECS con Fargate

#### Paso 1: Subir imágenes a ECR
```bash
# Login a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin tu-cuenta.dkr.ecr.us-east-1.amazonaws.com

# Build y push backend
docker build -t als-backend ./back
docker tag als-backend:latest tu-cuenta.dkr.ecr.us-east-1.amazonaws.com/als-backend:latest
docker push tu-cuenta.dkr.ecr.us-east-1.amazonaws.com/als-backend:latest

# Build y push frontend
docker build -t als-frontend ./front
docker tag als-frontend:latest tu-cuenta.dkr.ecr.us-east-1.amazonaws.com/als-frontend:latest
docker push tu-cuenta.dkr.ecr.us-east-1.amazonaws.com/als-frontend:latest
```

#### Paso 2: Crear cluster ECS
```bash
aws ecs create-cluster --cluster-name als-cluster
```

#### Paso 3: Desplegar con ECS
```bash
# Registrar task definition
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json

# Crear servicio
aws ecs create-service --cluster als-cluster --service-name als-service --task-definition als-app --desired-count 1
```

### Opción 3: AWS Elastic Beanstalk

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
 eb init -p docker als-app --region us-east-1

# Crear ambiente y desplegar
eb create als-env
eb deploy
```

## 🔧 Configuración de Base de Datos (RDS)

### Crear RDS PostgreSQL
1. Ve a RDS Dashboard → Create Database
2. Engine: PostgreSQL
3. Template: Free tier (para empezar)
4. Settings:
   - DB instance identifier: als-db
   - Master username: als_user
   - Master password: [segura]
5. Connectivity: Public access (para pruebas)
6. Security Group: Abrir puerto 5432

### Actualizar .env con RDS URL
```bash
DATABASE_URL=postgresql://als_user:password@als-db.xxxxx.us-east-1.rds.amazonaws.com:5432/als_db
```

## 📁 Configuración de S3 para archivos

### Crear bucket S3
```bash
aws s3 mb s3://als-bucket-tu-nombre --region us-east-1
```

### Actualizar .env
```bash
AWS_BUCKET_NAME=als-bucket-tu-nombre
AWS_REGION=us-east-1
```

## 🔒 Configuración de SSL (HTTPS)

### Opción 1: Let's Encrypt (Gratis)
```bash
# En tu servidor EC2
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### Opción 2: AWS Certificate Manager
1. Ve a Certificate Manager → Request Certificate
2. Request a public certificate
3. Add domain names: tudominio.com, *.tudominio.com
4. Validate via DNS o Email

## 🌐 Configuración de Dominio

### Route 53 (Recomendado)
1. Ve a Route 53 → Hosted Zones
2. Create Hosted Zone: tudominio.com
3. Añadir records:
   - A record: tudominio.com → IP de tu EC2
   - A record: www.tudominio.com → IP de tu EC2

### Configuración DNS en otro registrador
- A Record: @ → IP de EC2
- A Record: www → IP de EC2

## 📊 Monitoreo y Logs

### CloudWatch Logs
```bash
# Instalar CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configurar
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Ver logs de aplicación
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
```

## 🔧 Comandos útiles

### Verificar estado
```bash
# Ver servicios
docker-compose ps

# Ver recursos
docker stats

# Ver logs
docker-compose logs --tail=100
```

### Reiniciar servicios
```bash
# Reiniciar todo
docker-compose restart

# Reiniciar solo backend
docker-compose restart backend
```

### Actualizar aplicación
```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir y reiniciar
docker-compose build --no-cache
docker-compose up -d
```

## 🆘 Solución de Problemas

### Puerto 80 en uso
```bash
sudo netstat -tulpn | grep :80
sudo kill -9 [PID]
```

### Permisos Docker
```bash
sudo usermod -aG docker $USER
# Cierra sesión y vuelve a entrar
```

### Base de datos no conecta
- Verifica security groups
- Verifica endpoint RDS
- Verifica credenciales en .env

### Frontend no carga
- Verifica nginx logs: `docker-compose logs frontend`
- Verifica build: `cd front && npm run build`
- Verifica rutas en nginx.conf

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica la configuración en `.env`
3. Asegúrate de que los puertos estén abiertos en security groups
4. Comprueba que RDS esté en la misma VPC que EC2

EOF
    
    print_success "Guía de despliegue creada"
}

# Función principal
main() {
    print_message "🚀 Iniciando despliegue automático de ALS..."
    
    check_directory
    update_code
    install_backend_deps
    install_frontend_deps
    build_frontend
    create_aws_config
    create_dockerfiles
    create_docker_compose
    create_ec2_deploy_script
    create_aws_guide
    
    print_success "✅ ¡Despliegue completado!"
    echo ""
    print_message "📋 Resumen de archivos creados:"
    echo "  📄 back/config_prod.py - Configuración de producción"
    echo "  📄 back/Dockerfile - Contenedor backend"
    echo "  📄 front/Dockerfile - Contenedor frontend"
    echo "  📄 front/nginx.conf - Config nginx"
    echo "  📄 docker-compose.yml - Orquestación de contenedores"
    echo "  📄 scripts/deploy_ec2.sh - Script para EC2"
    echo "  📄 AWS_DEPLOYMENT_GUIDE.md - Guía completa de despliegue"
    echo "  📄 .env.example - Variables de entorno de ejemplo"
    echo ""
    print_message "🎯 Pasos siguientes:"
    echo "  1. Copia .env.example a .env y configura tus variables"
    echo "  2. Sube tu código a GitHub/GitLab"
    echo "  3. Crea una instancia EC2 en AWS"
    echo "  4. Ejecuta: ./scripts/deploy_ec2.sh en tu servidor"
    echo "  5. Configura tu dominio y SSL"
    echo ""
    print_success "¡Todo listo para desplegar en AWS! 🚀"
}

# Ejecutar script
main "$@"