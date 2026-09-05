import os

# 1. Update index.css
index_css = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import "tailwindcss";

@theme {
  /* Oceanic Palette Reskin mapped to previous structure names */
  --color-midnight-blue: #16587B; /* Venice Blue - Global App Bg */
  --color-navy-abyss: #394E6E; /* Blue Jay - Surface/Card Bg */
  --color-pure-white: #F5EEDD; /* Merino - Primary Typography */
  --color-sky-wash: #DCE4EF; /* Link Water - Secondary Text */
  --color-soft-frost: #A0ADC2; /* Gull Grey - Borders */
  --color-royal-blue: #84B3CE; /* Rock Blue - Buttons & Active */

  /* Gradients (Updated to Oceanic) */
  --background-image-gradient-primary: linear-gradient(135deg, rgba(132,179,206,0.8) 0%, rgba(132,179,206,0.5) 100%);
  --background-image-gradient-dark: linear-gradient(180deg, #394E6E 0%, #16587B 100%);
  --background-image-gradient-card: linear-gradient(135deg, rgba(245,238,221,0.05) 0%, rgba(245,238,221,0.01) 100%);
  --background-image-gradient-highlight: linear-gradient(90deg, rgba(245,238,221,0.1) 0%, transparent 100%);

  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    background: var(--color-midnight-blue);
    color: var(--color-pure-white);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::selection {
    background: var(--color-royal-blue);
    color: var(--color-midnight-blue);
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(245, 238, 221, 0.2);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(245, 238, 221, 0.3);
  }
}
"""
with open('src/index.css', 'w') as f:
    f.write(index_css)

# 2. Restore App.tsx (Standard Grid Layout)
app_tsx = """import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Map as MapIcon, History, FileCheck, Bell, User, Menu, X, Anchor } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import UploadProcess from './pages/UploadProcess';
import MapWorkspace from './pages/MapWorkspace';
import TemporalComparison from './pages/TemporalComparison';
import HumanReviewQueue from './pages/ReviewReport';
import Settings from './pages/Settings';

import { HARBOURS, Anomaly } from './data/mockData';
import { usePreferences } from './contexts/PreferencesContext';
import { useUser } from './contexts/UserContext';
import { subscribeToRealTimeAnomalies } from './services/api';

export const HarbourContext = createContext<{ activeHarbour: string, setActiveHarbour: (h: string) => void }>({ activeHarbour: 'Mumbai Harbor Q3', setActiveHarbour: () => {} });
export const useHarbour = () => useContext(HarbourContext);

