"""Configuration settings for MCPress backend."""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import AliasChoices, Field
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
    
    # Supabase configuration
    supabase_url: str  # Web URL: https://your-project.supabase.co
    supabase_service_key: str = Field(
        validation_alias=AliasChoices("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"),
    )
    supabase_anon_key: str

    # Database: set DATABASE_URL (full URI from dashboard) OR individual components
    database_url_override: str = Field(default="", validation_alias="DATABASE_URL")
    database_host: str = ""
    database_port: int = 5432
    database_user: str = "postgres"
    database_password: str = ""
    database_name: str = "postgres"

    def _db_host(self) -> str:
        """Supabase DB host: use db.<ref>.supabase.co if host is <ref>.supabase.co."""
        h = self.database_host.strip()
        if h and not h.startswith("db.") and ".supabase.co" in h:
            return f"db.{h}"
        return h or "localhost"

    def _built_database_url(self) -> str:
        """Build PostgreSQL URL from host/user/password (sync, with sslmode)."""
        host = self._db_host()
        if self.database_password:
            return f"postgresql://{self.database_user}:{self.database_password}@{host}:{self.database_port}/{self.database_name}?sslmode=require"
        return f"postgresql://{self.database_user}@{host}:{self.database_port}/{self.database_name}?sslmode=require"

    def _built_async_database_url(self) -> str:
        """Build async PostgreSQL URL from host/user/password."""
        host = self._db_host()
        if self.database_password:
            return f"postgresql+asyncpg://{self.database_user}:{self.database_password}@{host}:{self.database_port}/{self.database_name}"
        return f"postgresql+asyncpg://{self.database_user}@{host}:{self.database_port}/{self.database_name}"

    def _is_placeholder_url(self, url: str) -> bool:
        """True if URL contains placeholder host (e.g. aws-0-XX) that won't resolve."""
        if not url or "XX" in url or "your-" in url or ".example." in url:
            return True
        return False

    @property
    def database_url(self) -> str:
        """PostgreSQL connection URL (sync). Prefer DATABASE_URL if set and valid."""
        u = (self.database_url_override or "").strip()
        if u and not self._is_placeholder_url(u):
            if "?" not in u and "postgresql://" in u:
                u = f"{u}?sslmode=require"
            return u
        return self._built_database_url()

    @property
    def async_database_url(self) -> str:
        """Async PostgreSQL connection URL. Prefer DATABASE_URL if set and valid."""
        u = (self.database_url_override or "").strip()
        if u and not self._is_placeholder_url(u):
            return u.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self._built_async_database_url()
    
    # Groq API configuration
    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"
    
    # OpenAI API configuration
    openai_api_key: str
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536
    
    # Jina.ai configuration
    jina_reader_url: str = "https://r.jina.ai/http://"
    
    # CORS: store as str in env (comma-separated), expose as list via property
    cors_origins_str: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        validation_alias="CORS_ORIGINS",
    )
    
    # Allowed categories: store as str in env (comma-separated), expose as list via property
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
        """Pydantic config."""
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
