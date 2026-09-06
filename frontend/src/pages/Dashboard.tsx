import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Anchor, Zap } from 'lucide-react';

import MetricCard from '../components/ui/MetricCard';
import PriorityQueue from '../components/ui/PriorityQueue';
import ActiveLearningWidget from '../components/ui/ActiveLearningWidget';
import {
  getDashboardMetrics,
  getAnomalies,
  getTemporalSeries,
  getModelFeedback
} from '../services/api';
import { DashboardMetrics, Anomaly, TemporalPoint, ModelFeedback, HARBOURS } from '../data/mockData';
import { useHarbour, useRealTimeAnomalies } from '../contexts/AppContext';
import { Map, Marker } from '../components/RawMap';

export default function Dashboard() {
  const { activeHarbour, setActiveHarbour } = useHarbour();
  const navigate = useNavigate();
  const realTimeUpdates = useRealTimeAnomalies();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [chartData, setChartData] = useState<TemporalPoint[]>([]);
  const [modelFeedback, setModelFeedback] = useState<ModelFeedback | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPatrol, setIsAutoPatrol] = useState(true);
  const mapRef = useRef<any>(null);

  const liveAnomalies = React.useMemo(() =>
    anomalies.map(a => ({ ...a, ...(realTimeUpdates[a.id] || {}) })),
    [anomalies, realTimeUpdates]
  );

  const selectedAnomaly = liveAnomalies.find(a => a.id === selectedAnomalyId);
  const harborConfig = HARBOURS[activeHarbour] || HARBOURS['Mumbai Harbor Q3'];

  const selectedAnomalyLat = selectedAnomaly?.latitude;
  const selectedAnomalyLng = selectedAnomaly?.longitude;
  const harborLat = harborConfig?.lat;
  const harborLng = harborConfig?.lng;

  // Map flyTo logic
  useEffect(() => {
    if (mapRef.current) {
      if (selectedAnomalyLat && selectedAnomalyLng && harborLat && harborLng) {
        mapRef.current.fitBounds(
          [
            [Math.min(harborLng, selectedAnomalyLng), Math.min(harborLat, selectedAnomalyLat)],
            [Math.max(harborLng, selectedAnomalyLng), Math.max(harborLat, selectedAnomalyLat)]
          ],
          { padding: 100, duration: 3500, maxZoom: 13, essential: true }
        );
      } else {
        const midLng = (harborConfig.lng + harborConfig.waterCenter.lng) / 2;
        const midLat = (harborConfig.lat + harborConfig.waterCenter.lat) / 2;
        mapRef.current.flyTo({
          center: [midLng, midLat],
          zoom: 11,
          pitch: 0,
          bearing: 0,
          speed: 1.5,
          curve: 1
        });
      }
    }
  }, [selectedAnomalyLat, selectedAnomalyLng, harborLat, harborLng, harborConfig]);

  const isFirstLoad = useRef(true);
  const patrolIndicesRef = useRef<Record<string, number>>({});
  // Load data
  useEffect(() => {
    async function loadData() {
      if (isFirstLoad.current) {
        setIsLoading(true);
      }
      const [m, a, c, mf] = await Promise.all([
        getDashboardMetrics(activeHarbour),
        getAnomalies({}, activeHarbour),
        getTemporalSeries('', activeHarbour),
        getModelFeedback()
      ]);
      setMetrics(m);
      setAnomalies(a);
      setChartData(c);
      setModelFeedback(mf);
      if (a.length > 0) {
        if (isAutoPatrol) {
          const idx = patrolIndicesRef.current[activeHarbour] || 0;
          const nextIdx = idx % a.length;
          setSelectedAnomalyId(a[nextIdx].id);
        } else {
          const top = a.find(x => x.priority === 'immediate') || a.find(x => x.priority === 'high') || a[0];
          setSelectedAnomalyId(top.id);
        }
      }
      setIsLoading(false);
      isFirstLoad.current = false;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHarbour]);

  // Auto patrol logic
  useEffect(() => {
    if (!isAutoPatrol) return;

    const interval = setInterval(() => {
      const ports = Object.keys(HARBOURS);
      const currentIndex = ports.indexOf(activeHarbour);
      const nextIndex = (currentIndex + 1) % ports.length;
      const nextHarbour = ports[nextIndex];
      
      if (patrolIndicesRef.current[nextHarbour] === undefined) {
        patrolIndicesRef.current[nextHarbour] = 0;
      } else {
        patrolIndicesRef.current[nextHarbour] += 1;
      }
      
      setActiveHarbour(nextHarbour);
    }, 12000); // 12s wait (3.5s animation + 8.5s stay)

    return () => clearInterval(interval);
  }, [isAutoPatrol, activeHarbour, setActiveHarbour]);

  const priorityAnomalies = liveAnomalies
    .filter(a => a.priority === 'immediate' || a.priority === 'high' || a.priority === 'medium')
    .sort((a, b) => b.overallScore - a.overallScore);


  return (
    <div className="relative flex flex-col h-full bg-void text-text-primary overflow-hidden">
      
      {/* ── FULL SCREEN DARK TECH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-glass-strong)_0%,_var(--color-void)_50%)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
      </div>

      {/* ── BENTO BOX LAYOUT ── */}
      <div className="absolute inset-0 z-10 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar xl:overflow-hidden">
        <div className="max-w-[1600px] mx-auto xl:h-full flex flex-col xl:flex-row gap-4 lg:gap-6">
          
          {/* LEFT COLUMN */}
          <div className="flex-[2] flex flex-col gap-4 lg:gap-6 min-w-0 xl:min-h-0">
            
            {/* Top Ribbons (KPIs) - Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 shrink-0">
              <div className="bg-glass backdrop-blur-md rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"><MetricCard label="Normal Regions" value={metrics?.normalRegions ?? '--'} icon={CheckCircle} colorClass="text-text-primary" /></div>
              <div className="bg-glass backdrop-blur-md rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"><MetricCard label="Known Anomalies" value={metrics?.knownAnomalies ?? '--'} icon={AlertTriangle} colorClass="text-warning" /></div>
              <div className="bg-glass backdrop-blur-md rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"><MetricCard label="Unknown Anomalies" value={metrics?.unknownAnomalies ?? '--'} icon={AlertCircle} colorClass="text-danger" trend="+2 since last run" trendDirection="up" /></div>
              <div className="bg-glass backdrop-blur-md rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"><MetricCard label="New Changes" value={metrics?.newChanges ?? '--'} icon={TrendingUp} colorClass="text-cyan" trend="-1 since last run" trendDirection="down" /></div>
            </div>

            {/* Minimap Section */}
            <div className="flex-1 bg-glass backdrop-blur-md rounded-2xl border border-glass-border p-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-h-[300px] md:min-h-[400px] overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <h3 className="font-display font-bold text-sm uppercase tracking-[0.12em] text-text-primary px-3 py-1.5 bg-void/80 backdrop-blur-md border border-glass-border rounded-lg shadow-lg pointer-events-none hidden sm:block">Sector Minimap</h3>
                <button 
                  onClick={() => setIsAutoPatrol(!isAutoPatrol)}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors border shadow-lg flex items-center gap-2 ${
                    isAutoPatrol 
                      ? 'bg-accent/20 border-accent/40 text-accent shadow-[var(--glow-accent)]' 
                      : 'bg-void/80 border-glass-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isAutoPatrol ? 'bg-accent animate-pulse' : 'bg-text-muted'}`} />
                  Auto Patrol
                </button>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden relative pointer-events-auto">
                <Map
                  ref={mapRef}
                  initialViewState={{
                    longitude: harborConfig.lng,
                    latitude: harborConfig.lat,
                    zoom: 11.5,
                    pitch: 0,
                    bearing: 0,
                  }}
                  interactive={true}
                >
                  <Marker longitude={harborConfig.lng} latitude={harborConfig.lat}>
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-accent rounded-full border border-void shadow-[var(--glow-accent)] animate-pulse z-10 relative" />
                      <div className="mt-1 px-1.5 py-0.5 bg-void/80 backdrop-blur border border-glass-border text-[9px] text-text-primary uppercase tracking-[0.2em] font-light whitespace-nowrap rounded-sm">
                        {activeHarbour}
                      </div>
                    </div>
                  </Marker>
                  
                  {/* Live Anomaly Marker (Only Selected) */}
                  {selectedAnomaly && (
                    <Marker
                      longitude={selectedAnomaly.longitude}
                      latitude={selectedAnomaly.latitude}
                    >
                      <div className="w-2.5 h-2.5 rounded-full border border-void shadow-lg transition-all duration-500 bg-accent scale-125 animate-pulse ring-2 ring-accent/20 shadow-[var(--glow-accent)]" />
                    </Marker>
                  )}
                </Map>
                <div className="absolute inset-0 border border-glass-border rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Short Survey Activity Chart */}
            <div className="h-48 shrink-0 bg-glass backdrop-blur-md rounded-2xl border border-glass-border p-5 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-primary">Survey Trends</h3>
                {isLoading && <div className="w-3 h-3 border-2 border-glass-border border-t-cyan rounded-full animate-spin" />}
              </div>
              <div className="flex-1 w-full relative">
                {chartData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-text-secondary font-mono">No data available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(11, 14, 20, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px' }}
                        itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                        labelStyle={{ color: 'var(--color-text-secondary)', fontSize: '9px', marginBottom: '2px', fontFamily: 'var(--font-sans)' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="var(--color-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 4, fill: 'var(--color-void)', stroke: 'var(--color-cyan)', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-[1] flex flex-col gap-4 lg:gap-6 shrink-0 w-full xl:min-w-[340px] xl:w-[400px] xl:min-h-0">
            
            {/* Inspector Node */}
            <div className="bg-glass backdrop-blur-md rounded-2xl border border-glass-border p-6 flex flex-col shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h3 className="font-display font-bold text-sm uppercase tracking-[0.12em] text-text-primary flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-cyan" /> Inspector Node
              </h3>
              <div className="min-h-[120px]">
                {selectedAnomaly ? (
                  <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                    <div className="border-l-2 border-cyan pl-4 py-1">
                      <p className="text-text-primary font-mono text-xs leading-relaxed uppercase opacity-90">{selectedAnomaly.explanation || 'Anomaly requires manual review. Automated analysis pending deeper scanning operations.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-glass rounded-xl p-4 backdrop-blur-md border border-glass-border flex flex-col gap-1">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Confidence</div>
                        <div className="text-text-primary font-mono text-2xl font-light">{selectedAnomaly.confidence}%</div>
                      </div>
                      <div className="bg-glass rounded-xl p-4 backdrop-blur-md border border-glass-border flex flex-col gap-1">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Depth</div>
                        <div className="text-text-primary font-mono text-2xl font-light">{selectedAnomaly.depthMeters}m</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[120px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-glass-border bg-glass rounded-xl">
                    <Anchor className="w-6 h-6 text-text-muted mb-3" />
                    <span className="text-xs font-mono text-text-secondary uppercase">Select an anomaly to initialize inspector.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Priority Queue */}
            <div className="flex-1 min-h-0 bg-glass backdrop-blur-md rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
              <PriorityQueue
                anomalies={priorityAnomalies}
                selectedId={selectedAnomalyId}
                isLoading={false}
                onSelectAnomaly={id => setSelectedAnomalyId(id)}
                onViewDetails={id => navigate('/map', { state: { selectedAnomalyId: id } })}
              />
            </div>

            {/* Learning Pipeline */}
            <div className="shrink-0 bg-glass backdrop-blur-md rounded-2xl border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
              <ActiveLearningWidget
                currentModel={modelFeedback?.currentModel || { name: 'S.A.G.A.R. v1', accuracy: 0, lastUpdated: '' }}
                feedbackSamples={modelFeedback?.feedbackSamples || 0}
                potentialRetrainingSet={modelFeedback?.potentialRetrainingSet || 0}
                nextModel={modelFeedback?.nextModel || { name: 'S.A.G.A.R. v2', accuracy: 0, estimatedTime: '' }}
                isLoading={false}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