export const RealTimeAnomalyContext = createContext<Record<string, Partial<Anomaly>>>({});
export const useRealTimeAnomalies = () => useContext(RealTimeAnomalyContext);

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Survey', path: '/upload', icon: UploadCloud },
  { id: 'map', label: 'Baseline & Anomalies', path: '/map', icon: MapIcon },
  { id: 'comparison', label: 'Temporal Comparison', path: '/comparison', icon: History },
  { id: 'review', label: 'Human Review', path: '/review', icon: FileCheck },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeHarbour, setActiveHarbour] = useState('Mumbai Harbor Q3');
  const [anomalyUpdates, setAnomalyUpdates] = useState<Record<string, Partial<Anomaly>>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = NAV_ITEMS.find(n => location.pathname.startsWith(n.path));
  const { formatCoordinates } = usePreferences();
  const { profile } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRealTimeAnomalies(
      activeHarbour,
      (id, updates) => {
        setAnomalyUpdates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
      },
      () => { }
    );
    return () => unsubscribe();
  }, [activeHarbour]);

  return (
    <HarbourContext.Provider value={{ activeHarbour, setActiveHarbour }}>
      <RealTimeAnomalyContext.Provider value={anomalyUpdates}>
        <div className="flex h-screen overflow-hidden bg-midnight-blue font-sans text-pure-white selection:bg-pure-white/20">
          
          {/* ══ SIDEBAR ══ */}
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed md:static inset-y-0 left-0 z-50
            w-64 bg-navy-abyss border-r border-soft-frost
            flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            shadow-[4px_0_24px_rgba(0,0,0,0.2)] md:shadow-none
          `}>
            {/* Logo area */}
            <div className="h-16 shrink-0 flex items-center px-6 border-b border-soft-frost relative bg-[image:var(--background-image-gradient-card)]">
              <div className="absolute inset-y-0 left-0 w-1 bg-royal-blue shadow-[0_0_12px_rgba(132,179,206,0.8)]" />
              <Anchor className="w-6 h-6 text-royal-blue mr-3 drop-shadow-[0_0_8px_rgba(132,179,206,0.5)]" />
              <span className="text-lg font-semibold tracking-wide text-pure-white shadow-black drop-shadow-md">S.A.G.A.R.</span>
              <button 
                className="md:hidden ml-auto p-1 text-sky-wash hover:text-pure-white transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5 custom-scrollbar">
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-sky-wash mb-2 px-3 mt-2">Modules</div>
              {NAV_ITEMS.map(item => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative overflow-hidden
                      ${isActive 
                        ? 'text-pure-white font-medium bg-royal-blue shadow-sm' 
                        : 'text-sky-wash hover:text-pure-white hover:bg-soft-frost/20'}
                    `}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-pure-white' : 'text-sky-wash group-hover:text-pure-white'}`} />
                    <span className="relative z-10">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Bottom active harbour info */}
            <div className="shrink-0 p-4 border-t border-soft-frost bg-[image:var(--background-image-gradient-dark)]">
              <div className="bg-navy-abyss/80 border border-soft-frost rounded-xl p-3.5 shadow-inner">
                <div className="text-[10px] text-sky-wash uppercase tracking-wider mb-2 font-semibold">Active Sector</div>
                <select 
                  className="w-full bg-navy-abyss border border-soft-frost text-pure-white text-sm rounded-lg px-2 py-1.5 mb-2 focus:ring-1 focus:ring-royal-blue outline-none cursor-pointer appearance-none"
                  value={activeHarbour}
                  onChange={e => setActiveHarbour(e.target.value)}
                >
                  {Object.keys(HARBOURS).map((harbour) => (
                    <option key={harbour} value={harbour}>{harbour}</option>
                  ))}
                </select>
                <div className="text-sm font-bold text-pure-white tracking-wide uppercase">{activeHarbour}</div>
                <div className="text-[10px] text-sky-wash mt-1 mb-2 font-mono">{formatCoordinates(HARBOURS[activeHarbour].lat, HARBOURS[activeHarbour].lng)}</div>
                <div className="text-[11px] text-sky-wash truncate font-medium">surv_001 · R/V Samudra Shakti</div>
              </div>
            </div>
          </aside>

          {/* ══ MAIN CONTENT ══ */}
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 bg-midnight-blue">
            {/* ── Top Header ── */}
            <header className="h-16 shrink-0 bg-navy-abyss border-b border-soft-frost shadow-sm flex items-center justify-between px-4 lg:px-6 z-30">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 -ml-2 text-sky-wash hover:text-pure-white rounded-xl hover:bg-soft-frost/20 transition-colors"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col leading-tight">
                  <h1 className="text-base font-semibold text-pure-white tracking-[0.08em] uppercase">
                    {currentNav?.label || 'S.A.G.A.R. Command'}
                  </h1>
                  <span className="text-[10px] text-sky-wash tracking-wider font-mono uppercase">Seabed Anomaly Grid & Analysis Repository</span>
                </div>
              </div>

              <div className="flex items-center gap-3 relative" ref={menuRef}>
                {/* Live clock */}
                <div className="hidden lg:flex items-center text-[11px] font-mono text-pure-white bg-royal-blue/20 px-3 py-1.5 rounded-full border border-royal-blue/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-royal-blue mr-2" />
                  {time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })} IST
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    className="relative p-2 text-sky-wash hover:text-pure-white rounded-full hover:bg-soft-frost/20 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-royal-blue border-2 border-navy-abyss" />
                  </button>
                </div>

                <div className="h-6 w-px bg-soft-frost hidden sm:block" />

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    className="flex items-center gap-2.5 text-sm font-medium text-pure-white hover:bg-soft-frost/20 px-2 py-1.5 rounded-full transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-royal-blue flex items-center justify-center"><User className="w-4 h-4 text-pure-white" /></div>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-pure-white text-sm font-medium">{profile.fullName}</span>
                      <span className="text-[10px] text-sky-wash font-mono">{profile.role}</span>
                    </div>
                  </button>
                </div>
              </div>
            </header>

            {/* Page content */}
            <div className="flex-1 overflow-auto bg-transparent">
              <div className="p-4 lg:p-8 mx-auto max-w-[1600px] h-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </RealTimeAnomalyContext.Provider>
    </HarbourContext.Provider>
  );
};

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadProcess />} />
          <Route path="/map" element={<MapWorkspace />} />
          <Route path="/comparison" element={<TemporalComparison />} />
          <Route path="/review" element={<HumanReviewQueue />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
"""
with open('src/App.tsx', 'w') as f:
    f.write(app_tsx)

# 3. Restore Dashboard.tsx (Standard Grid Layout)
dashboard_tsx = """import React, { useState, useEffect } from 'react';
import MetricCard from '../components/ui/MetricCard';
import PriorityQueue from '../components/ui/PriorityQueue';
import ActiveLearningWidget from '../components/ui/ActiveLearningWidget';
import { useHarbour, useRealTimeAnomalies } from '../App';
import { HARBOURS, Anomaly, ModelFeedback } from '../data/mockData';
import { getAnomalies, getModelFeedback } from '../services/api';
import { ShieldAlert, Activity, CheckCircle, Database } from 'lucide-react';

export default function Dashboard() {
  const { activeHarbour } = useHarbour();
  const anomalyUpdates = useRealTimeAnomalies();
  const harbourData = HARBOURS[activeHarbour];

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [modelFeedback, setModelFeedback] = useState<ModelFeedback | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [anomalyData, feedbackData] = await Promise.all([
          getAnomalies({}, activeHarbour),
          getModelFeedback()
        ]);
        if (mounted) {
          setAnomalies(anomalyData);
          setModelFeedback(feedbackData);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [activeHarbour]);

  // Merge real-time updates
  const currentAnomalies = anomalies.map(a => {
    if (anomalyUpdates[a.id]) {
      return { ...a, ...anomalyUpdates[a.id] };
    }
    return a;
  });

  const metrics = [
    {
      title: 'Active Anomalies',
      value: currentAnomalies.length,
      icon: ShieldAlert,
      trend: { value: '+2 from last scan', isPositive: false }
    },
    {
      title: 'Confidence Score',
      value: '94.2%',
      icon: Activity,
      trend: { value: 'Stable', isPositive: true }
    },
    {
      title: 'Reviewed Scans',
      value: 34,
      icon: CheckCircle,
      trend: { value: '+124 today', isPositive: true }
    },
    {
      title: 'Database Size',
      value: '2.4 TB',
      icon: Database,
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <MetricCard
            key={idx}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Priority Queue */}
        <div className="xl:col-span-2">
          <div className="bg-navy-abyss border border-soft-frost rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-soft-frost bg-[image:var(--background-image-gradient-card)]">
              <h2 className="text-sm font-semibold text-pure-white tracking-wide">High Priority Review Queue</h2>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <PriorityQueue anomalies={currentAnomalies.filter(a => a.reviewStatus === 'pending')} />
            </div>
          </div>
        </div>

        {/* Active Learning Widget */}
        <div className="xl:col-span-1">
          {modelFeedback && (
            <div className="bg-navy-abyss border border-soft-frost rounded-xl shadow-sm overflow-hidden h-full">
              <ActiveLearningWidget 
                currentModel={modelFeedback.currentModel}
                feedbackSamples={modelFeedback.feedbackSamples}
                potentialRetrainingSet={modelFeedback.potentialRetrainingSet}
                nextModel={modelFeedback.nextModel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"""
with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(dashboard_tsx)

