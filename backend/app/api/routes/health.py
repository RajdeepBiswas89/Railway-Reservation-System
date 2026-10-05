from fastapi import APIRouter

from app.core.database import ping_database

router = APIRouter(prefix="/api")


@router.get("/health")
async def health_check() -> dict:
    try:
        ok = await ping_database()
        return {"status": "ok" if ok else "degraded", "database": "connected" if ok else "disconnected"}
    except Exception as exc:  # pragma: no cover
        return {"status": "degraded", "database": "disconnected", "error": str(exc)}
