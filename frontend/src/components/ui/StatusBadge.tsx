import React from 'react';

export type BadgeType = 
  | 'normal' 
  | 'unusual' 
  | 'highly_anomalous' 
  | 'unknown'
  | 'confirmed_unknown'
  | 'known_object'
  | 'pending'
  | 'false_positive';

interface StatusBadgeProps {
  status: BadgeType;
  label?: string;
  className?: string;
}

const BADGE_CONFIG: Record<BadgeType, { color: string; bg: string; border: string; label: string; glow?: boolean }> = {
  normal:            { color: 'text-success', bg: 'bg-success/5', border: 'border-success/20', label: 'Normal' },
  unusual:           { color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/20', label: 'Unusual', glow: true },
  highly_anomalous:  { color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/20', label: 'High Anomaly', glow: true },
  unknown:           { color: 'text-[#B993FF]', bg: 'bg-[#B993FF]/5', border: 'border-[#B993FF]/20', label: 'Unknown' },
  confirmed_unknown: { color: 'text-[#B993FF]', bg: 'bg-[#B993FF]/5', border: 'border-[#B993FF]/20', label: 'Confirmed Unknown' },
  known_object:      { color: 'text-cyan', bg: 'bg-cyan/5', border: 'border-cyan/20', label: 'Known Object' },
  pending:           { color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/20', label: 'Pending Review' },
  false_positive:    { color: 'text-text-muted', bg: 'bg-glass', border: 'border-border', label: 'False Positive' },
};

export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.unknown;
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm
      border ${config.border} ${config.bg}
      ${className}
    `}>
      <span 
        className={`w-1.5 h-1.5 rounded-full ${config.glow ? 'animate-glow-pulse shadow-[var(--glow-accent)]' : ''}`} 
        style={{ backgroundColor: 'currentColor', color: 'inherit' }} 
      />
      <span className={`text-[9px] font-mono tracking-wider uppercase ${config.color}`}>
        {label || config.label}
      </span>
    </span>
  );
}
