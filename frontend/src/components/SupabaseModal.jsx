import React, { useState } from 'react';
import { Database, X, Check, ExternalLink, ShieldCheck, Copy } from 'lucide-react';

export const SupabaseModal = ({ isOpen, onClose, connectionStatus, onSaveConfig }) => {
  const [dbUrl, setDbUrl] = useState(
    localStorage.getItem('darukaa_supabase_url') || ''
  );
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('darukaa_supabase_url', dbUrl);
    if (onSaveConfig) onSaveConfig(dbUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    area_hectares DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sites_geometry ON sites USING GIST (geometry);`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Supabase & PostGIS Configuration</h3>
              <p className="text-[11px] text-slate-400">Attach your PostgreSQL database with spatial extensions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Status Badge */}
          <div className="glass-card rounded-xl p-3 border border-brand-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Current Status:</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 font-semibold uppercase text-[10px]">
              {connectionStatus || 'Local Interactive Mode (Zero Config)'}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Supabase Connection String / DATABASE_URL
              </label>
              <input
                type="text"
                placeholder="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                className="w-full bg-earth-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Found in your Supabase Dashboard &gt; Project Settings &gt; Database &gt; Connection string (URI).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition flex items-center space-x-1.5"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{saved ? 'Saved!' : 'Save Connection'}</span>
              </button>
            </div>
          </form>

          {/* Quick SQL Schema Copy Helper */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Quick PostGIS SQL Schema</span>
              <button
                onClick={handleCopySql}
                className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Paste this in the Supabase <strong>SQL Editor</strong> tab to create the tables and PostGIS polygon columns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
