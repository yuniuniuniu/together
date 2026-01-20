import React from 'react';
import { useNavigate } from 'react-router-dom';

const MemoryTimeline: React.FC = () => {
  const navigate = useNavigate();
  // Toggle this to see populated vs empty state
  const memories: any[] = []; // Set to empty array to see empty state

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-charcoal selection:bg-dusty-rose/30 min-h-screen pb-32 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-b border-stone-100 dark:border-zinc-800 shadow-sm transition-all duration-300 flex-none">
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm border border-stone-100 dark:bg-zinc-800 dark:border-zinc-700">
            <span className="material-symbols-outlined text-wine text-xl">favorite</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <h2 className="text-charcoal dark:text-zinc-100 text-lg font-bold tracking-tight">Memories</h2>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
            <span className="material-symbols-outlined text-charcoal dark:text-zinc-400">search</span>
          </div>
        </div>
        <div className="px-6 pb-4 max-w-md mx-auto w-full mt-1">
          <div className="bg-stone-100 dark:bg-zinc-800 p-1.5 rounded-xl flex items-center shadow-inner">
            <button className="flex-1 py-1.5 rounded-lg bg-dusty-rose text-wine dark:text-charcoal shadow-sm font-bold text-xs tracking-wider uppercase transition-all transform active:scale-95">Timeline</button>
            <button 
              className="flex-1 py-1.5 rounded-lg text-stone-400 dark:text-zinc-500 font-medium text-xs tracking-wider uppercase hover:text-stone-600 dark:hover:text-zinc-300 transition-all"
              onClick={() => navigate('/memory/map')}
            >
              Map
            </button>
          </div>
        </div>
      </nav>

      {memories.length > 0 ? (
        <main className="max-w-md mx-auto flex-1">
          <div className="px-6 pt-8 pb-4 text-center">
            <h1 className="text-4xl font-serif font-medium tracking-tight text-charcoal dark:text-zinc-100 italic">Our Story</h1>
            <p className="text-stone-500 dark:text-zinc-400 text-xs mt-2 font-bold tracking-widest uppercase">Collecting Moments Since May 2023</p>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-4 bottom-0 w-px bg-stone-200 dark:bg-zinc-800 z-0 hidden"></div>
            
            {/* Card 1: Today */}
            <section className="mt-2 relative z-10">
              <div className="px-6 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-wine bg-background-light dark:bg-background-dark pr-2">Today</span>
                </div>
                <span className="text-xs font-medium text-stone-400 bg-background-light dark:bg-background-dark pl-2">Oct 24</span>
              </div>
              <div className="px-6 mb-8">
                <div 
                  className="bg-white dark:bg-zinc-900 rounded-3xl shadow-soft p-5 border border-white/50 dark:border-zinc-800 cursor-pointer"
                  onClick={() => navigate('/memory/detail')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full ring-2 ring-stone-100 dark:ring-zinc-800 p-0.5">
                        <img className="w-full h-full object-cover rounded-full" alt="Portrait of a smiling woman" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5qDkqZTpuEyLSRQmRuSTSN9zmSFd7iGDnNTq4TFgbCRKjwGwKN_JmjOMaQ1RqCIW_Bco3PnDxVvrfB7WHtGs788jO0IKVBeChiOLYfyTTi29m0UG0FCc7SFEZueW26NlQrOglowejlpmwus0Ka_Go1BZ0h3ZoNfTNtEjAoZwOMwcqqkKsbGwe6Upd7R7_43ZjfkiLz7hvi1MhYYtWKujTFHg_l8Fp9c5tf2Fm7bDwMXYPn249NYcCMiwafPgX565oMOE7jaSCrSw6"/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal dark:text-zinc-200">Sarah</p>
                        <p className="text-[10px] text-stone-400 uppercase font-medium tracking-wide">9:15 AM • Daily Note</p>
                      </div>
                    </div>
                    <button className="text-stone-300 hover:text-stone-500 dark:text-zinc-600 transition-colors">
                      <span className="material-symbols-outlined text-xl">more_horiz</span>
                    </button>
                  </div>
                  <p className="text-stone-600 dark:text-zinc-300 text-[15px] leading-relaxed mb-4 font-serif italic">
                    "Woke up to the smell of fresh coffee. You always remember exactly how much oat milk I like. It's the little things."
                  </p>
                  <div className="rounded-2xl overflow-hidden shadow-sm aspect-[4/3] w-full">
                    <img className="w-full h-full object-cover" alt="Two coffee mugs on a wooden table" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgY1dpm1lk9c52hEjM5PijDnQxE303dRAmMBBRFF7XxG5ST7EJmW8vl9RrLPuw4Mrzdxfs1-gWzbaSoMKJaZRwYER_kNFMe9XXzYZaAnAXm-pvCqqFbUc6rOFlkvp223Q6KaWSe5F0XrpnJwqMsJaROwMMUr_Nl5RuEJSQnITLe163Gh9ZE7z_aFmqVEuSoUeu6MVBgZgHqxtO3xr9Uj5teJCe7FwXoCT33hNhSY_bN4jh94-ntcWEvB-L-V1ec7_E_1J-BqIVkCiC"/>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100 dark:border-zinc-800">
                    <div className="flex -space-x-2 overflow-hidden">
                      <div className="size-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-stone-100 flex items-center justify-center text-[8px]">❤️</div>
                      <div className="size-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-stone-100 flex items-center justify-center text-[8px]">🥺</div>
                    </div>
                    <span className="text-xs text-stone-400">2 reactions</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Yesterday */}
            <section className="relative z-10">
              <div className="px-6 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400 bg-background-light dark:bg-background-dark pr-2">Yesterday</span>
                </div>
                <span className="text-xs font-medium text-stone-400 bg-background-light dark:bg-background-dark pl-2">Oct 23</span>
              </div>
              <div className="px-6 mb-8">
                <div 
                  className="bg-white dark:bg-zinc-900 rounded-3xl shadow-soft p-5 border border-white/50 dark:border-zinc-800 cursor-pointer"
                  onClick={() => navigate('/memory/detail')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full ring-2 ring-stone-100 dark:ring-zinc-800 p-0.5">
                        <img className="w-full h-full object-cover rounded-full" alt="Portrait of a smiling man" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvhI3M_7PWlHn_6CKyktv734qPR5bZ1m7Ff5Ve6Gmf3UXNbSveUvhi1zajPM-sk0pVKb6olM0i7i31KXqFtauNhf83UJCEzXkfwCwI45DN993l2_MEjrLu10zbbeV_rP_yRuuLUvqftg_OcwayyxJ09qDt1M-cbfPFcDJj6Jsc_AhMDIurA05ag9hF1IVx-yC86RkXgkK5SexzTcY7E2ntsluGZw8lgmZjfHBwVFGKPt72Dyrv37e5j4q25bXq8EwT5jpt8efQNQKE"/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal dark:text-zinc-200">Mark</p>
                        <p className="text-[10px] text-wine/80 uppercase font-medium tracking-wide">6:45 PM • Special Moment</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-wine text-xl icon-filled" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
                  </div>
                  <h4 className="text-lg font-serif font-medium text-charcoal dark:text-zinc-100 mb-2">Sunset at the pier</h4>
                  <p className="text-stone-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                    The sky was painting shades of pink and orange. Reminded me of our first date...
                  </p>
                  <div className="rounded-2xl overflow-hidden shadow-sm w-full h-48">
                    <img className="w-full h-full object-cover" alt="Scenic sunset over the ocean pier" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPK3zo3kjevxGXqNlWO-4LFaW3ZgqVtKj2G7mwAn1rkI7boqnLzOwofAVubiCbl-qVLsUDENOKS-xzv6T_xkMIgrO-fYFrgYK8q9JiRCfZmOKfz1OxdicCLraz1AP3EXppqr7qDx5WndXyS1TPKQSj8X6r8JQ3uWkz_ynyiepirUx06QCHow_VJPXVSW5xR6yIcl5NdCwo9gWMbdZ2Lt05jCTzGNXzdalfqNyWH2A6QGRzBAdT_ABQPyV4nBebUqVER08sR4ERvj3H"/>
                  </div>
                </div>
              </div>
            </section>

            {/* Milestone: 100 Days */}
            <div className="py-2 mb-6 relative z-10 w-full px-3">
              <div className="bg-blush-deep dark:bg-wine/40 rounded-2xl shadow-milestone p-8 text-center relative overflow-hidden group border border-white/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 transform translate-x-1/3 -translate-y-1/3">
                  <span className="material-symbols-outlined text-9xl">celebration</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-14 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center mb-4 shadow-sm text-wine dark:text-white">
                    <span className="material-symbols-outlined text-3xl">celebration</span>
                  </div>
                  <h3 className="font-serif text-3xl text-wine dark:text-zinc-100 font-medium italic mb-2 tracking-wide leading-tight">100 Days<br/>Together</h3>
                  <div className="w-8 h-1 bg-wine/20 dark:bg-white/20 rounded-full my-3"></div>
                  <p className="text-wine/80 dark:text-zinc-300 text-xs font-bold uppercase tracking-widest">October 20</p>
                </div>
              </div>
            </div>

            {/* Card 3: Oct 18 */}
            <section className="relative z-10">
              <div className="px-6 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400 bg-background-light dark:bg-background-dark pr-2">Oct 18</span>
                </div>
                <span className="text-xs font-medium text-stone-400 bg-background-light dark:bg-background-dark pl-2">Friday</span>
              </div>
              <div className="px-6 mb-8">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-soft p-5 border border-white/50 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-full ring-2 ring-stone-100 dark:ring-zinc-800 p-0.5">
                      <img className="w-full h-full object-cover rounded-full" alt="Portrait of a smiling woman" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVVtsSNPHNy01z5jCxa4SroFRFpufvVxyPfY0rKDHVT3t6OxyqtLlXK0aX3AMFOx4zbpcWR_Gkqh_vA3PZh9UZ0bltoNTdAuxmp7qC7bz6RE-8kEQdJxJsy4FlVa7HXmtP43VukDvKCxli8QSKQXoAjP4cCoKdq6MxUsuypXiEvFa76woLapSJ_NZs6AiX6KtvGb9rM_5CgsKbdRzkddhEr-dxdTdhhhvUiMO9cKcoaJ-4f7smfENb5-gjc3l6YJmnTw4iSHxNIGS6"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-charcoal dark:text-zinc-200">Sarah</p>
                      <p className="text-[10px] text-stone-400 uppercase font-medium tracking-wide">8:00 PM</p>
                    </div>
                  </div>
                  <p className="text-stone-600 dark:text-zinc-300 text-[15px] leading-relaxed font-serif italic pl-14">
                    "Finally tried that pasta place. The 'Angry Vodka Sauce' was no joke, but we finished it all. Best Friday night in a while. 🍝"
                  </p>
                </div>
              </div>
            </section>

            {/* Milestone: First Trip */}
            <div className="py-2 pb-8 relative z-10 w-full px-3">
              <div className="bg-apricot dark:bg-amber-900/40 rounded-2xl shadow-milestone p-8 text-center relative overflow-hidden group border border-white/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 transform translate-x-1/3 -translate-y-1/3">
                  <span className="material-symbols-outlined text-9xl">flight_takeoff</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-14 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center mb-4 shadow-sm text-yellow-900 dark:text-amber-100">
                    <span className="material-symbols-outlined text-3xl">flight_takeoff</span>
                  </div>
                  <h3 className="font-serif text-3xl text-yellow-900 dark:text-amber-100 font-medium italic mb-2 tracking-wide leading-tight">First Trip<br/>Together</h3>
                  <div className="w-8 h-1 bg-yellow-900/10 dark:bg-white/20 rounded-full my-3"></div>
                  <p className="text-yellow-900/70 dark:text-amber-100/70 text-xs font-bold uppercase tracking-widest">September 15</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-md mx-auto flex-1 flex flex-col items-center justify-center px-6 w-full py-12">
          <div className="relative w-full max-w-[280px] aspect-square mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-apricot/30 dark:bg-amber-900/20 rounded-full blur-3xl transform scale-75"></div>
            <div className="relative w-56 h-64 perspective-1000">
              <div className="absolute top-0 left-0 w-full h-full bg-white dark:bg-zinc-800 p-4 shadow-lg border border-stone-100 dark:border-zinc-700 transform -rotate-6 rounded-sm">
                <div className="w-full h-[75%] bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 flex items-center justify-center opacity-60">
                  <span className="material-symbols-outlined text-4xl text-stone-200 dark:text-zinc-700">image</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-full h-full bg-white dark:bg-zinc-800 p-4 shadow-xl border border-stone-50 dark:border-zinc-600 transform rotate-3 rounded-sm transition-transform duration-700 hover:rotate-0 hover:scale-[1.02]">
                <div className="w-full h-[75%] bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden group">
                  <span className="material-symbols-outlined text-5xl text-stone-200 dark:text-zinc-600 group-hover:scale-110 transition-transform duration-500">add_a_photo</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="h-2 w-20 bg-stone-100 dark:bg-zinc-700 rounded-full"></div>
                </div>
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-dusty-rose/30 backdrop-blur-sm transform -rotate-1 shadow-sm border-l border-r border-white/20"></div>
            </div>
          </div>
          <div className="text-center space-y-3 max-w-xs mx-auto mb-10">
            <h3 className="text-3xl font-serif text-charcoal dark:text-zinc-100 font-medium italic">
                Our story hasn't started yet
            </h3>
            <p className="text-stone-500 dark:text-zinc-400 text-sm leading-relaxed font-medium">
                Create your first story to fill this space.
            </p>
          </div>
          <button 
            onClick={() => navigate('/record-type')}
            className="bg-wine hover:bg-wine/90 text-white pl-6 pr-8 py-4 rounded-full shadow-lg shadow-wine/25 flex items-center gap-3 font-bold tracking-wide transition-all transform hover:scale-105 active:scale-95 group"
          >
            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add_circle</span>
            <span className="uppercase text-xs tracking-widest">Create Story</span>
          </button>
        </main>
      )}

      {/* FAB (Only show when not empty for now, or keep it consistent) */}
      {memories.length > 0 && (
        <div className="fixed bottom-28 right-6 z-40">
          <button 
            onClick={() => navigate('/record-type')}
            className="bg-wine text-white size-14 rounded-full shadow-lg shadow-wine/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">edit</span>
          </button>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-stone-100 dark:border-zinc-800 pb-8 pt-4 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto px-6">
          <button 
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/dashboard')}
          >
            <span className="material-symbols-outlined text-stone-400 group-hover:text-charcoal dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">home</span>
            <span className="text-[10px] font-medium text-stone-400 group-hover:text-charcoal dark:text-zinc-500 dark:group-hover:text-zinc-300">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 group w-16">
            <div className="bg-wine/10 rounded-2xl px-4 py-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-wine filled text-[26px]">favorite</span>
            </div>
            <span className="text-[10px] font-bold text-wine">Memories</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/settings')}
          >
            <span className="material-symbols-outlined text-stone-400 group-hover:text-charcoal dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">settings</span>
            <span className="text-[10px] font-medium text-stone-400 group-hover:text-charcoal dark:text-zinc-500 dark:group-hover:text-zinc-300">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryTimeline;