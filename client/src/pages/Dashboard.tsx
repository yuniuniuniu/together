import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../shared/context/SpaceContext';
import { useAuth } from '../shared/context/AuthContext';
import { useNotifications } from '../shared/context/NotificationContext';
import { useMemoriesQuery } from '../shared/hooks/useMemoriesQuery';
import { useMilestonesQuery } from '../shared/hooks/useMilestonesQuery';
import { resolveMediaUrl } from '../shared/utils/resolveMediaUrl';

interface Memory {
  id: string;
  content: string;
  mood?: string;
  photos: string[];
  createdAt: string;
  createdBy: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
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
  const { daysCount, anniversaryDate, partner } = useSpace();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { data: memories = [] } = useMemoriesQuery();
  const { data: milestones = [] } = useMilestonesQuery();
  const recentMemory = (memories as Memory[])[0] || null;
  const recentMilestone = (milestones as Milestone[])[0] || null;
  const [quote] = useState(() => loveQuotes[Math.floor(Math.random() * loveQuotes.length)]);
  const myAvatarUrl = resolveMediaUrl(user?.avatar);
  const partnerAvatarUrl = resolveMediaUrl(partner?.user?.avatar);

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
      <nav className="flex items-center justify-between px-6 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
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

      <main className="max-w-md mx-auto w-full px-6 pt-2 space-y-10 flex-1">
        <section className="flex flex-col items-center gap-10 mt-4">
          <div className="flex items-center gap-6 relative">
            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent -z-10"></div>
            {/* User Avatar */}
            <div className="relative group cursor-pointer" onClick={() => navigate('/settings')}>
              {myAvatarUrl ? (
                <div
                  className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300"
                  style={{ backgroundImage: `url("${myAvatarUrl}")` }}
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
              {partnerAvatarUrl ? (
                <div
                  className="size-[88px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20 transition-transform hover:scale-105 duration-300"
                  style={{ backgroundImage: `url("${partnerAvatarUrl}")` }}
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

        {/* Recent Milestone - Only show if there's no memory or there is a milestone */}
        {(!recentMemory || recentMilestone) && (
        <section className="w-full px-1">
          <div className="flex items-center justify-between px-2 mb-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c5a5a] dark:text-gray-400">Recent Milestone</h3>
             <button onClick={() => navigate('/milestones')} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-dark">View All</button>
          </div>
          {recentMilestone ? (
            <div
              className="w-full bg-white dark:bg-zinc-800 rounded-[2rem] overflow-hidden shadow-soft border border-white/50 dark:border-zinc-700 cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => navigate(`/milestone/${recentMilestone.id}`)}
            >
              <div className="h-40 w-full bg-cover bg-center relative bg-soft-sand/20"
                   style={{ backgroundImage: recentMilestone.photos?.[0] ? `url("${recentMilestone.photos[0]}")` : undefined }}>
                 {!recentMilestone.photos?.[0] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="material-symbols-outlined text-4xl text-milestone-pink/30">flag</span>
                    </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                 <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wide">Milestone</span>
                 </div>
              </div>
              <div className="p-5 flex items-start justify-between gap-4">
                 <div>
                    <h3 className="font-serif text-xl text-[#4a2b2b] dark:text-white leading-tight mb-2">
                       {recentMilestone.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-soft-gray">
                       <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                       <span className="text-xs font-medium">
                          {new Date(recentMilestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </span>
                    </div>
                 </div>
                 <div className="size-10 rounded-full bg-soft-sand/50 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-accent text-xl filled" style={{fontVariationSettings: "'FILL' 1"}}>
                       verified
                    </span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white dark:bg-zinc-800 rounded-[2rem] p-8 text-center shadow-soft border border-dashed border-milestone-pink/30 flex flex-col items-center justify-center gap-4">
              <div className="size-16 rounded-full bg-milestone-pink/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-milestone-pink">flag</span>
              </div>
              <div className="space-y-2 max-w-[260px]">
                <h3 className="text-xl font-serif text-[#4a2b2b] dark:text-gray-100 leading-tight">Mark a milestone</h3>
                <p className="text-[#8c5a5a] dark:text-gray-400 text-sm leading-relaxed">
                  Capture the moments that define your journey
                </p>
              </div>
              <button
                className="px-5 py-2 rounded-full bg-milestone-pink text-white text-xs font-bold uppercase tracking-widest"
                onClick={() => navigate('/milestone/new')}
              >
                Add Milestone
              </button>
            </div>
          )}
        </section>
        )}

        {/* Daily Memory - Only show if there's no milestone or there is a memory */}
        {(!recentMilestone || recentMemory) && (
        <section className="w-full px-1">
          <div className="flex items-center justify-between px-2 mb-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c5a5a] dark:text-gray-400">Daily Memory</h3>
             <button onClick={() => navigate('/memories')} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-dark">View All</button>
          </div>
          {recentMemory ? (
             <div
               className="w-full bg-white dark:bg-zinc-800 rounded-[2rem] p-5 shadow-soft border border-white/50 dark:border-zinc-700 cursor-pointer hover:shadow-lg transition-shadow flex items-start gap-4"
               onClick={() => navigate(`/memory/${recentMemory.id}`)}
             >
                {(() => {
                   const isOwn = recentMemory.createdBy === user?.id;
                   const avatarUrl = resolveMediaUrl(isOwn ? user?.avatar : partner?.user?.avatar);
                   return (
                     <div
                        className="size-14 rounded-full bg-cover bg-center shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm bg-soft-sand/20"
                        style={{ backgroundImage: avatarUrl ? `url("${avatarUrl}")` : undefined }}
                     >
                        {!avatarUrl && (
                           <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-2xl text-primary/40">person</span>
                           </div>
                        )}
                     </div>
                   );
                })()}
                <div className="flex-1 min-w-0 py-0.5">
                   <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-[#4a2b2b] dark:text-white text-sm truncate pr-2">
                         {recentMemory.content.length > 30 ? recentMemory.content.substring(0, 30) + '...' : recentMemory.content}
                      </h4>
                      <span className="text-[10px] font-bold text-accent/80 bg-accent/10 dark:bg-accent/20 px-2 py-0.5 rounded-full shrink-0">
                         {new Date(recentMemory.createdAt).toDateString() === new Date().toDateString() ? 'Today' : new Date(recentMemory.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                   </div>
                   <p className="font-serif italic text-[#4a2b2b]/80 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
                      "{recentMemory.content}"
                   </p>
                </div>
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
        )}

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
