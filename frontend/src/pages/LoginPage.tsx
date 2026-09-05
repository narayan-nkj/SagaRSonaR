import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Anchor, ShieldAlert, Lock, Mail, User, RefreshCw, Wand2, CheckCircle2 } from 'lucide-react';

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function LoginPage() {
  const { login } = useUser();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [captchaText, setCaptchaText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.resolve().then(() => setCaptchaText(generateCaptcha()));
  }, []);

  const handleRefreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setCaptchaInput('');
  };

  const handleSuggestPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const suggested = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setPassword(`S@G4R_${suggested}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com') && !email.toLowerCase().endsWith('@sagar.gov.in')) {
      setError('Only approved Gmail or SAGAR domains are permitted.');
      return;
    }

    if (captchaInput !== captchaText) {
      setError('Invalid CAPTCHA.');
      handleRefreshCaptcha();
      return;
    }

    // Simulate verification
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      
      // Complete login after toast
      setTimeout(() => {
        login(email, name);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="flex h-screen w-full bg-void text-text-primary overflow-hidden font-sans">
      
      {/* LEFT PANE - SAGAR INTRO */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-glass-border bg-glass backdrop-blur-xl">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(var(--color-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-cyan) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-glass-strong)_0%,_var(--color-void)_100%)] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <Anchor className="w-8 h-8 text-accent animate-glow-pulse" />
          <div className="flex flex-col leading-none">
            <span className="text-2xl tracking-[0.2em] font-light uppercase">S.A.G.A.R.</span>
            <span className="text-xs text-text-muted tracking-[0.3em] uppercase mt-1">Command</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger/10 border border-danger/30 rounded-full mb-6 shadow-lg shadow-danger/20">
            <ShieldAlert className="w-3.5 h-3.5 text-danger" />
            <span className="text-[10px] text-danger font-mono tracking-widest uppercase">Classified Access Only</span>
          </div>
          
          <h1 className="text-5xl font-display font-light leading-tight mb-6 tracking-wide drop-shadow-lg">
            Autonomous<br />Maritime<br /><span className="text-accent font-bold drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">Surveillance</span>
          </h1>
          
          <p className="text-sm text-text-muted leading-relaxed font-light mb-8 max-w-md">
            The System for Autonomous Geographical Analysis and Reconnaissance (S.A.G.A.R.) provides real-time geospatial intelligence, anomaly detection, and temporal mapping for coastal and harbour security.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-glass-border/50">
            <div>
              <div className="text-2xl font-display font-bold text-text-primary mb-1">100%</div>
              <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Coverage Area</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-accent mb-1 drop-shadow-[var(--glow-accent)]">&lt;0.5s</div>
              <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Detection Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center relative p-8">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-12 absolute top-8 left-8">
          <Anchor className="w-6 h-6 text-accent" />
          <div className="flex flex-col leading-none">
            <span className="text-lg tracking-[0.2em] font-light uppercase">S.A.G.A.R.</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-light mb-2">Secure Authentication</h2>
            <p className="text-xs text-text-muted tracking-wide font-mono">Verify credentials to initialize dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-glass backdrop-blur-3xl border border-glass-border p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
            
            {/* Loading/Verification overlay */}
            {(isVerifying || verified) && (
              <div className="absolute inset-0 bg-void/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                {verified ? (
                  <>
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4 border border-success/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                      <CheckCircle2 className="w-8 h-8 text-success drop-shadow-md" />
                    </div>
                    <p className="text-success font-display font-bold tracking-widest uppercase text-lg drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">Gmail Verified</p>
                    <p className="text-xs text-text-muted font-mono mt-2">Initializing Dashboard...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 border-2 border-glass-border border-t-accent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]" />
                    <p className="text-text-primary font-mono tracking-widest uppercase text-xs animate-pulse">Verifying Credentials...</p>
                  </>
                )}
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/50"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Gmail Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/50"
                    placeholder="operator@gmail.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase">Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/50"
                    placeholder="••••••••••••"
                  />
                  <button 
                    type="button"
                    onClick={handleSuggestPassword}
                    title="Suggest Strong Password"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-accent transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Captcha */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Security Verification</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full bg-void/50 border border-glass-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-text-muted/50"
                      placeholder="Enter code"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 bg-void/80 border border-glass-border rounded-xl px-4 py-2 select-none relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,var(--color-glass-border)_2px,var(--color-glass-border)_4px)]" />
                    <span className="font-mono text-lg font-bold tracking-[0.2em] text-accent/80 line-through decoration-text-muted decoration-2 relative z-10 filter drop-shadow-md mix-blend-screen">
                      {captchaText}
                    </span>
                    <button 
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="ml-2 text-text-muted hover:text-accent transition-colors relative z-10"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-[11px] text-danger font-mono bg-danger/10 border border-danger/20 p-2 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button 
                type="submit"
                className="w-full mt-4 bg-glass border border-glass-border hover:bg-glass-strong hover:border-accent/50 text-text-primary font-display font-light uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] flex justify-center items-center gap-2 group"
              >
                Authenticate
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center flex flex-col gap-1 text-[10px] text-text-muted font-mono uppercase tracking-widest opacity-60">
            <span>UNCLASSIFIED / FOUO</span>
            <span>V 2.0.4.5 · BUILD 88A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
