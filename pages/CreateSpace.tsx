import React from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSpace: React.FC = () => {
  const navigate = useNavigate();

  // Simulate waiting then redirecting for demo purposes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // In a real app, this would happen via websocket/polling when partner joins
      navigate('/dashboard'); 
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
        <div className="mb-8 flex justify-center items-center gap-4 text-primary">
          <span className="material-symbols-outlined text-5xl">auto_stories</span>
          <span className="material-symbols-outlined text-3xl text-accent">favorite</span>
        </div>

        <div className="w-full text-center">
          <h2 className="text-ink tracking-tight text-[28px] font-bold leading-tight pb-2">Start Your Journey</h2>
          <p className="text-ink/70 text-base font-normal leading-relaxed px-4">
            Anniversary set for <span className="font-semibold text-accent">October 14, 2023</span>.<br className="hidden sm:inline"/> Share this code to sync your diaries.
          </p>
        </div>

        <div className="w-full mt-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent-peach/50 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-accent-peach p-8 rounded-xl flex flex-col items-center shadow-sm border border-black/5">
              <span className="text-xs font-semibold tracking-widest text-accent uppercase mb-4">Your Private Code</span>
              <div className="flex gap-3 mb-6">
                <span className="text-4xl font-bold tracking-widest text-ink font-serif">8 2 4 1 9 5</span>
              </div>
              <button className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-ink text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                <span className="truncate">Copy Code</span>
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