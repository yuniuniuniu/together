import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-background-light pb-12">
      <header className="sticky top-0 z-50 bg-background-light/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-black/[0.03]">
        <button 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <span className="material-symbols-outlined text-ink/80">arrow_back</span>
        </button>
        <h1 className="text-xs font-bold tracking-[0.15em] uppercase text-soft-gray text-center">Couple Settings</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -mr-2">
          <span className="material-symbols-outlined text-ink/80">more_horiz</span>
        </button>
      </header>

      <main className="flex-1 px-6">
        <section className="py-10 flex flex-col items-center">
          <div className="flex items-center justify-center mb-8 w-full">
            <div 
              className="w-24 h-24 rounded-full border-4 border-white bg-cover bg-center shadow-lg relative z-10"
              style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDi_BVSbyGdh2-LTpHmC0CY2EF4wh0aQIsBApHLcvxABqytJCklk8f5GOMRenW0c1pUzI0qyC3ZLLauZ210J8bkff7qRJUZWASX8WFIMpeZA32AWV_p6I4S3H1iuRhWJWDIxnRVd7hI8tp0xk7-Zkh5IuUA8F4S_kF9b6bq05LKfsyoxEA6-EYWvgIakSFJHnKeJQVv44rHkJ9HtQrgO_7svGQ0F6v04x8OsGQAyEHoAGarJPAzn9xjV6EcTSZ5hFDd04qI05OhzC8M")'}}
            ></div>
            <div className="w-12 h-[2px] bg-primary/40 -mx-3 flex items-center justify-center relative z-0">
              <div className="bg-background-light p-1 rounded-full border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined text-accent text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
              </div>
            </div>
            <div 
              className="w-24 h-24 rounded-full border-4 border-white bg-cover bg-center shadow-lg relative z-10"
              style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKSKS0PQi3pbdwoO92niYuN_xk6CoF7Y2aRRyGHEfr3Esu9vK5gfUD8vyE2Qz8vz2mA7PXefp_m9yqZ7Rzr3iex6tqJsLPtc7GYIG_n9r637rxfU2QR6_IBmv5QXxYZctA7V4ahkfY57URjSmW5-xIeAddxSQaXhgMR1V99JEvTc7LZfZWmzmOzky0t8pVRW3PKOwa3a6trLFoc9R-usHQBYZxQNAVTyaOuvgVJQrkEUjKAjetRLFbGW79NBsa3aaSqlqneGs4pDN")'}}
            ></div>
          </div>
          <h2 className="font-serif text-3xl font-medium text-center tracking-tight mb-2 text-ink">Together for 482 days</h2>
          <p className="text-soft-gray/80 text-sm font-medium tracking-wide">Since October 24, 2022</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-soft-gray/60">Relationship Info</h3>
          </div>
          
          <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-black/[0.02]">
            {/* Item 1 */}
            <button className="w-full flex items-center gap-4 px-5 py-5 hover:bg-primary/5 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-soft-gray shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest mb-1">What my partner calls me</p>
                <p className="font-serif text-lg text-ink leading-none">Bean</p>
              </div>
              <span className="material-symbols-outlined text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
            </button>
            <div className="h-[1px] bg-black/[0.03] mx-5"></div>
            
            {/* Item 2 */}
            <button className="w-full flex items-center gap-4 px-5 py-5 hover:bg-primary/5 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-soft-gray shrink-0">
                <span className="material-symbols-outlined text-[20px]">favorite</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest mb-1">What I call my partner</p>
                <p className="font-serif text-lg text-ink leading-none">Sprout</p>
              </div>
              <span className="material-symbols-outlined text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
            </button>
            <div className="h-[1px] bg-black/[0.03] mx-5"></div>

            {/* Item 3 */}
            <button className="w-full flex items-center gap-4 px-5 py-5 hover:bg-primary/5 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-soft-gray shrink-0">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest mb-1">Anniversary Date</p>
                <p className="font-serif text-lg text-ink leading-none">Oct 24, 2022</p>
              </div>
              <span className="material-symbols-outlined text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all">edit</span>
            </button>
          </div>
        </section>

        <section className="mt-10 mb-8">
          <p className="text-center text-xs text-gray-400 mb-6 px-8 leading-relaxed font-medium">
            Unbinding your account will archive your shared gallery. You will need a new invite code to reconnect.
          </p>
          <button 
            onClick={() => navigate('/settings/unbind')}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-primary/20 text-[#5A3E3E] font-bold shadow-sm hover:shadow-md hover:bg-primary/30 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">heart_broken</span>
            <span>Unbind Connection</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;