# 🚀 Setup de ALS - PostgreSQL

Guía completa para configurar el proyecto ALS con PostgreSQL.

## 📋 Prerrequisitos

- **Python 3.8+**
- **Node.js 16+** y npm
- **Docker Desktop** (para PostgreSQL)
- **Git**

## 🔧 Setup Automático

### Opción 1: Script de Setup (Recomendado)

```bash
# Ejecutar script de setup automático
python setup.py
```

Este script:
- ✅ Configura el entorno virtual de Python
- ✅ Instala dependencias del backend
- ✅ Instala dependencias del frontend
- ✅ Levanta PostgreSQL con Docker
- ✅ Crea las tablas de la base de datos

### Opción 2: Setup Manual

#### 1. Backend (Python/FastAPI)

```bash
# Crear entorno virtual
cd back
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

#### 2. Frontend (React/TypeScript)

```bash
cd front
npm ci
```

#### 3. Base de Datos (PostgreSQL)

```bash
# Levantar PostgreSQL con Docker
docker-compose up -d postgres

# Verificar que esté corriendo
docker ps
```

#### 4. Crear Tablas

```bash
cd back
python -c "
from app.database import engine, Base
from app.models.system_user import SystemUser
Base.metadata.create_all(bind=engine)
print('Tablas creadas!')
"
```

## 🚀 Ejecutar la Aplicación

### Desarrollo

```bash
# Terminal 1: Backend
python back/start.py

# Terminal 2: Frontend
cd front
npm run dev
```

### URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PgAdmin**: http://localhost:5050

## 🐘 PostgreSQL

### Configuración

Las credenciales por defecto son:
- **Host**: localhost
- **Puerto**: 5432
- **Usuario**: ALS
- **Contraseña**: ALS123
- **Base de datos**: ALS_db

### PgAdmin (Interfaz Web)

Accede a http://localhost:5050 con:
- **Email**: admin@ALS.com
- **Contraseña**: admin123

### Comandos Útiles

```bash
# Ver logs de PostgreSQL
docker logs ALS_postgres

# Conectar a PostgreSQL
docker exec -it ALS_postgres psql -U ALS -d ALS_db

# Reiniciar PostgreSQL
docker-compose restart postgres

# Parar PostgreSQL
docker-compose down
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Edita `back/.env` para personalizar:

```env
# Base de datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=ALS
POSTGRES_PASSWORD=ALS123
POSTGRES_DB=ALS_db

# Aplicación
SECRET_KEY=tu_clave_secreta_aqui
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Migración desde SQLite

Si tienes datos en SQLite, puedes migrarlos:

```bash
# Exportar datos de SQLite
sqlite3 back/app.db .dump > backup.sql

# Importar a PostgreSQL (requiere adaptación del SQL)
# Este proceso requiere ajustes manuales del SQL
```

## 🐳 Docker Compose

El archivo `docker-compose.yml` incluye:

- **PostgreSQL 15**: Base de datos principal
- **PgAdmin 4**: Interfaz web para administrar PostgreSQL
- **Volúmenes persistentes**: Los datos se mantienen entre reinicios

### Comandos Docker

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes (⚠️ BORRA DATOS)
docker-compose down -v
```

## 🔍 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'psycopg2'"

```bash
cd back
pip install psycopg2-binary
```

### Error: "Connection refused" a PostgreSQL

1. Verificar que Docker esté corriendo
2. Verificar que PostgreSQL esté levantado: `docker ps`
3. Verificar logs: `docker logs ALS_postgres`

### Error: "Port 5432 already in use"

Si tienes PostgreSQL instalado localmente:

```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"  # Usar puerto 5433 en lugar de 5432

# Actualizar .env
POSTGRES_PORT=5433
```

## 📚 Próximos Pasos

1. **Autenticación**: Ya funcional con JWT
2. **Módulo de Proyectos**: Crear CRUD completo
3. **Migraciones**: Implementar Alembic para cambios de esquema
4. **Tests**: Configurar pytest con base de datos de prueba
5. **Deploy**: Configurar para producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request