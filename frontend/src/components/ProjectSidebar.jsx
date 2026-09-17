import React, { useState, useEffect, useRef } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  ChevronDown,
  Layers,
  Search,
  MapPin,
  Trees,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';

export const ProjectSidebar = ({
  projects = [],
  selectedProject,
  onSelectProject,
  onOpenCreateProjectModal,
  onDeleteProject,
  sites = [],
  selectedSiteId,
  onSelectSite,
  onDeleteSite,
  onTriggerDraw,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSites = sites.filter((s) => {
    const name = s.properties?.name || s.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalHectares = sites.reduce(
    (acc, s) => acc + (s.properties?.area_hectares || s.area_hectares || 0),
    0
  );

  return (
    <aside className="w-80 h-full glass-panel border-r border-white/10 flex flex-col z-10 select-none">
      {/* Project Selector Header */}
      <div className="p-4 border-b border-white/10" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Project
          </span>
          <button
            id="btn-new-project"
            onClick={onOpenCreateProjectModal}
            className="text-xs flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/20 transition active:scale-95"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New Project</span>
          </button>
        </div>

        {/* Project Dropdown */}
        <div className="relative">
          <button
            id="btn-project-dropdown"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full glass-card hover:border-white/20 p-2.5 rounded-xl flex items-center justify-between text-left transition border border-white/10 shadow-sm"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <FolderKanban className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-white truncate">
                {selectedProject ? selectedProject.name : 'Select a Project'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1.5 glass-dropdown rounded-xl shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto border border-white/15">
              {projects.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No projects found. Click "+ New Project" above.
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition group ${
                      selectedProject?.id === proj.id
                        ? 'bg-brand-500/20 text-brand-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <button
                      className="flex-1 text-left truncate flex items-center space-x-2"
                      onClick={() => {
                        onSelectProject(proj);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="truncate">{proj.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({proj.site_count || 0} sites)
                      </span>
                    </button>

                    {/* Delete Project action */}
                    {projects.length > 1 && (
                      <button
                        title="Delete project"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${proj.name}" and all its sites?`)) {
                            onDeleteProject(proj.id);
                            setIsDropdownOpen(false);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Project KPI Stats */}
        {selectedProject && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <div className="text-[11px] text-slate-400">Total Sites</div>
              <div className="text-sm font-bold text-white">{sites.length}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <div className="text-[11px] text-slate-400">Managed Area</div>
              <div className="text-sm font-bold text-brand-400">
                {totalHectares.toFixed(2)} <span className="text-[10px]">ha</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sites Section */}
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>Sites in Project ({sites.length})</span>
          </div>
          <button
            id="btn-sidebar-draw-polygon"
            onClick={onTriggerDraw}
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1 font-semibold px-2 py-0.5 rounded hover:bg-brand-500/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Draw Site</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-earth-dark/70 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Sites List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredSites.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center space-y-2">
              <MapPin className="w-6 h-6 text-slate-500 animate-bounce" />
              <div className="text-xs font-semibold text-slate-300">No Sites In This Project</div>
              <p className="text-[11px] text-slate-400">
                Use the map tool to draw geographical boundaries.
              </p>
              <button
                onClick={onTriggerDraw}
                className="mt-2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition"
              >
                + Draw Polygon Boundary
              </button>
            </div>
          ) : (
            filteredSites.map((site) => {
              const siteId = site.id || site.properties?.id;
              const name = site.properties?.name || site.name || 'Unnamed Site';
              const area = site.properties?.area_hectares || site.area_hectares || 0;
              const isSelected = selectedSiteId === siteId;

              return (
                <div
                  key={siteId}
                  onClick={() => onSelectSite(siteId)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-brand-500/20 border-brand-500 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/40'
                      : 'glass-card hover:bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-brand-500 text-white shadow-sm' : 'bg-white/5 text-slate-400'}`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                          {name}
                        </div>
                        <div className="text-[10px] text-brand-400 font-medium">
                          {Number(area).toFixed(2)} hectares
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete site "${name}"?`)) {
                          onDeleteSite(siteId);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 transition rounded hover:bg-white/5"
                      title="Delete Site"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
