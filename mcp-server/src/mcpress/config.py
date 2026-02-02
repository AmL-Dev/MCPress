"""Configuration for MCPress MCP server."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    """Application settings loaded from environment variables."""

    backend_url: str

    @classmethod
    def from_env(cls) -> "Settings":
        """Load settings from environment variables."""
        backend_url = os.getenv("MCPRESS_BACKEND_URL", "http://localhost:8000")
        backend_url = backend_url.rstrip("/")
        return cls(backend_url=backend_url)


def get_settings() -> Settings:
    """Get application settings."""
    return Settings.from_env()
