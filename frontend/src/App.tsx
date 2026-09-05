import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Map, History, FileCheck, Bell, User, Menu, X, Anchor, Sun, Moon } from 'lucide-react';
import Dashboard from './pages/Dashboard'; // trigger refresh
import UploadProcess from './pages/UploadProcess';
import MapWorkspace from './pages/MapWorkspace';
import TemporalComparison from './pages/TemporalComparison';
import ReviewReport from './pages/ReviewReport';
import Settings from './pages/Settings';
import { usePreferences } from './contexts/PreferencesContext';
import { useTheme } from './contexts/ThemeContext';
import { useUser, UserProvider } from './contexts/UserContext';
import { subscribeToRealTimeAnomalies } from './services/api';
import { HARBOURS } from './data/mockData';
import type { Anomaly } from './data/mockData';
import BootScreen from './components/BootScreen';
import LoginPage from './pages/LoginPage';

import { HarbourContext, RealTimeAnomalyContext } from './contexts/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Survey', path: '/upload', icon: UploadCloud },
  { id: 'map', label: 'Baseline & Anomalies', path: '/map', icon: Map },
  { id: 'comparison', label: 'Temporal Comparison', path: '/comparison', icon: History },
  { id: 'review', label: 'Human Review', path: '/review', icon: FileCheck },
];

