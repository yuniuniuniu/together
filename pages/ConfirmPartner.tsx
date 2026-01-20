import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

const ConfirmPartner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div className="flex items-center p-4 pb-2 justify-between">
        <div 
          className="text-ink flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-ink text-lg font-serif font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Confirm Partner</h2>
      </div>

      <div className="px-8 mt-2">
        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-3/4 rounded-full"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full flex flex-col items-center gap-2 mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] text-soft-gray font-bold">Connection Found</span>
          <h1 className="text-3xl font-serif text-ink text-center italic">Is this your TA?</h1>
        </div>

        <div className="w-full bg-white rounded-xl p-8 shadow-soft border border-gray-50 flex flex-col items-center animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
            <div 
              className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full h-40 w-40 border-4 border-white shadow-sm"
              style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBLGjCdV3rkHbAKNoMxHbYy-aLL8Jofo87uaJLWDk5Yb8PYfA2kRGYI2SBo2H3Q_Cgv2YJ__PrCrLoCEnFHbKfcKGqPVwAhnrwV74zfdkEU6jGdjBEpCAGY_DdtTCTgY7pQLAsBg-FrkJsZ5mJN2qWfoK1K4IwzjaKFOF_49gasdaAuqaP4Ks37LOoZq3k2rHUl3wh0kEKjzYUtUhZhFmDWuZACWCxTzQTOyVWhmnaIvCOj6KYaTxOvSKcDgwSpn8FsWrnNWqSlZpPx")'}}
            ></div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-ink text-2xl font-serif font-bold leading-tight tracking-tight text-center">Alex</p>
            <div className="flex items-center gap-2 py-1">
              <span className="material-symbols-outlined text-accent text-base filled" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
              <p className="text-ink text-lg font-medium leading-normal text-center tracking-tight">Anniversary: Nov 12, 2021</p>
            </div>
          </div>
        </div>

        <div className="mt-8 px-4 text-center">
          <p className="text-soft-gray text-base leading-relaxed italic">
            "Once connected, you'll be able to share private notes and daily captures."
          </p>
        </div>
      </div>

      <div className="pb-12 px-6 flex flex-col gap-4">
        <Button onClick={() => navigate('/celebration')} fullWidth>
          Confirm & Connect
        </Button>
        <div className="flex items-center justify-center gap-1.5 opacity-60">
          <span className="material-symbols-outlined text-xs">lock</span>
          <p className="text-soft-gray text-xs font-normal leading-normal text-center">
            You can only connect with one partner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPartner;