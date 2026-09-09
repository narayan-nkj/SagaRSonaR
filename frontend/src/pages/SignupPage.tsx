import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor, ShieldAlert, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function SignupPage() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useUser();

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend code');
      }
      setResendCooldown(60);
      // We can show a temporary success message or just let the user know it was sent
    } catch (err: any) {
      setError(err.message || 'Error resending code');
    } finally {
      setResendLoading(false);
    }
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Password must contain an uppercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain a number.";
    return null;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Required fields are missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName: name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }
      
      // If absolute host, maybe they bypass verification, but let's just check the response
      if (email.toLowerCase() === 'narayan.nkj@gmail.com') {
          // Absolute host bypasses verification and approval in backend, but we still show verification success
          setSuccess("Absolute Host recognized. Logging you in...");
          setTimeout(async () => {
              // auto login
              try {
                  const loginRes = await fetch(`${API_URL}/auth/login`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password })
                  });
                  const loginData = await loginRes.json();
                  if (loginRes.ok) {
                      sessionStorage.setItem('sagar_token', loginData.access_token);
                      sessionStorage.setItem('sagar_user', JSON.stringify(loginData.user));
                      login(loginData.user.email, loginData.user.fullName, loginData.user.role);
                      navigate('/dashboard');
                  } else {
                      navigate('/login');
                  }
              } catch (e) {
                  navigate('/login');
              }
          }, 1500);
      } else {
          setShowVerification(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsVerifying(true);
      try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${API_URL}/auth/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, token: verificationCode }),
          });
          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.detail || 'Verification failed');
          }
          
          setSuccess("Email verified successfully! Awaiting Admin Approval.");
          
          setTimeout(() => navigate('/login'), 2500);
      } catch (err: any) {
          setError(err.message || 'Invalid verification code.');
      } finally {
          setIsVerifying(false);
      }
  };

  if (success) {
    return (
      <div className="flex h-screen w-full bg-void text-text-primary overflow-hidden font-sans items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-glass-strong)_0%,_var(--color-void)_100%)] pointer-events-none" />
        <div className="w-full max-w-md bg-glass backdrop-blur-3xl border border-glass-border p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-success/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <ShieldCheck className="w-8 h-8 text-success drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-display font-light mb-4">Registration Update</h2>
          <p className="text-sm text-text-muted mb-8 leading-relaxed">
            {success}
          </p>
        </div>
      </div>
    );
  }

  if (showVerification) {
      return (
      <div className="flex h-screen w-full bg-void text-text-primary overflow-hidden font-sans items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-glass-strong)_0%,_var(--color-void)_100%)] pointer-events-none" />
        <div className="w-full max-w-md bg-glass backdrop-blur-3xl border border-glass-border p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10">
          <div className="text-center mb-8">
            <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-display font-light mb-2">Verify Operator Email</h2>
            <p className="text-xs text-text-muted font-mono">Enter the 6-digit code sent to {email}</p>
          </div>
          <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-void/80 border border-glass-border text-text-primary text-2xl text-center tracking-[0.5em] rounded-xl py-4 focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/80 transition-all placeholder:text-text-muted/50 font-mono"
                  placeholder="000000"
                />
              </div>
              {error && (
                <div className="text-[11px] text-danger font-mono bg-danger/10 border border-danger/30 p-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(255,77,77,0.1)]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <button 
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full mt-4 bg-glass-strong border border-glass-border-strong hover:bg-accent/20 hover:border-accent/50 text-text-primary font-display font-medium uppercase tracking-widest text-xs py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Verify Access Code'}
              </button>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-[11px] font-mono tracking-widest uppercase text-text-muted hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                </button>
              </div>
          </form>
        </div>
      </div>
      );
  }

  return (
    <div className="flex h-screen w-full bg-void text-text-primary overflow-hidden font-sans">
      
      {/* LEFT PANE - SAGAR INTRO */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-glass-border bg-glass backdrop-blur-xl">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-warning/10 border border-warning/30 rounded-full mb-6 shadow-lg shadow-warning/20">
            <ShieldCheck className="w-3.5 h-3.5 text-warning" />
            <span className="text-[10px] text-warning font-mono tracking-widest uppercase">Authorized Personnel Only</span>
          </div>
          
          <h1 className="text-5xl font-display font-light leading-tight mb-6 tracking-wide drop-shadow-lg">
            Personnel<br /><span className="text-accent font-bold drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">Registration</span>
          </h1>
          
          <p className="text-sm text-text-muted leading-relaxed font-light mb-8 max-w-md">
            Request access to the System for Autonomous Geographical Analysis and Reconnaissance. Access is strictly limited to authorized operators.
          </p>
        </div>
      </div>

      {/* RIGHT PANE - SIGNUP FORM */}
      <div className="flex-1 flex flex-col justify-center items-center relative p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-light tracking-wide text-text-primary mb-2">Registration</h2>
            <p className="text-xs text-text-muted tracking-wide font-mono">Create your operator profile</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="bg-glass backdrop-blur-3xl border border-glass-border p-8 md:p-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative">
            
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Full Name *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-void/80 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/80 transition-all placeholder:text-text-muted/50 autofill-bg-fix"
                    placeholder="Enter your official name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Official Email *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-void/80 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/80 transition-all placeholder:text-text-muted/50 autofill-bg-fix"
                    placeholder="operator@sagar.gov.in"
                  />
                </div>
              </div>

              {/* Department (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Department</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-void/80 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/80 transition-all placeholder:text-text-muted/50 autofill-bg-fix"
                    placeholder="e.g. Naval Intelligence"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Password *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-void/80 border border-glass-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-accent/80 focus:ring-1 focus:ring-accent/80 transition-all placeholder:text-text-muted/50 autofill-bg-fix"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-text-muted uppercase ml-1">Confirm Password *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-void/80 border text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none transition-all placeholder:text-text-muted/50 autofill-bg-fix ${confirmPassword && confirmPassword !== password ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger/50' : 'border-glass-border focus:border-accent/80 focus:ring-1 focus:ring-accent/80'}`}
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-[11px] text-danger font-mono bg-danger/10 border border-danger/30 p-3 rounded-xl flex items-center gap-3 mt-4 shadow-[0_0_15px_rgba(255,77,77,0.1)]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-8 bg-glass-strong border border-glass-border-strong hover:bg-accent/20 hover:border-accent/50 text-text-primary font-display font-medium uppercase tracking-widest text-xs py-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-glass-border border-t-accent rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Request
                    <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center flex flex-col gap-3">
            <p className="text-xs text-text-muted">
              Already have authorization?
            </p>
            <Link to="/login" className="text-[11px] font-mono tracking-widest uppercase text-text-primary bg-glass border border-glass-border hover:bg-glass-strong hover:border-text-primary/50 py-2.5 px-6 rounded-lg transition-all mx-auto inline-block">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
