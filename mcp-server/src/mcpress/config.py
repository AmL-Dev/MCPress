"""Configuration for MCPress MCP server."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    """Application settings loaded from environment variables."""

    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str | None = None

    @classmethod
    def from_env(cls) -> "Settings":
        """Load settings from environment variables."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")

        return cls(
            supabase_url=supabase_url,
            supabase_service_key=supabase_service_key,
            supabase_anon_key=supabase_anon_key,
        )


def get_settings() -> Settings:
    """Get application settings."""
    return Settings.from_env()
