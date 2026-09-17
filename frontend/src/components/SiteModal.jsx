import React, { useState } from 'react';
import { MapPin, X, Check, Globe } from 'lucide-react';

export const SiteModal = ({
  isOpen,
  onClose,
  drawnFeature,
  calculatedArea,
  projects = [],
  activeProjectId,
  onSubmit,
}) => {
  const [siteName, setSiteName] = useState('');
  const [siteDesc, setSiteDesc] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !drawnFeature) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteName.trim()) {
      setError('Please provide a site name.');
      return;
    }
    if (!selectedProjectId) {
      setError('Please select or create a project first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build GeoJSON payload
      const sitePayload = {
        name: siteName.trim(),
        description: siteDesc.trim() || null,
        project_id: selectedProjectId,
        geometry: drawnFeature.geometry,
        area_hectares: calculatedArea,
      };

      await onSubmit(sitePayload);
      setSiteName('');
      setSiteDesc('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save site.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Save Site Boundary</h3>
              <p className="text-[11px] text-slate-400">PostGIS Polygon GeoJSON Ingestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Area highlight card */}
          <div className="glass-card rounded-xl p-3 flex items-center justify-between border border-brand-500/30 bg-brand-500/5">
            <div className="text-xs text-slate-300 font-medium">Calculated Geodetic Area:</div>
            <div className="text-sm font-extrabold text-brand-400">
              {calculatedArea} <span className="text-xs font-normal text-slate-400">hectares</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-earth-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Site Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Western Ghats Restoration Plot Alpha"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full bg-earth-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description / Ecosystem Details
            </label>
            <textarea
              placeholder="Afforestation status, species composition, canopy cover..."
              value={siteDesc}
              onChange={(e) => setSiteDesc(e.target.value)}
              rows={3}
              className="w-full bg-earth-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <span>Ingesting...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Site to Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
