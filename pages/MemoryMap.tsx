import React from 'react';
import { useNavigate } from 'react-router-dom';

const MemoryMap: React.FC = () => {
  const navigate = useNavigate();
  // Toggle this to see populated vs empty state
  const locations: any[] = []; // Set to empty array for empty state demo

  return (
    <div className="bg-cream text-[#4a4244] font-sans h-screen flex flex-col overflow-hidden selection:bg-map-primary/20">
      <header className="relative z-30 pt-14 pb-4 flex flex-col items-center bg-cream w-full shrink-0 border-b border-stone-100/50">
        <div className="flex flex-col items-center gap-4 w-full px-6">
          <h1 className="font-serif text-3xl font-bold text-[#2c2426] tracking-tight">Memories</h1>
          <div className="flex items-center p-1 bg-white rounded-full border border-stone-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] w-[240px] relative">
            <button 
                onClick={() => navigate('/memory/timeline')}
                className="flex-1 py-2 rounded-full text-[15px] font-medium text-[#9e8c93] hover:text-map-primary transition-colors font-serif"
            >
              Timeline
            </button>
            <button className="flex-1 py-2 rounded-full text-[15px] font-bold text-map-primary bg-map-rose shadow-[0_2px_8px_rgba(172,57,96,0.15)] font-serif">
              Map
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative w-full overflow-hidden bg-map-bg">
        <div className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 800">
            <defs>
              <filter height="140%" id="soft-glow" width="140%" x="-20%" y="-20%">
                <feGaussianBlur result="blur" stdDeviation="4"></feGaussianBlur>
                <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
              </filter>
            </defs>
            <g className="fill-white" filter="url(#soft-glow)">
              <path d="M-50,-50 H450 V850 H-50 Z" fill="#fcfcfc"></path>
              <path d="M-20,100 H180 V300 H-20 Z" fill="#fff5f5"></path>
              <path d="M220,50 H450 V350 H220 Z" fill="#fff5f5"></path>
              <path d="M-20,350 H250 V600 H-20 Z" fill="#fff5f5"></path>
              <path d="M290,400 H450 V750 H290 Z" fill="#fff5f5"></path>
            </g>
            <g fill="none" stroke="#f0e6e8" strokeLinecap="round" strokeWidth="4">
              <path d="M200,-50 V850"></path>
              <path d="M-50,320 H450"></path>
              <path d="M-50,150 Q100,180 250,120 T450,100"></path>
              <path d="M300,400 L450,350"></path>
              <path d="M-50,600 Q150,620 250,550"></path>
            </g>
            <path d="M300,500 C350,480 420,520 400,600 S320,650 280,600 S250,520 300,500 Z" fill="#F3C6C6" fillOpacity="0.10"></path>
            <path d="M50,150 C80,120 150,130 160,180 S100,250 50,220 Z" fill="#F3C6C6" fillOpacity="0.08"></path>
            
            {/* Render Paths and Dots only if not empty */}
            {locations.length > 0 && (
              <>
                <path className="pulse-glow" d="M116,216 Q140,260 200,304 T338,578" fill="none" stroke="#F3C6C6" strokeLinecap="round" strokeWidth="14"></path>
                <path className="animate-path-dash" d="M116,216 Q140,260 200,304 T338,578" fill="none" stroke="#ac3960" strokeLinecap="round" strokeOpacity="0.3" strokeWidth="2.5"></path>
                
                <g className="float-delayed" style={{animationDelay: "0.5s"}} transform="translate(155, 260)">
                  <circle className="shadow-sm" fill="#fff" r="9" stroke="#F3C6C6" strokeWidth="1.5"></circle>
                  <text dominantBaseline="central" fill="#ac3960" fontFamily="Material Symbols Outlined" fontSize="12" textAnchor="middle">favorite</text>
                </g>
                <g className="float-delayed" style={{animationDelay: "1s"}} transform="translate(200, 304)">
                  <circle className="shadow-sm" fill="#fff" r="9" stroke="#F3C6C6" strokeWidth="1.5"></circle>
                  <text dominantBaseline="central" fill="#ac3960" fontFamily="Material Symbols Outlined" fontSize="12" textAnchor="middle">footprint</text>
                </g>
                <g className="float-delayed" style={{animationDelay: "1.5s"}} transform="translate(260, 420)">
                  <circle className="shadow-sm" fill="#fff" r="9" stroke="#F3C6C6" strokeWidth="1.5"></circle>
                  <text dominantBaseline="central" fill="#ac3960" fontFamily="Material Symbols Outlined" fontSize="12" textAnchor="middle">favorite</text>
                </g>
              </>
            )}
          </svg>

          {locations.length > 0 ? (
            <>
              {/* Floating Card */}
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-[140%] z-20">
                <div 
                    className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-map-float flex items-center gap-3.5 w-[280px] border border-white/60 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => navigate('/memory/detail')}
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-100 bg-cover bg-center shrink-0 shadow-inner ring-1 ring-black/5" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAbUee0JcQSd1zMulaDUccgygcCQQSiitCtyK1MTvY3JGJGhe8L3mO_tnI12chhjBmo8MaP01-S6su_ICIh2jR_Qu5W8pGcfC-A1jb5TSMaG5gOTTiAJyTyPpJl7LCWqxJo97LhV4glDSEGPqh_z-KSZHJ8I9dBfJT6Tu4FGH0nlag6oIV7sx8CaKvgJl0icJsCM1ti9E971bklk9BzWV6U2TZxNDtSz9AmU9emraqXkjaLn1UmrljBgZUH2GoHGxM3Dvk592NUCJvn')"}}></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-[16px] font-bold text-[#2c2426] leading-tight truncate">First Coffee Date</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[12px] text-map-rose">calendar_today</span>
                      <p className="text-[11px] font-semibold text-map-primary uppercase tracking-wide">Oct 14, 2023</p>
                    </div>
                  </div>
                </div>
                <div className="w-4 h-4 bg-white/95 absolute left-1/2 -translate-x-1/2 -bottom-2 rotate-45 shadow-sm rounded-sm"></div>
              </div>

              {/* Pulse Dot */}
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-14 h-14 bg-map-primary/20 rounded-full animate-ping"></div>
                  <div className="relative w-11 h-11 bg-map-primary text-white rounded-full flex items-center justify-center shadow-lg border-[3px] border-white dark:border-[#150f11] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </div>
                </div>
              </div>

              {/* Other dots */}
              <div className="absolute top-[25%] left-[26%] z-10">
                <div className="w-3.5 h-3.5 bg-white border-2 border-map-primary rounded-full shadow-md ring-2 ring-white/50"></div>
              </div>

              {/* Count Indicator */}
              <div className="absolute bottom-[28%] right-[15%] z-10">
                <div className="w-9 h-9 bg-white text-map-primary rounded-full flex items-center justify-center shadow-map-card border border-map-rose hover:scale-110 transition-transform cursor-pointer">
                  <span className="font-serif font-bold text-xs">15</span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-28 right-6 z-20 flex flex-col gap-3">
                <button className="w-12 h-12 bg-white rounded-2xl shadow-map-soft flex items-center justify-center text-[#5c4048] hover:text-map-primary transition-colors border border-white/50">
                  <span className="material-symbols-outlined text-[24px]">my_location</span>
                </button>
                <button className="w-12 h-12 bg-map-primary rounded-2xl shadow-map-soft flex items-center justify-center text-white hover:bg-[#8a2d4d] transition-colors border border-white/20">
                  <span className="material-symbols-outlined text-[26px]">add</span>
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-float flex flex-col items-center text-center w-full max-w-[320px] border border-white/60 animate-float-gentle">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-map-rose/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-gradient-to-tr from-map-rose/30 to-[#fff0f0] rounded-full flex items-center justify-center ring-1 ring-white">
                    <span className="material-symbols-outlined text-[42px] text-map-primary drop-shadow-sm">luggage</span>
                  </div>
                  <div className="absolute right-0 -top-1 bg-white rounded-full p-1.5 shadow-md border border-map-rose/40 transform rotate-12">
                    <span className="material-symbols-outlined text-[18px] text-map-primary filled" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
                  </div>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#2c2426] mb-3">No footprints yet</h2>
                <p className="text-[#9e8c93] font-medium text-[15px] leading-relaxed px-4 mb-8">
                  Mark your first location in a story!
                </p>
                <button 
                  onClick={() => navigate('/record-type')}
                  className="w-full py-4 bg-map-primary hover:bg-[#8a2d4d] active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-map-primary/20 transition-all flex items-center justify-center gap-2.5 group"
                >
                  <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">add_location_alt</span>
                  Create Story
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <nav className="glass-panel fixed bottom-0 w-full pb-8 pt-4 px-8 flex justify-between items-center z-50 rounded-t-[32px] shadow-map-nav">
        <button 
            className="group flex flex-col items-center gap-1.5 w-16"
            onClick={() => navigate('/dashboard')}
        >
          <span className="material-symbols-outlined text-[#9e8c93] group-hover:text-map-primary transition-colors text-[26px]">home</span>
          <span className="text-[11px] font-medium text-[#9e8c93] group-hover:text-map-primary">Home</span>
        </button>
        <button className="group flex flex-col items-center gap-1.5 w-16 relative top-[-4px]">
          <div className="absolute -top-1 w-12 h-12 bg-map-primary/5 rounded-full scale-110 blur-sm"></div>
          <span className="material-symbols-outlined text-map-primary text-[28px] filled drop-shadow-sm" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
          <span className="text-[11px] font-bold text-map-primary">Memories</span>
        </button>
        <button 
            className="group flex flex-col items-center gap-1.5 w-16"
            onClick={() => navigate('/settings')}
        >
          <span className="material-symbols-outlined text-[#9e8c93] group-hover:text-map-primary transition-colors text-[26px]">settings</span>
          <span className="text-[11px] font-medium text-[#9e8c93] group-hover:text-map-primary">Settings</span>
        </button>
      </nav>
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-map-cream/30 to-transparent pointer-events-none z-40"></div>
    </div>
  );
};

export default MemoryMap;