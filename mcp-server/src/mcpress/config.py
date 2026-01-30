"""Configuration for MCPress MCP server."""

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    """Application settings loaded from environment variables."""

    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str | None = None

    # OpenAI configuration for embeddings
    openai_api_key: str = field(default="")
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536

    @classmethod
    def from_env(cls) -> "Settings":
        """Load settings from environment variables."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")

        if not supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")

        return cls(
            supabase_url=supabase_url,
            supabase_service_key=supabase_service_key,
            supabase_anon_key=supabase_anon_key,
            openai_api_key=openai_api_key or "",
        )


def get_settings() -> Settings:
    """Get application settings."""
    return Settings.from_env()
