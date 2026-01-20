import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

const JoinSpace: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div className="flex items-center p-4 pb-2 justify-between">
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

      <div className="flex justify-center px-4 py-8">
        <fieldset className="relative flex gap-2 sm:gap-3">
          {[1, 2, 3].map((i) => (
            <input 
              key={i}
              className="flex h-16 w-12 sm:w-14 text-center text-xl font-semibold focus:outline-0 focus:ring-2 focus:ring-primary/50 bg-white border border-[#e3d3d3] rounded-xl transition-all"
              maxLength={1}
              placeholder="•"
              type="text"
            />
          ))}
          <div className="w-1 flex items-center justify-center opacity-20">—</div>
          {[4, 5, 6].map((i) => (
            <input 
              key={i}
              className="flex h-16 w-12 sm:w-14 text-center text-xl font-semibold focus:outline-0 focus:ring-2 focus:ring-primary/50 bg-white border border-[#e3d3d3] rounded-xl transition-all"
              maxLength={1}
              placeholder="•"
              type="text"
            />
          ))}
        </fieldset>
      </div>

      <div className="mt-auto px-8 pb-12 flex flex-col gap-4">
        <Button onClick={() => navigate('/confirm')} icon="favorite">
          Find My Partner
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