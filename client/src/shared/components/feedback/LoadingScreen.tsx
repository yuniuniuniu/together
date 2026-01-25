import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="relative flex flex-col h-screen w-full items-center justify-center font-display bg-loading-bg-light dark:bg-loading-bg-dark overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[70%] h-[60%] rounded-full bg-loading-primary/10 blur-[120px] animate-float"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[70%] h-[60%] rounded-full bg-loading-primary-deep/10 blur-[120px] animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>
      <div className="flex flex-col items-center gap-16 z-10 w-full max-w-md px-8">
        <div className="relative h-48 w-48 flex items-center justify-center">
          <div className="absolute w-32 h-32 bg-loading-primary/20 rounded-full blur-xl animate-pulse-glow"></div>
          <div className="absolute w-20 h-20 bg-loading-primary mix-blend-multiply dark:mix-blend-screen blur-[8px] animate-merge-left opacity-90"></div>
          <div className="absolute w-20 h-20 bg-loading-primary-deep mix-blend-multiply dark:mix-blend-screen blur-[8px] animate-merge-right opacity-90"></div>
          <div className="absolute w-24 h-24 border border-white/40 dark:border-white/10 rounded-[40%] animate-pulse-glow rotate-45 opacity-0 scale-50" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-loading-text dark:text-loading-text-dark text-4xl md:text-5xl font-medium italic tracking-tight leading-[1.15] animate-float">
            Where two worlds<br />
            <span className="text-loading-primary-deep/90 dark:text-loading-primary-deep">become one</span>
          </h1>
          <p className="text-loading-text/40 dark:text-loading-text-dark/40 text-sm font-sans tracking-[0.2em] uppercase mt-2 opacity-0 animate-[fade-in_2s_ease-out_forwards_1s]">
            Better Together
          </p>
        </div>
      </div>
      <div className="absolute bottom-2 w-full flex justify-center pb-4 pointer-events-none">
        <div className="w-32 h-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full"></div>
      </div>
      <div className="sr-only" role="status">Loading shared space...</div>
    </div>
  );
};
