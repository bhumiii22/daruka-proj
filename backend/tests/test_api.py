import pytest
from app.api.v1.endpoints.analytics import generate_synthetic_site_metrics
from uuid import uuid4


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_analytics_time_series_generator():
    site_id = uuid4()
    area = 15.5  # 15.5 hectares
    months = 12

    series = generate_synthetic_site_metrics(site_id=site_id, area_hectares=area, months=months)
    assert len(series) == 12
    # Check that points have proper fields and positive values
    for point in series:
        assert point.carbon_sequestration_tons >= 0
        assert 0 <= point.biodiversity_index <= 100
        assert 0 <= point.vegetation_index <= 1
        assert point.soil_organic_matter >= 0
    # Carbon sequestration should trend upwards over time
    assert series[-1].carbon_sequestration_tons >= series[0].carbon_sequestration_tons
