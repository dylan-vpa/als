# Paradixe ALS – Guía para Desarrolladores

Este documento resume el estado actual del proyecto, cómo levantarlo, qué funcionalidades están disponibles y cómo extenderlo. Es ideal para onboarding de nuevos devs.

## Visión General
- **Frontend**: React + Vite (ruta base `front/`).
- **Backend**: FastAPI + SQLAlchemy + JWT (ruta base `back/`).
- **DB por defecto**: SQLite (`back/app.db`). Postgres soportado por configuración.
- **IA**: Integración con Ollama local (default `http://localhost:11434`, modelo `llama3.2:3b`) con fallback heurístico.
- **Upload de OIT**: Soporta PDF/TXT/MD si `python-multipart` está instalado; si no, flujo alterno RAW (JSON).

## Estructura del Proyecto
```
als/
├── back/
│   ├── app/
│   │   ├── api/v1/               # Routers FastAPI
│   │   │   ├── __init__.py       # Registro de routers
│   │   │   ├── auth.py           # Auth y JWT
│   │   │   ├── oit.py            # OIT endpoints
│   │   │   └── resources.py      # Recursos (inventario)
│   │   ├── core/                 # Config y dependencias
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── system_user.py
│   │   │   ├── oit_document.py
│   │   │   └── resource.py
│   │   ├── schemas/              # Pydantic models
│   │   │   ├── oit.py
│   │   │   └── resource.py
│   │   ├── services/             # Servicios
│   │   │   └── ai.py             # IA: Ollama + heurística
│   │   ├── database.py           # Engine y sesiones
│   │   ├── main.py               # FastAPI app (startup crea tablas)
│   ├── uploads/oit/              # Archivos subidos
│   ├── start.py                  # Script de arranque (dev)
├── front/
│   ├── src/
│   │   ├── App.tsx               # Rutas React
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── OitDetailPage.tsx # Vista detalle OIT con tabs
│   │   │   └── ResourcesPage.tsx # CRUD simple de recursos
│   │   ├── services/api.ts       # Cliente API
│   │   └── contexts/AuthContext.tsx
└── DEVELOPERS.md                 # Este documento
```

## Setup Rápido
### Backend
- Requisitos: Python 3.12 (venv ya creado en `back/venv/`).
- Arranque (Windows):
  - `python back/start.py`
  - Alternativa: `uvicorn back.app.main:app --reload` (ajusta import según layout).
- Base de datos: por defecto SQLite. Tablas se crean en startup con `Base.metadata.create_all`.

### Frontend
- Requisitos: Node 18+.
- Arranque: `cd front && npm install && npm run dev`.
- URL de dev: `http://localhost:5173/`.

### IA (Ollama Local)
- Asegúrate de que Ollama corre en `http://localhost:11434`.
- Modelo por defecto: `llama3.2:3b`. Verifica con `ollama list`.
- Test rápido:
  ```bash
  curl -X POST http://localhost:11434/api/generate \
    -d '{"model":"llama3.2:3b","prompt":"Hola","stream":false}'
  ```

## Variables de Entorno
- Backend (opcional):
  - `PARADIXE_OLLAMA_URL` (default `http://localhost:11434`)
  - `PARADIXE_OLLAMA_MODEL` (default `llama3.2:3b`)
  - `PARADIXE_AI_FALLBACK` (`true|false`, fuerza heurística)
- Frontend:
  - `VITE_API_URL` (default `http://localhost:8000/api/v1`)

## Endpoints Backend
- Auth (`/api/v1/auth`):
  - `POST /signup` → `{email, password, full_name?}` → `{access_token}`
  - `POST /login` → `{email, password}` → `{access_token}`
  - `GET /me` → Datos del usuario
- OIT (`/api/v1/oit`):
  - `GET /oit` → Lista de documentos
  - `GET /oit/{id}` → Detalle documento (id)
  - `GET /oit/{id}/recommendations` → Recomendaciones IA + matches en recursos
  - Upload (condicional):
    - Si `python-multipart` instalado: `POST /oit/upload` (form-data `file`)
    - Si no está: `POST /oit/upload-raw` (JSON `{text: string}`)
