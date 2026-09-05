import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { History, Zap, ShieldAlert, ToggleLeft, ToggleRight, SlidersHorizontal, Anchor } from 'lucide-react';
import { getTemporalSeries, getAnomalyById, getAnomalies } from '../services/api';
import { TemporalPoint, Anomaly } from '../data/mockData';
import { useHarbour } from '../contexts/AppContext';

const paneClass = 'bg-surface border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl';

export default function TemporalComparison() {
 const { activeHarbour } = useHarbour();
 const [chartData, setChartData] = useState<TemporalPoint[]>([]);
 const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
 const [showChangedOnly, setShowChangedOnly] = useState(true);
 const [sliderIndex, setSliderIndex] = useState(4);

 const currentSurveyIndex = chartData.length > 0 ? chartData.length - 1 : 5;
 const previousSurveyIndex = chartData.length > 0 ? chartData.length - 2 : 4;
 const baselineIndex = 0;

 useEffect(() => {
 getAnomalies({}, activeHarbour).then(anomalies => {
 const id = anomalies[0]?.id || 'ano_017';
 getTemporalSeries(id, activeHarbour).then(data => {
 setChartData(data);
 setSliderIndex(data.length > 1 ? data.length - 2 : 4); // default to previous survey
 });
 getAnomalyById(id, activeHarbour).then(setAnomaly).catch(() => setAnomaly(null));
 });
 }, [activeHarbour]);

 // The "reference" panel shows the date at sliderIndex; the "current" panel always shows latest
 const referenceDate = chartData[sliderIndex]?.date || "Mar '26";
 const currentDate = chartData[currentSurveyIndex]?.date || "Aug '26";

 // Heatmap opacity changes with sliderIndex — older = less delta, recent = more
 const deltaOpacity = chartData.length > 0
 ? 0.1 + (sliderIndex / (chartData.length - 1)) * 0.6
 : 0.4;

 return (
 <div className="relative flex-1 w-full flex flex-col h-full bg-void text-text-primary overflow-hidden">
 <div className="relative z-10 flex flex-col h-full gap-6 w-full p-6 overflow-y-auto custom-scrollbar">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Anchor className="w-4 h-4 text-blue-500 opacity-70" />
 <span className="text-[10px] text-text-secondary font-mono uppercase tracking-[0.15em]">S.A.G.A.R. Command — Temporal Analysis</span>
 </div>
 <h2 className="text-2xl font-display font-bold tracking-tight text-text-primary tracking-tight">What changed beneath the surface?</h2>
 <p className="text-text-secondary mt-1 text-sm">
 {anomaly ? `Anomaly ${anomaly.label} — ${activeHarbour}` : 'Temporal analysis'}
 </p>
 </div>

 {/* Survey selector pills */}
 <div className={`flex bg-void border border-border p-0.5 shrink-0`}>
 {[
 { label: 'Baseline', idx: baselineIndex },
 { label: 'Previous Survey', idx: previousSurveyIndex },
 { label: 'Current Survey', idx: currentSurveyIndex },
 ].map(({ label, idx }) => (
 <button
 key={label}
 onClick={() => setSliderIndex(idx)}
 className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
 sliderIndex === idx
 ? 'bg-surface text-text-primary border border-border'
 : 'text-text-secondary hover:text-text-primary hover:bg-void border border-transparent'
 }`}
 >
 {label}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-0">

 {/* Left: Imagery + Slider */}
 <div className="flex flex-col gap-4 flex-1 min-h-0 xl:col-span-3">
 <div className="flex items-center justify-between">
 <h3 className="font-display font-bold uppercase tracking-[0.1em] text-text-primary text-sm">Imagery Synchronisation</h3>
 <button
 onClick={() => setShowChangedOnly(!showChangedOnly)}
 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors"
 >
 {showChangedOnly
 ? <ToggleRight className="w-5 h-5 text-cyan" />
 : <ToggleLeft className="w-5 h-5" />}
 Show changed regions only
 </button>
 </div>

 {/* Dual panels */}
 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Reference */}
  <div className={`${paneClass} flex flex-col relative group transition-colors hover:border-glass-border-strong overflow-hidden`}>
  <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur-md border border-border px-3 py-1.5 text-[9px] font-mono text-text-primary uppercase tracking-widest z-10 flex items-center gap-2 rounded shadow-sm">
  <span className="w-2 h-2 bg-text-muted rounded-full" />
  {referenceDate} · Reference
  </div>
  <div className="flex-1 bg-void relative min-h-[220px] overflow-hidden">
  
  {/* Grid & Radar Overlays */}
  <div className="absolute inset-0 opacity-10 dark:opacity-30 mix-blend-normal dark:mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--theme-color-text-muted) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
  <div className="absolute inset-0 opacity-5 dark:opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, var(--theme-color-text-muted) 29px, var(--theme-color-text-muted) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, var(--theme-color-text-muted) 29px, var(--theme-color-text-muted) 30px)' }} />
  
  {/* Sonar Crosshairs and Rings */}
  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border opacity-50" />
  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border opacity-50" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-border opacity-60 rounded-full" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-border opacity-40 rounded-full" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-border opacity-20 rounded-full" />
  
  {/* Baseline Terrain Simulation */}
  <div className="absolute top-[20%] left-[30%] w-[50%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--theme-color-accent)_0%,_transparent_70%)] blur-[50px] opacity-20 dark:opacity-10" />
  <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-[radial-gradient(ellipse_at_center,_var(--theme-color-cyan)_0%,_transparent_60%)] blur-[30px] opacity-20 dark:opacity-10" />
  
  <div className="absolute bottom-4 right-4 text-[9px] font-mono font-bold uppercase tracking-widest text-text-secondary bg-surface/80 backdrop-blur border border-border px-2 py-1 rounded shadow-sm">0m depth</div>
  {/* Scanline */}
  <div className="absolute left-0 w-full h-[2px] bg-text-primary/20 opacity-50 blur-[1px] animate-[scanline_4s_linear_infinite]" />
  </div>
  </div>

  {/* Current */}
  <div className={`${paneClass} flex flex-col relative group transition-colors hover:border-glass-border-strong overflow-hidden`}>
  <div className="absolute top-4 left-4 bg-danger/10 backdrop-blur-md border border-danger/30 px-3 py-1.5 text-[9px] font-mono text-danger uppercase tracking-widest z-10 flex items-center gap-2 rounded shadow-sm">
  <ShieldAlert className="w-3.5 h-3.5" />
  {currentDate} · Current
  </div>
  <div className="flex-1 bg-void relative min-h-[220px] overflow-hidden">
  
  {/* Grid & Radar Overlays */}
  <div className="absolute inset-0 opacity-10 dark:opacity-30 mix-blend-normal dark:mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--theme-color-text-muted) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
  <div className="absolute inset-0 opacity-5 dark:opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, var(--theme-color-text-muted) 29px, var(--theme-color-text-muted) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, var(--theme-color-text-muted) 29px, var(--theme-color-text-muted) 30px)' }} />
  
  {/* Sonar Crosshairs and Rings */}
  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border opacity-50" />
  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border opacity-50" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-border opacity-60 rounded-full" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-border opacity-40 rounded-full" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-border opacity-20 rounded-full" />
  
  {/* Baseline Terrain Simulation */}
  <div className="absolute top-[20%] left-[30%] w-[50%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--theme-color-accent)_0%,_transparent_70%)] blur-[50px] opacity-20 dark:opacity-10" />
  
  {/* Anomaly Signature (New Object) - Increased Size */}
  <div className="absolute top-[30%] left-[30%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,_var(--theme-color-danger)_0%,_transparent_70%)] blur-[30px] opacity-40 dark:opacity-30 mix-blend-normal dark:mix-blend-screen" />
  <div className="absolute top-[35%] left-[35%] w-[40%] h-[40%] bg-[var(--theme-color-danger)] blur-[20px] opacity-30 dark:opacity-20" />
  
  {/* Heatmap delta overlay — opacity driven by slider */}
  {showChangedOnly && (
  <div
  className="absolute inset-[5%] border border-danger/40 bg-danger/5 flex flex-col items-center justify-center transition-all duration-500 shadow-[0_0_40px_rgba(255,77,77,0.15)] rounded-full backdrop-blur-[2px]"
  style={{ opacity: deltaOpacity }}
  >
  {/* Concentric rings to simulate targeting ping */}
  <div className="absolute inset-8 rounded-full border border-danger/30" />
  <div className="absolute inset-16 rounded-full border border-dashed border-danger/40 animate-[spin_12s_linear_infinite]" />
  
  <div className="w-40 h-40 bg-[var(--theme-color-danger)] rounded-full blur-[40px] opacity-50 dark:opacity-40 mix-blend-normal dark:mix-blend-screen" />
  <span className="text-danger font-mono text-[9px] mt-2 relative z-10 font-bold bg-surface/90 backdrop-blur-sm border border-danger/30 px-2.5 py-1 uppercase tracking-widest rounded shadow-sm">+0.8m ELEV</span>
  </div>
  )}
  <div className="absolute bottom-4 right-4 text-[9px] font-mono font-bold uppercase tracking-widest text-text-secondary bg-surface/80 backdrop-blur border border-border px-2 py-1 rounded shadow-sm">0m depth</div>
  {/* Scanline */}
  <div className="absolute left-0 w-full h-[2px] bg-text-primary/20 opacity-50 blur-[1px] animate-[scanline_4s_linear_infinite]" />
  </div>
  </div>
 </div>

 {/* Timeline slider */}
 <div className={`${paneClass} p-5 flex items-center gap-5 transition-colors hover:bg-void`}>
 <div className="w-8 h-8 bg-void border border-border flex items-center justify-center shrink-0">
 <SlidersHorizontal className="w-4 h-4 text-text-secondary" />
 </div>
 <div className="flex-1 flex flex-col gap-2">
 <input
 type="range"
 min="0"
 max={chartData.length > 1 ? chartData.length - 1 : 5}
 value={sliderIndex}
 onChange={e => setSliderIndex(Number(e.target.value))}
 className="w-full cursor-pointer accent-[var(--color-cyan)]"
 />
 {/* Tick labels */}
 {chartData.length > 0 && (
 <div className="flex justify-between px-1">
 {chartData.map((d, i) => (
 <span key={i} className={`text-[9px] font-mono uppercase font-bold transition-colors ${i === sliderIndex ? 'text-cyan' : 'text-text-muted'}`}>
 {d.date}
 </span>
 ))}
 </div>
 )}
 </div>
 <div className="text-right shrink-0 bg-void px-3 py-1.5 border border-border">
 <div className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-widest">{referenceDate}</div>
 <div className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">selected</div>
 </div>
 </div>
 </div>

 {/* Right: Chart + Evidence */}
 <div className="flex flex-col gap-4 flex-1 min-h-0 xl:col-span-1">

 {/* Temporal trend chart */}
 <div className={`${paneClass} p-4 shrink-0`}>
 <div className="flex items-center justify-between mb-3">
 <h3 className="font-display font-bold text-text-primary text-[10px] uppercase tracking-widest flex items-center gap-2">
 <div className="bg-success/10 border border-success/30 p-1 flex items-center justify-center">
 <History className="w-3.5 h-3.5 text-success" />
 </div>
 Temporal Trend
 </h3>
 </div>
 <div className="h-32 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.35}/>
 <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0.03}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
 <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={9} tickLine={false} axisLine={false} tickMargin={10} style={{ fontFamily: 'monospace' }} />
 <YAxis stroke="var(--color-text-muted)" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} style={{ fontFamily: 'monospace' }} />
 <Tooltip
 contentStyle={{ backgroundColor: 'var(--color-void)', border: '1px solid var(--color-border)', borderRadius: '0px', color: 'var(--color-text-primary)' }}
 itemStyle={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '11px', fontFamily: 'monospace' }}
 labelStyle={{ color: 'var(--color-text-secondary)', fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}
 cursor={{ stroke: 'var(--color-danger)', strokeWidth: 1, strokeDasharray: '4 4' }}
 />
 <ReferenceLine y={80} stroke="var(--color-warning)" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
 {/* Vertical reference line at selected slider position */}
 {chartData[sliderIndex] && (
 <ReferenceLine x={chartData[sliderIndex].date} stroke="var(--color-cyan)" strokeDasharray="3 3" strokeWidth={1.5} opacity={0.6} />
 )}
 <Area type="monotone" dataKey="score" stroke="var(--color-danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorChange)" activeDot={{ r: 4, fill: 'var(--color-void)', stroke: 'var(--color-danger)', strokeWidth: 2 }} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Evidence + AI */}
 <div className="flex flex-col gap-4 flex-1 min-h-0">
 <div className={`${paneClass} p-4`}>
 <h4 className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4">Evidence Summary</h4>
 <ul className="space-y-3">
 {[
 { label: 'Spatial deviation', value: 'High (88/100)', color: 'text-warning font-mono' },
 { label: 'Temporal change', value: 'Very High (95/100)', color: 'text-danger font-bold font-mono' },
 { label: 'First observed', value: '27 Aug 2026', color: 'text-text-primary font-mono' },
 { label: 'Prior state', value: 'Not present', color: 'text-text-primary font-mono' },
 ].map(row => (
 <li key={row.label} className="flex justify-between items-center text-[11px] uppercase tracking-widest font-bold">
 <span className="text-text-secondary text-[9px]">{row.label}</span>
 <span className={row.color}>{row.value}</span>
 </li>
 ))}
 <li className="flex justify-between items-center pt-4 border-t border-border mt-3">
 <span className="text-text-secondary text-[9px] uppercase tracking-[0.2em] font-bold">Recommended Priority</span>
 <span className="text-danger font-mono font-bold tracking-widest uppercase text-[10px] bg-danger/10 border border-danger/30 px-2 py-1">Immediate Review</span>
 </li>
 </ul>
 </div>

 <div className={`${paneClass} p-4 relative overflow-hidden flex flex-col flex-1 min-h-0`}>
 <div className="absolute top-0 right-0 w-40 h-40 bg-glass-strong blur-3xl rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
 <h4 className="text-[10px] font-bold text-[#B993FF] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 relative z-10 shrink-0">
 <Zap className="w-3.5 h-3.5" /> AI Explanation
 </h4>
 <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pr-2 min-h-0 border-l border-glass-border-strong pl-3">
 <p className="text-[11px] font-mono text-text-primary leading-relaxed">
 {anomaly?.explanation || 'Load anomaly data to see AI-assisted explanation.'}
 </p>
 </div>
 <div className="mt-4 relative z-10 shrink-0">
 <div className="flex justify-between items-end mb-2">
 <span className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold">Model Confidence</span>
 <span className="text-success font-mono font-bold text-lg">{anomaly?.confidence ?? '--'}%</span>
 </div>
 <div className="w-full bg-void h-1.5 overflow-hidden border border-border">
 <div className="bg-success h-full transition-all duration-700" style={{ width: `${anomaly?.confidence || 0}%` }} />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
