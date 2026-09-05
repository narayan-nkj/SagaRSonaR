import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings as SettingsIcon, Bell, Shield, CheckCircle, Camera, Anchor, Lock } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useUser } from '../contexts/UserContext';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer shrink-0">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-glass peer-focus:outline-none rounded-full border border-glass-border peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-text-muted peer-checked:after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-accent peer-checked:border-accent shadow-inner" />
  </label>
);

// const paneClass = 'bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] relative overflow-hidden';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] relative overflow-hidden ${className}`}>
    {children}
  </div>
);

const SettingRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex items-center justify-between p-4 hover:bg-glass transition-colors border-b border-glass-border last:border-b-0">
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">{label}</h4>
      <p className="text-[10px] font-mono text-text-secondary mt-1">{description}</p>
    </div>
    {children}
  </div>
);

export default function Settings() {
  const navigate = useNavigate();
  const { coordFormat, setCoordFormat } = usePreferences();
  const { profile, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state for profile (mirrors global but lets user edit without instant update)
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);

  // Preferences
  const [workspace, setWorkspace] = useState('Dashboard');

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [notifyWeekly, setNotifyWeekly] = useState(true);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Avatar changes are immediate — update global context as soon as file is chosen
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        updateProfile({ avatarUrl: url }); // instant global update → header updates NOW
        showToast('Avatar updated successfully!');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    updateProfile({ fullName, email });
    showToast('Changes have been successfully saved!');
  };

  const TABS = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  const selectClass = "bg-glass backdrop-blur-3xl rounded-xl border border-glass-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all cursor-pointer";
  const inputClass = "w-full bg-glass backdrop-blur-3xl rounded-xl border border-glass-border px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all placeholder-text-muted";

  return (
    <div className="relative flex-1 w-full flex flex-col h-full bg-void text-text-primary overflow-hidden">
      {/* ── FULL SCREEN DARK TECH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-glass-strong)_0%,_var(--color-void)_50%)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex h-full flex-col md:flex-row gap-6 max-w-6xl mx-auto p-4 md:p-6 w-full overflow-y-auto custom-scrollbar">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-surface border border-success text-text-primary px-5 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-[100] shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <CheckCircle className="w-4 h-4 text-success shrink-0" />
          <span className="font-mono text-xs uppercase tracking-widest">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Nav */}
      <div className="w-full md:w-64 shrink-0 bg-glass backdrop-blur-3xl border border-glass-border rounded-2xl p-4 flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.4)] h-fit">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-glass-border">
          <div className="w-8 h-8 bg-glass-strong border border-glass-border rounded-lg flex items-center justify-center">
            <Anchor className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase leading-none">Settings</h2>
            <p className="text-[9px] text-text-secondary font-mono mt-1">S.A.G.A.R. Command</p>
          </div>
        </div>
        <div className="space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-[10px] uppercase font-bold tracking-widest border border-transparent rounded-xl ${
                activeTab === tab.id
                  ? 'bg-glass-strong text-cyan border-glass-border shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-glass hover:backdrop-blur-md'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <GlassCard className="flex-1 p-4 md:p-6 flex flex-col h-fit">

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="space-y-7 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Profile Settings</h3>
              <p className="text-[10px] font-mono text-text-secondary">Your identity across the S.A.G.A.R. Command platform.</p>
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-6 p-5 bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-glass border border-glass-border rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover grayscale opacity-80" />
                  ) : (
                    <User className="w-8 h-8 text-text-muted" />
                  )}
                </div>
                {/* hover overlay */}
                <div className="absolute inset-0 bg-void/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-cyan/50">
                  <Camera className="w-5 h-5 text-cyan" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-widest text-text-primary">{profile.fullName}</p>
                <p className="text-[10px] font-mono text-text-secondary mt-1">{profile.role} · {profile.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-glass hover:bg-glass-strong text-text-primary text-[9px] uppercase tracking-widest font-bold px-4 py-2 border border-glass-border hover:border-text-primary transition-colors rounded-xl"
                >
                  Change Avatar
                </button>
                <p className="text-[9px] font-mono text-text-muted mt-2">Changes appear everywhere instantly.</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Enter your name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="Enter your email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Role</label>
                <input type="text" value={profile.role} readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Organisation</label>
                <input type="text" defaultValue="S.A.G.A.R. Command — INS" readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
              </div>
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {activeTab === 'preferences' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Preferences</h3>
              <p className="text-[10px] font-mono text-text-secondary">Customise your workspace experience.</p>
            </div>
            <div className="bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
              <SettingRow label="Default Workspace" description="Choose which screen loads first when you log in">
                <select value={workspace} onChange={e => setWorkspace(e.target.value)} className={selectClass}>
                  <option>Dashboard</option>
                  <option>Map Workspace</option>
                  <option>Human Review</option>
                </select>
              </SettingRow>
              <SettingRow label="Coordinate Format" description="Display format for latitude and longitude across the platform">
                <select value={coordFormat} onChange={e => setCoordFormat(e.target.value as 'DD' | 'DMS')} className={selectClass}>
                  <option value="DD">Decimal Degrees (DD)</option>
                  <option value="DMS">Degrees Minutes Seconds (DMS)</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Notifications</h3>
              <p className="text-[10px] font-mono text-text-secondary">Control how and when you receive alerts.</p>
            </div>
            <div className="bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
              <SettingRow label="Email Alerts" description="Receive email alerts for new high-severity anomalies">
                <ToggleSwitch checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
              </SettingRow>
              <SettingRow label="Push Notifications" description="Get desktop notifications for active sector updates">
                <ToggleSwitch checked={notifyPush} onChange={() => setNotifyPush(!notifyPush)} />
              </SettingRow>
              <SettingRow label="Weekly Summary Reports" description="Receive a weekly digest of anomaly scans and metrics">
                <ToggleSwitch checked={notifyWeekly} onChange={() => setNotifyWeekly(!notifyWeekly)} />
              </SettingRow>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-[0.2em] uppercase mb-1">Security & Privacy</h3>
              <p className="text-[10px] font-mono text-text-secondary">Manage your account security settings.</p>
            </div>
            <div className="bg-glass-strong backdrop-blur-md border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
              <SettingRow label="Change Password" description="Update your account password">
                <button className="bg-glass hover:bg-glass-strong text-text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-glass-border hover:border-text-primary transition-colors flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Update
                </button>
              </SettingRow>
              <SettingRow label="Two-Factor Authentication (2FA)" description="Add an extra layer of security to your account">
                <ToggleSwitch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
              </SettingRow>
              <SettingRow label="Session Timeout" description="Automatically log out after inactivity">
                <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className={selectClass}>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>Never</option>
                </select>
              </SettingRow>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="mt-auto pt-6 border-t border-glass-border flex justify-end gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-text-secondary hover:text-text-primary font-bold uppercase tracking-[0.2em] text-[10px] px-6 py-3 rounded-xl border border-transparent hover:bg-glass transition-all"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="bg-cyan/10 hover:bg-cyan/20 text-cyan font-bold uppercase tracking-[0.2em] text-[10px] px-8 py-3 rounded-xl border border-cyan/30 hover:border-cyan transition-all shadow-[0_4px_16px_rgba(6,182,212,0.1)] hover:shadow-[0_4px_16px_rgba(6,182,212,0.2)]"
          >
            Save Changes
          </button>
        </div>
      </GlassCard>
    </div>
    </div>
  );
}