- Recursos (`/api/v1/resources`):
  - `GET /` → Lista
  - `POST /` → Crear `{name,type,quantity?,available?,location?,description?}`
  - `PUT /{id}` → Actualizar (parcial)
  - `DELETE /{id}` → Eliminar

## Modelos
- `SystemUser`: usuarios autenticados.
- `OitDocument`:
  - `filename`, `original_name`, `status` (`alerta|error|check`), `summary`, `alerts`, `missing`, `evidence`, `created_at`.
- `Resource`:
  - `name`, `type` (`vehiculo|equipo|personal|insumo`), `quantity`, `available`, `location`, `description`, `created_at`.

## Cliente Frontend (api.ts)
- Auth: `login`, `signup`, `logout`, `getCurrentUser`.
- OIT: `uploadOit` (multipart), `listOit`, `getOit`, `getOitRecommendations`.
- Recursos: `listResources`, `createResource`.

## Rutas Frontend
- `/` Home
- `/auth` Acceso
- `/dashboard` (protegida):
  - Subir OIT (si multipart disponible)
  - Lista de OIT (con botón “Ver” si `status === "check"`)
- `/oit/:id` (protegida):
  - Tabs: Resumen | Recursos recomendados (muestra recomendaciones IA y coincidencias por tipo contra inventario)
- `/resources` (protegida):
  - Crear recursos y ver inventario

## Flujos de Prueba
1. Registro/Login:
   - Frontend: usa `/auth` o desde Home.
   - Backend (PowerShell):
     ```powershell
     $login = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"user@example.com","password":"pass"}'
     $token = $login.access_token
     ```
2. Subida OIT:
   - Frontend (Dashboard) si multipart está instalado.
   - Backend RAW:
     ```powershell
     Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/oit/upload-raw" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body '{"text":"Documento OIT de ejemplo con muestreo y campo"}'
     ```
3. Ver recomendaciones:
   - Frontend: `/oit/{id}` → Tab “Recursos recomendados”.
   - Backend:
     ```powershell
     Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/v1/oit/1/recommendations" -Headers @{ Authorization = "Bearer $token" }
     ```
4. Recursos:
   - Crear:
     ```powershell
     Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/resources/" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body '{"name":"GPS portátil","type":"equipo","quantity":1,"available":true}'
     ```
   - Listar:
     ```powershell
     Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/v1/resources/" -Headers @{ Authorization = "Bearer $token" }
     ```

## IA – Detalles Técnicos
- Servicio: `back/app/services/ai.py`.
- Default: llama a `POST {OLLAMA_URL}/api/generate` con `model = llama3.2:3b`.
- Fallback: si hay error de red, salida no JSON o no hay `requests`, aplica `_heuristic_review`.
- `recommend_resources(document_text)`: heurísticas simples basadas en keywords (campo, muestreo, agua, seguridad, personal).

## Notas y Estado
- Upload multipart depende de `python-multipart`. Si no está, usar `/oit/upload-raw`.
- Extracción PDF depende de `pypdf`. Si no está, se trata el archivo como texto o se retorna vacío.
- Se cruzan recomendaciones con recursos por `type`. Mejoras futuras: matching por nombre, ubicación y disponibilidad.

## Roadmap Sugerido
- [ ] Editar/Eliminar recursos desde frontend (PUT/DELETE).
- [ ] Mostrar `alerts`, `missing`, `evidence` en detalle OIT.
- [ ] Mejorar prompt del modelo y validar JSON con esquema.
- [ ] Añadir filtros en Inventario (por tipo y disponibilidad).
- [ ] Soporte completo al flujo multipart (instalar dependencias en CI/CD).
- [ ] Exportar reportes de OIT (PDF/CSV).

## Contribución
- Mantener cambios acotados al scope de la tarea.
- Seguir estilo del código existente; evitar dependencias innecesarias.
- Documentar endpoints nuevos y actualizar este MD.

---
Si tienes dudas o necesitas más contexto del dominio ALS, revisa `DESIGN.MD` y `README.md`. Este documento se mantiene vivo; por favor, actualízalo con tu aporte.