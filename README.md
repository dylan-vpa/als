# Paradixe ALS – Dashboard de OITs y Recursos

Aplicación full‑stack (FastAPI + React/TypeScript) para gestionar OITs (documentos), recomendar recursos y administrar inventario. Incluye autenticación JWT, upload con drag & drop, vista de detalle con hallazgos y recomendaciones, y CRUD de recursos con filtros y exportación CSV.

## Estructura

```
als/
├── back/        # Backend FastAPI (Python)
│   ├── app/
│   ├── start.py
│   ├── requirements.txt
│   └── .env
├── front/       # Frontend React + Vite (TypeScript)
│   ├── src/
│   ├── package.json
│   └── .env
└── docker-compose.yml  # Postgres + PgAdmin (opcional)
```

## Funcionalidades

- Autenticación JWT: login, registro, sesión protegida, `/auth/me`.
- Dashboard OITs (ruta `/dashboard` o `/dashboard/oit`):
  - KPIs: Total, Check, Alerta, Error, última actualización.
  - Subida de OIT: botón “Subir nueva” con modal drag & drop + selector de archivo.
  - Listado con estado y fecha; enlace a detalle.
- Detalle OIT (`/dashboard/oit/:id`):
  - Resumen del documento.
  - Hallazgos: alerts, missing, evidence.
  - Recursos recomendados (visible con estado “check” sin alertas ni faltantes), incluyendo coincidencias con inventario.
- Funciona como **PWA**: se puede instalar en escritorio/móvil y trabajar offline con la última información sincronizada.
- Recursos (`/dashboard/resources`):
  - Crear, editar inline, eliminar.
  - Filtros por tipo y disponibilidad.
  - Exportación CSV.
- API Docs automáticas: `http://localhost:8000/docs`.

## Requisitos

- Python 3.8+
- Node.js 16+
- (Opcional) Docker Desktop para PostgreSQL

## Puesta en marcha rápida

Backend (Windows):
```
# Desde la raíz del repo
back\venv\Scripts\python back\start.py
```
Backend (creando venv manual):
```
cd back
python -m venv venv
venv\Scripts\activate  # Win  | source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python start.py
```
Frontend:
```
cd front
npm ci
npm run dev
```

### Modo PWA

- Entorno local: `npm run dev` y abre http://localhost:5173.
- Instala la app desde la opción “Instalar aplicación” del navegador (Chrome/Edge/Firefox en desktop, Chrome/Edge/Brave en Android).
- Service Worker (`public/pwa-sw.js`) mantiene en caché `index.html`, manifest e íconos; si requieres limpiar la caché manualmente, borra los datos del sitio en el navegador.
- Manifesto web: `public/manifest.webmanifest`.
- Si realizas cambios en el SW, ejecuta `npm run build` o recarga con _Update on reload_ en las DevTools para obtener la versión nueva.
URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Configuración

Backend (`back/.env`):
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=paradixe
POSTGRES_PASSWORD=paradixe123
POSTGRES_DB=paradixe_db
SECRET_KEY=tu_clave
ACCESS_TOKEN_EXPIRE_MINUTES=60
```
Frontend (`front/.env`):
```
VITE_API_URL=http://localhost:8000/api/v1
```

Base de datos:
- Por defecto el backend usa PostgreSQL (requiere `psycopg2-binary`).
- Pg con Docker (opcional): `docker-compose up -d` (ver `SETUP.md`).
- Usar SQLite en desarrollo (opcional): cambiar el engine a `settings.database_url` en `back/app/database.py`.

## API (resumen)

Base: `http://localhost:8000/api/v1`

- Auth
  - POST `/auth/login`, POST `/auth/signup`, GET `/auth/me`
- OIT
  - GET `/oit` (listar)
  - POST `/oit/upload` (multipart form‐data: `file`)
  - GET `/oit/{id}` (detalle)
  - GET `/oit/{id}/recommendations` (recomendaciones)
- Recursos
  - GET `/resources/`
  - POST `/resources/`
  - PUT `/resources/{id}`
  - DELETE `/resources/{id}`

## Notas de desarrollo

- Si ves error de `psycopg2`, asegura ejecutar el backend con el Python del `venv` (`back\venv\Scripts\python back\start.py`).
- Las rutas protegidas del frontend viven bajo `/dashboard`.
- El cliente del frontend lee `VITE_API_URL` para apuntar al backend.

## Licencia

Privado/Interno (actualiza esta sección si aplica).