import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Anomaly } from '../data/mockData';

interface OpticalUploaderProps {
  anomalyId: string;
  onAnalysisComplete: (updatedAnomaly: Anomaly) => void;
}

export default function OpticalUploader({ anomalyId, onAnalysisComplete }: OpticalUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitAnalysis = async () => {
    if (!file) return;
    setStatus('analyzing');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`http://localhost:8000/api/anomalies/${anomalyId}/optical`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Optical analysis could not be completed.");
      }
      
      const updatedAnomaly = await res.json();
      onAnalysisComplete(updatedAnomaly);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Optical analysis failed.');
    }
  };

  if (status === 'error') {
    return (
      <div className="bg-danger/10 border border-danger/30 p-4 rounded-lg flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger mt-0.5" />
          <div className="text-[11px] font-mono text-danger">
            <div className="font-bold mb-1">Analysis Failed</div>
            {errorMsg}
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={submitAnalysis} className="text-[10px] font-bold uppercase tracking-widest text-text-primary bg-danger/20 hover:bg-danger/30 px-3 py-1.5 rounded transition-colors">Retry</button>
          <button onClick={removeImage} className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary px-3 py-1.5 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  if (status === 'analyzing') {
    return (
      <div className="bg-surface border border-border p-6 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 text-cyan animate-spin" />
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-widest text-text-primary mb-1">Analyzing Optical Evidence</div>
          <div className="text-[10px] font-mono text-text-secondary">Comparing visual evidence with the detected sonar target...</div>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="bg-surface border border-border p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Image Preview</div>
          <button onClick={removeImage} className="text-text-secondary hover:text-danger"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-void border border-border overflow-hidden shrink-0">
            <img src={preview} alt="Optical Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="text-[11px] font-mono text-text-primary truncate">{file?.name}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary border border-border px-3 py-1.5 transition-colors">Replace</button>
              <button onClick={submitAnalysis} className="text-[10px] font-bold uppercase tracking-widest text-cyan border border-cyan/30 bg-cyan/10 hover:bg-cyan/20 px-4 py-1.5 transition-colors shadow-[var(--glow-accent)]">Analyze Optical Image →</button>
            </div>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border p-5 flex flex-col gap-4">
      <div>
        <div className="text-[11px] font-bold text-text-primary uppercase tracking-[0.1em] mb-1">Optical Verification</div>
        <div className="text-[10px] font-mono text-text-secondary">Do you have an optical image of this target? Upload an optical image to help identify what this detected target actually is.</div>
      </div>
      <div 
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-24 border-2 border-dashed border-border hover:border-cyan/50 bg-void/50 hover:bg-surface transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
      >
        <Upload className="w-5 h-5 text-text-secondary group-hover:text-cyan transition-colors" />
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest group-hover:text-text-primary transition-colors">Upload Optical Image</div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
    </div>
  );
}
