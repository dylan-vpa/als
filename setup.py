#!/usr/bin/env python3
"""
Script de setup automatizado para ALS
Instala dependencias, configura PostgreSQL y inicializa la aplicación
"""

import os
import sys
import subprocess
import platform
import time
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Ejecutar comando y manejar errores"""
    try:
        print(f"🔄 Ejecutando: {command}")
        result = subprocess.run(
            command, 
            shell=shell, 
            cwd=cwd, 
            capture_output=True, 
            text=True,
            check=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error ejecutando: {command}")
        print(f"Error: {e.stderr}")
        return False

def check_docker():
    """Verificar si Docker está instalado y corriendo"""
    try:
        subprocess.run(["docker", "--version"], capture_output=True, check=True)
        subprocess.run(["docker-compose", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def setup_backend():
    """Configurar backend Python"""
    print("\n🐍 Configurando Backend Python...")
    
    backend_dir = Path("back")
    venv_dir = backend_dir / "venv"
    
    # Crear entorno virtual si no existe
    if not venv_dir.exists():
        print("📦 Creando entorno virtual...")
        if not run_command(f"python -m venv {venv_dir}"):
            return False
    
    # Activar entorno virtual y instalar dependencias
    if platform.system() == "Windows":
        pip_path = venv_dir / "Scripts" / "pip.exe"
        python_path = venv_dir / "Scripts" / "python.exe"
    else:
        pip_path = venv_dir / "bin" / "pip"
        python_path = venv_dir / "bin" / "python"
    
    print("📦 Instalando dependencias del backend...")
    if not run_command(f'"{pip_path}" install -r requirements.txt', cwd=backend_dir):
        return False
    
    return True

def setup_frontend():
    """Configurar frontend Node.js"""
    print("\n⚛️ Configurando Frontend React...")
    
    frontend_dir = Path("front")
    
    # Verificar Node.js
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
        subprocess.run(["npm", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js no está instalado. Por favor instala Node.js primero.")
        return False
    
    # Instalar dependencias
    print("📦 Instalando dependencias del frontend...")
    if not run_command("npm ci", cwd=frontend_dir):
        return False
    
    return True

def setup_database():
    """Configurar PostgreSQL con Docker"""
    print("\n🐘 Configurando PostgreSQL...")
    
    if not check_docker():
        print("❌ Docker no está instalado o no está corriendo.")
        print("Por favor instala Docker Desktop y asegúrate de que esté corriendo.")
        return False
    
    # Levantar PostgreSQL
    print("🚀 Iniciando PostgreSQL con Docker...")
    if not run_command("docker-compose up -d postgres"):
        return False
    
    # Esperar a que PostgreSQL esté listo
    print("⏳ Esperando a que PostgreSQL esté listo...")
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            result = subprocess.run([
                "docker", "exec", "ALS_postgres", 
                "pg_isready", "-U", "ALS", "-d", "ALS_db"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ PostgreSQL está listo!")
                break
        except:
            pass
        
        if attempt < max_attempts - 1:
            time.sleep(2)
    else:
        print("❌ PostgreSQL no pudo iniciarse correctamente")
        return False
    
    return True

def create_database_tables():
    """Crear tablas de la base de datos"""
    print("\n🗄️ Creando tablas de la base de datos...")
    
    backend_dir = Path("back")
    if platform.system() == "Windows":
        python_path = backend_dir / "venv" / "Scripts" / "python.exe"
    else:
        python_path = backend_dir / "venv" / "bin" / "python"
    
    # Crear script temporal para inicializar DB
    init_script = """
import sys
sys.path.append('.')
from app.database import engine, Base
from app.models.system_user import SystemUser

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas exitosamente!")
"""
    
    init_file = backend_dir / "init_db.py"
    with open(init_file, "w") as f:
        f.write(init_script)
    
    success = run_command(f'"{python_path}" init_db.py', cwd=backend_dir)
    
    # Limpiar archivo temporal
    init_file.unlink()
    
    return success

def main():
    """Función principal del setup"""
    print("🚀 Iniciando setup de ALS...")
    print("=" * 50)
    
    # Verificar que estamos en el directorio correcto
    if not Path("back").exists() or not Path("front").exists():
        print("❌ Error: Ejecuta este script desde el directorio raíz del proyecto")
        sys.exit(1)
    
    steps = [
        ("Backend Python", setup_backend),
        ("Frontend React", setup_frontend),
        ("PostgreSQL", setup_database),
        ("Tablas de BD", create_database_tables),
    ]
    
    for step_name, step_func in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        if not step_func():
            print(f"❌ Error en: {step_name}")
            sys.exit(1)
        print(f"✅ {step_name} completado!")
    
    print("\n" + "="*50)
    print("🎉 ¡Setup completado exitosamente!")
    print("\n📋 Próximos pasos:")
    print("1. Backend: python back/start.py")
    print("2. Frontend: cd front && npm run dev")
    print("3. PostgreSQL Admin: http://localhost:5050")
    print("   - Email: admin@ALS.com")
    print("   - Password: admin123")
    print("\n🌐 URLs:")
    print("- Frontend: http://localhost:5173")
    print("- Backend API: http://localhost:8000")
    print("- API Docs: http://localhost:8000/docs")
    print("- PgAdmin: http://localhost:5050")

if __name__ == "__main__":
    main()