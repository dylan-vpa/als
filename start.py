#!/bin/bash

# Detener y eliminar contenedores existentes
docker compose -f docker-compose.prod.yml down

# Construir y levantar los contenedores
docker compose -f docker-compose.prod.yml up --build -d

echo "¡Listo! La aplicación está corriendo en:"
echo "- Frontend: http://localhost"
echo "- Backend: http://localhost:8000"
echo "- Ollama: http://localhost:11434"