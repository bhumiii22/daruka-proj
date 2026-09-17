import React from 'react';
import { Globe, Layers, User, LogOut, PlusCircle, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = ({ onOpenAuth, onStartDraw, activeProject, onOpenSupabaseModal, isSupabaseConfigured }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="h-16 border-b border-white/10 glass-panel px-6 flex items-center justify-between z-20 relative select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/25 cursor-pointer">
          <Globe className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
              Darukaa.Earth
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 font-semibold tracking-wide uppercase">
              Geospatial Platform
            </span>
          </div>
          <p className="text-xs text-slate-400">PostGIS Polygon Analytics & Carbon Telemetry</p>
        </div>
      </div>

      {/* Center status badges */}
      <div className="hidden md:flex items-center space-x-3">
        {activeProject && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>Project:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">{activeProject.name}</span>
          </div>
        )}

        {/* Supabase Connection Button / Indicator */}
        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            isSupabaseConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
          }`}
          title="Configure Supabase Database"
        >
          <Database className="w-3.5 h-3.5 text-brand-400" />
          <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Supabase / PostGIS'}</span>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        <button
          id="btn-header-draw-boundary"
          onClick={onStartDraw}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Draw Boundary</span>
        </button>

        {isAuthenticated ? (
          <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-brand-900/90 border border-brand-500/40 flex items-center justify-center text-brand-300 text-xs font-bold shadow-sm">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">{user?.full_name || 'Administrator'}</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition active:scale-95"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
