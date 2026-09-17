import math
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.metric import Metric
from app.schemas.metric import (
    SiteAnalyticsResponse,
    TimeSeriesDataPoint,
    MetricCreate,
    MetricResponse,
)

router = APIRouter()


def generate_synthetic_site_metrics(
    site_id: UUID, area_hectares: float, months: int = 12
) -> List[TimeSeriesDataPoint]:
    """
    Generate realistic environmental impact time-series modeling for a site.
    Carbon sequestration scales with area (average ~3-8 tons CO2e/hectare/year).
    Biodiversity increases over time reflecting restoration progress.
    """
    data_points: List[TimeSeriesDataPoint] = []
    base_area = max(area_hectares, 0.5)

    now = datetime.now(timezone.utc)

    # Base rates
    annual_carbon_rate = 4.2 * base_area  # tons per year
    base_bio = 45.0  # baseline biodiversity score

    for i in range(months, 0, -1):
        dt = now - timedelta(days=i * 30)
        progress_factor = (months - i) / max(months, 1)

        # Carbon accumulation curve (seasonal sin wave + monotonic growth)
        seasonal_variation = math.sin(i * 0.5) * 0.15
        monthly_rate = (annual_carbon_rate / 12.0) * (1.0 + seasonal_variation)
        accumulated_carbon = round(
            (progress_factor * annual_carbon_rate) + (monthly_rate * 2), 2
        )

        # Biodiversity index (0-100) with natural variation
        bio_score = round(
            min(100.0, base_bio + (progress_factor * 32.0) + (math.cos(i) * 3.5)), 1
        )

        # Normalized Vegetation Index (NDVI) between 0.35 and 0.88
        ndvi = round(0.40 + (progress_factor * 0.42) + (math.sin(i * 0.7) * 0.05), 3)

        # Soil organic matter percentage between 2.0% and 5.5%
        soil_matter = round(2.1 + (progress_factor * 2.8), 2)

        data_points.append(
            TimeSeriesDataPoint(
                timestamp=dt.strftime("%Y-%m-%d"),
                carbon_sequestration_tons=max(0.0, accumulated_carbon),
                biodiversity_index=max(0.0, bio_score),
                vegetation_index=max(0.0, ndvi),
                soil_organic_matter=max(0.0, soil_matter),
            )
        )

    return data_points


@router.get("/site/{site_id}", response_model=SiteAnalyticsResponse)
def get_site_analytics(
    site_id: UUID,
    months: int = Query(12, ge=1, le=60, description="Months of historical data to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve historical time-series analytics for carbon sequestration and biodiversity for a site.
    If database records exist, returns actual metrics; otherwise returns simulated historical models.
    """
    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(Site.id == site_id, Project.created_by == current_user.id)
        .first()
    )
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    # Check for recorded metrics in DB
    since_date = datetime.now(timezone.utc) - timedelta(days=months * 30)
    db_metrics = (
        db.query(Metric)
        .filter(Metric.site_id == site_id, Metric.timestamp >= since_date)
        .order_by(Metric.timestamp.asc())
        .all()
    )

    if db_metrics and len(db_metrics) >= 3:
        time_series = [
            TimeSeriesDataPoint(
                timestamp=m.timestamp.strftime("%Y-%m-%d"),
                carbon_sequestration_tons=m.carbon_sequestration_tons,
                biodiversity_index=m.biodiversity_index,
                vegetation_index=m.vegetation_index or 0.0,
                soil_organic_matter=m.soil_organic_matter or 0.0,
            )
            for m in db_metrics
        ]
        total_carbon = time_series[-1].carbon_sequestration_tons
        avg_biodiversity = sum(p.biodiversity_index for p in time_series) / len(time_series)
    else:
        # Generate model-based time-series data
        time_series = generate_synthetic_site_metrics(
            site_id=site.id,
            area_hectares=site.area_hectares,
            months=months,
        )
        total_carbon = time_series[-1].carbon_sequestration_tons if time_series else 0.0
        avg_biodiversity = (
            sum(p.biodiversity_index for p in time_series) / len(time_series)
            if time_series
            else 0.0
        )

    return SiteAnalyticsResponse(
        site_id=site.id,
        site_name=site.name,
        area_hectares=site.area_hectares,
        total_carbon_stored=round(total_carbon, 2),
        average_biodiversity_index=round(avg_biodiversity, 1),
        time_series=time_series,
    )


@router.post("/site/{site_id}/metrics", response_model=MetricResponse, status_code=status.HTTP_201_CREATED)
def record_site_metric(
    site_id: UUID,
    metric_in: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a new environmental metric reading for a site."""
    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(Site.id == site_id, Project.created_by == current_user.id)
        .first()
    )
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    metric = Metric(
        site_id=site.id,
        timestamp=metric_in.timestamp or datetime.now(timezone.utc),
        carbon_sequestration_tons=metric_in.carbon_sequestration_tons,
        biodiversity_index=metric_in.biodiversity_index,
        vegetation_index=metric_in.vegetation_index,
        soil_organic_matter=metric_in.soil_organic_matter,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric
