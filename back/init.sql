-- Script de inicialización para PostgreSQL
-- Se ejecuta automáticamente cuando se crea el contenedor

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'UTC';

-- Crear esquemas si es necesario
-- CREATE SCHEMA IF NOT EXISTS app;

-- Mensaje de confirmación
SELECT 'PostgreSQL inicializado correctamente para Paradixe' as status;