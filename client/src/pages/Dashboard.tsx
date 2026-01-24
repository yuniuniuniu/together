import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../shared/context/SpaceContext';
import { useAuth } from '../shared/context/AuthContext';
import { useNotifications } from '../shared/context/NotificationContext';
import { useMemoriesQuery } from '../shared/hooks/useMemoriesQuery';

interface Memory {
  id: string;
  content: string;
  mood?: string;
  photos: string[];
  createdAt: string;
  createdBy: string;
}

const loveQuotes = [
  "Home is wherever I am with you.",
  "You are my today and all of my tomorrows.",
  "In your arms is where I belong.",
  "Every love story is beautiful, but ours is my favorite.",
  "Together is a wonderful place to be.",
  "You are my sun, my moon, and all my stars.",
  "I love you more than yesterday, less than tomorrow.",
  "Being with you is my favorite adventure.",
  "You make my heart smile.",
  "Love is not about how many days you've been together, it's about how much you love each other every day.",
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { daysCount, anniversaryDate, partner, space, isLoading } = useSpace();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { data: memories = [], isLoading: isLoadingMemory } = useMemoriesQuery();
  const recentMemory = (memories as Memory[])[0] || null;
  const [quote] = useState(() => loveQuotes[Math.floor(Math.random() * loveQuotes.length)]);

  const formatAnniversaryDate = () => {
    if (!anniversaryDate) return '';
    return anniversaryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#2c1818] dark:text-gray-100 min-h-screen pb-32 selection:bg-primary/30 flex flex-col font-sans">
      <nav className="flex items-center justify-between px-6 py-5 sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <div className="size-10 flex items-center justify-start">
          <span className="material-symbols-outlined text-dusty-rose text-2xl">favorite</span>
        </div>
        <h2 className="text-base font-semibold tracking-wide uppercase text-[#5d3a3a] dark:text-gray-300">Our Space</h2>
        <div className="size-10 flex items-center justify-end">
          <button
            className="p-2 hover:bg-primary/20 rounded-full transition-colors text-dusty-rose relative"
            onClick={() => navigate('/notifications')}
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-orange-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto w-full px-6 pt-2 space-y-12 flex-1">
        <section className="flex flex-col items-center gap-10 mt-4">
          <div className="flex items-center gap-6 relative">
            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent -z-10"></div>
            {/* User Avatar */}
            <div className="relative group cursor-pointer" onClick={() => navigate('/settings')}>
              {user?.avatar ? (
                <div
                  className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300"
                  style={{ backgroundImage: `url("${user.avatar}")` }}
                ></div>
              ) : (
                <div className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300 bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-0.5 shadow-sm border border-primary/20">
                <span className="text-[10px] font-bold text-ink">{user?.nickname || 'Me'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center size-12 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-primary/20 z-10">
              <span className="material-symbols-outlined text-accent text-xl animate-pulse" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
            </div>
            {/* Partner Avatar */}
            <div className="relative group cursor-pointer" onClick={() => navigate('/settings')}>
              {partner?.user?.avatar ? (
                <div
                  className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300"
                  style={{ backgroundImage: `url("${partner.user.avatar}")` }}
                ></div>
              ) : (
                <div className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300 bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-0.5 shadow-sm border border-primary/20">
                <span className="text-[10px] font-bold text-ink">{partner?.user?.nickname || 'Partner'}</span>
              </div>
            </div>
          </div>
          <div className="text-center space-y-3">
            <h1 className="font-serif text-[3.5rem] leading-[1.1] text-[#4A2B2B] dark:text-white">
              <span className="text-accent italic font-medium">{daysCount || 0}</span> Days<br/>
              <span className="text-3xl text-[#6D4C4C] dark:text-gray-300">Together</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-soft-sand/50 dark:bg-white/5 rounded-full mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <p className="text-[#8c5a5a] dark:text-gray-400 text-xs font-semibold uppercase tracking-widest">
                {anniversaryDate ? `Since ${formatAnniversaryDate()}` : 'Start your journey'}
              </p>
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

        {/* Recent Memory or Empty State Card */}
        <section className="w-full px-1">
          {isLoadingMemory ? (
            <div className="w-full bg-white dark:bg-zinc-800 rounded-[2rem] p-8 text-center shadow-soft flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-rose"></div>
            </div>
          ) : recentMemory ? (
            <div
              className="w-full bg-white dark:bg-zinc-800 rounded-[2rem] p-6 shadow-soft border border-white/50 dark:border-zinc-700 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/memory/${recentMemory.id}`)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-dusty-rose uppercase tracking-widest">Latest Memory</p>
                  <p className="text-xs text-soft-gray">
                    {new Date(recentMemory.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {recentMemory.mood && ` · ${recentMemory.mood}`}
                  </p>
                </div>
                <span className="material-symbols-outlined text-soft-gray/50">chevron_right</span>
              </div>
              <p className="text-[#4a2b2b] dark:text-gray-200 text-base leading-relaxed font-serif italic line-clamp-3">
                "{recentMemory.content}"
              </p>
              {recentMemory.photos && recentMemory.photos.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-hidden">
                  {recentMemory.photos.slice(0, 3).map((photo, idx) => (
                    <div key={idx} className="size-16 rounded-lg overflow-hidden bg-gray-100">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {recentMemory.photos.length > 3 && (
                    <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">+{recentMemory.photos.length - 3}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
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
          )}
        </section>

        <section className="py-8 px-8 text-center relative">
          <span className="material-symbols-outlined absolute top-4 left-4 text-4xl text-primary/20 rotate-180">format_quote</span>
          <p className="font-serif italic text-xl text-[#8c5a5a] dark:text-gray-400 leading-relaxed">
            "{quote}"
          </p>
          <span className="material-symbols-outlined absolute bottom-4 right-4 text-4xl text-primary/20">format_quote</span>
        </section>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-8 pt-4 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto px-6">
          <button
            className="flex flex-col items-center gap-1 group w-16"
          >
            <div className="bg-primary/10 rounded-2xl px-4 py-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-[26px]" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
            </div>
            <span className="text-[10px] font-bold text-primary">Home</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/memories')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">favorite</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Memories</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/milestones')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">flag</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Milestones</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/settings')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">settings</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;