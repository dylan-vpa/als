import shutil
from pathlib import Path
import sys
import subprocess

# Ubicación del backend relative a este script
BACK_DIR = Path(__file__).resolve().parent
ENV_EXAMPLE = BACK_DIR / ".env.example"
ENV_FILE = BACK_DIR / ".env"

# Copiar .env.example si no existe .env
if not ENV_FILE.exists() and ENV_EXAMPLE.exists():
    shutil.copy2(ENV_EXAMPLE, ENV_FILE)

# Ejecutar uvicorn usando el intérprete actual del venv
cmd = [
    sys.executable,
    "-m",
    "uvicorn",
    "app.main:app",
    "--host",
    "0.0.0.0",
    "--port",
    "8000",
    "--reload",
]
# Asegurar cwd en el directorio del backend para que 'app' sea resoluble
subprocess.run(cmd, check=False, cwd=str(BACK_DIR))