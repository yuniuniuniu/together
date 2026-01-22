import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../shared/components/form/Button';
import { useAuth } from '../shared/context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { sendCode, login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
      navigate('/setup/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-8 py-12">
      <div className="w-full flex flex-col items-center pt-6 mb-8">
        <div className="w-20 h-20 mb-6 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl"></div>
          <span className="material-symbols-outlined text-5xl text-accent font-light relative z-10">
            all_inclusive
          </span>
        </div>
        <h1 className="text-ink text-2xl font-bold tracking-tight text-center">
          Welcome Back
        </h1>
        <p className="mt-2 text-soft-gray text-sm font-normal text-center">
          A space just for the two of you
        </p>
      </div>

      <div className="w-full space-y-8 flex-grow flex flex-col justify-start pt-4">
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          <div className="group">
            <label className="text-soft-gray text-[11px] font-bold uppercase tracking-wider px-0">Email Address</label>
            <div className="flex items-center border-b border-primary/50 focus-within:border-accent transition-all">
              <input
                className="flex-grow border-none focus:ring-0 text-base py-2 bg-transparent placeholder:text-soft-gray/40"
                placeholder="hello@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="text-xs font-bold text-accent hover:text-accent/80 px-2 py-1 transition-colors disabled:opacity-50 whitespace-nowrap"
                onClick={handleSendCode}
                disabled={isSendingCode || !email.trim() || countdown > 0}
              >
                {isSendingCode ? 'Sending...' : countdown > 0 ? `${countdown}s` : codeSent ? 'Resend' : 'Get Code'}
              </button>
            </div>
          </div>
          <div className="group">
            <label className="text-soft-gray text-[11px] font-bold uppercase tracking-wider px-0">Verification Code</label>
            <input
              className="w-full border-b border-primary/50 focus:border-accent bg-transparent focus:ring-0 text-base py-2 transition-all placeholder:text-soft-gray/40"
              placeholder="6-digit code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            {codeSent && (
              <p className="text-xs text-soft-gray mt-2">
                Check your inbox for the verification code
              </p>
            )}
          </div>

          <Button
            onClick={handleLogin}
            fullWidth
            className="mt-4 shadow-glow"
            disabled={isLoading || !email.trim() || !code.trim()}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          {!termsAccepted && email.trim() && code.trim() && (
            <p className="text-amber-600 text-xs text-center mt-2">
              Please accept the Terms of Service and Privacy Policy to continue
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-6 mt-8">
        <div className="flex items-start gap-3 max-w-[300px]">
          <input
            className="w-4 h-4 rounded border-primary text-primary focus:ring-primary mt-0.5"
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label className="text-[12px] text-soft-gray leading-snug" htmlFor="terms">
            I have read and agree to the <Link className="text-accent underline underline-offset-2" to="/terms">Terms of Service</Link> and <Link className="text-accent underline underline-offset-2" to="/privacy">Privacy Policy</Link>.
          </label>
        </div>
        <div className="flex items-center gap-2 text-soft-gray text-[10px] uppercase tracking-widest opacity-60">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          <span>Private & Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
