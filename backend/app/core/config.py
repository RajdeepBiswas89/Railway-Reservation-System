from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RAILNEX"
    TAGLINE: str = "Your Journey. Reimagined."
    API_V1_STR: str = "/api"

    DATABASE_URL: str
    JWT_SECRET: str

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        database_url = self.DATABASE_URL.strip()
        if database_url.startswith("postgres://"):
            return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        if database_url.startswith("postgresql://"):
            return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return database_url

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return self.ASYNC_DATABASE_URL.replace("+asyncpg", "")

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
