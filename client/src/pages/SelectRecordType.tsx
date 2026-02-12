import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';

const SelectRecordType: React.FC = () => {
  const navigate = useNavigate();
  const { topBarRef, topBarHeight } = useFixedTopBar();

  return (
    <div className="font-display bg-milestone-light dark:bg-milestone-dark text-milestone-primary dark:text-gray-100 min-h-screen flex flex-col antialiased selection:bg-milestone-primary selection:text-white relative">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-10 scale-110 blur-xl" 
              style={{backgroundImage: 'url("/images/record-type-bg.avif")'}}
            ></div>
            <div className="absolute inset-0 bg-milestone-light/80 dark:bg-milestone-dark/80 backdrop-blur-sm"></div>
        </div>

        <div
          ref={topBarRef}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] flex items-center justify-between px-5 pb-4 pt-safe-offset-4 bg-milestone-light/90 dark:bg-milestone-dark/90 backdrop-blur-md border-b border-black/[0.03] dark:border-zinc-800/80"
        >
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <span className="material-symbols-outlined text-milestone-primary dark:text-white">arrow_back</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-milestone-primary/70 dark:text-gray-300">Create Story</span>
            <div className="w-10"></div>
        </div>
        <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

        <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 pt-6 w-full max-w-md mx-auto min-h-screen">
            <header className="w-full text-center mb-10 animate-fade-in-down">
                <h1 className="text-[#131616] dark:text-white text-[32px] font-bold leading-tight tracking-tight">
                    Create Story
                </h1>
                <p className="text-milestone-primary/70 dark:text-gray-400 mt-2 font-noto-sans text-sm tracking-wide font-medium uppercase">
                    Select a format
                </p>
            </header>

            <div className="w-full flex flex-col gap-6">
                <button 
                  onClick={() => navigate('/memory/new')}
                  className="group relative w-full text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-milestone-rose/20 dark:bg-milestone-rose/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative bg-white dark:bg-[#1f2525] p-6 rounded-2xl border border-milestone-rose/20 shadow-soft-rose overflow-hidden flex items-center gap-5">
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-milestone-rose/20 flex items-center justify-center text-milestone-primary dark:text-milestone-rose">
                            <span className="material-symbols-outlined text-[32px]">photo_camera_back</span>
                        </div>
                        <div className="flex flex-col flex-grow">
                            <h2 className="font-display font-bold text-xl text-[#131616] dark:text-white mb-1 group-hover:text-milestone-primary transition-colors">Daily Memory</h2>
                            <p className="font-noto-sans text-[#6a7b7c] text-sm leading-relaxed">
                                Small moments, thoughts, and photos from your day.
                            </p>
                        </div>
                        <div className="text-milestone-rose opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>
                    </div>
                </button>

                <button 
                  onClick={() => navigate('/milestone/new')}
                  className="group relative w-full text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-milestone-gold/20 dark:bg-milestone-gold/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative bg-milestone-gradient dark:bg-gradient-to-br dark:from-[#2a2f2f] dark:to-[#1f2525] p-6 rounded-2xl border border-milestone-gold/30 shadow-soft-gold overflow-hidden flex items-center gap-5">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-milestone-gold text-6xl">auto_awesome</span>
                        </div>
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-milestone-gold/20 to-milestone-gold/40 flex items-center justify-center text-[#967d4d] dark:text-[#e0cba0] shadow-inner ring-1 ring-milestone-gold/20">
                            <span className="material-symbols-outlined text-[32px] fill-current">favorite</span>
                        </div>
                        <div className="flex flex-col flex-grow relative z-10">
                            <h2 className="font-display font-bold text-xl text-[#131616] dark:text-white mb-1 group-hover:text-[#967d4d] transition-colors flex items-center gap-2">
                                Milestone Event
                                <span className="material-symbols-outlined text-milestone-gold text-sm animate-pulse">spark</span>
                            </h2>
                            <p className="font-noto-sans text-[#6a7b7c] text-sm leading-relaxed">
                                Big steps like anniversaries, firsts, or celebrations.
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-auto pb-8 pt-10">
                <button 
                  onClick={() => navigate('/dashboard')}
                  aria-label="Close" 
                  className="w-12 h-12 rounded-full border border-milestone-primary/20 dark:border-white/20 flex items-center justify-center text-milestone-primary dark:text-white hover:bg-milestone-primary hover:text-white hover:border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-milestone-primary/50 group"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>
            </div>
        </main>
    </div>
  );
};

export default SelectRecordType;