import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unbinding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-background-light relative h-full min-h-screen">
      {/* Header */}
      <div className="flex items-center p-6 justify-between relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <span className="material-symbols-outlined text-ink" style={{fontSize: '20px'}}>arrow_back</span>
        </button>
        <h2 className="text-sm font-semibold tracking-wide uppercase text-soft-gray">Unbinding</h2>
        <div className="size-10"></div>
      </div>

      {/* Illustration */}
      <div className="px-6 pt-2 pb-6">
        <div className="w-full aspect-[4/3] bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm relative group">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105" 
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCtfy0d7_Aa-h3nYGIWCqB0hDqo67ElxLqUGcBSWQ_4Kh2-cCHeaA6u71HzO-krBzZ4T2uEOHyaHiFTH5Y9LX4SVEndpLL0a5Fs81_fpOrP3KdtfZdXpADlPUdHKJ-wGDt3_sm7HGFpx6wE2zdVrOm0Vzd0adOwNw4QmIx95XJI_CUaZ9VoHB_I2NH-aSjCEmYTooZ3Ygqf5564idhV5veCXM0cz-TXaXuHaiGlb0ZuCR-9KALNqzcJ6UXBxK_BIhyY50-0Fig2BBmo")'}}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background-light/40 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 flex flex-col">
        <h1 className="text-3xl font-medium leading-tight tracking-tight text-center mb-4 text-ink">
          A pause, <br/>not a goodbye
        </h1>
        <p className="text-base text-ink/60 text-center leading-relaxed font-normal mb-8 max-w-[90%] mx-auto">
          Unbinding is a big step. We've set aside a <span className="text-ink font-medium bg-primary/30 px-1 rounded">7-day cooling-off period</span> where your shared journal remains safe.
        </p>

        {/* Timeline Card */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6 border border-gray-100">
          <div className="grid grid-cols-[32px_1fr] gap-x-4">
            {/* Item 1 */}
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-primary/30 flex items-center justify-center text-ink">
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>schedule</span>
              </div>
              <div className="w-0.5 bg-gray-100 h-full min-h-[2rem]"></div>
            </div>
            <div className="pb-6 pt-1">
              <p className="text-sm font-semibold text-ink">Unbind Requested</p>
              <p className="text-xs text-ink/50 mt-0.5">Your connection pauses today</p>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-ink/40">
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>event_busy</span>
              </div>
              <div className="w-0.5 bg-gray-100 h-full min-h-[2rem]"></div>
            </div>
            <div className="pb-6 pt-1">
              <p className="text-sm font-semibold text-ink">Cooling-off Period</p>
              <p className="text-xs text-ink/50 mt-0.5">Restore anytime for 7 days</p>
            </div>

            {/* Item 3 */}
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-ink/40">
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete_forever</span>
              </div>
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold text-ink">Permanent Deletion</p>
              <p className="text-xs text-ink/50 mt-0.5">Data removed after 7 days</p>
            </div>
          </div>
        </div>

        {/* Backup Tip */}
        <div className="flex items-start gap-3 px-2 mb-6 opacity-80">
          <span className="material-symbols-outlined text-ink/40 shrink-0" style={{fontSize: '20px'}}>inventory_2</span>
          <p className="text-xs text-ink/50 leading-relaxed">
            Tip: We recommend downloading a backup of your shared memories before proceeding with the unbinding process.
          </p>
        </div>

        <div className="mt-auto pb-6 space-y-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all rounded-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-ink font-semibold text-lg"
          >
            <span>Back to Our Space</span>
            <span className="material-symbols-outlined" style={{fontSize: '20px', fontVariationSettings: "'FILL' 1"}}>favorite</span>
          </button>
          <button 
            onClick={() => { console.log('Proceeding to unbind...'); navigate('/'); }}
            className="w-full h-12 rounded-full flex items-center justify-center text-ink/40 hover:text-ink/80 transition-colors text-sm font-medium"
          >
            Continue to Unbind
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unbinding;