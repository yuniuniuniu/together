import React from 'react';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  // Toggle this to see populated vs empty state
  const notifications: any[] = []; 

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#1b100e] dark:text-[#fcf9f8] min-h-screen">
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative pb-8">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md flex items-center px-6 py-5 justify-between">
          <div className="text-[#1b100e] dark:text-white flex size-10 shrink-0 items-center justify-start -ml-2">
            <span 
              onClick={() => navigate(-1)}
              className="material-symbols-outlined cursor-pointer text-2xl hover:text-primary transition-colors"
            >
              arrow_back
            </span>
          </div>
          <h2 className={`text-[#1b100e] dark:text-white text-xl font-bold ${notifications.length === 0 ? 'tracking-[0.2em]' : 'tracking-widest'} flex-1 text-center font-display uppercase`}>
            Notifications
          </h2>
          <div className="flex size-10 items-center justify-end -mr-2">
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="px-6">
            {/* Populated State */}
            {/* Today Section */}
            <div className="flex items-center justify-between pt-4 pb-4">
              <h3 className="text-[#1b100e] dark:text-white text-2xl font-bold leading-tight tracking-tight font-serif italic">Today</h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b100e] bg-dusty-rose/30 dark:bg-dusty-rose/20 px-3 py-1.5 rounded-full">
                <svg className="w-2.5 h-2.5 fill-orange-primary" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"></path></svg>
                3 New
              </span>
            </div>

            {/* Content List ... (Simplified for this view since we focus on empty state) */}
             <div className="mb-4">
                <div className="relative flex items-center gap-4 rounded-[2rem] bg-white dark:bg-[#36312d] p-5 warm-shadow border border-stone-100 dark:border-stone-800 transition-transform active:scale-[0.98]">
                  <div className="size-12 rounded-full bg-apricot/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#d97706] hand-drawn" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-apricot dark:text-amber-200">Nudge</span>
                      <span className="text-[10px] text-stone-400 font-medium">2m ago</span>
                    </div>
                    <p className="text-[#1b100e] dark:text-white text-base font-medium font-serif leading-snug">TA just nudged you</p>
                    <p className="text-stone-500 dark:text-stone-400 text-sm leading-normal font-light">Thinking of you right now!</p>
                  </div>
                  <div className="absolute top-5 right-5">
                    <div className="w-2 h-2 rounded-full bg-orange-primary"></div>
                  </div>
                </div>
              </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-dusty-rose/10 dark:bg-dusty-rose/5 rounded-full blur-3xl"></div>
              <svg className="w-24 h-24 text-dusty-rose-dark/60 dark:text-dusty-rose/40 relative z-10 hand-drawn" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path d="M12 18s-4.5-1-4.5-5.5S11 7 11 7s1 1 1.5 2C13 8 14 7 14 7s3.5 1 3.5 5.5S13 18 12 18z"></path>
                <path d="M11 7c0-2 1-3 1-3s1 1 1 3"></path>
                <path d="M10.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="currentColor"></path>
                <path d="M14.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="currentColor"></path>
                <path d="M11.5 12.5c.33.17.67.17 1 0"></path>
                <path d="M4 20c4 0 7-1 8-3s4-3 8-3" strokeDasharray="0.5 2"></path>
              </svg>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-[#1b100e] dark:text-white text-2xl font-semibold font-serif italic tracking-tight">
                Your space is quiet for now
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-base font-light leading-relaxed max-w-[240px] mx-auto">
                Moments from TA will appear here
              </p>
            </div>
            <div className="mt-12 flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose/60"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose/40"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;