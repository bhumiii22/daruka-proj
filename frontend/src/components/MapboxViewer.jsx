import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import turfArea from '@turf/area';
import { Layers, Sparkles, MapPin, Pentagon, MousePointerClick, X } from 'lucide-react';

// Free tile providers - no API key needed
const MAP_STYLES = [
  {
    id: 'dark',
    name: 'Dark Carto',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  {
    id: 'positron',
    name: 'Light',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  {
    id: 'voyager',
    name: 'Voyager',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
];

export const MapboxViewer = ({
  sites = [],
  selectedSiteId,
  onSelectSite,
  onPolygonDrawn,
  isDrawingMode,
  setIsDrawingMode,
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentStyleIdx, setCurrentStyleIdx] = useState(0);

  // Drawing state
  const drawingVerticesRef = useRef([]);
  const [vertexCount, setVertexCount] = useState(0);
  const drawSourceAdded = useRef(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[0].url,
      center: [78.9629, 20.5937],
      zoom: 4.5,
      pitch: 20,
      antialias: true,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );
    map.addControl(
      new maplibregl.ScaleControl({ unit: 'metric' }),
      'bottom-left'
    );

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      addDrawingSources(map);
    });

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add drawing-related sources and layers once
  const addDrawingSources = (map) => {
    if (drawSourceAdded.current) return;

    // Source for drawing vertices
    map.addSource('draw-vertices', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Source for drawing line/polygon preview
    map.addSource('draw-polygon', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Polygon fill preview
    map.addLayer({
      id: 'draw-polygon-fill',
      type: 'fill',
      source: 'draw-polygon',
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': '#34d399',
        'fill-opacity': 0.25,
      },
    });

    // Polygon outline preview
    map.addLayer({
      id: 'draw-polygon-outline',
      type: 'line',
      source: 'draw-polygon',
      paint: {
        'line-color': '#10b981',
        'line-width': 2.5,
        'line-dasharray': [2, 2],
      },
    });

    // Line preview (connecting vertices)
    map.addLayer({
      id: 'draw-line',
      type: 'line',
      source: 'draw-polygon',
      filter: ['==', '$type', 'LineString'],
      paint: {
        'line-color': '#10b981',
        'line-width': 2,
        'line-dasharray': [3, 3],
      },
    });

    // Vertex circles
    map.addLayer({
      id: 'draw-vertices-layer',
      type: 'circle',
      source: 'draw-vertices',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ffffff',
        'circle-stroke-color': '#059669',
        'circle-stroke-width': 2.5,
      },
    });

    drawSourceAdded.current = true;
  };

  // Update drawing preview on map when vertices change
  const updateDrawPreview = useCallback(() => {
    const map = mapRef.current;
    if (!map || !drawSourceAdded.current) return;

    const verts = drawingVerticesRef.current;

    // Update vertex points
    const vertexFeatures = verts.map((coord, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coord },
      properties: { index: i },
    }));
    map.getSource('draw-vertices')?.setData({
      type: 'FeatureCollection',
      features: vertexFeatures,
    });

    // Update line/polygon preview
    if (verts.length >= 3) {
      // Show polygon
      const closed = [...verts, verts[0]];
      map.getSource('draw-polygon')?.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [closed] },
            properties: {},
          },
        ],
      });
    } else if (verts.length >= 2) {
      // Show line
      map.getSource('draw-polygon')?.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: verts },
            properties: {},
          },
        ],
      });
    } else {
      map.getSource('draw-polygon')?.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, []);

  // Clear all drawing data
  const clearDrawing = useCallback(() => {
    drawingVerticesRef.current = [];
    setVertexCount(0);
    const map = mapRef.current;
    if (map && drawSourceAdded.current) {
      map.getSource('draw-vertices')?.setData({
        type: 'FeatureCollection',
        features: [],
      });
      map.getSource('draw-polygon')?.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, []);

  // Complete the polygon and send it
  const completePolygon = useCallback(() => {
    const verts = drawingVerticesRef.current;
    if (verts.length < 3) return;

    const closed = [...verts, verts[0]];
    const feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closed] },
      properties: {},
    };

    let areaHa = 0;
    try {
      const areaM2 = turfArea(feature);
      areaHa = Number((areaM2 / 10000).toFixed(4));
    } catch {
      areaHa = 0;
    }

    if (onPolygonDrawn) {
      onPolygonDrawn(feature, areaHa);
    }

    clearDrawing();
    setIsDrawingMode(false);
  }, [onPolygonDrawn, clearDrawing, setIsDrawingMode]);

  // Handle map clicks for drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (!isDrawingMode) return;

      const coord = [e.lngLat.lng, e.lngLat.lat];
      drawingVerticesRef.current.push(coord);
      setVertexCount(drawingVerticesRef.current.length);
      updateDrawPreview();
    };

    const handleDblClick = (e) => {
      if (!isDrawingMode) return;
      e.preventDefault();
      completePolygon();
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
    };
  }, [isDrawingMode, updateDrawPreview, completePolygon]);

  // Change cursor in drawing mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isDrawingMode) {
      map.getCanvas().style.cursor = 'crosshair';
      // Disable double-click zoom during drawing
      map.doubleClickZoom.disable();
    } else {
      map.getCanvas().style.cursor = '';
      map.doubleClickZoom.enable();
      clearDrawing();
    }
  }, [isDrawingMode, clearDrawing]);

  // Render site polygons on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = 'darukaa-sites-source';
    const fillLayerId = 'darukaa-sites-fill';
    const outlineLayerId = 'darukaa-sites-outline';
    const labelLayerId = 'darukaa-sites-label';

    const geojsonData = {
      type: 'FeatureCollection',
      features: sites.map((s) => ({
        type: 'Feature',
        properties: {
          id: String(s.id || s.properties?.id || ''),
          name: s.properties?.name || s.name || 'Site',
          area_hectares: s.properties?.area_hectares || s.area_hectares || 0,
        },
        geometry: s.geometry,
      })),
    };

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      // Polygon fill
      map.addLayer(
        {
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'id'], selectedSiteId ? String(selectedSiteId) : ''],
              '#10b981',
              '#065f46',
            ],
            'fill-opacity': [
              'case',
              ['==', ['get', 'id'], selectedSiteId ? String(selectedSiteId) : ''],
              0.55,
              0.3,
            ],
          },
        },
        // Insert before drawing layers
        drawSourceAdded.current ? 'draw-polygon-fill' : undefined
      );

      // Polygon outline
      map.addLayer(
        {
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'id'], selectedSiteId ? String(selectedSiteId) : ''],
              '#34d399',
              '#10b981',
            ],
            'line-width': [
              'case',
              ['==', ['get', 'id'], selectedSiteId ? String(selectedSiteId) : ''],
              3.5,
              1.8,
            ],
          },
        },
        drawSourceAdded.current ? 'draw-polygon-fill' : undefined
      );

      // Site name labels
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#f1f5f9',
          'text-halo-color': '#0a0f12',
          'text-halo-width': 1.5,
        },
      });

      // Click handler
      map.on('click', fillLayerId, (e) => {
        if (isDrawingMode) return;
        if (e.features && e.features[0]) {
          const clickedId = e.features[0].properties.id;
          if (onSelectSite) onSelectSite(clickedId);
        }
      });

      map.on('mouseenter', fillLayerId, () => {
        if (!isDrawingMode) {
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', fillLayerId, () => {
        if (!isDrawingMode) {
          map.getCanvas().style.cursor = '';
        }
      });
    }

    // Update paint based on current selection
    if (map.getLayer(fillLayerId)) {
      const sid = selectedSiteId ? String(selectedSiteId) : '';
      map.setPaintProperty(fillLayerId, 'fill-color', [
        'case',
        ['==', ['get', 'id'], sid],
        '#10b981',
        '#065f46',
      ]);
      map.setPaintProperty(fillLayerId, 'fill-opacity', [
        'case',
        ['==', ['get', 'id'], sid],
        0.55,
        0.3,
      ]);
      map.setPaintProperty(outlineLayerId, 'line-color', [
        'case',
        ['==', ['get', 'id'], sid],
        '#34d399',
        '#10b981',
      ]);
      map.setPaintProperty(outlineLayerId, 'line-width', [
        'case',
        ['==', ['get', 'id'], sid],
        3.5,
        1.8,
      ]);
    }

    // Fit bounds to sites
    if (sites.length > 0) {
      try {
        const bounds = new maplibregl.LngLatBounds();
        let hasCoords = false;
        sites.forEach((site) => {
          const coords = site.geometry?.coordinates?.[0];
          if (coords) {
            coords.forEach((coord) => {
              bounds.extend(coord);
              hasCoords = true;
            });
          }
        });
        if (hasCoords && !bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 80,
            maxZoom: 14,
            duration: 1500,
          });
        }
      } catch (err) {
        console.warn('Bounds fitting error:', err);
      }
    }
  }, [sites, selectedSiteId, mapLoaded, isDrawingMode, onSelectSite]);

  // Change style
  const changeMapStyle = (idx) => {
    setCurrentStyleIdx(idx);
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(MAP_STYLES[idx].url);

    // Re-add sources/layers after style change
    map.once('styledata', () => {
      drawSourceAdded.current = false;
      addDrawingSources(map);
      setMapLoaded((prev) => !prev);
      setTimeout(() => setMapLoaded(true), 100);
    });
  };

  const triggerPolygonDraw = useCallback(() => {
    setIsDrawingMode(true);
  }, [setIsDrawingMode]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2.5">
        {/* Style Selector */}
        <div className="glass-panel rounded-xl p-1 flex items-center space-x-1 shadow-xl">
          {MAP_STYLES.map((style, idx) => (
            <button
              key={style.id}
              onClick={() => changeMapStyle(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                currentStyleIdx === idx
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        {/* Drawing Mode Banner */}
        {isDrawingMode && (
          <div className="glass-panel border-brand-500/50 rounded-xl px-4 py-2.5 flex items-center space-x-3 text-xs shadow-lg">
            <MousePointerClick className="w-4 h-4 text-brand-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-brand-300 font-semibold">
                Drawing Mode Active — {vertexCount} vertex{vertexCount !== 1 ? 'es' : ''} placed
              </span>
              <span className="text-slate-400 text-[11px]">
                {vertexCount < 3
                  ? `Click ${3 - vertexCount} more point${3 - vertexCount !== 1 ? 's' : ''} on the map to form a polygon`
                  : 'Double-click to complete the polygon, or keep adding vertices'}
              </span>
            </div>
            <button
              onClick={() => {
                clearDrawing();
                setIsDrawingMode(false);
              }}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Cancel drawing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Draw Trigger Button (shown when not drawing) */}
      {!isDrawingMode && (
        <button
          onClick={triggerPolygonDraw}
          className="absolute bottom-6 right-6 z-10 glass-panel hover:border-brand-500/50 hover:bg-white/10 px-4 py-2.5 rounded-xl flex items-center space-x-2 text-xs font-semibold text-slate-200 transition shadow-2xl group active:scale-95"
        >
          <Pentagon className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
          <span>New Site Boundary</span>
        </button>
      )}
    </div>
  );
};
