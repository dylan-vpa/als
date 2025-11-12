#!/usr/bin/env python3
"""Prepara un entorno "como local" en una instancia AWS sin usar Docker.

Acciones:
 1. Instala PostgreSQL 16, Python 3 tooling y Node.js LTS (NodeSource 20).
 2. Crea la base de datos ALS_db y el rol ALS con contraseña ALS123.
 3. Ejecuta back/init.sql para replicar el bootstrap del contenedor.

Tras correr este script, puedes levantar servicios manualmente:
   Backend: python back/start.py  (desde un venv)
   Frontend: npm run dev (en front/)
"""

from __future__ import annotations

import argparse
import os
import platform
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
BACK_DIR = REPO_ROOT / "back"
INIT_SQL = BACK_DIR / "init.sql"


def run(cmd: list[str], *, sudo: bool = False) -> None:
    if sudo and os.geteuid() != 0:
        cmd = ["sudo", *cmd]
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def ensure_linux() -> None:
    if platform.system().lower() != "linux":
        raise SystemExit("Este script debe ejecutarse en una instancia Linux (Ubuntu en EC2).")


def install_system_packages() -> None:
    run(["apt-get", "update"], sudo=True)
    run(["apt-get", "install", "-y",
         "curl",
         "git",
         "python3",
         "python3-venv",
         "python3-pip",
         "build-essential",
         "postgresql",
         "postgresql-contrib"], sudo=True)

    # Node.js 20 (NodeSource)
    run(["bash", "-c", "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -" ])
    run(["apt-get", "install", "-y", "nodejs"], sudo=True)


def configure_postgres(db_name: str, db_user: str, db_password: str) -> None:
    run(["systemctl", "enable", "--now", "postgresql"], sudo=True)

    psql_base = ["sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1"]

    run(psql_base + ["-c", f"CREATE ROLE {db_user} WITH LOGIN PASSWORD '{db_password}';" ])
    run(psql_base + ["-c", f"CREATE DATABASE {db_name} OWNER {db_user};" ])

    if INIT_SQL.exists():
        run([
            "sudo", "-u", "postgres", "psql",
            "-d", db_name,
            "-f", str(INIT_SQL)
        ])

    # Permitir conexiones locales sin tocar seguridad remota
    pg_hba = Path("/etc/postgresql/16/main/pg_hba.conf")
    if pg_hba.exists():
        entry = f"host    all             {db_user}        127.0.0.1/32            md5\n"
        text = pg_hba.read_text()
        if entry not in text:
            pg_hba.write_text(text + "\n" + entry)
            run(["systemctl", "restart", "postgresql"], sudo=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Setup dev nativo para Paradixe ALS en AWS.")
    parser.add_argument("--db-name", default="ALS_db")
    parser.add_argument("--db-user", default="ALS")
    parser.add_argument("--db-password", default="ALS123")
    return parser.parse_args()


def main() -> None:
    ensure_linux()
    args = parse_args()

    install_system_packages()
    configure_postgres(args.db_name, args.db_user, args.db_password)

    print("\n✅ Entorno base listo. Próximos pasos manuales:")
    print("1. Backend:\n   python3 -m venv back/venv\n   source back/venv/bin/activate\n   pip install -r back/requirements.txt\n   python back/start.py")
    print("\n2. Frontend:\n   cd front\n   npm install\n   npm run dev -- --host 0.0.0.0 --port 5173")
    print("\n3. Configura .env según producción/dev (back/.env, front/.env).")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        print(f"❌ Error ejecutando {' '.join(exc.cmd)}")
        sys.exit(exc.returncode)
    except KeyboardInterrupt:
        print("\nProceso cancelado por el usuario")
        sys.exit(130)
