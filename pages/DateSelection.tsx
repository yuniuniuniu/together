import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

const DateSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div className="flex items-center p-4 pb-2 justify-between z-10">
        <div 
          className="text-ink flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <div className="text-sm font-medium opacity-50 uppercase tracking-widest">Onboarding</div>
        <div className="size-12"></div> 
      </div>

      <div className="flex flex-col flex-1 px-8 pt-6 pb-8">
        <div className="mt-4 mb-10 text-center">
          <h1 className="text-ink tracking-tight text-[36px] font-bold leading-[1.15] text-center">
            When did your<br/>story begin?
          </h1>
        </div>

        <div className="relative w-full mb-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft border border-white/50 overflow-hidden h-[300px] flex items-center justify-center">
            {/* Selection Highlight */}
            <div className="absolute w-[calc(100%-32px)] h-14 bg-primary/25 rounded-xl z-0 border border-primary/20"></div>
            
            <div className="relative z-10 grid grid-cols-3 w-full px-6 gap-2 text-center h-full">
              {/* Month */}
              <div className="flex flex-col items-center justify-center h-full gap-5">
                <div className="text-lg text-gray-400 font-medium translate-y-2">Sep</div>
                <div className="text-2xl text-ink font-bold scale-110">Oct</div>
                <div className="text-lg text-gray-400 font-medium -translate-y-2">Nov</div>
              </div>
              {/* Day */}
              <div className="flex flex-col items-center justify-center h-full gap-5">
                <div className="text-lg text-gray-400 font-medium translate-y-2">13</div>
                <div className="text-2xl text-ink font-bold scale-110">14</div>
                <div className="text-lg text-gray-400 font-medium -translate-y-2">15</div>
              </div>
              {/* Year */}
              <div className="flex flex-col items-center justify-center h-full gap-5">
                <div className="text-lg text-gray-400 font-medium translate-y-2">2022</div>
                <div className="text-2xl text-ink font-bold scale-110">2023</div>
                <div className="text-lg text-gray-400 font-medium -translate-y-2">2024</div>
              </div>
            </div>
            
            {/* Gradient Overlays */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20"></div>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20"></div>
          </div>
        </div>

        <div className="text-center px-4 mb-auto">
          <p className="text-ink/50 text-sm font-medium leading-relaxed">
            This will be used to calculate your days together
          </p>
        </div>

        <div className="mt-8">
          <Button onClick={() => navigate('/setup/create')} fullWidth>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateSelection;