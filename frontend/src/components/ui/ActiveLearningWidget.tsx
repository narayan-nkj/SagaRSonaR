import React from 'react';
import { Cpu, ArrowRight, Zap, Target } from 'lucide-react';

interface ModelInfo {
  name: string;
  accuracy: number;
  lastUpdated?: string;
  estimatedTime?: string;
}

interface ActiveLearningWidgetProps {
  currentModel: ModelInfo;
  feedbackSamples: number;
  potentialRetrainingSet: number;
  nextModel: ModelInfo;
  isLoading?: boolean;
}

export default function ActiveLearningWidget({
  currentModel,
  feedbackSamples,
  potentialRetrainingSet,
  nextModel,
  isLoading
}: ActiveLearningWidgetProps) {
  const pct = Math.min(100, Math.round((feedbackSamples / 50) * 100));

  return (
    <div className="bg-transparent p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-display font-light text-[13px] tracking-[0.1em] text-text-primary uppercase flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" /> Learning Pipeline
        </h3>
        <span className="px-2 py-0.5 rounded-sm bg-glass border border-border text-[9px] font-mono tracking-wider text-text-muted">ACTIVE</span>
      </div>

      {isLoading ? (
        <div className="space-y-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-glass rounded h-16" />
            <div className="w-6 h-6 bg-glass rounded" />
            <div className="flex-1 bg-glass rounded h-16" />
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-glass rounded w-1/3" />
            <div className="h-1 bg-glass rounded w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* Model progression */}
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="flex-1 bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl p-4 flex flex-col items-center hover:border-glass-border-strong transition-colors duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-sans font-light mb-2">Current</div>
              <div className="text-[13px] font-display font-light text-text-primary mb-1.5 tracking-wide">{currentModel.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-success">
                <Target className="w-3 h-3" /> {currentModel.accuracy}%
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 px-1">
              <ArrowRight className="w-4 h-4 text-accent" />
              <div className="flex flex-col gap-0.5 text-center">
                <div className="text-[9px] font-mono text-text-muted">{feedbackSamples} fb</div>
                <div className="text-[9px] font-mono text-text-muted">{potentialRetrainingSet} pnd</div>
              </div>
            </div>

            <div className="flex-1 bg-accent/10 backdrop-blur-3xl border border-accent/30 rounded-2xl p-4 flex flex-col items-center shadow-[0_4px_16px_rgba(0,0,0,0.2)] relative overflow-hidden group/target">
              <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover/target:translate-y-0 transition-transform duration-500" />
              <div className="text-[9px] text-accent uppercase tracking-[0.2em] font-sans font-light mb-2 relative z-10">Target</div>
              <div className="text-[13px] font-display font-light text-text-primary mb-1.5 tracking-wide relative z-10">{nextModel.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent relative z-10">
                <Target className="w-3 h-3" /> {nextModel.accuracy}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-2 text-[10px] text-text-muted font-sans uppercase tracking-[0.15em] font-light">
                <Zap className="w-3.5 h-3.5 text-accent" /> Readiness
              </div>
              <span className="text-[10px] font-mono text-text-primary bg-glass px-2 py-0.5 rounded-sm border border-border">{pct}%</span>
            </div>
            <div className="w-full h-1 bg-glass-strong rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[var(--glow-accent)] relative"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent to-white/30 animate-shimmer" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
