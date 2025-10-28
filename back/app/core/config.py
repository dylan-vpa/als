from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = Field(default="Paradixe API")
    secret_key: str = Field(default="change_me_to_a_random_secret")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)
    api_prefix: str = Field(default="/api/v1")
    backend_cors_origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:5173",
    ])
    
    # Database configuration
    database_url: str = Field(default="sqlite:///./app.db")
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=5432)
    postgres_user: str = Field(default="paradixe")
    postgres_password: str = Field(default="paradixe123")
    postgres_db: str = Field(default="paradixe_db")
    
    @property
    def postgres_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    class Config:
        env_file = "./back/.env"
        env_file_encoding = "utf-8"

settings = Settings()