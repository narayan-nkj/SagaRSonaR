import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Anchor } from 'lucide-react';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid or missing verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Verification failed');
        }
        
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred during verification.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex h-screen w-full bg-void text-text-primary overflow-hidden font-sans items-center justify-center relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-glass-strong)_0%,_var(--color-void)_100%)] pointer-events-none" />
      
      <div className="absolute top-8 left-8 flex items-center gap-3 opacity-50">
        <Anchor className="w-6 h-6 text-accent" />
        <span className="text-lg tracking-[0.2em] font-light uppercase">S.A.G.A.R.</span>
      </div>

      <div className="w-full max-w-md bg-glass backdrop-blur-3xl border border-glass-border p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 text-center">
        
        {status === 'verifying' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto border-2 border-glass-border border-t-accent animate-spin shadow-[0_0_30px_rgba(0,240,255,0.2)]">
              {/* <Loader2 className="w-8 h-8 text-accent animate-spin" /> */}
            </div>
            <h2 className="text-xl font-display font-light mb-2 uppercase tracking-widest text-text-primary">Verifying Identity</h2>
            <p className="text-xs text-text-muted font-mono tracking-widest">Please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-success/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-8 h-8 text-success drop-shadow-md" />
            </div>
            <h2 className="text-xl font-display font-light mb-2 uppercase tracking-widest text-success">Verification Complete</h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              Your email has been successfully verified. You now have authorization to access the platform.
            </p>
            <Link 
              to="/login"
              className="w-full inline-block text-center bg-success/10 border border-success/30 hover:bg-success/20 text-success font-display font-light uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
            >
              Proceed to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-danger/50 shadow-[0_0_30px_rgba(255,77,77,0.3)]">
              <XCircle className="w-8 h-8 text-danger drop-shadow-md" />
            </div>
            <h2 className="text-xl font-display font-light mb-2 uppercase tracking-widest text-danger">Verification Failed</h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <Link 
              to="/login"
              className="w-full inline-block text-center bg-glass border border-glass-border hover:bg-glass-strong hover:border-text-muted text-text-primary font-display font-light uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all duration-300"
            >
              Return to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
