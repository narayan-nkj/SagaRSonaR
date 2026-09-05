import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}

export default function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass = "text-text-primary",
  trend,
  trendDirection = 'neutral',
  isLoading
}: MetricCardProps) {
  return (
    <div className="
      p-6 flex flex-col gap-3 relative overflow-hidden group
      border-r border-glass-border last:border-r-0 bg-transparent
      transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
      hover:bg-glass hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
    ">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-sans font-medium tracking-[0.15em] uppercase text-text-muted">{label}</span>
        <Icon className={`w-4 h-4 ${colorClass} opacity-50 group-hover:opacity-100 group-hover:text-accent transition-all duration-500`} />
      </div>
      
      {isLoading ? (
        <div className="h-8 bg-glass animate-pulse rounded w-1/2 mt-1" />
      ) : (
        <div className="flex items-baseline gap-3 mt-1">
          <span className={`text-3xl font-display font-light tracking-tight text-text-primary group-hover:text-accent transition-colors duration-500`}>{value}</span>
          {trend && (
            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${
              trendDirection === 'up' ? 'text-danger' : 
              trendDirection === 'down' ? 'text-success' : 'text-text-secondary'
            }`}>
              {trendDirection === 'up' ? <TrendingUp className="w-3 h-3" /> :
               trendDirection === 'down' ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
