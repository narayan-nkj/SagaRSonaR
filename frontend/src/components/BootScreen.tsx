import React, { useEffect, useState } from 'react';

const DetailedChakra = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" stroke="currentColor">
    {/* Outer rings */}
    <circle cx="60" cy="60" r="56" strokeWidth="3" />
    <circle cx="60" cy="60" r="51" strokeWidth="1" />
    
    {/* Inner ring for spoke boundary */}
    <circle cx="60" cy="60" r="42" strokeWidth="1.5" />
    
    {/* Central sunburst/hub */}
    <circle cx="60" cy="60" r="6" fill="currentColor" />
    <circle cx="60" cy="60" r="12" strokeWidth="1" />
    
    {/* 24 Spokes */}
    <g strokeWidth="1.5">
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="60"
          y1="48"
          x2="60"
          y2="18"
          transform={`rotate(${i * 15} 60 60)`}
        />
      ))}
    </g>
  </svg>
);

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress simulation over 3 seconds
    const duration = 3000;
    const interval = 30; // update every 30ms
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const p = Math.min((currentStep / steps) * 100, 100);
      setProgress(p);

      if (p === 100) {
        clearInterval(timer);
        setTimeout(onComplete, 800);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0D12] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Soft radial glow behind the chakra */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <div className="w-[400px] h-[400px] bg-[#DCA454]/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-8 space-y-16">
        
        {/* Logo Mark - Detailed Gold Chakra */}
        <div className="relative">
          <DetailedChakra className="w-36 h-36 text-[#DCA454] opacity-90 drop-shadow-[0_0_15px_rgba(220,164,84,0.4)] animate-[spin_20s_linear_infinite]" />
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-48 h-[2px] bg-glass-strong rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#45A796] via-[#DCA454] to-[#DCA454] transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
      </div>
    </div>
  );
}
