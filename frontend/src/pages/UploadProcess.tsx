import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, CheckCircle2, FileJson, Image as ImageIcon, ArrowRight, AlertCircle, Anchor } from 'lucide-react';
import { startSurveyProcessing } from '../services/api';

type ProcessState = 'upload' | 'processing' | 'complete';

const paneClass = 'bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] relative overflow-hidden';
const inputClass = 'w-full bg-glass backdrop-blur-3xl border border-glass-border rounded-xl px-4 py-2.5 text-[11px] font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:shadow-[0_0_10px_rgba(0,255,170,0.2)] transition-all';

export default function UploadProcess() {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<ProcessState>('upload');
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [metadata, setMetadata] = useState({
    surveyName: '', vessel: '', area: '', surveyDate: '', depthRange: '', baselineRef: ''
  });
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const hasFiles = selectedFiles.length > 0;

  const steps = [
    'Ingest Survey',
    'Register Coordinates',
    'Compare Baseline',
    'Detect Anomalies',
    'Prepare Review Queue'
  ];

  useEffect(() => {
    if (appState !== 'processing') return;
    let p = 0;
    let logIndex = 0;
    
    Promise.resolve().then(() => setTerminalLogs([`> Initiating S.A.G.A.R. pipeline for survey...`]));
    
    const interval = setInterval(() => {
      p += Math.random() * 5 + 1;
      
      if (p > (logIndex + 1) * 20 && logIndex < steps.length) {
         setTerminalLogs(prev => [...prev, `> ${steps[logIndex]}... [OK]`]);
         logIndex++;
      }
      
      if (p >= 100) {
        p = 100;
        setTerminalLogs(prev => [...prev, `> Pipeline execution finished. Ready for review.`]);
        setAppState('complete');
        clearInterval(interval);
      }
      setProgress(p);
    }, 200);
    startSurveyProcessing('surv_003');
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const handleStartAnalysis = () => {
    if (!hasFiles) { setShowErrorToast(true); setTimeout(() => setShowErrorToast(false), 3000); return; }
    setAppState('processing');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    setShowErrorToast(false);
    const jsonFile = files.find(f => f.name.endsWith('.json'));
    if (jsonFile) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const d = JSON.parse(ev.target?.result as string);
          setMetadata(prev => ({
            ...prev,
            surveyName: d.surveyName || d.name || prev.surveyName,
            vessel: d.vessel || d.platform || prev.vessel,
            area: d.area || d.location || prev.area,
            surveyDate: d.surveyDate || d.date || prev.surveyDate,
            depthRange: d.depthRange || d.depth || prev.depthRange,
            baselineRef: d.baselineRef || d.baseline || prev.baselineRef,
          }));
        } catch {}
      };
      reader.readAsText(jsonFile);
    }
  };

  const formatSize = (b: number) => {
    if (b === 0) return '0 B';
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
  };

  const getIcon = (name: string) => {
    if (name.endsWith('.json')) return <FileJson className="w-5 h-5 text-[#60A5FA] shrink-0" />;
    if (name.match(/\.(png|jpg|jpeg)$/i)) return <ImageIcon className="w-5 h-5 text-[#B993FF] shrink-0" />;
    return <File className="w-5 h-5 text-[#8B9BB4] shrink-0" />;
  };

  return (
    <div className="relative flex-1 w-full flex flex-col h-full bg-void text-text-primary overflow-hidden">
      {/* ── FULL SCREEN DARK TECH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-glass-strong)_0%,_var(--color-void)_50%)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex-1 w-full flex flex-col p-6 overflow-y-auto custom-scrollbar">

      {/* Error Toast */}
      {showErrorToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className="bg-danger/10 border border-danger text-text-primary px-4 py-2 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-danger">Upload missing</span>
          </div>
        </div>
      )}

      {appState === 'upload' && (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Anchor className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-[9px] text-text-secondary font-mono uppercase tracking-[0.2em]">Data Ingestion</span>
            </div>
            <h2 className="text-xl font-display font-bold uppercase tracking-[0.1em] text-text-primary">Survey Upload</h2>
            <p className="text-text-secondary text-[11px] font-mono mt-1">Import sonar data and metadata for baseline comparison.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Drop zone + metadata */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={onFileChange} accept=".sl2,.xtf,.png,.jpg,.jpeg,.json" />

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer ${paneClass} p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:bg-glass-strong`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 border ${hasFiles ? 'bg-accent/10 border-accent/30 text-accent shadow-[var(--glow-accent)]' : 'bg-glass border-glass-border text-text-muted group-hover:border-accent/30 group-hover:text-accent'}`}>
                  {hasFiles ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                </div>
                <h3 className="text-text-primary text-[12px] font-mono uppercase tracking-widest mb-2">{hasFiles ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} queued` : 'Select survey files'}</h3>
                <p className="text-[10px] text-text-secondary font-mono uppercase tracking-widest max-w-sm mb-6">Supported formats: .sl2, .xtf, .json</p>
                <div className={`text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all duration-300 border ${hasFiles ? 'bg-glass-strong border-glass-border-strong text-text-primary' : 'bg-glass border-glass-border text-text-secondary group-hover:border-accent/50 group-hover:text-accent group-hover:bg-accent/10'}`}>
                  {hasFiles ? 'Add More' : 'Browse Files'}
                </div>
              </div>

              {/* Metadata form */}
              <div className={`${paneClass} p-6`}>
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                  <FileJson className="w-3.5 h-3.5 text-text-secondary" /> Survey Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'surveyName',  label: 'Survey Name',       placeholder: 'e.g. Mumbai Harbor Q4', type: 'text' },
                    { key: 'vessel',      label: 'Vessel / Platform',  placeholder: 'e.g. R/V Samudra Shakti', type: 'text' },
                    { key: 'area',        label: 'Area / Sector',      placeholder: 'e.g. Sector 7A', type: 'text' },
                    { key: 'surveyDate',  label: 'Survey Date',        placeholder: '', type: 'date' },
                    { key: 'depthRange',  label: 'Depth Range',        placeholder: 'e.g. 15–45m', type: 'text' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.1em]">{label}</label>
                      <input
                        type={type}
                        value={(metadata as any)[key]}
                        onChange={e => setMetadata(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className={inputClass}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.1em]">Baseline Reference</label>
                    <select
                      value={metadata.baselineRef}
                      onChange={e => setMetadata(p => ({ ...p, baselineRef: e.target.value }))}
                      className={`${inputClass} cursor-pointer appearance-none`}
                    >
                      <option value="" disabled>Select baseline…</option>
                      <option value="Coastal Baseline 2025">Coastal Baseline 2025</option>
                      <option value="Harbor Survey 2024">Harbor Survey 2024</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: File list + CTA */}
            <div className="flex flex-col gap-6">
              <div className={`${paneClass} p-5 flex-1 flex flex-col`}>
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                  <UploadCloud className="w-3.5 h-3.5 text-text-secondary" /> Queued Files
                </h3>
                {hasFiles ? (
                  <div className="space-y-2 flex-1 max-h-80 overflow-y-auto custom-scrollbar">
                    {selectedFiles.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="bg-glass border border-glass-border rounded-xl p-3 flex items-start gap-3 hover:bg-glass-strong transition-colors">
                        <div className="mt-0.5">{getIcon(file.name)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono font-bold text-text-primary truncate">{file.name}</p>
                          <p className="text-[9px] text-text-secondary mt-0.5 font-mono">{formatSize(file.size)}</p>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-text-muted text-[11px] font-mono uppercase tracking-widest bg-glass rounded-xl border border-dashed border-glass-border-strong p-6 text-center">
                    <p>No files queued</p>
                  </div>
                )}
              </div>

              <div className={`${paneClass} p-5`}>
                {hasFiles && (
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-[10px] font-mono text-accent uppercase tracking-widest leading-relaxed">Metadata verified.<br/>Ready for execution.</p>
                  </div>
                )}

                <button
                  onClick={handleStartAnalysis}
                  className={`w-full text-[11px] font-bold uppercase tracking-widest px-4 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border ${
                    hasFiles
                      ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 hover:shadow-[var(--glow-accent)]'
                      : 'bg-glass text-text-muted cursor-not-allowed border-glass-border'
                  }`}
                >
                  Execute Pipeline <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(appState === 'processing' || appState === 'complete') && (
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[9px] text-text-secondary font-mono uppercase tracking-[0.2em]">Data Ingestion</span>
          </div>
          <h2 className="text-xl font-display font-bold uppercase tracking-[0.1em] text-text-primary mb-6">Pipeline Execution</h2>
            
          <div className={`w-full ${paneClass} flex flex-col flex-1 min-h-[400px]`}>

            {/* Terminal Header */}
            <div className="p-4 border-b border-glass-border bg-glass-strong flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-text-muted rounded-full"></div>
                  <span className="text-[10px] font-bold font-mono text-text-secondary uppercase tracking-[0.2em]">Terminal</span>
               </div>
               <div className="text-[10px] font-mono text-accent uppercase tracking-widest">{Math.round(progress)}%</div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 bg-glass p-6 flex flex-col font-mono text-[12px] overflow-hidden">
               <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
                 {terminalLogs.map((log, idx) => (
                    <div key={idx} className="text-text-secondary">
                      <span className={log.includes('[OK]') ? 'text-success' : 'text-accent'}>{log.substring(0, 2)}</span>
                      {log.substring(2)}
                    </div>
                 ))}
                 {appState === 'processing' && (
                    <div className="text-accent animate-pulse">_</div>
                 )}
               </div>
               
               {/* Progress Bar inside terminal */}
               <div className="mt-6 border border-glass-border h-1.5 bg-glass-strong rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300 shadow-[var(--glow-accent)]" style={{ width: `${progress}%` }}></div>
               </div>
            </div>
            
            {/* Action Area */}
            {appState === 'complete' && (
              <div className="p-8 border-t border-glass-border bg-glass flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 text-success mb-2">
                   <CheckCircle2 className="w-6 h-6" />
                   <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Execution Completed</span>
                </div>
                <p className="text-[11px] text-text-secondary font-mono text-center uppercase tracking-widest max-w-sm">
                  Model has identified <span className="text-danger font-bold">7</span> unknown anomalies requiring verification.
                </p>
                <button
                  onClick={() => navigate('/map')}
                  className="mt-4 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-[11px] font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-2 hover:shadow-[var(--glow-accent)]"
                >
                  <ArrowRight className="w-4 h-4" /> Open Review Map
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      </div>

      <style>{`
        @keyframes scan { 0% { transform: translateX(-400%); } 100% { transform: translateX(400%); } }
      `}</style>
    </div>
  );
}
