const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Seed demo projects
const DEFAULT_PROJECTS = [
  {
    id: 'proj-001',
    name: 'Western Ghats Afforestation Initiative',
    description: 'High-density tropical forest ecosystem restoration.',
    created_at: new Date().toISOString(),
    site_count: 2,
  },
  {
    id: 'proj-002',
    name: 'Sundarbans Coastal Mangrove Belt',
    description: 'Blue carbon sequestration and coastal protection.',
    created_at: new Date().toISOString(),
    site_count: 1,
  },
];

// Seed demo sites
const DEFAULT_SITES = [
  {
    id: 'site-001',
    properties: {
      id: 'site-001',
      project_id: 'proj-001',
      name: 'Anamalai Canopy Corridor Sector A',
      description: 'Restoration corridor for native flora and elephant passage.',
      area_hectares: 24.8,
      created_at: new Date().toISOString(),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [76.882, 10.315],
          [76.915, 10.315],
          [76.925, 10.342],
          [76.879, 10.338],
          [76.882, 10.315],
        ],
      ],
    },
  },
  {
    id: 'site-002',
    properties: {
      id: 'site-002',
      project_id: 'proj-001',
      name: 'Silent Valley Buffer Zone',
      description: 'Secondary rainforest regeneration plot.',
      area_hectares: 18.2,
      created_at: new Date().toISOString(),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [76.435, 11.085],
          [76.475, 11.085],
          [76.468, 11.115],
          [76.425, 11.108],
          [76.435, 11.085],
        ],
      ],
    },
  },
  {
    id: 'site-003',
    properties: {
      id: 'site-003',
      project_id: 'proj-002',
      name: 'Sundarbans Delta Mangrove Plot B',
      description: 'Rhizophora mucronata replantation zone.',
      area_hectares: 32.5,
      created_at: new Date().toISOString(),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [88.75, 21.85],
          [88.82, 21.85],
          [88.81, 21.92],
          [88.74, 21.91],
          [88.75, 21.85],
        ],
      ],
    },
  },
];

