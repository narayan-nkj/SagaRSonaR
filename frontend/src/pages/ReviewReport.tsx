import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAnomalies, submitReview, getReportSummary, getModelFeedback } from '../services/api';
import { Anomaly, ReportSummary, ModelFeedback, HARBOURS } from '../data/mockData';
import { Map, Marker } from '../components/RawMap';
import 'maplibre-gl/dist/maplibre-gl.css';
import StatusBadge from '../components/ui/StatusBadge';
import { 
 List,
 FileCheck, 
 FileText, 
 Download, 
 Share2, 
 AlertCircle, 
 CheckCircle2, 
 Navigation, 
 Clock, 
 MessageSquare, 
 Zap, 
 Check 
} from 'lucide-react';
import { useHarbour } from '../contexts/AppContext';
import { usePreferences } from '../contexts/PreferencesContext';
import OpticalUploader from '../components/OpticalUploader';

type Tab = 'review' | 'report';

const paneClass = 'bg-surface border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl';

 export default function ReviewReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeHarbour } = useHarbour();
 const { formatCoordinates } = usePreferences();
 const [activeTab, setActiveTab] = useState<Tab>('review');
 const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
 const [selectedId, setSelectedId] = useState<string>('');
 const [notes, setNotes] = useState('');
 const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
 const [showNewClassModal, setShowNewClassModal] = useState(false);
 const [newClassName, setNewClassName] = useState('');
 
 const [reportData, setReportData] = useState<ReportSummary | null>(null);
 const [feedbackData, setFeedbackData] = useState<ModelFeedback | null>(null);

 const [page, setPage] = useState(1);
 const [hasMore, setHasMore] = useState(true);
 const [isLoading, setIsLoading] = useState(false);
 const observerTarget = useRef<HTMLLIElement>(null);

 const fetchAnomalies = useCallback(async (pageNum: number, isInitial = false) => {
 setIsLoading(true);
 try {
 const data = await getAnomalies({ page: pageNum, limit: 10 }, activeHarbour);
 if (isInitial) {
 setAnomalies(data);
 if (location.state?.selectedAnomalyId) {
    setSelectedId(location.state.selectedAnomalyId);
  } else if (data.length > 0) {
    setSelectedId(data.find(a => a.reviewStatus === 'pending')?.id || data[0].id);
  }
 } else {
        setAnomalies(prev => {
          const newAnomalies = data.filter(d => !prev.some(p => p.id === d.id));
          return [...prev, ...newAnomalies];
        });
 }
 setHasMore(data.length === 10);
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoading(false);
 }
 }, [activeHarbour]);

 // Initial load when harbour changes
 useEffect(() => {
 Promise.resolve().then(() => setPage(1));
 Promise.resolve().then(() => fetchAnomalies(1, true));
 getReportSummary('surv_001').then(setReportData);
 getModelFeedback().then(setFeedbackData);
 }, [activeHarbour, fetchAnomalies]);

 // Observer for infinite scroll
 useEffect(() => {
 const observer = new IntersectionObserver(
 entries => {
 if (entries[0].isIntersecting && hasMore && !isLoading) {
 setPage(p => p + 1);
 }
 },
 { threshold: 1.0 }
 );

 if (observerTarget.current) {
 observer.observe(observerTarget.current);
 }

 return () => observer.disconnect();
 }, [hasMore, isLoading]);

 // Fetch more when page changes
 useEffect(() => {
 if (page > 1) {
 Promise.resolve().then(() => fetchAnomalies(page));
 }
 }, [page, fetchAnomalies]);

 const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
 setShowToast({ message, type });
 setTimeout(() => setShowToast(null), 3000);
 };

  const handleDecision = async (decision: 'accept' | 'reject' | 'reclassify') => {
  if (!selectedId) return;
  try {
  const statusMapping = {
    'accept': 'confirmed_unknown',
    'reject': 'false_positive',
    'reclassify': 'known_object'
  } as const;
  const updated = await submitReview(selectedId, { status: statusMapping[decision], notes });
  setAnomalies(prev => prev.map(a => a.id === selectedId ? updated : a));
 
 // Update local feedback count for demo
 if (feedbackData) {
 setFeedbackData({ ...feedbackData, feedbackSamples: feedbackData.feedbackSamples + 1 });
 }
 
 triggerToast('Review saved successfully. Added to feedback loop.');
 setNotes('');
 
 // Select next pending
 const nextPending = anomalies.find(a => a.id !== selectedId && a.reviewStatus === 'pending');
 if (nextPending) {
 setTimeout(() => setSelectedId(nextPending.id), 500);
 }
 } catch (e) {
 console.error(e);
 }
 };

 const selectedAnomaly = anomalies.find(a => a.id === selectedId);

 return (
 <div className="relative flex-1 w-full flex flex-col h-full bg-void text-text-primary overflow-hidden">
 
 <div className="relative z-10 flex flex-col h-full w-full">
 {/* Toast Notification */}
 {showToast && (
 <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
 <div className="bg-success/10 border border-success text-text-primary px-4 py-2 shadow-lg backdrop-blur-md flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-success" />
 <span className="text-[11px] font-mono font-bold uppercase tracking-widest">{showToast.message}</span>
 </div>
 </div>
 )}

 {/* Header & Tabs */}
 <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b border-border bg-surface shrink-0">
 <div>
 <h2 className="text-[15px] font-display font-light uppercase tracking-[0.15em] text-text-primary">
 {activeTab === 'review' ? 'Human Review Queue' : 'Survey Intelligence Report'}
 </h2>
 <p className="text-text-secondary mt-1 text-[11px] font-mono">
 {activeTab === 'review' 
 ? 'Validate AI detections and provide feedback to improve the model.' 
 : 'Exportable operational summary for Sector 7A.'}
 </p>
 </div>
 
 <div className="flex bg-void border border-border shrink-0 p-0.5">
 <button 
 onClick={() => setActiveTab('review')}
 className={`px-4 py-2 text-[10px] font-light uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${
 activeTab === 'review' ? 'bg-surface text-text-primary border border-border shadow-[var(--glow-accent)]' : 'text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent'
 }`}
 >
 <FileCheck className="w-3 h-3 shrink-0" /> Review Queue
 </button>
 <button 
 onClick={() => setActiveTab('report')}
 className={`px-4 py-2 text-[10px] font-light uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${
 activeTab === 'report' ? 'bg-surface text-text-primary border border-border shadow-[var(--glow-accent)]' : 'text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent'
 }`}
 >
 <FileText className="w-3 h-3 shrink-0" /> Final Report
 </button>
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 min-h-0 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative z-10">
 
 {activeTab === 'review' && (
 <div className="max-w-[1600px] mx-auto min-h-full flex flex-col xl:flex-row gap-6">
 
 {/* Left: Queue */}
 <div className={`${paneClass} w-full xl:w-[320px] shrink-0 flex flex-col h-[400px] xl:h-full overflow-hidden`}>
 <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-void ">
 <h3 className="font-light font-display text-text-primary text-[11px] uppercase tracking-[0.2em] flex items-center gap-2"><List className="w-3 h-3 text-accent" /> Pending Review</h3>
 <span className="bg-surface text-text-muted border border-border text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-sm">
 {anomalies.filter(a => a.reviewStatus === 'pending').length} left
 </span>
 </div>
 <ul className="flex-1 overflow-y-auto divide-y divide-border custom-scrollbar">
 {anomalies.map(anomaly => (
 <li key={anomaly.id}>
 <button
 onClick={() => setSelectedId(anomaly.id)}
 className={`w-full text-left px-4 py-3 transition-colors duration-150 flex flex-col gap-2 border-l-2 outline-none focus-visible:bg-border/30
 ${selectedId === anomaly.id ? 'bg-void border-cyan' : 'bg-transparent border-transparent hover:bg-void '}
 `}
 >
 <div className="flex items-center justify-between">
 <span className={`font-display text-[12px] font-light uppercase tracking-[0.1em] ${selectedId === anomaly.id ? 'text-accent shadow-[var(--glow-accent)]' : 'text-text-primary group-hover:text-white transition-colors'}`}>{anomaly.label}</span>
 {anomaly.reviewStatus === 'pending' ? (
 <div className="w-1.5 h-1.5 bg-warning animate-glow-pulse shadow-[var(--glow-accent)] rounded-full"></div>
 ) : (
 <Check className="w-3 h-3 text-success" />
 )}
 </div>
 <StatusBadge status={anomaly.reviewStatus} label={anomaly.customClassName || undefined} />
 {anomaly.notes && (
 <div className="mt-1 text-[9px] font-mono text-text-secondary bg-surface p-2 border border-border text-left truncate">
 <span className="text-cyan font-bold uppercase">NOTES:</span> {anomaly.notes}
 </div>
 )}
 </button>
 </li>
 ))}
 
 {/* Infinite scroll trigger */}
 {hasMore && (
 <li ref={observerTarget} className="p-4 text-center">
 <span className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">
 {isLoading ? 'Loading...' : 'Scroll for more'}
 </span>
 </li>
 )}
 {!hasMore && anomalies.length > 0 && (
 <li className="p-4 text-center">
 <span className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">
 End of queue
 </span>
 </li>
 )}
 </ul>
 </div>

 {/* Center: Evidence Viewer */}
 <div className={`${paneClass} flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar`}>
 {selectedAnomaly ? (
 <div className="flex flex-col p-6 gap-6 max-w-4xl mx-auto w-full">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-xl font-display font-light uppercase tracking-[0.15em] text-text-primary mb-2">{selectedAnomaly.label} Evidence</h3>
 <div className="flex items-center gap-4 text-[11px] font-mono text-text-secondary">
 <button 
 onClick={() => navigate('/map', { state: { selectedAnomalyId: selectedAnomaly.id } })}
 className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-pointer bg-surface px-2 py-1 border border-border hover:border-text-secondary"
 title="View on Map"
 >
 <Navigation className="w-3 h-3 text-cyan" /> 
 {formatCoordinates(selectedAnomaly.latitude, selectedAnomaly.longitude)}
 </button>
 <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(selectedAnomaly.detectedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} UTC</span>
 </div>
 </div>
 <div className="text-right flex items-center gap-4">
   <div className="flex flex-col items-end">
     <div className="text-2xl font-mono font-bold text-text-primary leading-none">{(selectedAnomaly.confidence).toFixed(1)}%</div>
     <div className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold mt-1">Confidence</div>
   </div>
   <div className="flex flex-col items-end border-l border-border pl-4">
     <div className="text-4xl font-mono font-bold text-danger leading-none">{selectedAnomaly.overallScore}</div>
     <div className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold mt-1">Overall Score</div>
   </div>
 </div>
 </div>
 
  {/* Evidence Images */}
  <div className={`grid grid-cols-1 ${selectedAnomaly.opticalImagePath ? 'md:grid-cols-2' : ''} gap-4`}>
    <div className="flex flex-col gap-2">
      <div className="text-[10px] text-text-secondary font-mono uppercase tracking-widest font-bold">Sonar Evidence</div>
      <div className="w-full h-72 bg-surface border border-border relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #45A796 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Dynamic Sonar Shape Rendering */}
        {(() => {
        const isCable = selectedAnomaly.label.toLowerCase().includes('cable') || selectedAnomaly.explanation.toLowerCase().includes('cable');
        const isUnknown = selectedAnomaly.classification === 'unknown';
        
        if (isCable) {
        return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-80 drop-shadow-[0_0_8px_rgba(224,87,99,0.8)]">
        <path d="M0,80 Q40,60 60,30 T100,10" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeDasharray="4,2" className="animate-pulse"/>
        <path d="M0,82 Q40,62 60,32 T100,12" fill="none" stroke="var(--color-danger)" strokeWidth="0.5" opacity="0.6"/>
        <rect x="55" y="25" width="10" height="10" fill="var(--color-danger)" fillOpacity="0.2" stroke="var(--color-danger)" strokeWidth="0.5" className="animate-ping" style={{transformOrigin: '60px 30px'}}/>
        </svg>
        );
        } else if (isUnknown) {
        const getSeededRandom = (seed: string) => {
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
        return () => {
        h = Math.imul(1525540023, h) + 1 | 0;
        return (h >>> 0) / 4294967296;
        };
        };
        const rand = getSeededRandom(selectedAnomaly.id);
        const numPoints = 5 + Math.floor(rand() * 4);
        const points = Array.from({ length: numPoints }).map((_, i) => {
        const angle = (i / numPoints) * Math.PI * 2;
        const radius = 20 + rand() * 30; // Radius between 20 and 50
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        return (
        <svg viewBox="0 0 100 100" className="absolute inset-1/4 w-1/2 h-1/2 opacity-80 drop-shadow-[0_0_12px_rgba(229,184,105,0.8)]">
        <polygon points={points} fill="var(--color-warning)" fillOpacity="0.15" stroke="var(--color-warning)" strokeWidth="1" strokeDasharray="3,3" className="animate-pulse" />
        <circle cx="50" cy="50" r={30 + rand() * 15} fill="none" stroke="var(--color-warning)" strokeWidth="0.5" opacity="0.3" strokeDasharray="2,4" />
        </svg>
        );
        } else {
        return (
        <div className="absolute inset-[30%] border border-cyan rounded-md opacity-60 bg-cyan/10 shadow-[0_0_20px_rgba(69,167,150,0.4)] flex items-center justify-center">
        <div className="w-1/2 h-1/2 bg-cyan/50 rounded-md animate-ping"></div>
        </div>
        );
        }
        })()}

        <span className="absolute bottom-3 left-3 text-[9px] font-mono text-cyan bg-void px-2 py-1 border border-cyan/30 uppercase tracking-widest">Sonar Crop — 450kHz</span>
      </div>
    </div>
    
    {selectedAnomaly.opticalImagePath && (
      <div className="flex flex-col gap-2">
        <div className="text-[10px] text-text-secondary font-mono uppercase tracking-widest font-bold flex justify-between">
          <span>Optical Evidence</span>
          <span className="text-cyan">CONF: {(selectedAnomaly.opticalConfidence! * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-72 bg-void border border-border relative overflow-hidden flex items-center justify-center">
          <img 
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/uploads/${selectedAnomaly.opticalImagePath.split('/').pop()}`} 
            alt="Optical Evidence" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-border pointer-events-none"></div>
          <span className="absolute bottom-3 left-3 text-[9px] font-mono text-cyan bg-void/80 backdrop-blur-sm px-2 py-1 border border-cyan/30 uppercase tracking-widest">Optical Cam</span>
        </div>
      </div>
    )}
  </div>
  
  {!selectedAnomaly.opticalImagePath && (
    <OpticalUploader 
      anomalyId={selectedAnomaly.id} 
      onAnalysisComplete={(updatedAnomaly) => {
        setAnomalies(prev => prev.map(a => a.id === updatedAnomaly.id ? updatedAnomaly : a));
      }} 
    />
  )}

  {selectedAnomaly.finalClassification && (
    <div className="bg-surface border border-cyan/30 p-5 mt-2 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse shadow-[var(--glow-accent)]"></div>
        <div className="text-[10px] font-bold text-cyan uppercase tracking-[0.2em]">Final Target Identification</div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-display font-light text-text-primary capitalize mb-1">{selectedAnomaly.finalClassification.replace(/_/g, ' ')}</div>
          <div className="text-[11px] font-mono text-text-secondary">Combined Sonar & Optical Analysis</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-cyan">{(selectedAnomaly.finalConfidence! * 100).toFixed(1)}%</div>
          <div className="text-[10px] font-mono text-text-secondary tracking-widest uppercase">Confidence</div>
        </div>
      </div>
    </div>
  )}
 
 {/* Context Info */}
 <div className="bg-surface border border-border p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
 <div>
 <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Seabed Nature</div>
 <div className="text-text-primary font-mono text-[11px] capitalize">{selectedAnomaly.seabedNature || 'Unknown'}</div>
 </div>
 <div>
 <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Risk Level</div>
 <div className="text-text-primary font-mono text-[11px] capitalize">{selectedAnomaly.riskLevel || selectedAnomaly.severity}</div>
 </div>
 <div>
 <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Depth</div>
 <div className="text-text-primary font-mono text-[11px]">{selectedAnomaly.depthMeters} m</div>
 </div>
 <div>
 <div className="text-[9px] text-text-secondary font-mono uppercase tracking-widest font-bold mb-1.5">Geolocation</div>
 <div className="text-text-primary font-mono text-[11px]">{formatCoordinates(selectedAnomaly.latitude, selectedAnomaly.longitude)}</div>
 </div>
 </div>

 {/* Explanation */}
 <div className="bg-surface border border-border p-5 flex flex-col gap-3">
 <div className="flex items-center gap-2">
 <Zap className="w-4 h-4 text-[#B993FF] shrink-0" />
 <div className="text-[10px] font-bold text-[#B993FF] uppercase tracking-[0.2em]">AI-Assisted Explanation</div>
 </div>
 <p className="text-xs text-text-primary font-mono leading-relaxed pl-6 border-l border-[#B993FF]/30">{selectedAnomaly.explanation}</p>
 {selectedAnomaly.notes && (
   <div className="mt-2 pt-3 border-t border-border">
     <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-2">Historical Notes</div>
     <p className="text-xs text-text-secondary font-mono leading-relaxed pl-6 border-l border-border">{selectedAnomaly.notes}</p>
   </div>
 )}
 </div>
 </div>
 ) : (
 <div className="flex-1 flex items-center justify-center text-text-secondary font-mono text-xs uppercase tracking-widest">Select an anomaly to review</div>
 )}
 </div>

 {/* Right: Decision Card */}
 <div className={`${paneClass} w-full xl:w-[360px] shrink-0 flex flex-col overflow-y-auto custom-scrollbar`}>
 <div className="p-6 flex flex-col gap-6">
 <h3 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.12em]">Review Decision</h3>
 
 <div className="flex flex-col gap-2">
 <button 
 onClick={() => handleDecision('accept')}
 className="w-full text-left px-4 py-3 bg-void hover:bg-surface border border-border transition-colors text-text-primary font-mono text-[11px] uppercase tracking-widest flex items-center justify-between group"
 >
 Accept
 <CheckCircle2 className="w-4 h-4 text-[#B993FF] opacity-0 group-hover:opacity-100 transition-opacity" />
 </button>
 <button 
 onClick={() => handleDecision('reject')}
 className="w-full text-left px-4 py-3 bg-void hover:bg-surface border border-border transition-colors text-text-primary font-mono text-[11px] uppercase tracking-widest flex items-center justify-between group"
 >
 Reject
 <CheckCircle2 className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
 </button>
 <button 
 onClick={() => handleDecision('reclassify')}
 className="w-full text-left px-4 py-3 bg-void hover:bg-surface border border-border transition-colors text-text-primary font-mono text-[11px] uppercase tracking-widest flex items-center justify-between group"
 >
 Reclassify
 <CheckCircle2 className="w-4 h-4 text-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
 </button>
 <button 
 onClick={() => setShowNewClassModal(true)}
 className="w-full text-center px-4 py-2 mt-2 bg-transparent border border-border hover:border-text-secondary transition-colors text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-widest border-dashed">
 + Add New Class
 </button>
 </div>
 
 <div className="relative flex flex-col gap-2">
 <div className="flex items-center justify-between">
 <label className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-bold flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Operator Notes</label>
 {notes && (
   <button 
     onClick={() => {
       setNotes('');
       if (selectedId) {
         setAnomalies(prev => prev.map(a => a.id === selectedId ? { ...a, notes: '' } : a));
       }
     }}
     className="text-[9px] text-text-secondary hover:text-danger uppercase tracking-wider font-bold transition-colors"
   >
     Clear
   </button>
 )}
 </div>
 <textarea 
 value={notes}
 onChange={e => setNotes(e.target.value)}
 onBlur={() => {
 if (notes.trim() !== '' && selectedId) {
 setAnomalies(prev => prev.map(a => a.id === selectedId ? { ...a, notes } : a));
 triggerToast('Notes saved successfully');
 }
 }}
 className="w-full bg-void border border-border p-3 text-[11px] font-mono text-text-primary focus:outline-none focus:border-cyan resize-none h-32 transition-colors placeholder-text-muted" 
 placeholder="Add justification for the model feedback loop..."
 ></textarea>
 </div>
 
 <div className="bg-success/10 border border-success/30 p-3 flex items-start gap-3">
 <Zap className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
 <div className="text-[10px] font-mono text-success uppercase tracking-wider leading-relaxed">
 Your decision adds to the active learning set for Model v1.1
 </div>
 </div>
 </div>
 </div>

 </div>
 )}

 {activeTab === 'report' && (
 <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500 p-6 h-full overflow-y-auto custom-scrollbar">
 
 {/* Report Actions */}
 <div className="flex gap-2">
 <button 
 onClick={() => {
 triggerToast('Generating PDF...');
 setTimeout(() => { triggerToast('Downloaded PDF'); }, 1500);
 }}
 className="bg-surface hover:bg-border border border-border text-text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
 >
 <Download className="w-3 h-3" /> Export PDF
 </button>
 <button 
 onClick={() => {
 triggerToast('Generating CSV...');
 setTimeout(() => { triggerToast('Downloaded CSV'); }, 1000);
 }}
 className="bg-surface hover:bg-border border border-border text-text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
 >
 <FileText className="w-3 h-3" /> Export CSV
 </button>
 <button onClick={async () => {
 try { await navigator.clipboard.writeText(window.location.href); triggerToast('Link copied!'); } 
 catch (err) { console.error(err); triggerToast('Failed to copy', 'info'); }
 }} className="bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2 ml-auto">
 <Share2 className="w-3 h-3" /> Share Demo Link
 </button>
 </div>
 
 {/* Disclaimer */}
 <div className="bg-warning/10 border border-warning/30 p-3 flex items-start gap-3">
 <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
 <p className="text-[11px] font-mono text-warning leading-relaxed uppercase tracking-wider">
 <strong>Disclaimer:</strong> Prototype output for operational review. Not a substitute for certified marine assessment.
 </p>
 </div>
 
 {/* Summary Cards */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <div className={`${paneClass} p-4`}>
 <div className="text-[9px] text-text-secondary mb-1 font-bold uppercase tracking-[0.2em]">Coverage</div>
 <div className="text-xl font-mono font-bold text-text-primary">{reportData?.surveyCoverage}</div>
 </div>
 <div className={`${paneClass} p-4`}>
 <div className="text-[9px] text-text-secondary mb-1 font-bold uppercase tracking-[0.2em]">Normal</div>
 <div className="text-xl font-mono font-bold text-success">{reportData?.normalRegions}</div>
 </div>
 <div className={`${paneClass} p-4`}>
 <div className="text-[9px] text-text-secondary mb-1 font-bold uppercase tracking-[0.2em]">Known Obj</div>
 <div className="text-xl font-mono font-bold text-cyan">{reportData?.knownAnomalies}</div>
 </div>
 <div className={`${paneClass} p-4`}>
 <div className="text-[9px] text-text-secondary mb-1 font-bold uppercase tracking-[0.2em]">Unknown</div>
 <div className="text-xl font-mono font-bold text-[#B993FF]">{reportData?.unknownAnomalies}</div>
 </div>
 <div className={`${paneClass} p-4`}>
 <div className="text-[9px] text-text-secondary mb-1 font-bold uppercase tracking-[0.2em]">New</div>
 <div className="text-xl font-mono font-bold text-danger">{reportData?.newChanges}</div>
 </div>
 </div>
 
 {/* Map Snapshot & Table */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
 <div className={`lg:col-span-1 ${paneClass} overflow-hidden relative`}>
 <Map
 initialViewState={{
 longitude: HARBOURS[activeHarbour].lng,
 latitude: HARBOURS[activeHarbour].lat,
 zoom: 12
 }}
 >
 {anomalies.filter(a => a.priority === 'immediate' || a.priority === 'high').map(anomaly => (
 <Marker
 key={anomaly.id}
 longitude={anomaly.longitude}
 latitude={anomaly.latitude}
 >
 <div className="w-2 h-2 bg-danger border border-void animate-pulse"></div>
 </Marker>
 ))}
 </Map>
 </div>
 
 <div className={`lg:col-span-2 ${paneClass} overflow-hidden flex flex-col`}>
 <div className="p-4 border-b border-border bg-void ">
 <h3 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.12em]">Top Priority Detections</h3>
 </div>
 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left">
 <thead className="text-[9px] text-text-secondary font-mono uppercase tracking-widest bg-void border-b border-border sticky top-0 z-10">
 <tr>
 <th className="px-4 py-2 font-bold">ID</th>
 <th className="px-4 py-2 font-bold">Class</th>
 <th className="px-4 py-2 font-bold">Score</th>
 <th className="px-4 py-2 font-bold">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {anomalies.sort((a, b) => b.overallScore - a.overallScore).slice(0, 10).map(a => (
 <tr 
 key={a.id} 
 className="hover:bg-void transition-colors text-[11px] font-mono text-text-primary cursor-pointer"
 onClick={() => {
 setSelectedId(a.id);
 setActiveTab('review');
 }}
 >
 <td className="px-4 py-2.5">{a.id}</td>
 <td className="px-4 py-2.5 capitalize">{a.classification.replace('_', ' ')}</td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-2">
 <div className="w-12 h-1 bg-border overflow-hidden">
 <div className="bg-danger h-full" style={{ width: `${a.overallScore}%` }}></div>
 </div>
 <span className="text-[10px] text-text-secondary">{a.overallScore}</span>
 </div>
 </td>
 <td className="px-4 py-2.5"><StatusBadge status={a.reviewStatus} label={a.customClassName || undefined} /></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 </div>
 )}
 
 {showNewClassModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-void backdrop-blur-sm">
 <div className="bg-surface border border-border p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
 <h3 className="text-[11px] font-display font-bold tracking-[0.1em] uppercase text-text-primary">Add New Class</h3>
 <input 
 type="text"
 autoFocus
 value={newClassName}
 onChange={(e) => setNewClassName(e.target.value)}
 onKeyDown={async (e) => {
 if (e.key === 'Enter' && newClassName.trim() !== '') {
 try {
 const updated = await submitReview(selectedId!, { status: 'confirmed_unknown', newClass: newClassName.trim() });
 setAnomalies(prev => prev.map(a => a.id === selectedId ? updated : a));
 triggerToast(`Class '${newClassName}' added successfully`);
 } catch (e) { console.error(e); }
 setShowNewClassModal(false);
 setNewClassName('');
 }
 if (e.key === 'Escape') {
 setShowNewClassModal(false);
 setNewClassName('');
 }
 }}
 placeholder="e.g. Submerged Container"
 className="w-full bg-void border border-border p-2.5 text-[11px] font-mono text-text-primary focus:outline-none focus:border-cyan"
 />
 <div className="flex justify-end gap-2 mt-2">
 <button 
 onClick={() => { setShowNewClassModal(false); setNewClassName(''); }}
 className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary hover:bg-void transition-colors border border-transparent"
 >
 Cancel
 </button>
 <button 
 onClick={async () => {
 if (newClassName.trim() !== '') {
 try {
 const updated = await submitReview(selectedId!, { status: 'confirmed_unknown', newClass: newClassName.trim() });
 setAnomalies(prev => prev.map(a => a.id === selectedId ? updated : a));
 triggerToast(`Class '${newClassName}' added successfully`);
 } catch (e) { console.error(e); }
 setShowNewClassModal(false);
 setNewClassName('');
 }
 }}
 className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan transition-colors"
 >
 Add Class
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 </div>
 </div>
 );
}
