from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings

# Usar SQLite para desarrollo
DATABASE_URL = settings.database_url  # Asegurarse de usar SQLite

engine = create_engine(
    DATABASE_URL,
    # Configuración general
    connect_args={"check_same_thread": False}  # Necesario para SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependencia a inyectar en endpoints
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()