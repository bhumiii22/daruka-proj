import json
from typing import Optional, List, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape, mapping, Polygon
from pyproj import Geod

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.schemas.site import (
    SiteCreate,
    SiteFeatureCreate,
    SiteUpdate,
    SiteGeoJSONFeature,
    SiteFeatureCollection,
    SiteProperties,
    GeoJSONPolygonGeometry,
)

router = APIRouter()

# WGS84 geodesic calculator for exact hectare measurements
geod = Geod(ellps="WGS84")


def calculate_polygon_hectares(geojson_geom: dict) -> float:
    """Calculate geodesic area in hectares for a GeoJSON polygon."""
    try:
        poly = shape(geojson_geom)
        if isinstance(poly, Polygon):
            area_m2, _ = geod.geometry_area_perimeter(poly)
            return round(abs(area_m2) / 10000.0, 4)
    except Exception:
        pass
    return 0.0


def site_to_geojson_feature(site: Site, db: Session) -> SiteGeoJSONFeature:
    """Convert an ORM Site instance to a valid GeoJSON Feature."""
    # Read geometry as GeoJSON via PostGIS function or shapely
    geom_json_str = db.query(func.ST_AsGeoJSON(site.geometry)).scalar()
    if geom_json_str:
        geom_dict = json.loads(geom_json_str)
    else:
        # Fallback to shapely if not using PostGIS function directly
        geom_shape = to_shape(site.geometry)
        geom_dict = mapping(geom_shape)

    return SiteGeoJSONFeature(
        type="Feature",
        id=site.id,
        geometry=GeoJSONPolygonGeometry(**geom_dict),
        properties=SiteProperties(
            id=site.id,
            project_id=site.project_id,
            name=site.name,
            description=site.description,
            area_hectares=site.area_hectares,
            created_at=site.created_at,
            updated_at=site.updated_at,
        ),
    )


@router.get("/", response_model=SiteFeatureCollection)
def list_sites(
    project_id: Optional[UUID] = Query(None, description="Filter sites by project ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List sites as a GeoJSON FeatureCollection.
    Only sites belonging to projects owned by the authenticated user are returned.
    """
    query = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(Project.created_by == current_user.id)
    )

    if project_id:
        query = query.filter(Site.project_id == project_id)

    sites = query.order_by(Site.created_at.desc()).all()

    features = [site_to_geojson_feature(s, db) for s in sites]
    return SiteFeatureCollection(type="FeatureCollection", features=features)


@router.post("/", response_model=SiteGeoJSONFeature, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: Union[SiteCreate, SiteFeatureCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new site. Ingests either a standard payload or a full GeoJSON Feature.
    """
    # Normalize input whether received as GeoJSON Feature or SiteCreate
    if hasattr(site_in, "properties") and site_in.type == "Feature":
        props = site_in.properties
        project_id = props.get("project_id")
        name = props.get("name", "Untitled Site")
        description = props.get("description")
        geometry_dict = site_in.geometry.model_dump()
        area = props.get("area_hectares")
    else:
        project_id = site_in.project_id
        name = site_in.name
        description = site_in.description
        geometry_dict = site_in.geometry.model_dump()
        area = site_in.area_hectares

    # Verify project exists and belongs to current user
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.created_by == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified project not found or access denied",
        )

    # Convert GeoJSON to Shapely and then GeoAlchemy2 element
    try:
        poly_shape = shape(geometry_dict)
        if not isinstance(poly_shape, Polygon):
            raise ValueError("Geometry must be a valid Polygon")
        spatial_element = from_shape(poly_shape, srid=4326)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid polygon geometry: {str(e)}",
        )

    # Compute area if not supplied
    if area is None or area <= 0:
        area = calculate_polygon_hectares(geometry_dict)

    site = Site(
        project_id=project_id,
        name=name,
        description=description,
        geometry=spatial_element,
        area_hectares=area,
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    return site_to_geojson_feature(site, db)


@router.get("/{site_id}", response_model=SiteGeoJSONFeature)
def get_site(
    site_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single site by ID as a GeoJSON Feature."""
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

    return site_to_geojson_feature(site, db)


@router.put("/{site_id}", response_model=SiteGeoJSONFeature)
def update_site(
    site_id: UUID,
    site_in: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a site's attributes or geometry."""
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

    if site_in.name is not None:
        site.name = site_in.name
    if site_in.description is not None:
        site.description = site_in.description
    if site_in.geometry is not None:
        geom_dict = site_in.geometry.model_dump()
        poly_shape = shape(geom_dict)
        site.geometry = from_shape(poly_shape, srid=4326)
        site.area_hectares = calculate_polygon_hectares(geom_dict)
    elif site_in.area_hectares is not None:
        site.area_hectares = site_in.area_hectares

    db.commit()
    db.refresh(site)

    return site_to_geojson_feature(site, db)


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a site."""
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

    db.delete(site)
    db.commit()
    return None
