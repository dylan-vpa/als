#!/usr/bin/env python3
"""Provisiona PostgreSQL (y servicios aliados) en una instancia AWS
usando la misma configuración Docker Compose del entorno local.

Este script debe ejecutarse en la instancia EC2 (o servidor Linux)
después de clonar el repositorio.
"""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

REPO_ROOT = Path(__file__).resolve().parent
DEFAULT_COMPOSE = REPO_ROOT / "docker-compose.yml"
PROD_COMPOSE = REPO_ROOT / "docker-compose.prod.yml"


@dataclass
class CommandResult:
    command: Sequence[str]
    returncode: int
    stdout: str
    stderr: str


def run_command(
    command: Sequence[str],
    *,
    sudo: bool = False,
    check: bool = True,
    capture: bool = True,
) -> CommandResult:
    """Ejecuta un comando del sistema y retorna el resultado estructurado."""

    if sudo:
        if shutil.which("sudo") is None:
            raise RuntimeError("sudo no está disponible en el sistema")
        command = ("sudo", *command)

    process = subprocess.run(
        command,
        check=check,
        capture_output=capture,
        text=True,
    )
    return CommandResult(command, process.returncode, process.stdout, process.stderr)


def command_exists(command: Sequence[str]) -> bool:
    """Retorna True si el comando se puede ejecutar correctamente."""
    try:
        run_command(command, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError, RuntimeError):
        return False
    return True


def ensure_linux() -> None:
    if platform.system().lower() != "linux":
        raise SystemExit("Este script está diseñado para ejecutarse en Linux (por ejemplo, Ubuntu en EC2).")


def ensure_docker() -> None:
    """Instala Docker y habilita el servicio si es necesario."""
    if not shutil.which("docker"):
        print("🐳 Docker no está instalado. Instalando...")
        run_command(["apt-get", "update"], sudo=True)
        run_command(["apt-get", "install", "-y", "docker.io"], sudo=True)
    else:
        print("✅ Docker ya está instalado.")

    print("🔁 Habilitando y arrancando el servicio docker...")
    run_command(["systemctl", "enable", "--now", "docker"], sudo=True)


def ensure_compose() -> str:
    """Garantiza que Docker Compose (plugin o binario) está disponible."""
    if command_exists(["docker", "compose", "version"]):
        print("✅ Docker compose plugin disponible.")
        return "docker compose"

    if shutil.which("docker-compose"):
        print("✅ docker-compose (binario legacy) disponible.")
        return "docker-compose"

    print("⚙️ Instalando docker compose plugin...")
    run_command(["apt-get", "update"], sudo=True)
    run_command(["apt-get", "install", "-y", "docker-compose-plugin"], sudo=True)

    if command_exists(["docker", "compose", "version"]):
        return "docker compose"

    raise SystemExit("No se pudo instalar Docker Compose. Revisa la salida anterior.")


def ensure_user_in_docker_group() -> None:
    """Añade al usuario actual al grupo docker si aún no pertenece."""
    user = os.environ.get("SUDO_USER") or os.environ.get("USER")
    if not user or user == "root":  # Si estamos como root no hace falta añadir a nadie.
        return

    try:
        result = run_command(["groups", user], capture=True)
    except subprocess.CalledProcessError:
        print("⚠️ No se pudo verificar el grupo del usuario. Continúo...")
        return

    if "docker" in result.stdout.split():
        return

    print(f"➕ Añadiendo {user} al grupo docker...")
    run_command(["usermod", "-aG", "docker", user], sudo=True)
    print("ℹ️ Debes cerrar sesión y volver a entrar para que el cambio surta efecto.")


def check_required_files(compose_files: Iterable[Path]) -> None:
    for compose_file in compose_files:
        if not compose_file.exists():
            raise SystemExit(f"No se encontró el archivo {compose_file}. Ejecuta el script en la raíz del repo.")

    init_sql = REPO_ROOT / "back" / "init.sql"
    if not init_sql.exists():
        raise SystemExit("No se encontró back/init.sql. Verifica que el repositorio esté completo.")


def build_compose_command(
    compose_bin: str,
    compose_files: Iterable[Path],
    services: Sequence[str],
    force_recreate: bool,
) -> list[str]:
    compose_parts: list[str] = compose_bin.split()

    for compose_file in compose_files:
        compose_parts.extend(["-f", str(compose_file)])

    compose_parts.extend(["up", "-d"])
    if force_recreate:
        compose_parts.append("--force-recreate")

    compose_parts.extend(services)
    return compose_parts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Provisiona PostgreSQL (y opcionalmente PgAdmin/Ollama) en AWS usando Docker Compose.",
    )
    parser.add_argument(
        "--compose-file",
        default=str(DEFAULT_COMPOSE),
        help="Ruta al docker-compose base (por defecto docker-compose.yml).",
    )
    parser.add_argument(
        "--prod-overlay",
        action="store_true",
        help="Añade docker-compose.prod.yml como overlay (para tomar variables de producción).",
    )
    parser.add_argument(
        "--no-pgadmin",
        action="store_true",
        help="No levanta el servicio PgAdmin.",
    )
    parser.add_argument(
        "--with-ollama",
        action="store_true",
        help="Incluye el servicio Ollama además de PostgreSQL.",
    )
    parser.add_argument(
        "--force-recreate",
        action="store_true",
        help="Recrear contenedores aunque existan previamente.",
    )
    parser.add_argument(
        "--extra-service",
        action="append",
        default=[],
        help="Servicios adicionales a levantar (puede indicarse varias veces).",
    )
    return parser.parse_args()


def main() -> None:
    ensure_linux()
    args = parse_args()

    compose_files = [Path(args.compose_file)]
    if args.prod_overlay:
        compose_files.append(PROD_COMPOSE)

    check_required_files(compose_files)

    ensure_docker()
    compose_bin = ensure_compose()
    ensure_user_in_docker_group()

    services: list[str] = ["postgres"]
    if not args.no_pgadmin:
        services.append("pgadmin")
    if args.with_ollama:
        services.append("ollama")
    services.extend(args.extra_service)

    print("🚀 Levantando servicios Docker:", ", ".join(services))
    command = build_compose_command(compose_bin, compose_files, services, args.force_recreate)
    try:
        result = run_command(command, capture=True)
    except subprocess.CalledProcessError as exc:
        print("❌ Error al ejecutar docker compose")
        if exc.stdout:
            print(exc.stdout)
        if exc.stderr:
            print(exc.stderr)
        raise SystemExit(1) from exc

    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)

    print("\n✅ PostgreSQL quedó provisionado. Verifica el estado con `docker ps`.")
    print("ℹ️ Credenciales disponibles en .env.prod o en tus variables de entorno personalizadas.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProceso interrumpido por el usuario.")
        sys.exit(130)
