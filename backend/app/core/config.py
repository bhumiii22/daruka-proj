from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Darukaa.Earth Geospatial API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    JWT_SECRET_KEY: str = "darukaa_earth_hackathon_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database: Supabase / PostgreSQL with PostGIS
    # Example format: postgresql://postgres:password@db.supabase.co:5432/postgres
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/darukaa_earth"

    # CORS origins (comma-separated string or JSON list in .env)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://darukaa.earth",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",")]
        return v

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
    }


settings = Settings()
