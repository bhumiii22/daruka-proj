from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MetricBase(BaseModel):
    carbon_sequestration_tons: float
    biodiversity_index: float
    vegetation_index: Optional[float] = 0.0
    soil_organic_matter: Optional[float] = 0.0


class MetricCreate(MetricBase):
    site_id: UUID
    timestamp: Optional[datetime] = None


class MetricResponse(MetricBase):
    id: UUID
    site_id: UUID
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimeSeriesDataPoint(BaseModel):
    timestamp: str
    carbon_sequestration_tons: float
    biodiversity_index: float
    vegetation_index: float
    soil_organic_matter: float


class SiteAnalyticsResponse(BaseModel):
    site_id: UUID
    site_name: str
    area_hectares: float
    total_carbon_stored: float
    average_biodiversity_index: float
    time_series: List[TimeSeriesDataPoint]
