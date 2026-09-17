import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProjectSidebar } from './components/ProjectSidebar';
import { MapboxViewer } from './components/MapboxViewer';
import { MetricsChart } from './components/MetricsChart';
import { SiteModal } from './components/SiteModal';
import { ProjectModal } from './components/ProjectModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const { isAuthenticated } = useAuth();

  // State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(12);

  // Modals & Draw state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnFeature, setDrawnFeature] = useState(null);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
      }
    };
    loadProjects();
  }, []);

  // Load Sites whenever selectedProject changes
  useEffect(() => {
    const loadSites = async () => {
      if (!selectedProject) {
        setSites([]);
        setSelectedSiteId(null);
        setAnalytics(null);
        return;
      }
      const data = await api.getSites(selectedProject.id);
      const projectSites = data?.features || [];
      setSites(projectSites);
      if (projectSites.length > 0) {
        setSelectedSiteId(projectSites[0].id || projectSites[0].properties?.id);
      } else {
        setSelectedSiteId(null);
        setAnalytics(null);
      }
    };
    loadSites();
  }, [selectedProject?.id]);

  // Load Analytics whenever selectedSiteId or selectedMonths changes
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedSiteId) {
        setAnalytics(null);
        return;
      }

      setAnalyticsLoading(true);
      try {
        const data = await api.getSiteAnalytics(selectedSiteId, selectedMonths);
        setAnalytics(data);
      } catch (err) {
        console.warn('Analytics fetch error:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    loadAnalytics();
  }, [selectedSiteId, selectedMonths]);

  // Create Project handler
  const handleCreateProject = async (name, description, targetHectares) => {
    const newProj = await api.createProject(name, description, targetHectares);
    setProjects((prev) => [newProj, ...prev]);
    setSelectedProject(newProj);
    showToast(`Project "${newProj.name}" created successfully!`);
  };

  // Delete Project handler
  const handleDeleteProject = async (projectId) => {
    await api.deleteProject(projectId);
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (selectedProject?.id === projectId) {
      setSelectedProject(remaining.length > 0 ? remaining[0] : null);
    }
    showToast('Project deleted', 'info');
  };

  // Trigger Polygon Draw
  const handleTriggerDraw = () => {
    setIsDrawingMode(true);
    showToast('Click points on the map to define boundary. Double-click to complete.', 'info');
  };

  // Handle polygon creation from Mapbox Draw
  const handlePolygonDrawn = useCallback((feature, areaHectares) => {
    setDrawnFeature(feature);
    setCalculatedArea(areaHectares);
    setIsSiteModalOpen(true);
  }, []);

  // Submit new site to backend / local storage
  const handleCreateSiteSubmit = async (sitePayload) => {
    const newSite = await api.createSite(sitePayload);
    setSites((prev) => [newSite, ...prev]);
    setSelectedSiteId(newSite.id || newSite.properties?.id);

    // Update project site count in local state
    setProjects((prev) =>
      prev.map((p) =>
        p.id === sitePayload.project_id ? { ...p, site_count: (p.site_count || 0) + 1 } : p
      )
    );

    showToast(`Site "${sitePayload.name}" saved with ${sitePayload.area_hectares} hectares!`);
  };

  // Delete Site handler
  const handleDeleteSite = async (siteId) => {
    await api.deleteSite(siteId);
    setSites((prev) => prev.filter((s) => (s.id || s.properties?.id) !== siteId));

    if (selectedSiteId === siteId) {
      setSelectedSiteId(null);
      setAnalytics(null);
    }

    // Update project site count
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject?.id ? { ...p, site_count: Math.max(0, (p.site_count || 1) - 1) } : p
      )
    );

    showToast('Site removed from project', 'info');
  };

  const isSupabaseConfigured = !!localStorage.getItem('darukaa_supabase_url');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-earth-dark text-slate-100 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2.5 px-4 py-2.5 rounded-xl glass-dropdown border border-brand-500/40 shadow-2xl animate-fadeIn text-xs text-white">
          {toast.type === 'info' ? (
            <AlertCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeProject={selectedProject}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onStartDraw={handleTriggerDraw}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConfigured={isSupabaseConfigured}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <ProjectSidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onOpenCreateProjectModal={() => setIsProjectModalOpen(true)}
          onDeleteProject={handleDeleteProject}
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSelectSite={setSelectedSiteId}
          onDeleteSite={handleDeleteSite}
          onTriggerDraw={handleTriggerDraw}
        />

        {/* Central Map Workspace */}
        <main className="flex-1 relative h-full">
          <MapboxViewer
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            onPolygonDrawn={handlePolygonDrawn}
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}
          />

          {/* Bottom Floating Analytics Overlay */}
          {analytics && (
            <div className="absolute bottom-6 left-6 right-6 max-w-4xl mx-auto z-20 transition-all duration-300">
              <MetricsChart
                analytics={analytics}
                loading={analyticsLoading}
                selectedMonths={selectedMonths}
                onMonthsChange={setSelectedMonths}
                onClose={() => setAnalytics(null)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <SiteModal
        isOpen={isSiteModalOpen}
        onClose={() => {
          setIsSiteModalOpen(false);
          setDrawnFeature(null);
        }}
        drawnFeature={drawnFeature}
        calculatedArea={calculatedArea}
        projects={projects}
        activeProjectId={selectedProject?.id}
        onSubmit={handleCreateSiteSubmit}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        connectionStatus={isSupabaseConfigured ? 'Supabase Connected' : 'Local PostGIS Emulation Active'}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;
