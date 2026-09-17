# Darukaa.Earth — Geospatial Data Analytics Platform

[![CI Pipeline](https://github.com/bhumiii22/daruka-proj/actions/workflows/ci.yml/badge.svg)](https://github.com/bhumiii22/daruka-proj/actions/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![PostGIS](https://img.shields.io/badge/PostGIS-PostgreSQL-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![Mapbox](https://img.shields.io/badge/Mapbox-GL%20JS%20v3-000000.svg?logo=mapbox&logoColor=white)](https://www.mapbox.com)

**Darukaa.Earth** is an enterprise-grade geospatial analytics platform built to monitor, analyze, and verify environmental impact, carbon sequestration volumes, and ecosystem biodiversity indexes.

---

## 📁 Project Structure

```text
daruka-proj/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
├── .husky/
│   └── pre-commit             # Git hook triggering lint-staged
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # Auth, Projects, Sites (GeoJSON), Analytics
│   │   ├── core/              # Config, Security (JWT/bcrypt), Database
│   │   ├── models/            # SQLAlchemy + GeoAlchemy2 PostGIS models
│   │   ├── schemas/           # Pydantic v2 GeoJSON Feature validation
│   │   └── main.py            # FastAPI entry point
│   ├── migrations/
│   │   └── schema.sql         # PostgreSQL + PostGIS SQL DDL & triggers
│   ├── tests/                 # Pytest test suite
│   ├── requirements.txt       # Backend dependencies
│   ├── pyproject.toml         # Black & Pytest configurations
│   ├── .flake8                # Flake8 linter configuration
│   └── Dockerfile             # Container definition
├── frontend/
│   ├── src/
│   │   ├── components/        # MapboxViewer, MetricsChart, Sidebar, Modals
│   │   ├── context/           # AuthContext (JWT state management)
│   │   ├── services/          # API Client with token injection
│   │   ├── App.jsx            # Dashboard orchestrator
│   │   └── index.css          # Glassmorphic Tailwind styles & Mapbox overrides
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite bundler configuration
│   └── tailwind.config.js     # Geospatial dark-mode palette
├── .lintstagedrc.json         # Pre-commit configuration
├── package.json               # Root workspace scripts & Husky
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Database Setup (Supabase / PostgreSQL + PostGIS)
1. In your Supabase dashboard or local PostgreSQL instance, run the migration script:
   ```bash
   psql -h <host> -U <user> -d <database> -f backend/migrations/schema.sql
   ```
2. This creates:
   - `postgis` and `uuid-ossp` extensions.
   - `users`, `projects`, `sites`, and `metrics` tables.
   - `fn_calculate_site_area` trigger to calculate geodesic hectares automatically via `ST_Area(geometry::geography) / 10000.0`.
   - Spatial GIST indexes for sub-millisecond bounding box and intersection lookups.

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc UI: `http://localhost:8000/redoc`

### 3. Frontend (React + Vite + Mapbox)
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173`
- *Optional*: Set your Mapbox Public Token in `frontend/.env`:
  ```env
  VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
  VITE_API_URL=http://localhost:8000/api/v1
  ```

---

## 🗺️ Key Features

### 1. PostGIS GeoJSON Ingestion & Retrieval
- **Ingestion**: Accepts complete GeoJSON Features or standard payloads. The polygon is validated via Shapely and converted into native PostGIS binary WKB geometry.
- **Output**: Returns standard GeoJSON `Feature` and `FeatureCollection` formats directly consumable by Mapbox GL JS, QGIS, or Leaflet.

### 2. Interactive Mapbox Drawing & Real-Time Hectares
- Draw site boundaries on satellite/terrain/dark basemaps using `@mapbox/mapbox-gl-draw`.
- Auto-calculates geodesic surface area in hectares in real-time.
- Saves site boundaries directly to the PostGIS backend.

### 3. Environmental Impact & Time-Series Analytics
- Historical carbon sequestration curves (measured in tons CO2e accumulated).
- Biodiversity Index tracking (0-100 scale).
- Dual-axis interactive charts powered by Chart.js.

### 4. DevOps & Code Quality
- **Husky + lint-staged**: Enforces code formatting (Prettier, Black) and linting (ESLint, Flake8) on every git commit.
- **GitHub Actions (`ci.yml`)**: Parallel pipeline validating backend unit tests, formatting, and frontend production builds.
