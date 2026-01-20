import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/form/Button';

const Login: React.FC = () => {
  const navigate = useNavigate();

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
          <div className="group">
            <label className="text-soft-gray text-[11px] font-bold uppercase tracking-wider px-0">Phone Number</label>
            <div className="flex items-center border-b border-primary/50 focus-within:border-accent transition-all">
              <input 
                className="flex-grow border-none focus:ring-0 text-base py-2 bg-transparent placeholder:text-soft-gray/40" 
                placeholder="+1 (000) 000-0000" 
                type="tel"
              />
              <button className="text-xs font-bold text-accent hover:text-accent/80 px-2 py-1 transition-colors">
                Get SMS Code
              </button>
            </div>
          </div>
          <div className="group">
            <label className="text-soft-gray text-[11px] font-bold uppercase tracking-wider px-0">Verification Code</label>
            <input 
              className="w-full border-b border-primary/50 focus:border-accent bg-transparent focus:ring-0 text-base py-2 transition-all placeholder:text-soft-gray/40" 
              placeholder="6-digit code" 
              type="text"
            />
          </div>
          
          <Button onClick={() => navigate('/setup/profile')} fullWidth className="mt-4 shadow-glow">
            Sign In
          </Button>
        </div>

        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-grow bg-primary/20"></div>
            <span className="text-[10px] uppercase tracking-widest text-soft-gray font-bold">Or continue with</span>
            <div className="h-[1px] flex-grow bg-primary/20"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-primary/20 rounded-2xl active:scale-[0.95] transition-all hover:bg-white/50">
              <svg className="w-6 h-6 text-[#07C160]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.28,11.23C7.57,11.23,7,10.66,7,9.95s0.57-1.28,1.28-1.28c0.71,0,1.28,0.57,1.28,1.28S8.99,11.23,8.28,11.23z M13.72,11.23 c-0.71,0-1.28-0.57-1.28-1.28s0.57-1.28,1.28-1.28c0.71,0,1.28,0.57,1.28,1.28S14.43,11.23,13.72,11.23z M18.17,11.66 c0-2.85-2.67-5.18-5.94-5.18c-3.27,0-5.94,2.33-5.94,5.18c0,2.85,2.67,5.18,5.94,5.18c0.75,0,1.45-0.12,2.11-0.34l2.12,1.11 c0.16,0.08,0.34,0.01,0.34-0.16c0-0.1-0.04-0.2-0.11-0.27l-0.57-0.77C17.51,15.17,18.17,13.51,18.17,11.66z M16.48,6.86 c0-0.32-0.01-0.63-0.05-0.94C15.54,4.11,13.31,2.77,10.74,2.77C7.57,2.77,5,4.9,5,7.52c0,1.52,0.85,2.88,2.16,3.77l-0.42,0.57 c-0.06,0.07-0.08,0.15-0.08,0.22c0,0.13,0.14,0.24,0.26,0.18l1.58-0.83C8.99,11.59,9.52,11.68,10.07,11.68 c0.11,0,0.21,0,0.32-0.01C10.14,11.08,10.07,10.49,10.07,9.88C10.07,7.84,12.72,6.19,16.01,6.19c0.16,0,0.32,0,0.47,0.01 C16.48,6.41,16.48,6.63,16.48,6.86z M11.45,8.8c0.55,0,0.99-0.44,0.99-0.99s-0.44-0.99-0.99-0.99s-0.99,0.44-0.99,0.99 S10.9,8.8,11.45,8.8z M15.42,8.8c0.55,0,0.99-0.44,0.99-0.99s-0.44-0.99-0.99-0.99s-0.99,0.44-0.99,0.99S14.87,8.8,15.42,8.8z"></path>
              </svg>
              <span className="text-[11px] font-bold text-soft-gray">WeChat</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-primary/20 rounded-2xl active:scale-[0.95] transition-all hover:bg-white/50">
              <span className="material-symbols-outlined text-accent text-2xl">lock_open</span>
              <span className="text-[11px] font-bold text-soft-gray">Password</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-6 mt-8">
        <div className="flex items-start gap-3 max-w-[300px]">
          <input className="w-4 h-4 rounded border-primary text-primary focus:ring-primary mt-0.5" id="terms" type="checkbox" />
          <label className="text-[12px] text-soft-gray leading-snug" htmlFor="terms">
            I have read and agree to the <a className="text-accent underline underline-offset-2" href="#">Terms of Service</a> and <a className="text-accent underline underline-offset-2" href="#">Privacy Policy</a>.
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