from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    # Darukaa.Earth Geospatial API
    High-performance environmental geospatial analytics platform.
    
    ## Core Features:
    * **JWT Authentication**: Register, login, and secure token lifecycle.
    * **Project & Site Management**: PostGIS polygon spatial storage, auto-computed geodesic hectares.
    * **GeoJSON Ingestion & Output**: Full GeoJSON Feature and FeatureCollection compatibility.
    * **Environmental Impact Analytics**: Historical time-series models for carbon sequestration and biodiversity index.
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
is_wildcard = "*" in settings.BACKEND_CORS_ORIGINS or settings.BACKEND_CORS_ORIGINS == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else [str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    """Service status check."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Liveness / Readiness probe."""
    return {"status": "healthy"}
