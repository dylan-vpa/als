from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field


BACK_DIR = Path(__file__).resolve().parents[2]
BASE_DIR = BACK_DIR.parent


class Settings(BaseSettings):
    app_name: str = Field(default="Paradixe API")
    secret_key: str = Field(default="change_me_to_a_random_secret")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)
    api_prefix: str = Field(default="/api/v1")
    backend_cors_origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
    ])
    
    # Database configuration (override with DATABASE_URL env or fallback to postgres_*)
    database_url: str | None = Field(default=None)
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=5432)
    postgres_user: str = Field(default="paradixe")
    postgres_password: str = Field(default="paradixe123")
    postgres_db: str = Field(default="paradixe_db")
    
    # Resend email configuration
    resend_api_key: str = Field(default="")
    resend_from: str = Field(default="")
    
    @property
    def postgres_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    class Config:
        env_file = str(BACK_DIR / ".env")
        env_file_encoding = "utf-8"

settings = Settings()