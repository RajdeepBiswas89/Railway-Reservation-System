from typing import Any, AsyncGenerator, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=False,
    future=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def _rows_as_dicts(result) -> List[Dict[str, Any]]:
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in result.fetchall()]


async def fetch_all(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute SQL and return all rows as dictionaries. Commits so INSERT/RETURNING persists."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query), params or {})
        rows = _rows_as_dicts(result)
        await session.commit()
        return rows


async def fetch_one(query: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """Execute SQL and return the first row. Commits so writes persist."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query), params or {})
        row = result.fetchone()
        columns = list(result.keys())
        await session.commit()
        if not row:
            return None
        return dict(zip(columns, row))


async def execute_commit(query: str, params: Optional[Dict[str, Any]] = None) -> Any:
    """Execute a SQL statement and commit."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query), params or {})
        await session.commit()
        return result


async def ping_database() -> bool:
    row = await fetch_one("SELECT 1 AS ok")
    return bool(row and row.get("ok") == 1)


async def ensure_extra_tables() -> None:
    """Tables used by the API that are not in the original reservation schema."""
    await execute_commit(
        """
        CREATE TABLE IF NOT EXISTS saved_passengers (
            saved_passenger_id BIGSERIAL PRIMARY KEY,
            user_id            BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            full_name          VARCHAR(120) NOT NULL,
            age                INTEGER NOT NULL,
            gender             VARCHAR(20) NOT NULL,
            id_type            VARCHAR(30),
            id_number          VARCHAR(60),
            preference         VARCHAR(40),
            created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT chk_saved_passenger_age CHECK (age BETWEEN 1 AND 120),
            CONSTRAINT chk_saved_passenger_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'))
        )
        """
    )
    await execute_commit(
        """
        CREATE INDEX IF NOT EXISTS idx_saved_passengers_user
            ON saved_passengers(user_id)
        """
    )
