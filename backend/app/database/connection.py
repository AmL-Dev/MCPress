"""Database connection and session management for Supabase/PostgreSQL."""
import ssl
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings

# SSL context for Supabase (required for db.*.supabase.co)
_ssl_context = ssl.create_default_context()


# Synchronous engine (for migrations and legacy code)
sync_engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)


# Asynchronous engine (for FastAPI) – SSL required for Supabase
async_engine = create_async_engine(
    settings.async_database_url,
    connect_args={"ssl": _ssl_context},
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@asynccontextmanager
async def get_async_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_session() -> Session:
    """Get a synchronous database session."""
    return SyncSessionLocal()


async def init_db() -> None:
    """Initialize database connection."""
    async with async_engine.begin() as conn:
        # Test connection
        await conn.execute("SELECT 1")


async def close_db() -> None:
    """Close database connections."""
    await async_engine.dispose()
