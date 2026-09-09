import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, UploadCloud, CheckCircle2, Image as ImageIcon, AlertCircle,
  XCircle, ArrowRight, Download, Play, Map, FileCheck, BarChart2, Trash2, Clock
} from 'lucide-react';
import { imageProcessingApi, ImageProcessingJobResponse } from '../services/imageProcessingApi';
import { HarbourContext } from '../contexts/AppContext';

type ProcessState = 'upload' | 'processing' | 'assessed' | 'complete' | 'cancelled';

interface HistoryEntry {
  jobId: string;
  harbour: string;
  timestamp: string;
  result: ImageProcessingJobResponse;
  filename: string;
}

const paneClass = 'bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] relative overflow-hidden';

const STAGES = [
  "uploading","noise reduction","contrast enhancement","pixel normalization",
  "resolution standardization","sonar quality assessment","quality mask generation",
  "shadow and object analysis","preparing visual output"
];

function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-yellow-400';
  return 'text-danger';
}

function getCategoryColor(cat: string) {
  const c = cat?.toLowerCase() || '';
  if (c === 'excellent') return 'text-success bg-success/10 border-success/30';
  if (c === 'good') return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
  if (c === 'fair') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
  return 'text-danger bg-danger/10 border-danger/30';
}

function QualityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-glass-border last:border-0">
      <span className="text-text-secondary font-mono text-[12px]">{label}:</span>
      <span className="text-text-primary font-mono text-[12px] font-medium">{value}</span>
    </div>
  );
}

