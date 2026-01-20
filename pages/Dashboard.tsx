import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#2c1818] dark:text-gray-100 min-h-screen pb-32 selection:bg-primary/30 flex flex-col font-sans">
      <nav className="flex items-center justify-between px-6 py-5 sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <div className="size-10 flex items-center justify-start">
          <span className="material-symbols-outlined text-dusty-rose text-2xl">favorite</span>
        </div>
        <h2 className="text-base font-semibold tracking-wide uppercase text-[#5d3a3a] dark:text-gray-300">Our Space</h2>
        <div className="size-10 flex items-center justify-end">
          <button 
            className="p-2 hover:bg-primary/20 rounded-full transition-colors text-dusty-rose"
            onClick={() => navigate('/notifications')}
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto w-full px-6 pt-2 space-y-12 flex-1">
        <section className="flex flex-col items-center gap-10 mt-4">
          <div className="flex items-center gap-6 relative">
            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent -z-10"></div>
            <div className="relative group cursor-pointer" onClick={() => navigate('/settings')}>
              <div 
                className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300"
                style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC30MsYoNnpEvZsEOP7boz3-OEgWm_8bqG9pKoYD8ZhDpDGV_hjzEkrVmvNkIdIGWifjYPLwK1nWZh8nQTCysRbXCuZVo_-zCjxj2T0YidV92XUCLw6uy-YA7uBmHKzO37CQy8BBHTJbuF2TjFOm984llNGnZkF-yjwffitsV8BYgNUudfWbwy3U-T7jtMxZM6bms9druPx8baOtjjZDKvDGiN_TbVWqygKWhzq58crJqNZsPmQ9nEFCOzAYalxwWYOW1MZITV4l-Sy")'}}
              ></div>
            </div>
            <div className="flex flex-col items-center justify-center size-12 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-primary/20 z-10">
              <span className="material-symbols-outlined text-accent text-xl animate-pulse" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
            </div>
            <div className="relative group cursor-pointer" onClick={() => navigate('/settings')}>
              <div 
                className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300"
                style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBhPCloPMwfO7rU9egZjKAWfO89-_Xl-Oh-cTLCgIJR7dNV_3WwOlbW_-gwB1fvqN3q3BGcjkSKXmyEKGyYZUq5zwY_OpOD2NXkcoX_tLDvI65l3L7ACDNJblUeNtntWlaCPu7m-Y16P_t-VMB8aGXZGt0BReUpBSIgkUgf3Sz6y7vZM-HkxbjKK0mnqeW7-tWpgygwJVQzzNek-ftH8odtuMJfD0Pm1_mj1n_h1Ym3U5rufvYLvHLxLxPSrRUCyxaMieX1SK9ywKxD")'}}
              ></div>
            </div>
          </div>
          <div className="text-center space-y-3">
            <h1 className="font-serif text-[3.5rem] leading-[1.1] text-[#4A2B2B] dark:text-white">
              <span className="text-accent italic font-medium">128</span> Days<br/>
              <span className="text-3xl text-[#6D4C4C] dark:text-gray-300">Together</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-soft-sand/50 dark:bg-white/5 rounded-full mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <p className="text-[#8c5a5a] dark:text-gray-400 text-xs font-semibold uppercase tracking-widest">Since Sept 12, 2023</p>
            </div>
          </div>
        </section>

        <section className="w-full px-2">
          <button 
            onClick={() => navigate('/record-type')}
            className="group w-full bg-dusty-rose-light hover:bg-[#eccaca] text-[#4a2b2b] py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] shadow-glow border border-white/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="material-symbols-outlined relative z-10">edit_note</span>
            <span className="text-lg font-bold tracking-tight relative z-10">Record Today's Story</span>
          </button>
        </section>

        {/* Empty State Card */}
        <section className="w-full px-1">
          <div className="w-full bg-white dark:bg-zinc-800 rounded-[2rem] p-8 text-center shadow-soft border border-dashed border-dusty-rose/30 flex flex-col items-center justify-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-soft-sand/20 to-transparent pointer-events-none"></div>
            <div className="relative transform group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-dusty-rose/10 rounded-full blur-xl transform scale-150"></div>
              <div className="relative size-24 bg-soft-sand/50 dark:bg-white/5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-700 shadow-sm">
                <span className="material-symbols-outlined text-4xl text-dusty-rose/80" style={{fontVariationSettings: "'FILL' 0, 'wght' 300"}}>import_contacts</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-1.5 rounded-full shadow-md border border-primary/20">
                <span className="material-symbols-outlined text-xl text-accent" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
              </div>
            </div>
            <div className="space-y-3 z-10 max-w-[260px]">
              <h3 className="text-2xl font-serif text-[#4a2b2b] dark:text-gray-100 leading-tight">Your journey awaits</h3>
              <p className="text-[#8c5a5a] dark:text-gray-400 text-sm leading-relaxed">
                Record your first memory together to see it here
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 px-8 text-center relative">
          <span className="material-symbols-outlined absolute top-4 left-4 text-4xl text-primary/20 rotate-180">format_quote</span>
          <p className="font-serif italic text-xl text-[#8c5a5a] dark:text-gray-400 leading-relaxed">
            "Home is wherever I am with you."
          </p>
          <span className="material-symbols-outlined absolute bottom-4 right-4 text-4xl text-primary/20">format_quote</span>
        </section>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border-t border-primary/20 dark:border-zinc-800 pb-safe z-50 rounded-t-[2rem] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-3 w-full h-[88px] max-w-md mx-auto px-6">
          <button className="flex flex-col items-center justify-center gap-1.5 group">
            <div className="p-2.5 rounded-xl group-hover:bg-soft-sand/50 transition-colors">
              <svg className="w-7 h-7 stroke-dusty-rose group-hover:stroke-accent transition-colors fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 9.5L12 3l9 6.5v10.5a1 1 0 0 1-1 1h-5v-6h-4v6H4a1 1 0 0 1-1-1z"></path>
              </svg>
            </div>
            <span className="text-[11px] font-bold text-dusty-rose group-hover:text-accent transition-colors uppercase tracking-wider">Home</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center gap-1.5 group"
            onClick={() => navigate('/memory/timeline')}
          >
            <div className="p-2.5 rounded-xl group-hover:bg-soft-sand/50 transition-colors">
              <svg className="w-7 h-7 stroke-dusty-rose group-hover:stroke-accent transition-colors fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                <path d="M12 5.67l.35.35M11.65 6.02L12 6.38"></path>
              </svg>
            </div>
            <span className="text-[11px] font-bold text-dusty-rose group-hover:text-accent transition-colors uppercase tracking-wider">Memories</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center gap-1.5 group"
            onClick={() => navigate('/settings')}
          >
            <div className="p-2.5 rounded-xl group-hover:bg-soft-sand/50 transition-colors">
              <svg className="w-7 h-7 stroke-dusty-rose group-hover:stroke-accent transition-colors fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <span className="text-[11px] font-bold text-dusty-rose group-hover:text-accent transition-colors uppercase tracking-wider">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;