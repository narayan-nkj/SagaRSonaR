import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Source, Layer, Marker } from '../components/RawMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Activity, Clock, Navigation, Zap, AlertTriangle, ArrowRight, ExternalLink, X, History, List, Plus, Minus, Compass } from 'lucide-react';

import { getAnomalies } from '../services/api';
import { Anomaly, HARBOURS } from '../data/mockData';
import { useHarbour, useRealTimeAnomalies } from '../contexts/AppContext';
import { usePreferences } from '../contexts/PreferencesContext';
import StatusBadge from '../components/ui/StatusBadge';
import { generateGraticule } from '../utils/graticule';

const paneClass = 'bg-surface';

export default function MapWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeHarbour, setActiveHarbour } = useHarbour();
  const { formatCoordinates, formatLat, formatLng } = usePreferences();
  const realTimeUpdates = useRealTimeAnomalies();
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [showAnomalyList, setShowAnomalyList] = useState(false);
  const [showGraticule, setShowGraticule] = useState(true);
  const mapRef = useRef<any>(null);
  const radarBlipsRef = useRef<Record<string, HTMLDivElement>>({});
  const [zoomState, setZoomState] = useState(0); // 0: zoomed out, 1: mid zoom, 2: zoomed in
  const harbourMarkersRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const anomalyMarkersRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isFirstRender = useRef(true);

  const [showSonarModal, setShowSonarModal] = useState(false);
  const [showExplanationDrawer, setShowExplanationDrawer] = useState(false);

  useEffect(() => {
    getAnomalies({}, activeHarbour).then(data => {
      setAnomalies(data);
      if (location.state?.selectedAnomalyId) {
        const id = location.state.selectedAnomalyId;
        setSelectedAnomalyId(id);
        const anomaly = data.find(a => a.id === id);
        if (anomaly && mapRef.current) {
          setTimeout(() => {
            mapRef.current.flyTo({ 
              center: [anomaly.longitude, anomaly.latitude], 
              zoom: 11, 
              speed: 1.5,
              curve: 1,
              essential: true
            });
          }, 500);
        }
      }
    });
  }, [activeHarbour, location.state]);

  const liveAnomalies = useMemo(() =>
    anomalies.map(a => ({ ...a, ...(realTimeUpdates[a.id] || {}) })),
    [anomalies, realTimeUpdates]
  );

  const filteredAnomalies = useMemo(() => {
    if (activeFilter === 'All') return liveAnomalies;
    if (activeFilter === 'Unknown') return liveAnomalies.filter(a => a.classification === 'unknown');
    if (activeFilter === 'Known Object') return liveAnomalies.filter(a => a.classification === 'known');
    if (activeFilter === 'New Change') return liveAnomalies.filter(a => a.severity === 'unusual' || a.severity === 'high');
    if (activeFilter === 'High Priority') return liveAnomalies.filter(a => a.severity === 'high' || a.severity === 'unusual');
    return liveAnomalies;
  }, [liveAnomalies, activeFilter]);

  // Radar sync and zoom visibility
  useEffect(() => {
    let animId: number;

    const update = () => {
      const map = mapRef.current;
      if (map) {
        const zoom = map.getZoom();
        
        let currentZoomState = 0;
        if (zoom >= 9.5 && zoom < 11.5) currentZoomState = 1;
        else if (zoom >= 11.5) currentZoomState = 2;

        setZoomState(prev => prev !== currentZoomState ? currentZoomState : prev);

        const w = map.getContainer().clientWidth;
        const h = map.getContainer().clientHeight;
        filteredAnomalies.forEach(a => {
          const el = radarBlipsRef.current[a.id];
          if (!el) return;
          const pt = map.project([a.longitude, a.latitude]);
          const rx = 50 + ((pt.x - w / 2) / (w / 2)) * 40;
          const ry = 50 + ((pt.y - h / 2) / (h / 2)) * 40;
          const d = Math.sqrt((rx - 50) ** 2 + (ry - 50) ** 2);
          if (d > 45 || zoom < 8) { el.style.opacity = '0'; } else {
            el.style.opacity = '1'; el.style.top = `${ry}%`; el.style.left = `${rx}%`;
          }
        });
      }
      animId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animId);
  }, [filteredAnomalies]);

  const selectedAnomaly = selectedAnomalyId ? liveAnomalies.find(a => a.id === selectedAnomalyId) : null;
  const harborConfig = HARBOURS[activeHarbour] || HARBOURS['Mumbai Harbor Q3'];

  // Zoom handlers
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleRecenter = () => mapRef.current?.flyTo({ 
    center: [harborConfig.lng, harborConfig.lat], 
    zoom: 11.5, 
    pitch: 0, 
    bearing: 0, 
    speed: 1.5,
    curve: 1,
    essential: true 
  });

  // Jump map when harbour changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const midLng = (harborConfig.lng + harborConfig.waterCenter.lng) / 2;
    const midLat = (harborConfig.lat + harborConfig.waterCenter.lat) / 2;
    mapRef.current?.flyTo({
      center: [midLng, midLat],
      zoom: 11,
      speed: 1.5,
      curve: 1,
      essential: true
    });
  }, [activeHarbour, harborConfig]);

  // Anomaly styling helpers
  const dotColor = (s: string) => s === 'high' ? 'var(--color-danger)' : s === 'unusual' ? 'var(--color-warning)' : 'var(--color-accent)';
  const ringColor = (s: string) => s === 'high' ? 'border-danger' : s === 'unusual' ? 'border-warning' : 'border-accent';

  return (
    <div className="flex flex-col lg:flex-row h-full w-full relative">

      {/* ══════ FULL-BLEED MAP ══════ */}
      <div className={`${paneClass} flex-1 relative overflow-hidden flex flex-col min-h-0`}>
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: (harborConfig.lat === 18.9387 ? harborConfig.lng + harborConfig.waterCenter.lng : harborConfig.lng + harborConfig.waterCenter.lng) / 2, // hack to get midLng inline
              latitude: (harborConfig.lat + harborConfig.waterCenter.lat) / 2,
              zoom: 11,
              pitch: 0,
              bearing: 0,
            }}
          >
          {/* Harbour markers */}
          {Object.entries(HARBOURS).map(([name, coords]) => (
            <Marker key={name} longitude={coords.lng} latitude={coords.lat}>
                      <div
                        ref={el => { if (el) harbourMarkersRef.current[name] = el; }}
                        className={`flex flex-col items-center group cursor-pointer relative transition-opacity duration-300 ${zoomState === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                        onClick={e => { 
                          e.stopPropagation(); 
                          setActiveHarbour(name);
                          setShowAnomalyList(true); 
                        }}
              >
                {name === activeHarbour && (
                  <div className="absolute -inset-6 rounded-sm border border-dashed border-accent/50 bg-accent/5 pointer-events-none -translate-y-4">
                    <div className="absolute inset-3 rounded-sm border border-dotted border-accent/30" />
                  </div>
                )}
                <div className={`w-3 h-3 border border-void shadow-[var(--glow-accent)] group-hover:scale-125 transition-transform z-10 relative ${name === activeHarbour ? 'bg-accent' : 'bg-text-secondary'}`} />
                <div className={`mt-1 px-1.5 py-0.5 bg-void/80 backdrop-blur border border-border text-[9px] text-text-primary uppercase tracking-[0.2em] font-light whitespace-nowrap shadow-[var(--glow-hover)] transition-opacity duration-300 ${zoomState === 0 && name !== activeHarbour ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                  {name}
                </div>
              </div>
            </Marker>
          ))}

          {/* Graticule */}
          {showGraticule && (
            <Source id="graticule" type="geojson" data={generateGraticule(0.02, formatLat, formatLng)}>
              <Layer id="graticule-line" type="line" paint={{ 'line-color': '#FFFFFF', 'line-width': 1, 'line-opacity': 0.03 }} />
              <Layer id="graticule-label" type="symbol"
                layout={{ 'text-field': ['get', 'label'], 'symbol-placement': 'line', 'text-size': 10, 'text-letter-spacing': 0.1 }}
                paint={{ 'text-color': '#475569', 'text-halo-color': '#0B0E14', 'text-halo-width': 2 }}
              />
            </Source>
          )}

          {/* Anomaly nodes */}
          {filteredAnomalies.map(anomaly => {
            const selected = anomaly.id === selectedAnomalyId;
            return (
              <Marker key={anomaly.id} longitude={anomaly.longitude} latitude={anomaly.latitude} anchor="center">
                        <div
                          ref={el => { if (el) anomalyMarkersRef.current[anomaly.id] = el; }}
                          className={`relative group cursor-pointer flex flex-col items-center justify-center translate-y-6 transition-opacity duration-300 ${zoomState === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                          onClick={e => { e.stopPropagation(); setSelectedAnomalyId(anomaly.id); mapRef.current?.flyTo({ 
                    center: [anomaly.longitude, anomaly.latitude], 
                    zoom: 11, 
                    speed: 1.5,
                    curve: 1,
                    essential: true 
                  }); }}
                        >
                  <div className="relative mb-2 flex items-center justify-center w-5 h-5">
                    {(selected || anomaly.severity === 'high') && (
                      <div className={`absolute -inset-3 rounded-full animate-ping opacity-20 border-[3px] ${ringColor(anomaly.severity)}`} style={{ animationDuration: '3s' }} />
                    )}
                    <div className={`absolute -inset-1 rounded-full border border-dotted opacity-40 pointer-events-none ${ringColor(anomaly.severity)}`} />
                    <div
                      className={`w-4 h-4 rounded-full z-10 transition-all duration-300 shadow-[0_0_12px_currentColor] ${selected ? 'scale-125 ring-4 ring-[#12161E]' : 'hover:scale-110 ring-2 ring-[#12161E]'}`}
                      style={{ backgroundColor: dotColor(anomaly.severity), color: dotColor(anomaly.severity) }}
                    />
                  </div>
                  <div className={`theme-panel px-2 py-1 flex flex-col items-center transition-all duration-300 z-20 ${selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none'}`}>
                    <span className="text-[10px] font-display font-light text-text-primary uppercase tracking-[0.2em] whitespace-nowrap">{anomaly.label}</span>
                    <span className="text-[9px] font-mono text-text-secondary whitespace-nowrap">{formatCoordinates(anomaly.latitude, anomaly.longitude)}</span>
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>

        
        {/* ── Top: Filters ── */}
        <div className="absolute top-6 left-6 flex pointer-events-none z-10 max-w-[calc(100vw-3rem)] overflow-x-auto custom-scrollbar">
          <div className="bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl p-1.5 flex items-center gap-1.5 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-max">
            {['All', 'Unknown', 'Known Object', 'New Change', 'High Priority'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap rounded-xl border ${
                  activeFilter === f
                    ? 'bg-glass-strong text-text-primary border-glass-border-strong shadow-[var(--glow-hover)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Unified Dock Controls (bottom-right) ── */}
        <div className="absolute bottom-6 right-6 z-10 pointer-events-auto flex flex-col gap-2">
          <div className="bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-1 gap-1">
            <button onClick={handleZoomIn} className="p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-strong transition-all duration-300 group" title="Zoom In">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} className="p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-strong transition-all duration-300 group" title="Zoom Out">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={handleRecenter} className="p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-glass-strong transition-all duration-300 group" title="Recenter">
              <Compass className="w-4 h-4" />
            </button>
            <button onClick={() => setShowGraticule(!showGraticule)} className={`p-3 rounded-xl transition-all duration-300 group ${showGraticule ? 'bg-glass-strong text-text-primary shadow-[var(--glow-hover)]' : 'text-text-secondary hover:text-text-primary hover:bg-glass-strong'}`} title="Toggle Grid">
              <Layers className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAnomalyList(!showAnomalyList)} className={`p-3 rounded-xl transition-all duration-300 group ${showAnomalyList ? 'bg-glass-strong text-text-primary shadow-[var(--glow-hover)]' : 'text-text-secondary hover:text-text-primary hover:bg-glass-strong'}`} title="Toggle Anomalies List">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Live Sonar Radar (bottom-left) ── */}
        <div className="absolute bottom-4 left-4 z-10 w-36 h-36 pointer-events-none hidden md:block border border-cyan/20 bg-void/50 backdrop-blur-sm p-1 rounded-full">
          <div className="w-full h-full border border-cyan/10 relative overflow-hidden flex items-center justify-center rounded-full">
            <div className="absolute inset-0 border border-cyan/10 m-2 rounded-full" />
            <div className="absolute inset-0 border border-cyan/10 m-6 rounded-full" />
            <div className="absolute inset-0 border border-cyan/10 m-10 rounded-full" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan/20" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan/20" />
            {/* Sweep */}
            <div className="absolute inset-0 origin-center animate-spin"
              style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(0, 229, 255, 0.15) 100%)', animationDuration: '3s' }}
            >
              <div className="absolute top-0 right-1/2 w-[1px] h-1/2 bg-cyan origin-bottom transform translate-x-1/2 opacity-60" />
            </div>
            {/* Blips */}
            {filteredAnomalies.map(a => (
              <div key={`radar-${a.id}`} ref={el => { if (el) radarBlipsRef.current[a.id] = el; }}
                className={`absolute w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor] transition-opacity duration-300 ${
                  a.severity === 'high' ? 'bg-danger text-danger' : a.severity === 'unusual' ? 'bg-warning text-warning' : 'bg-success text-success'
                }`}
                style={{ top: '50%', left: '50%', opacity: 0 }}
              />
            ))}
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[8px] font-mono text-cyan bg-void/80 px-1.5 py-0.5 border border-cyan/20 uppercase rounded-full">Ranging</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ RIGHT COLUMN (LIST / DETAILS) ══════ */}
      {showAnomalyList && (
        <div className="w-full lg:w-[420px] lg:p-6 lg:pl-0 flex flex-col h-[50%] lg:h-full shrink-0 relative z-20 pointer-events-none animate-in slide-in-from-bottom lg:slide-in-from-right fade-in duration-300">
          <div className="flex-1 bg-void/50 backdrop-blur-3xl border border-glass-border lg:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden pointer-events-auto">
            {selectedAnomaly ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-glass-border flex flex-col gap-4 shrink-0 bg-glass-strong">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[14px] font-display font-bold uppercase tracking-[0.15em] text-text-primary mb-2">{selectedAnomaly.label}</h2>
                    <StatusBadge status={
                      selectedAnomaly.classification === 'unknown' ? 'unknown' :
                      selectedAnomaly.classification === 'known' ? 'known_object' : 'false_positive'
                    } />
                  </div>
                  <button onClick={() => setSelectedAnomalyId(null)}
                    className="p-2 bg-glass rounded-full text-text-muted hover:text-text-primary hover:bg-glass-strong transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedAnomaly.severity === 'high' && (
                  <div className="flex items-center gap-2 text-danger bg-danger/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-danger/30 w-fit rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5" /> Immediate Priority
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar bg-glass">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-px bg-glass-strong border-b border-glass-border">
                  <div className="bg-glass-strong p-5">
                    <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-text-secondary mb-2">Overall Score</div>
                    <div className="text-2xl font-mono font-bold text-text-primary">{selectedAnomaly.overallScore}</div>
                    <div className="w-full bg-glass-strong h-1.5 mt-3 rounded-full overflow-hidden">
                      <div className="bg-text-secondary h-full" style={{ width: `${selectedAnomaly.overallScore}%` }} />
                    </div>
                  </div>
                  <div className="bg-glass-strong p-5">
                    <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-text-secondary mb-2">Confidence</div>
                    <div className="text-2xl font-mono font-bold text-success">{selectedAnomaly.confidence}%</div>
                    <div className="w-full bg-glass-strong h-1.5 mt-3 rounded-full overflow-hidden">
                      <div className="bg-success h-full shadow-[0_0_8px_rgba(0,255,170,0.5)]" style={{ width: `${selectedAnomaly.confidence}%` }} />
                    </div>
                  </div>
                </div>

                {/* Deviation bars */}
                <div className="p-6 border-b border-glass-border space-y-5 bg-glass">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-text-secondary text-[10px] font-mono uppercase tracking-widest"><Activity className="w-3.5 h-3.5" /> Spatial Dev</span>
                      <span className="font-mono text-text-primary text-[10px]">{selectedAnomaly.spatialDeviationScore}/100</span>
                    </div>
                    <div className="w-full bg-glass-strong h-1.5 rounded-full overflow-hidden">
                      <div className="bg-warning h-full transition-all shadow-[0_0_8px_rgba(255,166,0,0.5)]" style={{ width: `${selectedAnomaly.spatialDeviationScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-text-secondary text-[10px] font-mono uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> Temp Change</span>
                      <span className="font-mono text-text-primary text-[10px]">{selectedAnomaly.temporalChangeScore}/100</span>
                    </div>
                    <div className="w-full bg-glass-strong h-1.5 rounded-full overflow-hidden">
                      <div className="bg-danger h-full transition-all shadow-[0_0_8px_rgba(255,77,77,0.5)]" style={{ width: `${selectedAnomaly.temporalChangeScore}%` }} />
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-y-5 p-6 bg-glass">
                  <div>
                    <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Depth</div>
                    <div className="text-text-primary font-mono text-[11px]">{selectedAnomaly.depthMeters} m</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Detected</div>
                    <div className="text-text-primary font-mono text-[11px]">{new Date(selectedAnomaly.detectedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Coordinates</div>
                    <div className="text-text-primary font-mono text-[11px] flex items-center gap-2 bg-glass p-2.5 rounded-xl border border-glass-border">
                      <Navigation className="w-3.5 h-3.5 text-accent shrink-0" />
                      {formatCoordinates(selectedAnomaly.latitude, selectedAnomaly.longitude)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 border-t border-glass-border bg-glass-strong flex flex-col gap-3 shrink-0">
                <div className="flex gap-3">
                  <button onClick={() => setShowSonarModal(true)}
                    className="flex-1 bg-glass hover:bg-glass-strong text-text-primary text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all duration-300 border border-glass-border">
                    Sonar
                  </button>
                  <button onClick={() => setShowExplanationDrawer(true)}
                    className="flex-1 bg-glass hover:bg-glass-strong text-text-primary text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all duration-300 border border-glass-border flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-accent" /> Explain
                  </button>
                </div>
                <button onClick={() => navigate('/review')}
                  className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-[11px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[var(--glow-accent)]">
                  Review Target <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-6 py-5 border-b border-glass-border flex justify-between items-center bg-glass-strong shrink-0">
                <h3 className="text-text-primary font-bold text-[11px] uppercase tracking-[0.15em]">Anomalies ({filteredAnomalies.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2.5 bg-glass">
                {filteredAnomalies.map(anomaly => (
                  <button
                    key={`list-${anomaly.id}`}
                    onClick={() => {
                      setSelectedAnomalyId(anomaly.id);
                      mapRef.current?.flyTo({ 
                        center: [anomaly.longitude, anomaly.latitude], 
                        zoom: 11, 
                        speed: 1.5,
                        curve: 1,
                        essential: true 
                      });
                    }}
                    className={`w-full flex flex-col text-left px-5 py-4 rounded-xl transition-all duration-300 border focus:outline-none ${
                      selectedAnomalyId === anomaly.id
                        ? 'bg-glass-strong border-glass-border-strong shadow-[var(--glow-hover)]'
                        : 'bg-glass border-glass-border hover:bg-glass-strong hover:border-glass-border'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[12px] font-mono font-bold uppercase tracking-wider ${selectedAnomalyId === anomaly.id ? 'text-accent' : 'text-text-primary'}`}>{anomaly.label}</span>
                      <StatusBadge status={anomaly.severity === 'high' ? 'highly_anomalous' : anomaly.severity === 'unusual' ? 'unusual' : 'normal'} />
                    </div>
                    <div className="text-[10px] text-text-secondary font-mono flex gap-4">
                      <span>SCORE: <span className="text-text-primary">{anomaly.overallScore}</span></span>
                      <span>DEPTH: <span className="text-text-primary">{anomaly.depthMeters}m</span></span>
                    </div>
                  </button>
                ))}
                {filteredAnomalies.length === 0 && (
                  <div className="text-center p-8 text-text-muted text-[11px] font-mono uppercase tracking-widest bg-glass rounded-xl border border-dashed border-glass-border">No matching records</div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* ══════ SONAR MODAL ══════ */}
      {showSonarModal && (
        <div className="absolute inset-0 z-50 bg-void/60 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 animate-in fade-in">
          <div className="bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="px-6 py-5 border-b border-glass-border flex items-center justify-between bg-glass-strong">
              <h3 className="font-display font-bold uppercase tracking-widest text-text-primary flex items-center gap-2 text-[12px]">
                <ExternalLink className="w-4 h-4 text-text-muted" />
                Sonar Evidence — {selectedAnomaly?.label}
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-[10px] text-text-secondary font-mono uppercase tracking-widest group-hover:text-text-primary transition-colors">Compare Baseline</span>
                  <div onClick={() => setIsCompareMode(!isCompareMode)}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 border border-glass-border-strong ${isCompareMode ? 'bg-accent shadow-[var(--glow-hover)]' : 'bg-glass'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-[1px] transition-transform duration-300 ${isCompareMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
                <button onClick={() => setShowSonarModal(false)} className="text-text-muted hover:text-text-primary hover:bg-glass-strong rounded-xl p-2 transition-all duration-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-glass p-6 relative flex items-center justify-center">
              <div className="w-full h-full max-w-4xl max-h-full bg-void border border-glass-border relative overflow-hidden rounded-xl shadow-inner">
                {/* Waterfall background texture */}
                <div className="absolute inset-0 opacity-20 animate-[waterfall_20s_linear_infinite]" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, transparent 1px, transparent 40px)',
                  backgroundSize: '100% 40px'
                }} />
                
                {/* Simulated Anomaly Heat Signatures */}
                <div className={`absolute top-[30%] left-[40%] w-[20%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--color-warning)_0%,_transparent_70%)] blur-[20px] transition-all duration-1000 ${isCompareMode ? 'opacity-5 grayscale' : 'opacity-40'}`} />
                <div className={`absolute top-[40%] left-[50%] w-[30%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--color-danger)_0%,_transparent_60%)] blur-[30px] transition-opacity duration-1000 ${isCompareMode ? 'opacity-0' : 'opacity-60'}`} />
                
                {isCompareMode && (
                  <div className="absolute top-4 left-4 px-4 py-2 text-[10px] uppercase tracking-widest font-bold font-mono animate-in fade-in z-10 text-text-primary bg-surface/80 backdrop-blur-xl border border-glass-border rounded-lg shadow-lg">
                    Baseline View — Anomalies Hidden
                  </div>
                )}
                
                {/* Moving Scanline */}
                <div className="absolute left-0 w-full h-[5px] bg-gradient-to-b from-transparent via-white/30 to-transparent opacity-50 blur-[2px] animate-[scanline_4s_linear_infinite]" />
                <div className="absolute left-0 w-full h-[1px] bg-glass0 opacity-50 animate-[scanline_4s_linear_infinite]" />

                {/* Targeting HUD (Properly centered over the anomaly) */}
                <div className={`absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 pointer-events-none z-10 transition-opacity duration-1000 ${isCompareMode ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="absolute inset-0 border border-danger/40 bg-danger/5 animate-pulse rounded-lg" />
                  {/* Corner reticles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-danger rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-danger rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-danger rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-danger rounded-br" />
                  {/* Crosshairs */}
                  <div className="w-full h-[1px] top-1/2 -translate-y-1/2 bg-danger/30 absolute" />
                  <div className="h-full w-[1px] left-1/2 -translate-x-1/2 bg-danger/30 absolute" />
                  
                  {/* Target text labels */}
                  <span className="text-danger font-mono text-[9px] tracking-widest absolute -top-6 left-0 bg-glass backdrop-blur-md px-1.5 py-0.5 rounded border border-danger/30">TARGET_LOCKED</span>
                  <span className="text-danger font-mono text-[9px] absolute -bottom-6 right-0 bg-glass backdrop-blur-md px-1.5 py-0.5 rounded border border-danger/30">CONF: {selectedAnomaly?.confidence}%</span>
                </div>

                {/* Top Right Stats HUD */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1 font-mono text-[10px] text-text-primary bg-surface/80 p-3 rounded-xl backdrop-blur-xl border border-glass-border">
                  <span className="text-text-secondary uppercase tracking-widest">SYS_TIME: <span className="text-text-primary font-bold">{new Date().toISOString().split('T')[1].slice(0, 8)} UTC</span></span>
                  <span className="text-text-secondary uppercase tracking-widest">LAT: <span className="text-text-primary font-bold">{formatLat(selectedAnomaly?.latitude || 0)}</span></span>
                  <span className="text-text-secondary uppercase tracking-widest">LNG: <span className="text-text-primary font-bold">{formatLng(selectedAnomaly?.longitude || 0)}</span></span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-glass-border flex justify-between text-[10px] text-text-secondary font-mono bg-glass-strong uppercase tracking-widest font-bold">
              <span>Transect: B_04</span>
              <span>Freq: 450 kHz</span>
              <span>Range: 50m</span>
              <span>{formatCoordinates(selectedAnomaly?.latitude || 0, selectedAnomaly?.longitude || 0, true)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════ EXPLANATION DRAWER ══════ */}
      {showExplanationDrawer && (
        <div className="absolute inset-0 z-50 flex justify-end animate-in fade-in bg-void/60 backdrop-blur-3xl">
          <div className="w-full max-w-md bg-void/50 border-l border-glass-border h-full shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right-full backdrop-blur-3xl pointer-events-auto">
            <div className="p-6 border-b border-glass-border flex items-center justify-between bg-glass-strong">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent" />
                <h3 className="font-display font-bold uppercase tracking-widest text-text-primary text-[13px]">AI-Assisted Explanation</h3>
              </div>
              <button onClick={() => setShowExplanationDrawer(false)} className="text-text-muted hover:text-text-primary hover:bg-glass-strong rounded-xl p-2 transition-all duration-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-glass">
              <div className="bg-glass border border-glass-border rounded-2xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent animate-glow-pulse shadow-[var(--glow-accent)]" />
                <p className="text-text-primary font-mono text-[11px] leading-relaxed ml-2">{selectedAnomaly?.explanation}</p>
                {selectedAnomaly?.notes && (
                  <div className="mt-4 pt-4 border-t border-glass-border ml-2">
                    <h4 className="text-[10px] font-display font-bold tracking-[0.2em] uppercase text-text-secondary mb-2">Historical Notes</h4>
                    <p className="text-text-secondary font-mono text-[10px] leading-relaxed">{selectedAnomaly.notes}</p>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-[10px] font-display font-bold tracking-[0.2em] uppercase text-text-secondary mb-4">Evidence Factors</h4>
                <div className="space-y-3">
                  <div className="bg-glass border border-glass-border rounded-xl p-4 hover:border-glass-border-strong hover:bg-glass-strong transition-all duration-300 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] text-text-primary font-bold uppercase tracking-widest">Geometric Regularity</span>
                      <span className="text-[10px] text-danger font-mono font-bold tracking-widest shadow-[var(--glow-hover)] bg-danger/10 px-2 py-1 rounded-md border border-danger/20">HIGH</span>
                    </div>
                    <p className="text-[10px] font-mono text-text-secondary leading-relaxed">Strong linear edges detected, unlike natural rock formations.</p>
                  </div>
                  <div className="bg-glass border border-glass-border rounded-xl p-4 hover:border-glass-border-strong hover:bg-glass-strong transition-all duration-300 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] text-text-primary font-bold uppercase tracking-widest">Acoustic Shadow</span>
                      <span className="text-[10px] text-warning font-mono font-bold tracking-widest shadow-[var(--glow-hover)] bg-warning/10 px-2 py-1 rounded-md border border-warning/20">MEDIUM</span>
                    </div>
                    <p className="text-[10px] font-mono text-text-secondary leading-relaxed">Shadow length indicates object stands ~2m above sea floor.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-glass-border bg-glass-strong">
              <button onClick={() => { setShowExplanationDrawer(false); navigate('/comparison'); }}
                className="w-full bg-glass hover:bg-glass-strong text-text-primary text-[10px] font-bold tracking-widest uppercase py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-glass-border shadow-[var(--glow-hover)]">
                <History className="w-4 h-4" /> View Temporal Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
