import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Trees, Award, Droplets, X, Calendar } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const MetricsChart = ({ analytics, loading, onClose, onMonthsChange, selectedMonths = 12 }) => {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-80 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading geospatial telemetry & impact analytics...</span>
      </div>
    );
  }

  if (!analytics) return null;

  const labels = analytics.time_series.map((pt) => pt.timestamp);
  const carbonData = analytics.time_series.map((pt) => pt.carbon_sequestration_tons);
  const bioData = analytics.time_series.map((pt) => pt.biodiversity_index);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Carbon Sequestration (t CO2e)',
        data: carbonData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        yAxisID: 'yCarbon',
        pointBackgroundColor: '#10b981',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Biodiversity Index (0-100)',
        data: bioData,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        borderWidth: 2,
        borderDash: [4, 4],
        fill: false,
        tension: 0.3,
        yAxisID: 'yBio',
        pointBackgroundColor: '#38bdf8',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Plus Jakarta Sans' },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 30, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      yCarbon: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Carbon (Tons)',
          color: '#10b981',
          font: { size: 10, weight: 600 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#10b981', font: { size: 10 } },
      },
      yBio: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Biodiversity Score',
          color: '#38bdf8',
          font: { size: 10, weight: 600 },
        },
        grid: { drawOnChartArea: false },
        ticks: { color: '#38bdf8', font: { size: 10 } },
      },
    },
  };

  const latestPoint = analytics.time_series[analytics.time_series.length - 1] || {};

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base text-white">{analytics.site_name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
              {analytics.area_hectares} ha
            </span>
          </div>
          <p className="text-xs text-slate-400">Environmental Telemetry & Time-Series Impact Modeling</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time range filters */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
            {[6, 12, 24].map((m) => (
              <button
                key={m}
                onClick={() => onMonthsChange && onMonthsChange(m)}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedMonths === m
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="glass-card rounded-xl p-3 border border-brand-500/20">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold mb-1">
            <Trees className="w-3.5 h-3.5" />
            <span>Carbon Captured</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {analytics.total_carbon_stored} <span className="text-xs font-normal text-slate-400">t CO2e</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 border border-sky-500/20">
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Biodiversity Index</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {analytics.average_biodiversity_index} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Vegetation (NDVI)</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {latestPoint.vegetation_index || 0.65}
          </div>
        </div>

        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-1">
            <Droplets className="w-3.5 h-3.5" />
            <span>Soil Organic Matter</span>
          </div>
          <div className="text-lg font-extrabold text-white">
            {latestPoint.soil_organic_matter || 3.4}%
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-56 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
