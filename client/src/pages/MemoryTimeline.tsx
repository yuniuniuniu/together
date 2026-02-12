import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { memoriesApi, reactionsApi, commentsApi } from '../shared/api/client';
import { useAuth } from '../shared/context/AuthContext';
import { useSpace } from '../shared/context/SpaceContext';
import { useToast } from '../shared/components/feedback/Toast';
import { useMemoriesQuery, type Memory } from '../shared/hooks/useMemoriesQuery';
import { setLastMemoryPath } from '../shared/utils';
import { VideoPreview } from '../shared/components/display/VideoPreview';

interface ReactionState {
  [memoryId: string]: { liked: boolean; count: number };
}

interface CommentCountState {
  [memoryId: string]: number;
}

const MemoryTimeline: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { partner, space } = useSpace();
  const { showToast } = useToast();
  const { data: memories = [], error } = useMemoriesQuery();
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : '';
  const [reactions, setReactions] = useState<ReactionState>({});
  const [reactionPending, setReactionPending] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<CommentCountState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    setLastMemoryPath('/memory/timeline');

    const fetchReactions = async () => {
      if (!memories || memories.length === 0) {
        setReactions({});
        return;
      }

      const results = await Promise.all(
        memories.map(async (memory) => {
          try {
            const [reactionsRes, myReactionRes] = await Promise.all([
              reactionsApi.list(memory.id),
              reactionsApi.getMine(memory.id),
            ]);
            const state = {
              liked: myReactionRes.data !== null,
              count: reactionsRes.data.length,
            };
            // Seed the React Query cache so MemoryDetail won't re-fetch
            queryClient.setQueryData(['reactions', memory.id], state);
            return { id: memory.id, state };
          } catch {
            return { id: memory.id, state: { liked: false, count: 0 } };
          }
        })
      );
      const reactionStates: ReactionState = {};
      for (const r of results) reactionStates[r.id] = r.state;
      setReactions(reactionStates);
    };

    const fetchCommentCounts = async () => {
      if (!memories || memories.length === 0) {
        setCommentCounts({});
        return;
      }

      const results = await Promise.all(
        memories.map(async (memory) => {
          try {
            const res = await commentsApi.count(memory.id);
            return { id: memory.id, count: res.data.count };
          } catch {
            return { id: memory.id, count: 0 };
          }
        })
      );
      const counts: CommentCountState = {};
      for (const r of results) counts[r.id] = r.count;
      setCommentCounts(counts);
    };

    fetchReactions();
    fetchCommentCounts();
  }, [memories]);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const updateHeight = () => {
      setNavHeight(navElement.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(navElement);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [showSearch]);

  const handleToggleLike = async (memoryId: string, createdBy: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (createdBy === user?.id) {
      return;
    }
    if (reactionPending[memoryId]) return;

    setReactionPending((prev) => ({ ...prev, [memoryId]: true }));
    try {
      const result = await reactionsApi.toggle(memoryId);
      const action = result.action;
      if (action === 'blocked') {
        return;
      }
      const newState = {
        liked: action === 'added',
        count: action === 'added'
          ? (reactions[memoryId]?.count || 0) + 1
          : Math.max((reactions[memoryId]?.count || 1) - 1, 0),
      };
      setReactions((prev) => ({ ...prev, [memoryId]: newState }));
      // Keep query cache in sync for MemoryDetail
      queryClient.setQueryData(['reactions', memoryId], newState);
    } catch {
      showToast('Failed to update reaction', 'error');
    } finally {
      setReactionPending((prev) => ({ ...prev, [memoryId]: false }));
    }
  };

  const getAnniversaryMonth = () => {
    if (!space?.anniversaryDate) return '';
    const date = new Date(space.anniversaryDate);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return { label: 'TODAY', date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    } else if (date.toDateString() === yesterday.toDateString()) {
      return { label: 'YESTERDAY', date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    }
    return { 
      label: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(), 
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
    };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Filter memories based on search query
  const filteredMemories = memories.filter(memory => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      memory.content.toLowerCase().includes(query) ||
      (memory.mood && memory.mood.toLowerCase().includes(query)) ||
      (memory.location?.name && memory.location.name.toLowerCase().includes(query))
    );
  });

  const handleOpenMemory = (memory: Memory) => {
    const firstMedia = memory.photos?.[0];
    if (firstMedia && !firstMedia.match(/\.(mp4|webm|mov|avi|m4v)$/i)) {
      const img = new Image();
      img.src = firstMedia;
      void img.decode?.().catch(() => {});
    }

    void queryClient.prefetchQuery({
      queryKey: ['memory', memory.id],
      queryFn: async () => (await memoriesApi.getById(memory.id)).data,
      staleTime: 15_000,
    });

    navigate(`/memory/${memory.id}`, { state: { memory } });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-[#4A2B2B] dark:text-gray-100 selection:bg-dusty-rose/30 min-h-screen pb-32 flex flex-col">
      {/* Navbar */}
      <nav
        ref={navRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-b border-stone-100 dark:border-zinc-800 shadow-sm transition-all duration-300 flex-none pt-safe-offset-4"
      >
        <div className="max-w-3xl mx-auto w-full">
          {/* Header Title Area */}
          <div className="pt-6 pb-2 text-center">
            <h1 className="text-3xl font-serif font-medium tracking-tight text-[#4A2B2B] dark:text-zinc-100 italic">Our Story</h1>
            {space?.anniversaryDate && (
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#8c5a5a] dark:text-zinc-500 uppercase mt-2">
                COLLECTING MOMENTS SINCE {getAnniversaryMonth()}
              </p>
            )}
          </div>
          
          {/* Controls */}
          <div className="px-4 pb-4 mt-4 flex items-center gap-3">
             <div className="flex-1 bg-stone-100 dark:bg-zinc-900 p-1 rounded-full flex items-center relative">
               <button className="flex-1 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-charcoal dark:text-zinc-200 shadow-sm text-[10px] font-bold tracking-widest uppercase transition-all">Timeline</button>
               <button 
                 onClick={() => navigate('/memory/map')}
                 className="flex-1 py-1.5 rounded-full text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 text-[10px] font-bold tracking-widest uppercase transition-all"
               >
                 Map
               </button>
             </div>
             <button
               onClick={() => setShowSearch(!showSearch)}
               className="size-9 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
             >
               <span className="material-symbols-outlined text-stone-500 text-lg">{showSearch ? 'close' : 'search'}</span>
             </button>
          </div>

          {/* Search Input */}
          {showSearch && (
            <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">search</span>
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-zinc-900 rounded-2xl border-none focus:ring-2 focus:ring-wine/20 text-sm placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      <div aria-hidden="true" className="w-full flex-none" style={{ height: navHeight }} />

      {error ? (
        <main className="max-w-xl mx-auto flex-1 flex items-center justify-center px-4 w-full">
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl text-center w-full">
            {errorMessage || 'Failed to load memories'}
          </div>
        </main>
      ) : memories.length > 0 ? (
        <main className="max-w-3xl mx-auto flex-1 w-full px-4 pt-4 pb-32">
          {filteredMemories.length === 0 && searchQuery ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[#8c5a5a]/20 mb-4">search_off</span>
              <p className="text-[#8c5a5a] text-sm">No memories found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredMemories.map((memory) => {
                const dateInfo = formatDate(memory.createdAt);
                const isOwnMemory = memory.createdBy === user?.id;
                return (
                  <section key={memory.id} className="relative z-10">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8c5a5a]">
                        {dateInfo.label}
                      </span>
                      <span className="text-[10px] font-medium text-[#8c5a5a]/60 dark:text-zinc-600 tracking-wide">
                        {dateInfo.date}
                      </span>
                    </div>
                    
                    <div
                      className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] border border-white/50 dark:border-zinc-800"
                      onClick={() => handleOpenMemory(memory)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const isOwn = memory.createdBy === user?.id;
                            const avatarUrl = isOwn ? user?.avatar : partner?.user?.avatar;
                            const fallbackName = isOwn ? user?.nickname : partner?.user?.nickname;
                            if (avatarUrl) {
                              return (
                                <div className="size-9 rounded-full ring-2 ring-white dark:ring-zinc-800 shadow-sm">
                                  <div 
                                    className="w-full h-full object-cover rounded-full bg-cover bg-center"
                                    style={{ backgroundImage: `url("${avatarUrl}")` }}
                                  ></div>
                                </div>
                              );
                            }
                            return (
                              <div className="size-9 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
                                {fallbackName ? (
                                  <span className="text-xs font-bold text-stone-400">
                                    {fallbackName.slice(0, 1).toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="material-symbols-outlined text-stone-300 text-lg">person</span>
                                )}
                              </div>
                            );
                          })()}
                          <div>
                            <p className="text-sm font-bold text-[#4A2B2B] dark:text-zinc-200 leading-tight">
                              {memory.createdBy === user?.id ? (user?.nickname || 'You') : (partner?.user?.nickname || 'Partner')}
                            </p>
                            <p className="text-[9px] text-[#8c5a5a] uppercase font-bold tracking-widest mt-0.5">
                              {formatTime(memory.createdAt)} • {memory.mood || 'NOTE'}
                            </p>
                          </div>
                        </div>
                        <button className="text-[#8c5a5a]/40 hover:text-[#8c5a5a] dark:text-zinc-600 transition-colors -mr-2 -mt-2 p-2">
                          <span className="material-symbols-outlined text-lg">more_horiz</span>
                        </button>
                      </div>
                      
                      {/* Content */}
                      <p className="text-[#4a2b2b]/80 dark:text-zinc-300 text-[15px] leading-relaxed mb-5 font-serif">
                        {memory.content}
                      </p>

                      {/* Media */}
                      {memory.photos && memory.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 mb-6">
                          {memory.photos.map((mediaUrl, index) => {
                            const isVideo = mediaUrl.match(/\.(mp4|webm|mov|avi|m4v)$/i);
                            const isGif = mediaUrl.match(/\.gif$/i);

                            if (isVideo) {
                              return (
                                <div key={`${memory.id}-${index}`} className="aspect-square relative overflow-hidden rounded-xl bg-black">
                                  <VideoPreview
                                    src={mediaUrl}
                                    className="w-full h-full object-cover"
                                    iconSize="sm"
                                    enableFullscreen={false}
                                    enableInlinePlayback={true}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`${memory.id}-${index}`}
                                className="aspect-square relative overflow-hidden rounded-xl bg-stone-50 dark:bg-zinc-950/50"
                              >
                                <img
                                  src={mediaUrl}
                                  alt={`Memory ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                {isGif && (
                                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded font-bold tracking-wider">
                                    GIF
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-stone-50 dark:border-zinc-800/50">
                        <div className="flex items-center gap-3">
                           <div className="flex items-center">
                             <button
                               onClick={(e) => handleToggleLike(memory.id, memory.createdBy, e)}
                               disabled={reactionPending[memory.id] || isOwnMemory}
                               className={`flex items-center justify-center size-8 rounded-full transition-all ${
                                 reactions[memory.id]?.liked
                                   ? 'bg-red-50 text-wine'
                                   : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                               } ${(reactionPending[memory.id] || isOwnMemory) ? 'opacity-60 cursor-not-allowed' : ''}`}
                             >
                               <span
                                 className={`material-symbols-outlined text-lg transition-transform ${
                                   reactions[memory.id]?.liked ? 'scale-110' : ''
                                 }`}
                                 style={reactions[memory.id]?.liked ? { fontVariationSettings: "'FILL' 1" } : {}}
                               >
                                 favorite
                               </span>
                             </button>
                           </div>
                           
                           {reactions[memory.id]?.count > 0 && (
                             <span className="text-[10px] font-medium text-stone-400">
                               {reactions[memory.id].count} {reactions[memory.id].count === 1 ? 'reaction' : 'reactions'}
                             </span>
                           )}

                           {commentCounts[memory.id] > 0 && (
                             <div className="flex items-center gap-1 text-stone-400">
                               <span className="material-symbols-outlined text-sm">chat_bubble</span>
                               <span className="text-[10px] font-medium">
                                 {commentCounts[memory.id]}
                               </span>
                             </div>
                           )}
                        </div>

                        <div className="flex items-center gap-2 text-stone-300 min-w-0">
                          {memory.voiceNote && (
                            <span className="material-symbols-outlined text-lg" title="Voice note">mic</span>
                          )}
                          {memory.location && (
                            <div className="flex items-center gap-1.5 min-w-0 text-stone-400">
                              <span className="material-symbols-outlined text-lg shrink-0" title={memory.location.name}>location_on</span>
                              <span
                                className="text-[11px] leading-none truncate max-w-[160px]"
                                title={memory.location.address ?? memory.location.name}
                              >
                                {memory.location.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        <main className="max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center px-4 w-full py-12">
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
            onClick={() => navigate('/memory/new')}
            className="bg-wine hover:bg-wine/90 text-white pl-6 pr-8 py-4 rounded-full shadow-lg shadow-wine/25 flex items-center gap-3 font-bold tracking-wide transition-all transform hover:scale-105 active:scale-95 group"
          >
            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add_circle</span>
            <span className="uppercase text-xs tracking-widest">Create Story</span>
          </button>
        </main>
      )}

      {/* FAB (Only show when not empty for now, or keep it consistent) */}
      {memories.length > 0 && (
        <div className="fixed bottom-32 right-6 z-50">
          <button 
            onClick={() => navigate('/memory/new')}
            className="bg-wine text-white size-14 rounded-full shadow-lg shadow-wine/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">edit</span>
          </button>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-8 pt-4 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto px-6">
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/dashboard')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">home</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 group w-16">
            <div className="bg-primary/10 rounded-2xl px-4 py-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-[26px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
            </div>
            <span className="text-[10px] font-bold text-primary">Memories</span>
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

export default MemoryTimeline;