const AvatarBadge: React.FC<{ size?: 'sm' | 'md', showStatus?: boolean }> = ({ size = 'sm', showStatus = false }) => {
  const { profile } = useUser();
  const dim = size === 'md' ? 'w-12 h-12' : 'w-8 h-8';
  const iconDim = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className={`${dim} rounded-full bg-surface flex items-center justify-center border border-accent/30 overflow-hidden relative shrink-0`}>
      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
      ) : (
        <User className={`${iconDim} text-accent`} />
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
      )}
    </div>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeHarbour, setActiveHarbour] = useState('Mumbai Harbor Q3');
  const { theme, setTheme } = useTheme();
  const [anomalyUpdates, setAnomalyUpdates] = useState<Record<string, Partial<Anomaly>>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = NAV_ITEMS.find(n => location.pathname.startsWith(n.path));
  const { formatCoordinates } = usePreferences();
  const { profile, logout } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHarbourMenuOpen, setIsHarbourMenuOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
        setIsHarbourMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <HarbourContext.Provider value={{ activeHarbour, setActiveHarbour }}>
      <RealTimeAnomalyContext.Provider value={anomalyUpdates}>
        {/* ── Root shell: Technical Pane Architecture ── */}
        <div className="flex h-screen w-full overflow-hidden font-sans relative text-text-primary bg-void">

          {/* Mobile and Desktop overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* ══ SIDEBAR ══ */}
          <aside className={`
            w-64 bg-glass backdrop-blur-3xl border-r border-glass-border flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]
            fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            {/* Logo */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-glass-border shrink-0">
              <div className="flex items-center gap-2.5">
                <Anchor className="w-4 h-4 text-accent" />
                <div className="flex flex-col leading-none">
                  <span className="text-[13px] tracking-[0.2em] text-text-primary font-light uppercase">S.A.G.A.R.</span>
                  <span className="text-[8px] text-text-muted tracking-[0.3em] uppercase mt-0.5">Command</span>
                </div>
              </div>
              <button className="text-text-muted hover:text-text-primary transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="p-3 space-y-px flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 transition-all duration-300 text-[12px] tracking-[0.04em] font-light group rounded-xl
                      ${isActive ? 'bg-glass-strong border border-glass-border-strong shadow-[0_4px_16px_rgba(0,0,0,0.2)] text-accent'
                        : 'text-text-muted hover:text-text-primary hover:bg-glass border border-transparent'
                      }
                    `}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          {/* ══ MAIN CONTENT ══ */}
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 bg-void">
            {/* ── Top Header ── */}
            <header className="h-14 shrink-0 bg-glass backdrop-blur-3xl border-b border-glass-border flex items-center justify-between px-6 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 shrink-0">
                <button
                  className="p-2 -ml-2 text-text-muted hover:text-text-primary rounded transition-colors"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="hidden md:flex flex-col leading-tight">
                  <h1 className="text-base font-display font-light text-text-primary tracking-[0.02em]">
                    {currentNav?.label || 'S.A.G.A.R. Command'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4 relative flex-1 justify-end pl-4" ref={menuRef}>
                {/* Active Sector Selector */}
                <div className="relative shrink-0">
                  <div 
                    className="flex items-center gap-3 px-3 py-1 cursor-pointer bg-glass backdrop-blur-3xl border border-glass-border hover:bg-glass-strong hover:border-glass-border-strong rounded-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                    onClick={() => setIsHarbourMenuOpen(!isHarbourMenuOpen)}
                  >
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-[8px] leading-none text-text-muted tracking-[0.2em] uppercase font-light">
                        <span className="w-1 h-1 bg-accent rounded-full animate-glow-pulse shadow-[var(--glow-accent)]" />
                        Active Sector
                      </div>
                      <div key={activeHarbour} className="text-[12px] leading-none text-text-primary font-medium tracking-[0.02em] animate-in fade-in zoom-in duration-500">
                        {activeHarbour}
                      </div>
                      <div className="text-[8px] leading-none text-text-muted font-mono tracking-widest opacity-80">
                        {formatCoordinates(HARBOURS[activeHarbour].lat, HARBOURS[activeHarbour].lng)}
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`text-text-muted transition-transform duration-300 ${isHarbourMenuOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>

                  {/* Dropdown Menu */}
                  {isHarbourMenuOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-void/80 backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] py-2 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                      <div className="max-h-64 overflow-y-auto divide-y divide-glass-border">
                        {Object.keys(HARBOURS).sort().map((harbour, idx) => (
                          <div 
                            key={harbour}
                            className="p-3 hover:bg-glass-strong hover:backdrop-blur-md cursor-pointer transition-all duration-300 flex items-center justify-between group animate-in slide-in-from-right-4 fade-in fill-mode-both rounded-lg mx-1 my-0.5"
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => {
                              setActiveHarbour(harbour);
                              setIsHarbourMenuOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className={`text-[12px] font-light tracking-wide transition-colors ${harbour === activeHarbour ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>{harbour}</span>
                              <span className="text-[9px] font-mono text-text-muted tracking-widest mt-0.5">{formatCoordinates(HARBOURS[harbour].lat, HARBOURS[harbour].lng)}</span>
                            </div>
                            {harbour === activeHarbour && <span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[var(--glow-accent)]" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-px h-6 bg-glass-strong mx-2 shrink-0" />

                {/* Live clock */}
                <div className="flex shrink-0 items-center text-[10px] font-mono text-text-muted tracking-wider px-3 py-1.5 bg-glass backdrop-blur-sm border border-glass-border rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
                  <div className="w-1 h-1 bg-accent rounded-full mr-2.5 animate-glow-pulse shadow-[var(--glow-accent)]" />
                  {time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })} IST
                </div>

                {/* Theme Switcher */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="relative p-1.5 text-text-muted hover:text-accent transition-all duration-300"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    <div className="relative w-4 h-4">
                      <Sun 
                        className={`absolute inset-0 w-4 h-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} 
                      />
                      <Moon 
                        className={`absolute inset-0 w-4 h-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${theme === 'light' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`} 
                      />
                    </div>
                  </button>
                </div>

                {/* Notifications */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    className="relative p-1.5 text-text-muted hover:text-accent transition-all duration-300"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent shadow-[var(--glow-accent)]" />
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-3 w-80 max-w-[90vw] bg-void/80 backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-5 py-4 border-b border-glass-border bg-glass-strong">
                        <h3 className="font-display font-bold text-text-primary text-[11px] tracking-[0.1em] uppercase">Notifications</h3>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-glass-border">
                        <div className="p-4 hover:bg-glass-strong transition-colors duration-300 cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0 shadow-[0_0_10px_rgba(255,77,77,0.3)]" />
                            <div>
                              <p className="text-[12px] text-text-primary font-light leading-snug">New high-priority anomaly detected in Sector 7A.</p>
                              <p className="text-[10px] text-text-muted mt-1.5 font-mono">2 mins ago · Mumbai Harbor Q3</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-glass transition-colors duration-300 cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                            <div>
                              <p className="text-[12px] text-text-primary font-light leading-snug">Survey 'Mumbai Harbor Q3' processing complete.</p>
                              <p className="text-[10px] text-text-muted mt-1.5 font-mono">1 hr ago · System</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-glass transition-colors duration-300 cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0 shadow-[var(--glow-accent)]" />
                            <div>
                              <p className="text-[12px] text-text-primary font-light leading-snug">Model v1.1 retraining scheduled for 03:00 IST.</p>
                              <p className="text-[10px] text-text-muted mt-1.5 font-mono">3 hrs ago · AI Pipeline</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-5 w-px bg-glass-strong mx-1 shrink-0" />

                {/* User Menu */}
                <div className="relative ml-2 shrink-0">
                  <button
                    onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-glass transition-all duration-300"
                  >
                    <AvatarBadge size="sm" showStatus />
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[11px] text-text-primary tracking-wide font-medium">{profile.fullName}</span>
                      <span className="text-[9px] text-text-muted font-mono tracking-widest">{profile.role}</span>
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-void/80 backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] py-2 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-3 border-b border-glass-border mb-2">
                        <p className="text-sm font-medium text-text-primary truncate">{profile.fullName}</p>
                        <p className="text-[10px] text-text-muted font-mono truncate">{profile.email}</p>
                      </div>
                      <div className="px-2">
                        <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-glass-strong rounded-lg transition-colors flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> Profile Settings
                        </button>
                        <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center gap-2 mt-1">
                          <X className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Page content */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {children}
            </div>
          </main>
        </div>
      </RealTimeAnomalyContext.Provider>
    </HarbourContext.Provider>
  );
};

const AppRouter = () => {
  const [booting, setBooting] = useState(true);
  const { isAuthenticated } = useUser();

  if (booting) {
    return <BootScreen onComplete={() => setBooting(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadProcess />} />
          <Route path="/map" element={<MapWorkspace />} />
          <Route path="/comparison" element={<TemporalComparison />} />
          <Route path="/review" element={<ReviewReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </Router>
  );
};

export default function App() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  );
}