export default function ImageProcessing() {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<ProcessState>('upload');
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<ImageProcessingJobResponse | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("uploading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<HistoryEntry[]>([]);
  const { activeHarbour } = React.useContext(HarbourContext) as { activeHarbour: string };

  const hasFiles = selectedFiles.length > 0;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sonar_scan_history');
      if (saved) setScanHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToHistory = (result: ImageProcessingJobResponse, filename: string) => {
    const entry: HistoryEntry = { jobId: result.jobId, harbour: activeHarbour, timestamp: new Date().toISOString(), result, filename };
    setScanHistory(prev => {
      const updated = [entry, ...prev.filter(e => e.jobId !== result.jobId)].slice(0, 20);
      localStorage.setItem('sonar_scan_history', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFromHistory = (id: string) => {
    setScanHistory(prev => {
      const updated = prev.filter(e => e.jobId !== id);
      localStorage.setItem('sonar_scan_history', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (appState === 'processing' || appState === 'assessed') {
      if (!jobId && appState === 'processing') {
        const imgFile = selectedFiles.find(f => f.name.match(/\.(png|jpg|jpeg|tif|tiff)$/i));
        if (imgFile) {
          imageProcessingApi.createJob(imgFile).then((res: any) => setJobId(res.jobId)).catch(err => { setErrorMessage(err.message || 'Failed to upload image.'); setAppState('upload'); });
        } else { setErrorMessage('No valid image file found.'); setAppState('upload'); }
      } else if (jobId) {
        interval = setInterval(async () => {
          try {
            const status = await imageProcessingApi.getJobStatus(jobId);
            setProgress(status.progress);
            setCurrentStage(status.stage);
            if (status.status === 'assessed' && appState === 'processing') { setAppState('assessed'); setPipelineResult(status); }
            else if (status.status === 'completed') { setPipelineResult(status); setAppState('complete'); clearInterval(interval); saveToHistory(status, selectedFiles[0]?.name || `job_${status.jobId.slice(0, 8)}`); }
            else if (status.status === 'failed') { setErrorMessage('Pipeline execution failed.'); setAppState('upload'); clearInterval(interval); }
            else if (status.status === 'cancelled') { setAppState('cancelled'); clearInterval(interval); }
          } catch (err: any) { console.error("Status fetch error", err); }
        }, 1000);
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [appState, jobId, selectedFiles]);

  const handleStartProcessing = () => {
    if (!hasFiles) { setShowErrorToast(true); setTimeout(() => setShowErrorToast(false), 3000); return; }
    setErrorMessage(null); setAppState('processing'); setCurrentStage('uploading'); setProgress(0);
  };

  const handleAnalyzeAnomalies = async () => {
    if (!jobId) return;
    try { setAppState('processing'); await imageProcessingApi.analyzeJob(jobId); }
    catch (err: any) { setErrorMessage(err.message || 'Failed to start anomaly analysis.'); }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    try { await imageProcessingApi.cancelJob(jobId); setAppState('cancelled'); }
    catch (err: any) { console.error("Cancel error", err); }
  };

  const handleDownload = (asset: string) => {
    if (!jobId) return;
    window.open(`/api/v1/image-processing/jobs/${jobId}/download/${asset}`, '_blank');
  };

  const handleNewImage = () => {
    setAppState('upload'); setSelectedFiles([]); setJobId(null); setPipelineResult(null); setErrorMessage(null); setProgress(0); setCurrentStage('uploading');
  };

  const loadHistoryEntry = (entry: HistoryEntry) => { setPipelineResult(entry.result); setJobId(entry.jobId); setAppState('complete'); };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setSelectedFiles(Array.from(e.target.files)); setShowErrorToast(false); setErrorMessage(null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    setSelectedFiles(Array.from(e.dataTransfer.files)); setShowErrorToast(false); setErrorMessage(null);
  };

  const getStageIndex = (stage: string) => { const idx = STAGES.indexOf(stage); return idx === -1 ? STAGES.length : idx; };
  const currentIdx = getStageIndex(currentStage);
  const qa = pipelineResult?.qualityAssessment;
  const ms = pipelineResult?.maskStatistics;

  return (
    <div className="relative flex-1 w-full flex flex-col h-full bg-void text-text-primary overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.06) 0%, rgba(10,13,18,1) 80%)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex-1 w-full flex flex-col p-6 overflow-y-auto custom-scrollbar gap-6">
        {showErrorToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
            <div className="bg-danger/10 border border-danger text-text-primary px-4 py-2 flex items-center gap-2 shadow-lg backdrop-blur-md rounded-lg">
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-danger">Please select an image first</span>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="w-full bg-danger/10 border border-danger px-4 py-3 flex items-center gap-2 shadow-lg backdrop-blur-md rounded-xl">
            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
            <span className="text-sm font-medium text-danger">{errorMessage}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-accent" />
              <span className="text-[9px] text-text-secondary font-mono uppercase tracking-[0.2em]">Image Processing</span>
            </div>
            <h2 className="text-xl font-display font-bold uppercase tracking-[0.1em] text-text-primary">
              {appState === 'upload' ? 'New Processing Job' : 'Pipeline Execution'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {(appState === 'processing' || appState === 'assessed') && (
              <button onClick={handleCancel} className="bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 px-4 py-2 flex items-center gap-2 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-colors">
                <XCircle className="w-4 h-4" /> Cancel Job
              </button>
            )}
            {(appState === 'complete' || appState === 'cancelled') && (
              <button onClick={handleNewImage} className="bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 px-4 py-2 flex items-center gap-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors">
                <UploadCloud className="w-4 h-4" /> Process New Image
              </button>
            )}
          </div>
        </div>

        {/* UPLOAD STATE */}
        {appState === 'upload' && (
          <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-text-secondary text-[11px] font-mono">Upload a sonar image to begin the enhancement and quality assessment pipeline.</p>
            <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} accept=".png,.jpg,.jpeg,.tif,.tiff" />
            <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
              className={`cursor-pointer ${paneClass} p-14 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:bg-glass-strong border-dashed border-2`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 border ${hasFiles ? 'bg-accent/10 border-accent/30 text-accent shadow-[var(--glow-accent)]' : 'bg-glass border-glass-border text-text-muted group-hover:border-accent/30 group-hover:text-accent'}`}>
                {hasFiles ? <CheckCircle2 className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
              </div>
              <h3 className="text-text-primary text-[14px] font-mono uppercase tracking-widest mb-2">{hasFiles ? selectedFiles[0].name : 'Drag & drop sonar image here'}</h3>
              <p className="text-[11px] text-text-secondary font-mono uppercase tracking-widest mb-6">Supported: .png, .jpg, .jpeg, .tif, .tiff</p>
              <div className={`text-[11px] font-bold uppercase tracking-widest px-8 py-3 rounded-xl border ${hasFiles ? 'bg-glass-strong border-glass-border-strong text-text-primary' : 'bg-glass border-glass-border text-text-secondary group-hover:border-accent/50 group-hover:text-accent group-hover:bg-accent/10'}`}>
                {hasFiles ? 'Change Image' : 'Browse Files'}
              </div>
            </div>
            <div className={`${paneClass} p-4 flex justify-end`}>
              <button onClick={handleStartProcessing}
                className={`text-[12px] font-bold uppercase tracking-widest px-10 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 border ${hasFiles ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 hover:shadow-[var(--glow-accent)]' : 'bg-glass text-text-muted cursor-not-allowed border-glass-border'}`}>
                <Play className="w-4 h-4 fill-current" /> Start Processing
              </button>
            </div>
          </div>
        )}

        {/* CANCELLED */}
        {appState === 'cancelled' && (
          <div className={`${paneClass} p-12 flex flex-col items-center justify-center text-center bg-danger/5 border-danger/20`}>
            <XCircle className="w-12 h-12 text-danger mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Job Cancelled</h3>
            <p className="text-text-secondary text-sm">The image processing job was cancelled.</p>
          </div>
        )}

        {/* PROCESSING / ASSESSED / COMPLETE */}
        {(appState === 'processing' || appState === 'assessed' || appState === 'complete') && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* LEFT COLUMN */}
            <div className="xl:col-span-1 flex flex-col gap-4">

              {/* Pipeline */}
              <div className={`${paneClass} p-5 flex flex-col`}>
                <h3 className="font-bold text-text-primary mb-4 text-[10px] uppercase tracking-[0.15em]">Pipeline Stages</h3>
                <div className="space-y-2.5">
                  {STAGES.map((stage, idx) => {
                    const isActive = stage === currentStage;
                    const isPast = idx < currentIdx;
                    const isFuture = idx > currentIdx;
                    return (
                      <div key={stage} className={`flex items-center gap-3 ${isFuture ? 'opacity-35' : 'opacity-100'} transition-opacity duration-300`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${isPast ? 'bg-success border-success' : isActive ? 'bg-accent border-accent shadow-[var(--glow-accent)]' : 'bg-void border-glass-border'}`}>
                          {isPast ? <CheckCircle2 className="w-2.5 h-2.5 text-void" /> : isActive ? <div className="w-1 h-1 bg-void rounded-full animate-pulse" /> : null}
                        </div>
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${isActive ? 'text-accent font-bold' : isPast ? 'text-success' : 'text-text-secondary'}`}>{stage}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 border border-glass-border h-1.5 bg-glass-strong rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-700 shadow-[var(--glow-accent)]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Quality Assessment */}
              {(appState === 'assessed' || appState === 'complete') && qa && (
                <div className={`${paneClass} p-5 flex flex-col animate-in fade-in duration-500`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <h3 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.15em]">Quality Assessment</h3>
                  </div>
                  <QualityRow label="Overall Score" value={`${qa.overallScore.toFixed(0)}/100`} />
                  <QualityRow label="Category" value={qa.category?.toUpperCase() || 'N/A'} />
                  <QualityRow label="Speckle Noise" value={qa.speckleNoise || 'N/A'} />
                  <QualityRow label="Data Dropout" value={`${(qa.dataDropoutPercentage || 0).toFixed(2)}%`} />
                  <QualityRow label="Image Coverage" value={`${(qa.imageCoveragePercentage || 0).toFixed(2)}%`} />
                  <QualityRow label="Motion Distortion" value={qa.motionDistortion || 'Unavailable'} />
                  <QualityRow label="Shadow Visibility" value={qa.shadowVisibility || 'N/A'} />
                  <QualityRow label="Missing Region" value={`${(qa.missingRegionPercentage || 0).toFixed(2)}%`} />
                  <QualityRow label="Contrast Score" value={(qa.contrastScore || 0).toFixed(2)} />
                  {ms && <QualityRow label="Usable Area" value={`${(ms.usablePercentage || 0).toFixed(1)}%`} />}
                  <div className="mt-3 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${getCategoryColor(qa.category)}`}>
                      {qa.category?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  {appState === 'assessed' && (
                    <button onClick={handleAnalyzeAnomalies}
                      className="mt-4 w-full bg-success/20 hover:bg-success/30 border border-success/40 text-success text-[13px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                      Analyze Anomaly <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Export */}
              {appState === 'complete' && (
                <div className={`${paneClass} p-5 flex flex-col gap-3 animate-in fade-in duration-500`}>
                  <h3 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.15em]">Export Options</h3>
                  <div className="flex flex-col gap-1.5">
                    {[{label:'Original Image',key:'original'},{label:'Enhanced Image',key:'processed'},{label:'Quality Mask',key:'quality_mask'},{label:'Shadow Overlay',key:'shadow_overlay'},{label:'Inference Mask',key:'inference_mask'}].map(({label,key}) => (
                      <button key={key} onClick={() => handleDownload(key)} className="text-left w-full px-4 py-2.5 bg-glass hover:bg-glass-strong border border-glass-border rounded-lg text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between">
                        {label} <Download className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="xl:col-span-2 flex flex-col gap-4">
              {/* Image Preview Card */}
              <div className={`${paneClass} flex flex-col overflow-hidden`}>
                <div className="p-4 border-b border-glass-border bg-glass-strong flex justify-between items-center">
                  <span className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-[0.2em]">Image Preview</span>
                  {appState === 'complete' && <span className="text-[10px] font-mono text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded border border-accent/20">Analysis Complete</span>}
                </div>
                <div className="bg-void flex items-center justify-center p-4">
                  {pipelineResult?.processedImageUrl || pipelineResult?.qualityMaskUrl ? (
                    <div className="w-full grid grid-cols-2 gap-4">
                      <div className="relative aspect-square bg-void rounded-xl border border-glass-border overflow-hidden">
                        <span className="absolute top-3 left-3 z-10 text-[10px] font-mono uppercase bg-void/80 backdrop-blur-md px-2 py-1 rounded border border-glass-border text-text-secondary tracking-widest">Original</span>
                        <img src={pipelineResult.originalImageUrl || ''} alt="Original" className="w-full h-full object-contain p-2" />
                      </div>
                      <div className="relative aspect-square bg-void rounded-xl border border-glass-border overflow-hidden">
                        <span className="absolute top-3 left-3 z-10 text-[10px] font-mono uppercase bg-void/80 backdrop-blur-md px-2 py-1 rounded border border-glass-border text-accent tracking-widest">Processed</span>
                        <img src={pipelineResult.qualityMaskUrl || pipelineResult.processedImageUrl || ''} alt="Processed" className="w-full h-full object-contain p-2" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-text-muted">
                      <div className="w-16 h-16 relative flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-glass-border rounded-full" />
                        <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] font-mono uppercase tracking-widest animate-pulse">Generating preview...</p>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-glass-border bg-glass flex flex-wrap gap-4 items-center justify-center">
                  {[{color:'bg-green-500',label:'Green: Usable',glow:'rgba(34,197,94,0.4)'},{color:'bg-yellow-400',label:'Yellow: Uncertain',glow:'rgba(250,204,21,0.4)'},{color:'bg-red-500',label:'Red/Black: Missing',glow:'rgba(239,68,68,0.4)'},{color:'bg-blue-500',label:'Blue: Shadow',glow:'rgba(59,130,246,0.4)'}].map(({color,label,glow}) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} style={{boxShadow:`0 0 6px ${glow}`}} />
                      <span className="text-[9px] font-mono text-text-secondary uppercase">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ANOMALIES — fills blank space in right column */}
              {appState === 'complete' && pipelineResult?.regionAnalysis && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-accent" />
                    <h3 className="font-display font-bold text-text-primary text-[10px] uppercase tracking-[0.15em]">Detected Anomalies — {activeHarbour}</h3>
                  </div>
                  {pipelineResult.regionAnalysis.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {pipelineResult.regionAnalysis.map((region) => (
                        <div key={region.id} className={`${paneClass} p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors`}>
                          <div className="flex items-start justify-between border-b border-glass-border pb-2">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-accent uppercase tracking-widest">{region.label.replace(/_/g,' ')}</span>
                              <span className="text-[8px] text-text-muted uppercase tracking-widest mt-0.5">{activeHarbour}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded-lg font-mono font-bold border bg-glass border-glass-border ${getScoreColor(region.objectConfidence * 100)}`}>
                              {(region.objectConfidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: 'Object Conf.', val: `${(region.objectConfidence*100).toFixed(1)}%`, color: region.objectConfidence > 0.6 ? 'text-danger' : region.objectConfidence > 0.3 ? 'text-yellow-400' : 'text-success' },
                              { label: 'Shadow Conf.', val: `${(region.shadowConfidence*100).toFixed(1)}%`, color: 'text-blue-400' },
                              { label: 'Uncertainty', val: `${((region.uncertainty||0)*100).toFixed(1)}%`, color: 'text-text-muted' },
                            ].map(({label,val,color}) => (
                              <div key={label} className="bg-glass border border-glass-border rounded-lg p-1.5 flex flex-col items-center text-center">
                                <span className="text-[7px] uppercase text-text-muted tracking-widest mb-0.5">{label}</span>
                                <span className={`text-[11px] font-bold font-mono ${color}`}>{val}</span>
                              </div>
                            ))}
                          </div>
                          <div className="bg-glass border border-glass-border rounded-xl p-2.5 flex flex-col gap-1.5">
                            <span className="text-[7px] uppercase text-text-muted tracking-widest font-bold">Sonar Feature Analysis</span>
                            {[
                              { label: 'Brightness Return', val: region.features?.brightnessReturn ?? 0 },
                              { label: 'Shadow Continuity', val: region.features?.shadowContinuity ?? 0 },
                              { label: 'Shape Score', val: region.features?.shapeScore ?? 0 },
                              { label: 'Texture Score', val: region.features?.textureScore ?? 0 },
                              { label: 'Seabed Similarity', val: region.features?.seabedSimilarity ?? 0 },
                            ].map(({ label, val }) => {
                              const pct = Math.min(100, Math.max(0, (val as number) * 100));
                              const barColor = pct > 66 ? 'bg-success' : pct > 33 ? 'bg-yellow-400' : 'bg-danger';
                              return (
                                <div key={label} className="flex items-center gap-2">
                                  <span className="text-[8px] font-mono text-text-secondary w-[100px] shrink-0">{label}</span>
                                  <div className="flex-1 h-1.5 bg-void rounded-full overflow-hidden border border-glass-border">
                                    <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-[8px] font-mono text-text-muted w-7 text-right">{pct.toFixed(0)}%</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 bg-glass border border-glass-border rounded-xl p-2.5">
                            <span className="col-span-2 text-[7px] uppercase text-text-muted tracking-widest font-bold">Detection Region</span>
                            {[
                              { label: 'X', val: (region.boundingBox?.x ?? 0).toFixed(1) },
                              { label: 'Y', val: (region.boundingBox?.y ?? 0).toFixed(1) },
                              { label: 'Width', val: (region.boundingBox?.width ?? 0).toFixed(1) + 'px' },
                              { label: 'Height', val: (region.boundingBox?.height ?? 0).toFixed(1) + 'px' },
                            ].map(({ label, val }) => (
                              <div key={label} className="flex flex-col">
                                <span className="text-[7px] uppercase text-text-muted tracking-widest mb-0.5">{label}</span>
                                <span className="text-text-primary font-medium text-[9px] font-mono">{val}</span>
                              </div>
                            ))}
                          </div>
                          {region.explanation && (
                            <div className="bg-accent/5 border border-accent/20 rounded-xl p-2.5">
                              <span className="text-[7px] uppercase text-accent tracking-widest font-bold block mb-1">AI Analysis</span>
                              <p className="text-[9px] font-mono text-text-secondary leading-relaxed">{region.explanation}</p>
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5 mt-auto">
                            <button onClick={() => navigate('/map')} className="w-full bg-glass hover:bg-glass-strong border border-glass-border text-text-primary text-[9px] py-2 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-widest font-bold">
                              <Map className="w-3 h-3" /> Locate on Map
                            </button>
                            <button onClick={() => navigate('/review')} className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-[9px] py-2 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-widest font-bold">
                              <FileCheck className="w-3 h-3" /> Send to Human Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-success py-8">
                      <CheckCircle2 className="w-8 h-8" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">No anomalies detected</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}




        {/* SCAN HISTORY — full width below grid */}
        <div className="flex flex-col gap-4 w-full animate-in fade-in duration-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <h3 className="font-display font-bold text-text-primary text-[12px] uppercase tracking-[0.12em]">Previously Assessed Sonar Scans</h3>
            <span className="ml-auto text-[10px] text-text-muted font-mono">{scanHistory.length} record{scanHistory.length !== 1 ? 's' : ''}</span>
          </div>
          {scanHistory.length === 0 ? (
            <div className={`${paneClass} p-8 flex flex-col items-center justify-center gap-2 text-text-muted`}>
              <ImageIcon className="w-8 h-8 opacity-30" />
              <p className="text-[11px] font-mono uppercase tracking-widest opacity-60">No previous scans. Complete a job to see history.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {scanHistory.map((entry) => {
                const eqa = entry.result.qualityAssessment;
                const anomalyCount = entry.result.regionAnalysis?.length ?? 0;
                return (
                  <div key={entry.jobId} className={`${paneClass} p-4 flex items-center gap-4 hover:border-accent/30 transition-colors`}>
                    <div className="w-14 h-14 rounded-lg border border-glass-border bg-void overflow-hidden shrink-0 flex items-center justify-center">
                      {entry.result.originalImageUrl ? (
                        <img src={entry.result.originalImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-text-muted opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-bold text-text-primary truncate">{entry.filename}</span>
                        {eqa && <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(eqa.category)}`}>{eqa.category}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted flex-wrap">
                        <span>{entry.harbour}</span>
                        <span>·</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        {eqa && <><span>·</span><span>Score: <span className={`font-bold ${getScoreColor(eqa.overallScore)}`}>{eqa.overallScore.toFixed(0)}/100</span></span></>}
                        <span>·</span>
                        <span className={anomalyCount > 0 ? 'text-danger font-bold' : 'text-success'}>{anomalyCount} anomal{anomalyCount !== 1 ? 'ies' : 'y'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => loadHistoryEntry(entry)} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors">View</button>
                      <button onClick={() => deleteFromHistory(entry.jobId)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
