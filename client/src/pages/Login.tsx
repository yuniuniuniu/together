import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../shared/components/form/Button';
import { useAuth } from '../shared/context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { sendCode, login, isLoading } = useAuth();

  const safeGet = (key: string) => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) || '' : '');

  const [email, setEmail] = useState(() => safeGet('loginEmail'));
  const [code, setCode] = useState(() => safeGet('loginCode'));
  const [termsAccepted, setTermsAccepted] = useState(() => safeGet('loginTermsAccepted') === 'true');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Persist login form state so navigating to Privacy/Terms doesn't clear input
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (email) {
      sessionStorage.setItem('loginEmail', email);
    } else {
      sessionStorage.removeItem('loginEmail');
    }
  }, [email]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (code) {
      sessionStorage.setItem('loginCode', code);
    } else {
      sessionStorage.removeItem('loginCode');
    }
  }, [code]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem('loginTermsAccepted', termsAccepted ? 'true' : 'false');
  }, [termsAccepted]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsSendingCode(true);
    try {
      await sendCode(email);
      setCodeSent(true);
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !code.trim()) {
      setError('Please enter email and verification code');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }
    setError('');
    try {
      await login(email, code);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('loginEmail');
        sessionStorage.removeItem('loginCode');
        sessionStorage.removeItem('loginTermsAccepted');
      }
      // Always go to profile setup after login, ProtectedRoute will handle subsequent routing
      navigate('/setup/profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10 pt-safe-offset-10 bg-background-light dark:bg-background-dark min-h-screen relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full flex flex-col items-center pt-12 mb-8 relative z-10">
        <div className="w-24 h-24 mb-6 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-xl animate-pulse-slow"></div>
          <div className="relative size-20 bg-white dark:bg-zinc-800 rounded-2xl shadow-soft rotate-3 flex items-center justify-center border border-white/50 dark:border-zinc-700">
            <span className="material-symbols-outlined text-4xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>
              favorite
            </span>
          </div>
          <div className="absolute -bottom-2 -left-2 size-10 bg-primary/10 rounded-full blur-md"></div>
        </div>
        <h1 className="text-[#4A2B2B] dark:text-zinc-100 text-4xl font-serif italic font-medium tracking-tight text-center">
          Together
        </h1>
        <p className="mt-3 text-[#8c5a5a] dark:text-zinc-400 text-xs font-bold tracking-[0.2em] uppercase text-center">
          Our Shared Journey
        </p>
      </div>

      <div className="w-full max-w-sm space-y-8 flex-grow flex flex-col justify-start pt-4 relative z-10">
        <div className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-2xl text-center shadow-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="group space-y-2">
            <label className="text-[#8c5a5a] dark:text-zinc-500 text-[11px] font-bold uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl py-4 pl-5 pr-24 text-[#4A2B2B] dark:text-zinc-100 placeholder:text-stone-300 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm outline-none"
                placeholder="hello@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  className={`
                    px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all
                    ${isSendingCode || countdown > 0 
                      ? 'bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95'}
                  `}
                  onClick={handleSendCode}
                  disabled={isSendingCode || !email.trim() || countdown > 0}
                >
                  {isSendingCode ? '...' : countdown > 0 ? `${countdown}s` : codeSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
            </div>
          </div>

          <div className="group space-y-2">
            <label className="text-[#8c5a5a] dark:text-zinc-500 text-[11px] font-bold uppercase tracking-wider pl-1">Verification Code</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-2xl py-4 px-5 text-[#4A2B2B] dark:text-zinc-100 placeholder:text-stone-300 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm outline-none tracking-widest"
                placeholder="0 0 0 0 0 0"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300 dark:text-zinc-600">
                <span className="material-symbols-outlined text-xl">lock</span>
              </div>
            </div>
            {codeSent && (
              <p className="text-[11px] text-[#8c5a5a] dark:text-zinc-500 pl-1 flex items-center gap-1.5 animate-in fade-in">
                <span className="material-symbols-outlined text-sm">mark_email_read</span>
                Code sent to your email
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={handleLogin}
              fullWidth
              className="py-4 text-base shadow-lg shadow-primary/20 rounded-2xl font-bold tracking-wide"
              disabled={isLoading || !email.trim() || !code.trim()}
            >
              {isLoading ? 'Signing In...' : 'Start Your Journey'}
            </Button>
          </div>

          {!termsAccepted && email.trim() && code.trim() && (
            <p className="text-amber-600/80 text-[11px] text-center font-medium animate-pulse">
              Please accept the Terms & Privacy below
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-5 mt-auto pt-8 pb-4 relative z-10">
        <div className="flex items-start gap-3 max-w-[280px] bg-white/50 dark:bg-zinc-900/50 p-3 rounded-xl backdrop-blur-sm border border-white/50 dark:border-zinc-800/50">
          <input
            className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary/30 mt-0.5 bg-white dark:bg-zinc-800"
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed" htmlFor="terms">
            I agree to the <Link className="text-primary font-bold hover:underline" to="/terms">Terms</Link> and <Link className="text-primary font-bold hover:underline" to="/privacy">Privacy Policy</Link>.
          </label>
        </div>
        <div className="flex items-center gap-2 text-stone-400 dark:text-zinc-600 text-[10px] uppercase tracking-widest opacity-60">
          <span className="material-symbols-outlined text-[14px]">shield_lock</span>
          <span>End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
