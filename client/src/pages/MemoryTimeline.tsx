import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memoriesApi, reactionsApi } from '../shared/api/client';
import { useAuth } from '../shared/context/AuthContext';
import { useToast } from '../shared/components/feedback/Toast';

interface Memory {
  id: string;
  spaceId: string;
  content: string;
  mood?: string;
  photos: string[];
  location?: { name: string; address?: string; latitude?: number; longitude?: number };
  voiceNote?: string;
  stickers: string[];
  createdAt: string;
  createdBy: string;
  wordCount?: number;
}

interface ReactionState {
  [memoryId: string]: { liked: boolean; count: number };
}

const MemoryTimeline: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reactions, setReactions] = useState<ReactionState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await memoriesApi.list();
        const memoriesList = response.data.data || [];
        setMemories(memoriesList);

        // Fetch reactions for each memory
        const reactionStates: ReactionState = {};
        for (const memory of memoriesList) {
          try {
            const [reactionsRes, myReactionRes] = await Promise.all([
              reactionsApi.list(memory.id),
              reactionsApi.getMine(memory.id),
            ]);
            reactionStates[memory.id] = {
              liked: myReactionRes.data !== null,
              count: reactionsRes.data.length,
            };
          } catch {
            reactionStates[memory.id] = { liked: false, count: 0 };
          }
        }
        setReactions(reactionStates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memories');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, []);

  const handleToggleLike = async (memoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await reactionsApi.toggle(memoryId);
      setReactions((prev) => ({
        ...prev,
        [memoryId]: {
          liked: result.action === 'added',
          count: result.action === 'added'
            ? (prev[memoryId]?.count || 0) + 1
            : Math.max((prev[memoryId]?.count || 1) - 1, 0),
        },
      }));
    } catch {
      showToast('Failed to update reaction', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-charcoal dark:text-zinc-400">{showSearch ? 'close' : 'search'}</span>
          </button>
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
        {/* Search Input */}
        {showSearch && (
          <div className="px-6 pb-4 max-w-md mx-auto w-full">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-wine/30 text-sm"
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
            {searchQuery && (
              <p className="text-xs text-stone-400 mt-2 text-center">
                Found {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'}
              </p>
            )}
          </div>
        )}
      </nav>

      {isLoading ? (
        <main className="max-w-md mx-auto flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine"></div>
            <p className="text-stone-500 text-sm">Loading memories...</p>
          </div>
        </main>
      ) : error ? (
        <main className="max-w-md mx-auto flex-1 flex items-center justify-center px-6">
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        </main>
      ) : memories.length > 0 ? (
        <main className="max-w-md mx-auto flex-1">
          <div className="px-6 pt-8 pb-4 text-center">
            <h1 className="text-4xl font-serif font-medium tracking-tight text-charcoal dark:text-zinc-100 italic">Our Story</h1>
            <p className="text-stone-500 dark:text-zinc-400 text-xs mt-2 font-bold tracking-widest uppercase">
              {memories.length} {memories.length === 1 ? 'Memory' : 'Memories'} Collected
            </p>
          </div>

          {filteredMemories.length === 0 && searchQuery ? (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-stone-300 mb-4">search_off</span>
              <p className="text-stone-500 text-sm">No memories found for "{searchQuery}"</p>
            </div>
          ) : (
          <div className="relative">
            <div className="absolute left-6 top-4 bottom-0 w-px bg-stone-200 dark:bg-zinc-800 z-0 hidden"></div>

            {filteredMemories.map((memory, index) => (
              <section key={memory.id} className="mt-2 relative z-10">
                <div className="px-6 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-widest ${index === 0 ? 'text-wine' : 'text-stone-400'} bg-background-light dark:bg-background-dark pr-2`}>
                      {formatDate(memory.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-stone-400 bg-background-light dark:bg-background-dark pl-2">
                    {new Date(memory.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="px-6 mb-8">
                  <div
                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-soft p-5 border border-white/50 dark:border-zinc-800 cursor-pointer"
                    onClick={() => navigate(`/memory/${memory.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full ring-2 ring-stone-100 dark:ring-zinc-800 p-0.5 bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-charcoal dark:text-zinc-200">
                            {memory.createdBy === user?.id ? 'You' : 'Partner'}
                          </p>
                          <p className="text-[10px] text-stone-400 uppercase font-medium tracking-wide">
                            {formatTime(memory.createdAt)} • {memory.mood || 'Daily Note'}
                          </p>
                        </div>
                      </div>
                      <button className="text-stone-300 hover:text-stone-500 dark:text-zinc-600 transition-colors">
                        <span className="material-symbols-outlined text-xl">more_horiz</span>
                      </button>
                    </div>
                    <p className="text-stone-600 dark:text-zinc-300 text-[15px] leading-relaxed font-serif italic">
                      "{memory.content}"
                    </p>
                    {memory.photos && memory.photos.length > 0 && (
                      <div className="rounded-2xl overflow-hidden shadow-sm aspect-[4/3] w-full mt-4 relative">
                        {(() => {
                          const firstMedia = memory.photos[0];
                          const isVideo = firstMedia.match(/\.(mp4|webm|mov|avi|m4v)$/i);
                          const isGif = firstMedia.match(/\.gif$/i);

                          if (isVideo) {
                            return (
                              <>
                                <video
                                  className="w-full h-full object-cover"
                                  src={firstMedia}
                                  muted
                                  playsInline
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">play_circle</span>
                                </div>
                              </>
                            );
                          }

                          return (
                            <>
                              <img className="w-full h-full object-cover" alt="Memory" src={firstMedia} />
                              {isGif && (
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  GIF
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {/* Like Button */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800">
                      <button
                        onClick={(e) => handleToggleLike(memory.id, e)}
                        className={`flex items-center gap-1.5 transition-all ${
                          reactions[memory.id]?.liked
                            ? 'text-wine'
                            : 'text-stone-400 hover:text-wine'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl transition-transform ${
                            reactions[memory.id]?.liked ? 'scale-110' : ''
                          }`}
                          style={reactions[memory.id]?.liked ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          favorite
                        </span>
                        {reactions[memory.id]?.count > 0 && (
                          <span className="text-xs font-medium">{reactions[memory.id].count}</span>
                        )}
                      </button>
                      <div className="flex items-center gap-2 text-stone-400">
                        {memory.voiceNote && (
                          <span className="material-symbols-outlined text-lg">mic</span>
                        )}
                        {memory.location && (
                          <span className="material-symbols-outlined text-lg">location_on</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
          )}
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