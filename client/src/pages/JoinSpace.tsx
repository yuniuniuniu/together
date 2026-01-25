import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { spacesApi } from '../shared/api/client';
import { LoadingScreen } from '../shared/components/feedback';

const JoinSpace: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!sanitized && value) return;

    const newCode = [...code];
    newCode[index] = sanitized;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6);
    if (pastedData.length === 6) {
      setCode(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleFindPartner = async () => {
    const inviteCode = code.join('').toUpperCase();
    if (inviteCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Lookup the space by invite code (without joining yet)
      const response = await spacesApi.lookup(inviteCode);
      // Store space info and invite code for confirm page
      sessionStorage.setItem('pendingSpace', JSON.stringify({
        ...response.data,
        pendingInviteCode: inviteCode,
      }));
      navigate('/confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code or space not found');
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = code.every(digit => digit !== '');

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div className="flex items-center px-4 pb-2 pt-safe-offset-4 justify-between">
        <div
          className="text-ink flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <div className="text-sm font-medium opacity-50 uppercase tracking-widest">Onboarding</div>
        <div className="size-12"></div>
      </div>

      <div className="flex w-full grow-0 px-8 py-6">
        <div className="w-full aspect-square rounded-3xl overflow-hidden bg-white/50 flex items-center justify-center border border-primary/20 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <div className="relative flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-[120px] transition-transform duration-500 group-hover:scale-110">
              extension
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 text-center">
        <h1 className="text-ink tracking-tight text-[32px] font-bold leading-tight pb-2 pt-4">
          Enter Invitation Code
        </h1>
        <p className="text-ink/60 text-base font-normal leading-relaxed max-w-[280px] mx-auto">
          Type the 6-digit code shared by your partner to start your shared journey.
        </p>
      </div>

      {error && (
        <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center px-4 py-8">
        <fieldset className="relative flex gap-2 sm:gap-3" onPaste={handlePaste}>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={`flex h-16 w-12 sm:w-14 text-center text-xl font-semibold focus:outline-0 focus:ring-2 focus:ring-primary/50 bg-white border rounded-xl transition-all ${
                code[i] ? 'border-primary' : 'border-[#e3d3d3]'
              }`}
              maxLength={1}
              placeholder="•"
              type="text"
              inputMode="numeric"
              value={code[i]}
              onChange={(e) => handleInputChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
          <div className="w-1 flex items-center justify-center opacity-20">—</div>
          {[3, 4, 5].map((i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={`flex h-16 w-12 sm:w-14 text-center text-xl font-semibold focus:outline-0 focus:ring-2 focus:ring-primary/50 bg-white border rounded-xl transition-all ${
                code[i] ? 'border-primary' : 'border-[#e3d3d3]'
              }`}
              maxLength={1}
              placeholder="•"
              type="text"
              inputMode="numeric"
              value={code[i]}
              onChange={(e) => handleInputChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </fieldset>
      </div>

      <div className="mt-auto px-8 pb-12 flex flex-col gap-4">
        <Button
          onClick={handleFindPartner}
          icon="favorite"
          disabled={!isComplete || isLoading}
        >
          {isLoading ? 'Finding...' : 'Find My Partner'}
        </Button>
        <button className="w-full bg-transparent hover:bg-primary/10 text-ink/50 font-medium py-2 text-sm transition-colors rounded-lg">
          Need help? Where is my code?
        </button>
      </div>

      {/* Decorative */}
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default JoinSpace;