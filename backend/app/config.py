"""Configuration settings for MCPress backend."""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic import Field
from pydantic_settings import BaseSettings

# Project root and backend dir for .env lookup
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent


def _split_comma_stripped(s: str) -> List[str]:
    """Split by comma and strip each item."""
    return [x.strip() for x in s.split(",") if x.strip()]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application settings
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = False

    # Chroma storage (local, no Supabase/Postgres)
    chroma_persist_dir: Path = Field(
        default=Path("./data/chroma"),
        validation_alias="CHROMA_PERSIST_DIR",
    )

    @field_validator("chroma_persist_dir", mode="before")
    @classmethod
    def coerce_chroma_path(cls, v):
        if isinstance(v, str):
            return Path(v)
        return v

    # Groq API configuration
    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"

    # OpenAI API configuration
    openai_api_key: str
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536

    # Jina.ai configuration
    jina_reader_url: str = "https://r.jina.ai/http://"
    jina_api_key: str = Field(default="", validation_alias="JINA_API_KEY")

    # CORS: store as str in env (comma-separated)
    cors_origins_str: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:8000",
        validation_alias="CORS_ORIGINS",
    )

    # Allowed categories (comma-separated)
    allowed_categories_str: str = Field(
        default="news,tech,sports,business,politics,entertainment,health,science",
        validation_alias="ALLOWED_CATEGORIES",
    )

    @property
    def cors_origins(self) -> List[str]:
        return _split_comma_stripped(self.cors_origins_str)

    @property
    def allowed_categories(self) -> List[str]:
        return _split_comma_stripped(self.allowed_categories_str)

    class Config:
        env_file = [
            _PROJECT_ROOT / ".env",
            _BACKEND_DIR / ".env",
            ".env",
        ]
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
