from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.bookings import router as bookings_router
from app.api.routes.health import router as health_router
from app.api.routes.stations import router as stations_router
from app.api.routes.trains import router as trains_router
from app.core.config import settings
from app.core.database import ensure_extra_tables, ping_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    summary=settings.TAGLINE,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(auth_router, tags=["auth"])
app.include_router(stations_router, tags=["stations"])
app.include_router(trains_router, tags=["trains"])
app.include_router(bookings_router, tags=["bookings"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


@app.on_event("startup")
async def startup_event() -> None:
    try:
        await ensure_extra_tables()
        app.state.db_ok = await ping_database()
        app.state.db_error = None
    except Exception as exc:  # pragma: no cover - startup degradation
        app.state.db_ok = False
        app.state.db_error = str(exc)


@app.get("/")
async def root() -> dict:
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "ok",
        "docs": "/docs",
    }
