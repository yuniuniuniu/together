import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-background-light relative">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
        <div className="w-full max-w-[320px]">
          <div className="text-center mb-10">
            <h1 className="text-[32px] font-extrabold tracking-tight text-ink mb-3 leading-tight">
              Let's get to know you
            </h1>
            <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
              Add a photo and details so your partner recognizes you instantly.
            </p>
          </div>

          <div className="flex justify-center mb-14">
            <div className="relative group cursor-pointer">
              <div className="w-40 h-40 rounded-full bg-white border border-primary/20 shadow-soft flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
                <span className="material-symbols-outlined text-[64px] text-primary/60 relative z-10" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
              </div>
              <div className="absolute bottom-1 right-2 bg-primary text-white rounded-full w-10 h-10 shadow-lg border-4 border-background-light flex items-center justify-center transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[20px] font-bold">add</span>
              </div>
            </div>
          </div>

          <form className="space-y-10 w-full" onSubmit={(e) => { e.preventDefault(); navigate('/sanctuary'); }}>
            <div className="space-y-2 relative group">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4" htmlFor="nickname">
                What should we call you?
              </label>
              <div className="relative">
                <input 
                  className="w-full py-3 bg-transparent border-b-[1.5px] border-gray-200 focus:border-primary focus:ring-0 text-xl font-semibold text-ink placeholder-gray-300 text-center transition-colors outline-none rounded-none" 
                  id="nickname" 
                  placeholder="e.g. Honey" 
                  type="text"
                />
                <div className="absolute right-0 bottom-3 text-gray-300 pointer-events-none group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-background-light via-background-light to-transparent z-20">
        <button 
          onClick={() => navigate('/sanctuary')}
          className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white text-[17px] font-bold rounded-full shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
        >
          <span>Save & Continue</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;