class ApiService {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem('darukaa_projects')) {
      localStorage.setItem('darukaa_projects', JSON.stringify(DEFAULT_PROJECTS));
    }
    if (!localStorage.getItem('darukaa_sites')) {
      localStorage.setItem('darukaa_sites', JSON.stringify(DEFAULT_SITES));
    }
  }

  getLocalProjects() {
    try {
      return JSON.parse(localStorage.getItem('darukaa_projects')) || DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  }

  saveLocalProjects(projects) {
    localStorage.setItem('darukaa_projects', JSON.stringify(projects));
  }

  getLocalSites() {
    try {
      return JSON.parse(localStorage.getItem('darukaa_sites')) || DEFAULT_SITES;
    } catch {
      return DEFAULT_SITES;
    }
  }

  saveLocalSites(sites) {
    localStorage.setItem('darukaa_sites', JSON.stringify(sites));
  }

  getToken() {
    return localStorage.getItem('darukaa_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('darukaa_token', token);
    } else {
      localStorage.removeItem('darukaa_token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s quick timeout

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || `Request failed with status ${res.status}`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      // Pass along error to allow seamless local fallback
      throw err;
    }
  }

  // Authentication
  async register(email, password, full_name) {
    try {
      const data = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      });
      return data;
    } catch {
      // Local fallback auth
      const mockUser = {
        id: `user-${Date.now()}`,
        email,
        full_name: full_name || email.split('@')[0],
        is_active: true,
      };
      const token = `mock-jwt-token-${Date.now()}`;
      this.setToken(token);
      localStorage.setItem('darukaa_user', JSON.stringify(mockUser));
      return { access_token: token, user: mockUser };
    }
  }

  async login(email, password) {
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return data;
    } catch {
      // Local fallback login
      const mockUser = {
        id: `user-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        is_active: true,
      };
      const token = `mock-jwt-token-${Date.now()}`;
      this.setToken(token);
      localStorage.setItem('darukaa_user', JSON.stringify(mockUser));
      return { access_token: token, user: mockUser };
    }
  }

  async getProfile() {
    try {
      return await this.request('/auth/me');
    } catch {
      const stored = localStorage.getItem('darukaa_user');
      if (stored) return JSON.parse(stored);
      return {
        id: 'admin-001',
        email: 'admin@darukaa.earth',
        full_name: 'Lead Ecologist',
      };
    }
  }

  // Projects CRUD
  async getProjects() {
    try {
      const data = await this.request('/projects/');
      if (data && Array.isArray(data) && data.length > 0) {
        this.saveLocalProjects(data);
        return data;
      }
    } catch {
      // Fallback
    }
    const local = this.getLocalProjects();
    const sites = this.getLocalSites();
    return local.map((p) => ({
      ...p,
      site_count: sites.filter((s) => s.properties?.project_id === p.id).length,
    }));
  }

  async createProject(name, description, targetHectares) {
    try {
      const data = await this.request('/projects/', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      if (data) {
        const local = this.getLocalProjects();
        this.saveLocalProjects([data, ...local]);
        return data;
      }
    } catch {
      // Fallback
    }
    const newProject = {
      id: `proj-${Date.now()}`,
      name,
      description: description || '',
      target_hectares: targetHectares,
      created_at: new Date().toISOString(),
      site_count: 0,
    };
    const local = this.getLocalProjects();
    const updated = [newProject, ...local];
    this.saveLocalProjects(updated);
    return newProject;
  }

  async deleteProject(id) {
    try {
      await this.request(`/projects/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    const local = this.getLocalProjects().filter((p) => p.id !== id);
    this.saveLocalProjects(local);
    // Also delete project sites
    const sites = this.getLocalSites().filter((s) => s.properties?.project_id !== id);
    this.saveLocalSites(sites);
    return true;
  }

  // Sites (GeoJSON FeatureCollection & Features)
  async getSites(projectId = null) {
    try {
      const query = projectId ? `?project_id=${projectId}` : '';
      const data = await this.request(`/sites/${query}`);
      if (data && data.features && data.features.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }
    const allSites = this.getLocalSites();
    const filtered = projectId
      ? allSites.filter((s) => s.properties?.project_id === projectId)
      : allSites;
    return {
      type: 'FeatureCollection',
      features: filtered,
    };
  }

  async createSite(siteData) {
    try {
      const data = await this.request('/sites/', {
        method: 'POST',
        body: JSON.stringify(siteData),
      });
      if (data) {
        const allSites = this.getLocalSites();
        this.saveLocalSites([data, ...allSites]);
        return data;
      }
    } catch {
      // Fallback
    }

    const newSite = {
      type: 'Feature',
      id: `site-${Date.now()}`,
      properties: {
        id: `site-${Date.now()}`,
        project_id: siteData.project_id,
        name: siteData.name,
        description: siteData.description || '',
        area_hectares: siteData.area_hectares || 10.0,
        created_at: new Date().toISOString(),
      },
      geometry: siteData.geometry,
    };

    const allSites = this.getLocalSites();
    const updated = [newSite, ...allSites];
    this.saveLocalSites(updated);
    return newSite;
  }

  async deleteSite(id) {
    try {
      await this.request(`/sites/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    const allSites = this.getLocalSites().filter(
      (s) => (s.id || s.properties?.id) !== id
    );
    this.saveLocalSites(allSites);
    return true;
  }

  // Analytics
  async getSiteAnalytics(siteId, months = 12) {
    try {
      return await this.request(`/analytics/site/${siteId}?months=${months}`);
    } catch {
      // Local dynamic mock generator
      const allSites = this.getLocalSites();
      const site = allSites.find((s) => (s.id || s.properties?.id) === siteId);
      const area = site?.properties?.area_hectares || site?.area_hectares || 15.0;
      const name = site?.properties?.name || site?.name || 'Restoration Sector';

      const timeSeries = [];
      const now = new Date();
      const annualCarbon = 4.2 * area;

      for (let i = months; i >= 1; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 30);
        const factor = (months - i) / months;
        timeSeries.push({
          timestamp: d.toISOString().split('T')[0],
          carbon_sequestration_tons: Number((factor * annualCarbon + 2.5).toFixed(1)),
          biodiversity_index: Number((48 + factor * 30 + Math.sin(i * 0.8) * 4).toFixed(1)),
          vegetation_index: Number((0.42 + factor * 0.38).toFixed(2)),
          soil_organic_matter: Number((2.2 + factor * 2.4).toFixed(1)),
        });
      }

      return {
        site_id: siteId,
        site_name: name,
        area_hectares: area,
        total_carbon_stored: timeSeries[timeSeries.length - 1].carbon_sequestration_tons,
        average_biodiversity_index: 68.4,
        time_series: timeSeries,
      };
    }
  }
}

export const api = new ApiService();
