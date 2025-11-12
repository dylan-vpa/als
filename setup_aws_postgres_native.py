#!/usr/bin/env python3
"""Provisiona PostgreSQL nativo (sin Docker) en una instancia AWS Linux.

Este script asume Ubuntu 22.04/24.04 en EC2. Instala PostgreSQL desde el
repositorio oficial, crea un rol/base con las credenciales del proyecto,
importa el script back/init.sql, habilita conexiones remotas y prepara un
servicio systemd.
"""

from __future__ import annotations

import argparse
import os
import platform
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

REPO_ROOT = Path(__file__).resolve().parent
INIT_SQL = REPO_ROOT / "back" / "init.sql"
DEFAULT_DB_NAME = "ALS_db"
DEFAULT_DB_USER = "ALS"
DEFAULT_DB_PASSWORD = "ALS123"
POSTGRES_VERSION = "16"


@dataclass
class CommandResult:
    command: list[str]
    returncode: int
    stdout: str
    stderr: str


def run_command(
    command: Iterable[str],
    *,
    sudo: bool = False,
    check: bool = True,
    capture: bool = True,
) -> CommandResult:
    if sudo:
        command = ["sudo", *command]

    process = subprocess.run(
        list(command),
        check=check,
        capture_output=capture,
        text=True,
    )
    return CommandResult(list(command), process.returncode, process.stdout, process.stderr)


def ensure_linux() -> None:
    if platform.system().lower() != "linux":
        raise SystemExit("Este script requiere Linux (Ubuntu en EC2).")


def apt_install(packages: list[str]) -> None:
    run_command(["apt-get", "update"], sudo=True)
    run_command(["apt-get", "install", "-y", *packages], sudo=True)


def ensure_postgres_repo() -> None:
    """Añade el repo oficial de PostgreSQL si aún no está."""
    list_result = run_command(["apt-cache", "policy", f"postgresql-{POSTGRES_VERSION}"], check=False)
    if f"Installed: (none)" not in list_result.stdout and list_result.returncode == 0:
        return

    print("➕ Añadiendo repositorio oficial de PostgreSQL...")
    apt_install(["wget", "ca-certificates"])
    run_command([
        "wget",
        "-qO",
        "-",
        "https://www.postgresql.org/media/keys/ACCC4CF8.asc",
        "|",
        "apt-key",
        "add",
        "-",
    ], sudo=True, check=False, capture=False)
    with open("/etc/apt/sources.list.d/pgdg.list", "w", encoding="utf-8") as f:
        f.write("deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main\n")
    run_command([
        "bash",
        "-c",
        "echo 'deb http://apt.postgresql.org/pub/repos/apt/ '$(lsb_release -cs)'-pgdg main' | sudo tee /etc/apt/sources.list.d/pgdg.list",
    ])


def install_postgresql() -> None:
    ensure_postgres_repo()
    print("📦 Instalando PostgreSQL...")
    apt_install([f"postgresql-{POSTGRES_VERSION}", f"postgresql-client-{POSTGRES_VERSION}", "postgresql-contrib"])


def systemctl_enable(service: str) -> None:
    run_command(["systemctl", "enable", "--now", service], sudo=True)


def run_psql(sql: str, *, user: str = "postgres", db: Optional[str] = None) -> None:
    command = ["psql", "-v", "ON_ERROR_STOP=1"]
    if db:
        command.extend(["-d", db])
    command.extend(["-c", sql])
    run_command(["sudo", "-u", user, *command])


def create_db_user(db_user: str, db_password: str) -> None:
    print(f"👤 Creando/actualizando usuario {db_user}...")
    run_psql(
        f"CREATE ROLE {db_user} WITH LOGIN PASSWORD '{db_password}';",
    )


def create_database(db_name: str, owner: str) -> None:
    print(f"🗄️ Creando base de datos {db_name}...")
    run_psql(
        f"CREATE DATABASE {db_name} OWNER {owner};",
    )


def init_extensions(db_name: str, db_user: str) -> None:
    if not INIT_SQL.exists():
        print("⚠️ No se encontró back/init.sql; omitiendo importación de extensiones.")
        return
    print("📑 Ejecutando init.sql...")
    run_command([
        "sudo",
        "-u",
        "postgres",
        "psql",
        "-d",
        db_name,
        "-f",
        str(INIT_SQL),
    ])


def ensure_pg_hba(db_user: str) -> None:
    pg_hba = Path(f"/etc/postgresql/{POSTGRES_VERSION}/main/pg_hba.conf")
    if not pg_hba.exists():
        print("⚠️ No se encontró pg_hba.conf; verifica la versión instalada.")
        return

    content = pg_hba.read_text(encoding="utf-8")
    rule = f"host    all             {db_user}        0.0.0.0/0               md5"
    if rule in content:
        print("✅ Regla de pg_hba.conf ya presente.")
        return

    print("➕ Añadiendo regla en pg_hba.conf para acceso remoto...")
    with pg_hba.open("a", encoding="utf-8") as f:
        f.write("\n" + rule + "\n")


def ensure_postgresql_conf() -> None:
    conf = Path(f"/etc/postgresql/{POSTGRES_VERSION}/main/postgresql.conf")
    if not conf.exists():
        print("⚠️ No se encontró postgresql.conf; verifica la versión instalada.")
        return

    text = conf.read_text(encoding="utf-8")
    replacements = {
        "#listen_addresses = 'localhost'": "listen_addresses = '*" + "'",
    }

    updated = text
    for pattern, replacement in replacements.items():
        updated = re.sub(pattern, replacement, updated)

    if updated != text:
        print("🛠️ Actualizando postgresql.conf para permitir conexiones externas...")
        conf.write_text(updated, encoding="utf-8")
    else:
        print("✅ postgresql.conf ya permite conexiones externas.")


def reload_postgres() -> None:
    print("🔁 Reiniciando PostgreSQL...")
    systemctl_enable(f"postgresql@{POSTGRES_VERSION}-main")
    run_command(["systemctl", "restart", f"postgresql@{POSTGRES_VERSION}-main"], sudo=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Instala y configura PostgreSQL nativo para ALS.")
    parser.add_argument("--db-name", default=DEFAULT_DB_NAME)
    parser.add_argument("--db-user", default=DEFAULT_DB_USER)
    parser.add_argument("--db-password", default=DEFAULT_DB_PASSWORD)
    parser.add_argument("--skip-init", action="store_true", help="No ejecutar back/init.sql.")
    parser.add_argument("--no-remote", action="store_true", help="No habilita acceso remoto (pg_hba / listen_addresses).")
    return parser.parse_args()


def main() -> None:
    ensure_linux()
    args = parse_args()

    install_postgresql()

    create_db_user(args.db_user, args.db_password)
    create_database(args.db_name, args.db_user)

    if not args.skip_init:
        init_extensions(args.db_name, args.db_user)

    if not args.no_remote:
        ensure_pg_hba(args.db_user)
        ensure_postgresql_conf()

    reload_postgres()

    print("\n✅ PostgreSQL instalado y configurado.")
    print(f"➡️ Cadena de conexión: postgresql://{args.db_user}:{args.db_password}@<HOST>:5432/{args.db_name}")
    print("Recuerda ajustar el Security Group de EC2 para permitir el puerto 5432 desde las IPs necesarias.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProceso interrumpido por el usuario.")
        sys.exit(130)
