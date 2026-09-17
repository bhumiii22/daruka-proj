from fastapi import APIRouter
from app.api.v1.endpoints import auth, projects, sites, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(sites.router, prefix="/sites", tags=["Sites (GeoJSON)"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Metrics"])
