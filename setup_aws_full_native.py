#!/usr/bin/env python3
"""Provisiona backend, frontend y PostgreSQL nativos en una instancia AWS Linux.

Requisitos:
- Ejecutar en Ubuntu 22.04/24.04 (EC2) con privilegios de superusuario (sudo).
- Repositorio clonado en la instancia.

Acciones principales:
1. Instala dependencias del sistema (Python, Node.js, Nginx, etc.).
2. Opcionalmente provisiona PostgreSQL nativo reutilizando setup_aws_postgres_native.py.
3. Instala dependencias del backend, configura venv y crea servicio systemd para uvicorn.
4. Compila el frontend (Vite) y configura Nginx para servirlo y hacer proxy al backend.
"""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

REPO_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = REPO_ROOT / "back"
FRONTEND_DIR = REPO_ROOT / "front"
BACKEND_VENV = BACKEND_DIR / "venv"
BACKEND_ENV = BACKEND_DIR / ".env"
BACKEND_ENV_EXAMPLE = BACKEND_DIR / ".env.example"
BACKEND_ENV_PROD = REPO_ROOT / ".env.prod"
FRONT_DIST = Path("/var/www/als_frontend")
SYSTEMD_DIR = Path("/etc/systemd/system")
BACKEND_SERVICE_NAME = "als-backend.service"
NGINX_AVAILABLE = Path("/etc/nginx/sites-available")
NGINX_ENABLED = Path("/etc/nginx/sites-enabled")
NGINX_CONF_NAME = "als.conf"
POSTGRES_SETUP = REPO_ROOT / "setup_aws_postgres_native.py"
NODESOURCE_SETUP = "https://deb.nodesource.com/setup_20.x"


@dataclass
class CommandResult:
    command: Sequence[str]
    returncode: int
    stdout: str
    stderr: str


def run_command(
    command: Sequence[str],
    *,
    check: bool = True,
    capture: bool = True,
    cwd: Path | None = None,
) -> CommandResult:
    process = subprocess.run(
        list(command),
        cwd=str(cwd) if cwd else None,
        check=check,
        capture_output=capture,
        text=True,
    )
    return CommandResult(command, process.returncode, process.stdout, process.stderr)


def ensure_linux_root() -> tuple[str, str]:
    if platform.system().lower() != "linux":
        raise SystemExit("Este script debe ejecutarse en Linux (Ubuntu en EC2).")
    if os.geteuid() != 0:
        raise SystemExit("Debe ejecutarse con privilegios de superusuario (sudo).")
    sudo_user = os.environ.get("SUDO_USER")
    primary_user = sudo_user or os.environ.get("USER", "ubuntu")
    return primary_user, sudo_user or "root"


def apt_install(packages: list[str]) -> None:
    run_command(["apt-get", "update"], capture=False)
    run_command(["apt-get", "install", "-y", *packages], capture=False)


def setup_system_packages() -> None:
    print("📦 Instalando paquetes base...")
    apt_install([
        "python3",
        "python3-venv",
        "python3-pip",
        "build-essential",
        "nginx",
        "git",
        "curl",
    ])


def ensure_node() -> None:
    if shutil.which("node") and shutil.which("npm"):
        version = run_command(["node", "--version"]).stdout.strip()
        if version.startswith("v"):
            try:
                major = int(version.split(".")[0].lstrip("v"))
            except ValueError:
                major = 0
        else:
            major = int(version.split(".")[0])
        if major >= 18:
            print(f"✅ Node.js {version} ya instalado.")
            return

    print("⚙️ Instalando Node.js 20 desde NodeSource...")
    run_command(["bash", "-c", f"curl -fsSL {NODESOURCE_SETUP} | bash -"], capture=False)
    apt_install(["nodejs"])


def run_postgres_setup(args: argparse.Namespace) -> None:
    if args.skip_db:
        print("⏭️ Omitiendo configuración de PostgreSQL nativo.")
        return
    if not POSTGRES_SETUP.exists():
        raise SystemExit("No se encontró setup_aws_postgres_native.py. Asegúrate de mantener el repositorio actualizado.")

    print("🐘 Configurando PostgreSQL nativo...")
    command = [
        "python3",
        str(POSTGRES_SETUP),
        "--db-name",
        args.db_name,
        "--db-user",
        args.db_user,
        "--db-password",
        args.db_password,
    ]
    if args.skip_db_init:
        command.append("--skip-init")
    if args.db_no_remote:
        command.append("--no-remote")
    run_command(command, capture=False)


def ensure_backend_env() -> None:
    if BACKEND_ENV.exists():
        print("✅ back/.env ya existe.")
        return

    if BACKEND_ENV_EXAMPLE.exists():
        shutil.copy2(BACKEND_ENV_EXAMPLE, BACKEND_ENV)
        print("📄 Copiado back/.env.example -> back/.env (ajusta valores según entorno).")
        return

    if BACKEND_ENV_PROD.exists():
        shutil.copy2(BACKEND_ENV_PROD, BACKEND_ENV)
        print("📄 Copiado .env.prod -> back/.env (ajusta valores según entorno).")
        return

    print("⚠️ No se encontró archivo de entorno. Crea back/.env manualmente con credenciales correctas.")


