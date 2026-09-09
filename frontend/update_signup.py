import re

with open("src/pages/SignupPage.tsx", "r") as f:
    content = f.read()

# 1. Add resend states and handleResend function
# Find where setIsVerifying is defined
state_insert = """  const [isVerifying, setIsVerifying] = useState(false);
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
  };"""

content = content.replace("  const [isVerifying, setIsVerifying] = useState(false);\n  const { login } = useUser();", state_insert)

# 2. Add Resend Button to the verification form
old_form_buttons = """              <button 
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full mt-4 bg-glass-strong border border-glass-border-strong hover:bg-accent/20 hover:border-accent/50 text-text-primary font-display font-medium uppercase tracking-widest text-xs py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Verify Access Code'}
              </button>
          </form>"""

new_form_buttons = """              <button 
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
          </form>"""

content = content.replace(old_form_buttons, new_form_buttons)

with open("src/pages/SignupPage.tsx", "w") as f:
    f.write(content)

print("Updated SignupPage.tsx")
