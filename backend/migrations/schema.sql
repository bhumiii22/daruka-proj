-- Darukaa.Earth Database Schema (PostgreSQL + PostGIS)
-- Designed for Supabase / PostgreSQL with PostGIS extension

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects (created_by);

-- 4. Sites Table (with PostGIS Geometry)
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    -- Geometry Polygon in WGS84 (SRID 4326)
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    -- Area in hectares (calculated automatically from geometry)
    area_hectares DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Spatial GIST Index for high-performance spatial queries (intersects, contains, bounding box)
CREATE INDEX IF NOT EXISTS idx_sites_geometry ON sites USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON sites (project_id);

-- Trigger Function: Auto-calculate area in hectares if not explicitly provided or on geometry update
CREATE OR REPLACE FUNCTION fn_calculate_site_area()
RETURNS TRIGGER AS $$
BEGIN
    -- ST_Area on geography computes square meters on Earth's ellipsoid (WGS 84)
    -- 1 hectare = 10,000 square meters
    IF NEW.geometry IS NOT NULL THEN
        NEW.area_hectares := ROUND((ST_Area(NEW.geometry::geography) / 10000.0)::numeric, 4);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sites_calculate_area ON sites;
CREATE TRIGGER trg_sites_calculate_area
    BEFORE INSERT OR UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION fn_calculate_site_area();

-- 5. Metrics Table (Time-series data for environmental impact)
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    carbon_sequestration_tons DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    biodiversity_index DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- Normalized score e.g. 0.0 to 100.0
    vegetation_index DOUBLE PRECISION DEFAULT 0.0,           -- NDVI or equivalent
    soil_organic_matter DOUBLE PRECISION DEFAULT 0.0,         -- Percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Composite Index for rapid time-series range queries per site
CREATE INDEX IF NOT EXISTS idx_metrics_site_timestamp ON metrics (site_id, timestamp DESC);

-- View: Site Summary with latest metric snapshot
CREATE OR REPLACE VIEW view_site_summary AS
SELECT 
    s.id AS site_id,
    s.project_id,
    s.name AS site_name,
    s.area_hectares,
    ST_AsGeoJSON(s.geometry)::json AS geojson,
    p.name AS project_name,
    m.carbon_sequestration_tons AS latest_carbon_tons,
    m.biodiversity_index AS latest_biodiversity_index,
    m.timestamp AS latest_metric_timestamp
FROM sites s
JOIN projects p ON s.project_id = p.id
LEFT JOIN LATERAL (
    SELECT carbon_sequestration_tons, biodiversity_index, timestamp
    FROM metrics
    WHERE site_id = s.id
    ORDER BY timestamp DESC
    LIMIT 1
) m ON TRUE;
