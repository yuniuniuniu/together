import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../shared/context/SpaceContext';
import { useClipboard } from '../shared/hooks/useClipboard';

const CreateSpace: React.FC = () => {
  const navigate = useNavigate();
  const { createSpace, space, isLoading, refreshSpace } = useSpace();
  const { copyToClipboard } = useClipboard();

  const [inviteCode, setInviteCode] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedDate = sessionStorage.getItem('anniversaryDate');
    if (storedDate) {
      setAnniversaryDate(storedDate);
    } else {
      // Default to today if no date selected
      setAnniversaryDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    const doCreateSpace = async () => {
      if (!anniversaryDate || isCreating || space) return;

      setIsCreating(true);
      setError('');
      try {
        await createSpace(new Date(anniversaryDate));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create space');
      } finally {
        setIsCreating(false);
      }
    };

    doCreateSpace();
  }, [anniversaryDate, createSpace, isCreating, space]);

  useEffect(() => {
    if (space?.inviteCode) {
      setInviteCode(space.inviteCode);
    }
  }, [space]);

  useEffect(() => {
    if (space?.partners && space.partners.length >= 2) {
      navigate('/celebration');
    }
  }, [space, navigate]);

  // Poll for partner joining
  useEffect(() => {
    if (!space) return;

    const checkPartner = setInterval(() => {
      refreshSpace();
      if (space.partners && space.partners.length >= 2) {
        clearInterval(checkPartner);
        navigate('/celebration');
      }
    }, 3000);

    return () => clearInterval(checkPartner);
  }, [space, navigate, refreshSpace]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    const success = await copyToClipboard(inviteCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatCode = (code: string) => {
    return code.split('').join(' ');
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light relative overflow-hidden">
      <header className="flex items-center p-4 pb-2 justify-between">
        <button
          className="text-ink flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-ink text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Create Couple Space</h2>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {error && (
          <div className="w-full mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="mb-8 flex justify-center items-center gap-4 text-primary">
          <span className="material-symbols-outlined text-5xl">auto_stories</span>
          <span className="material-symbols-outlined text-3xl text-accent">favorite</span>
        </div>

        <div className="w-full text-center">
          <h2 className="text-ink tracking-tight text-[28px] font-bold leading-tight pb-2">Start Your Journey</h2>
          <p className="text-ink/70 text-base font-normal leading-relaxed px-4">
            Anniversary set for <span className="font-semibold text-accent">{formatDate(anniversaryDate)}</span>.<br className="hidden sm:inline"/> Share this code to sync your diaries.
          </p>
        </div>

        <div className="w-full mt-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent-peach/50 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-accent-peach p-8 rounded-xl flex flex-col items-center shadow-sm border border-black/5">
              <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-4">Your Private Code</span>
              <div className="flex gap-3 mb-6">
                {isLoading || isCreating ? (
                  <div className="animate-pulse flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="w-8 h-10 bg-primary/20 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <span className="text-4xl font-bold tracking-widest text-ink font-serif">
                    {inviteCode ? formatCode(inviteCode) : '- - - - - -'}
                  </span>
                )}
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-ink text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span className="truncate">{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full mt-12 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </div>
            <p className="text-ink text-base font-medium leading-normal">Waiting for partner to join...</p>
          </div>
          <div className="w-full h-2 rounded-full bg-[#e3d3d3] overflow-hidden">
            <div className="h-full rounded-full bg-primary animate-[pulse_2s_infinite]" style={{width: '45%'}}></div>
          </div>
          <p className="text-soft-gray text-sm font-normal leading-normal text-center italic">
            The space will open automatically once they connect.
          </p>
        </div>
      </main>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-peach/20 blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default CreateSpace;