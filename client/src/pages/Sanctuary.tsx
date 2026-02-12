import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';

const Sanctuary: React.FC = () => {
  const navigate = useNavigate();
  const { topBarRef, topBarHeight } = useFixedTopBar();

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div
        ref={topBarRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] flex items-center px-6 pb-4 pt-safe-offset-4 justify-between bg-background-light/90 backdrop-blur-md border-b border-black/[0.03]"
      >
        <div className="size-10 flex items-center justify-center rounded-full bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-ink text-xl">close</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Together</span>
        </div>
        <div className="size-10"></div>
      </div>
      <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
        <div className="relative w-full max-w-[320px] aspect-square mb-12 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
          <div 
            className="relative w-full h-full bg-cover bg-center rounded-xl shadow-lg" 
            style={{backgroundImage: 'url("/images/sanctuary-hero.png")'}}
          ></div>
        </div>

        <div className="text-center max-w-sm mx-auto mb-10">
          <h2 className="text-ink tracking-tight text-3xl font-bold leading-tight mb-4">
            This is your private space
          </h2>
          <p className="text-gray-500 text-base font-normal leading-relaxed px-2">
            A quiet space for the two of you to breathe, remember, and grow together.
          </p>
        </div>

        <div className="w-full max-w-md flex flex-col gap-4">
          <Button onClick={() => navigate('/setup/date')}>
            Create Couple Space
          </Button>
          <Button variant="secondary" onClick={() => navigate('/join')}>
            Join Existing Space
          </Button>
        </div>
      </div>

      <div className="pb-10 pt-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span className="text-[11px] font-medium uppercase tracking-widest">End-to-end encrypted</span>
        </div>
        <p className="text-[10px] text-gray-300 font-normal">
          Your memories are yours alone.
        </p>
      </div>

      {/* Decorative */}
      <div className="fixed -bottom-12 -right-12 size-40 bg-accent-peach/50 rounded-full blur-2xl pointer-events-none"></div>
      <div className="fixed -top-12 -left-12 size-40 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
};

export default Sanctuary;