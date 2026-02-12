import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useSpace } from '../shared/context/SpaceContext';
import { useAuth } from '../shared/context/AuthContext';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';
import { resolveMediaUrl } from '../shared/utils/resolveMediaUrl';

const Celebration: React.FC = () => {
  const navigate = useNavigate();
  const { anniversaryDate, partner } = useSpace();
  const { user } = useAuth();
  const { topBarRef, topBarHeight } = useFixedTopBar();
  const myAvatarUrl = resolveMediaUrl(user?.avatar);
  const partnerAvatarUrl = resolveMediaUrl(partner?.user?.avatar);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Your Special Day';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_center,#fbf9f9_0%,#f3e9e9_100%)]">
      {/* Confetti / Hearts overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <span className="material-symbols-outlined text-primary absolute top-10 left-[10%] text-sm">favorite</span>
        <span className="material-symbols-outlined text-primary absolute top-1/4 right-[15%] text-lg">favorite</span>
        <span className="material-symbols-outlined text-primary/40 absolute bottom-1/3 left-1/4 text-xl">favorite</span>
      </div>

      <div
        ref={topBarRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] flex items-center px-6 pb-4 pt-safe-offset-4 justify-between bg-background-light/70 backdrop-blur-md border-b border-black/[0.03]"
      >
        <div
          className="text-[#181010] flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <span className="material-symbols-outlined">close</span>
        </div>
      </div>
      <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-20">
        <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="absolute w-32 h-32 bg-primary/40 rounded-full blur-xl translate-x-4"></div>
            <div className="absolute w-32 h-32 bg-primary/40 rounded-full blur-xl -translate-x-4"></div>
            <div className="z-10 bg-white/40 backdrop-blur-md rounded-full p-8 shadow-whisper">
              <span className="material-symbols-outlined text-primary text-7xl select-none" style={{fontVariationSettings: "'FILL' 1, 'wght' 200"}}>favorite</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-12">
          <h1 className="text-ink tracking-widest text-lg font-bold leading-tight uppercase opacity-60">
            Together Since
          </h1>
          <p className="text-ink text-4xl font-serif font-bold tracking-tight">
            {formatDate(anniversaryDate)}
          </p>
          <p className="text-accent text-xs font-sans font-semibold tracking-wider uppercase pt-2">
            Our Anniversary
          </p>
        </div>

        <div className="flex items-center justify-center relative w-full max-w-xs mb-12">
          <div className="absolute h-[2px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent blur-[1px]"></div>
          <div className="flex items-center gap-16 relative">
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/50">
                {myAvatarUrl ? (
                  <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover"
                    style={{backgroundImage: `url("${myAvatarUrl}")`}}
                  ></div>
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-sans font-semibold text-ink/50 tracking-wider uppercase">{user?.nickname || 'You'}</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white/50">
                {partnerAvatarUrl ? (
                  <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover"
                    style={{backgroundImage: `url("${partnerAvatarUrl}")`}}
                  ></div>
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-sans font-semibold text-ink/50 tracking-wider uppercase">{partner?.user?.nickname || 'Partner'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 pb-12 z-20">
        <Button onClick={() => navigate('/dashboard')} fullWidth className="py-5 shadow-whisper">
          Enter Our Space
        </Button>
        <p className="mt-4 text-center text-ink/40 text-[10px] uppercase tracking-[0.3em] font-sans">
          Your private journey begins
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background-light/50 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Celebration;