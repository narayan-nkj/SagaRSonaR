import React from 'react';
import { Anomaly } from '../../data/mockData';
import StatusBadge from './StatusBadge';
import { ChevronRight, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

interface PriorityQueueProps {
  anomalies: Anomaly[];
  onSelectAnomaly?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  selectedId?: string;
  isLoading?: boolean;
}

export default function PriorityQueue({ anomalies, onSelectAnomaly, onViewDetails, selectedId, isLoading }: PriorityQueueProps) {
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHover = (id: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      onSelectAnomaly?.(id);
    }, 200);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
      <div className="px-5 py-4 border-b border-glass-border flex items-center justify-between shrink-0 bg-glass backdrop-blur-3xl">
        <h2 className="font-display font-light text-[13px] tracking-[0.1em] text-text-primary uppercase flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" /> Active Queue
        </h2>
        <span className="text-[10px] font-mono text-text-muted bg-glass px-2.5 py-1 rounded-sm border border-border">
          {isLoading ? '--' : anomalies.length} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-5 py-4 flex flex-col gap-2 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-glass rounded w-24"></div>
                  <div className="h-3 bg-glass rounded w-16"></div>
                </div>
                <div className="h-2 bg-glass rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mb-4 opacity-40 shadow-[0_0_20px_rgba(74,222,128,0.2)] rounded-full" />
            <span className="text-text-primary font-display font-light tracking-widest text-sm uppercase mb-1.5">Queue Clear</span>
            <span className="text-text-muted text-[11px] font-sans max-w-[200px]">No anomalies detected in the active sector.</span>
          </div>
        ) : (
          <ul className="divide-y divide-white/5 p-2">
            {anomalies.map(anomaly => {
              const isSelected = selectedId === anomaly.id;
              return (
                <li key={anomaly.id} className="group/item relative mb-2 last:mb-0">
                  <button
                    onClick={() => onSelectAnomaly?.(anomaly.id)}
                    onMouseEnter={() => handleHover(anomaly.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between outline-none ${
                      isSelected
                        ? 'bg-glass-strong backdrop-blur-3xl border border-glass-border-strong shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                        : 'border border-transparent hover:bg-glass hover:backdrop-blur-xl hover:border-glass-border'
                    }`}
                  >
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`font-display text-[12px] font-medium tracking-[0.05em] uppercase ${isSelected ? 'text-accent shadow-[var(--glow-accent)]' : 'text-text-primary group-hover/item:text-accent transition-colors'}`}>{anomaly.label}</span>
                        <StatusBadge status={anomaly.severity === 'high' ? 'highly_anomalous' : anomaly.severity === 'unusual' ? 'unusual' : 'normal'} />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted">
                        <span>CONF: <span className="text-text-secondary">{anomaly.confidence}%</span></span>
                        <span>SCORE: <span className="text-text-secondary">{anomaly.overallScore}</span></span>
                      </div>
                    </div>
                    {isSelected ? (
                       <button
                         onClick={(e) => { e.stopPropagation(); onViewDetails?.(anomaly.id); }}
                         className="p-1.5 bg-glass-strong backdrop-blur-md hover:bg-white/20 border border-glass-border-strong text-accent rounded-lg transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                         title="View on Map"
                       >
                         <ArrowRight className="w-3.5 h-3.5" />
                       </button>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted transition-all duration-500 group-hover/item:text-accent group-hover/item:translate-x-1" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
