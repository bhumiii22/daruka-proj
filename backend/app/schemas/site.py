from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class GeoJSONPolygonGeometry(BaseModel):
    type: str = Field("Polygon", pattern="^Polygon$")
    coordinates: List[List[List[float]]]  # [[[lng, lat], [lng, lat], ...]]


class SiteCreate(BaseModel):
    name: str
    project_id: UUID
    description: Optional[str] = None
    # Accepts GeoJSON Polygon geometry or full GeoJSON Feature
    geometry: GeoJSONPolygonGeometry
    area_hectares: Optional[float] = None


class SiteFeatureCreate(BaseModel):
    """Allows ingesting a complete GeoJSON Feature directly."""
    type: str = Field("Feature", pattern="^Feature$")
    geometry: GeoJSONPolygonGeometry
    properties: Dict[str, Any]


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    geometry: Optional[GeoJSONPolygonGeometry] = None
    area_hectares: Optional[float] = None


class SiteProperties(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str] = None
    area_hectares: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SiteGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: UUID
    geometry: GeoJSONPolygonGeometry
    properties: SiteProperties


class SiteFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[SiteGeoJSONFeature]