def setup_backend_venv() -> None:
    print("🐍 Configurando backend (FastAPI)...")
    if not BACKEND_VENV.exists():
        run_command(["python3", "-m", "venv", str(BACKEND_VENV)])
    pip_path = BACKEND_VENV / "bin" / "pip"
    run_command([str(pip_path), "install", "--upgrade", "pip"], capture=False)
    run_command([str(pip_path), "install", "-r", "requirements.txt"], cwd=BACKEND_DIR, capture=False)


def create_backend_service(app_user: str, backend_port: int) -> None:
    service_path = SYSTEMD_DIR / BACKEND_SERVICE_NAME
    python_path = BACKEND_VENV / "bin" / "uvicorn"
    service = textwrap.dedent(
        f"""
        [Unit]
        Description=ALS FastAPI Backend
        After=network.target postgresql.service

        [Service]
        Type=simple
        User={app_user}
        WorkingDirectory={BACKEND_DIR}
        Environment=PATH={BACKEND_VENV / 'bin'}
        ExecStart={python_path} app.main:app --host 0.0.0.0 --port {backend_port}
        Restart=always
        RestartSec=5

        [Install]
        WantedBy=multi-user.target
        """
    ).strip()
    service_path.write_text(service, encoding="utf-8")
    run_command(["systemctl", "daemon-reload"], capture=False)
    run_command(["systemctl", "enable", "--now", BACKEND_SERVICE_NAME], capture=False)
    print(f"✅ Servicio systemd {BACKEND_SERVICE_NAME} desplegado y en ejecución.")


def build_frontend() -> None:
    print("⚛️ Compilando frontend (Vite)...")
    run_command(["npm", "install", "-g", "npm@latest"], capture=False)
    run_command(["npm", "ci"], cwd=FRONTEND_DIR, capture=False)
    run_command(["npm", "run", "build"], cwd=FRONTEND_DIR, capture=False)
    dist_dir = FRONTEND_DIR / "dist"
    if not dist_dir.exists():
        raise SystemExit("La compilación del frontend no generó la carpeta dist/. Revisa los logs de npm.")
    if FRONT_DIST.exists():
        shutil.rmtree(FRONT_DIST)
    shutil.copytree(dist_dir, FRONT_DIST)
    run_command(["chown", "-R", "www-data:www-data", str(FRONT_DIST)], capture=False)
    run_command(["chmod", "-R", "755", str(FRONT_DIST)], capture=False)


def configure_nginx(server_name: str, backend_port: int) -> None:
    nginx_conf_path = NGINX_AVAILABLE / NGINX_CONF_NAME
    proxy_pass = f"http://127.0.0.1:{backend_port}/"
    nginx_conf = textwrap.dedent(
        f"""
        server {{
            listen 80;
            server_name {server_name};

            root {FRONT_DIST};
            index index.html;

            location /api/ {{
                proxy_pass {proxy_pass}api/;
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }}

            location / {{
                try_files $uri /index.html;
            }}
        }}
        """
    ).strip()
    nginx_conf_path.write_text(nginx_conf, encoding="utf-8")
    enabled_link = NGINX_ENABLED / NGINX_CONF_NAME
    if enabled_link.exists():
        enabled_link.unlink()
    enabled_link.symlink_to(nginx_conf_path)
    run_command(["nginx", "-t"], capture=False)
    run_command(["systemctl", "restart", "nginx"], capture=False)
    print("✅ Nginx configurado y reiniciado.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Despliega ALS (backend+frontend+DB) sin Docker en AWS.")
    parser.add_argument("--db-name", default="ALS_db")
    parser.add_argument("--db-user", default="ALS")
    parser.add_argument("--db-password", default="ALS123")
    parser.add_argument("--skip-db", action="store_true", help="No ejecutar el setup de PostgreSQL nativo.")
    parser.add_argument("--skip-db-init", action="store_true", help="No ejecutar back/init.sql en PostgreSQL.")
    parser.add_argument("--db-no-remote", action="store_true", help="No habilitar conexiones remotas en PostgreSQL.")
    parser.add_argument("--backend-port", type=int, default=8000)
    parser.add_argument("--server-name", default="_")
    parser.add_argument("--app-user", default=None, help="Usuario del sistema para el servicio backend (por defecto SUDO_USER/ubuntu).")
    return parser.parse_args()


def main() -> None:
    primary_user, _ = ensure_linux_root()
    args = parse_args()
    app_user = args.app_user or primary_user or "ubuntu"

    if not BACKEND_DIR.exists() or not FRONTEND_DIR.exists():
        raise SystemExit("Ejecuta este script desde la raíz del repositorio (se requieren back/ y front/).")

    setup_system_packages()
    ensure_node()
    run_postgres_setup(args)

    ensure_backend_env()
    setup_backend_venv()
    create_backend_service(app_user, args.backend_port)

    build_frontend()
    configure_nginx(args.server_name, args.backend_port)

    print("\n🎉 Despliegue completado.")
    print("- Backend FastAPI expuesto en http://<IP_PUBLICA>:8000 (ajusta security group).")
    print("- Frontend servido por Nginx en http://<IP_PUBLICA> (puerto 80).")
    print("- Ajusta back/.env para apuntar a la DB y llaves definitivas.")
    print("- Verifica servicios con: systemctl status als-backend && sudo journalctl -u als-backend -f")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProceso interrumpido por el usuario.")
        sys.exit(130)
