import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { memoriesApi, reactionsApi } from '../shared/api/client';
import { useAuth } from '../shared/context/AuthContext';
import { useSpace } from '../shared/context/SpaceContext';
import { useToast } from '../shared/components/feedback/Toast';
import { EnhancedImageViewer } from '../shared/components/display/EnhancedImageViewer';
import { VideoPreview } from '../shared/components/display/VideoPreview';
import { countWords } from '../shared/utils/wordCount';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';

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

interface MemoryRouteState {
  memory?: Memory;
}

const MemoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { partner, daysCount, anniversaryDate } = useSpace();
  const { showToast } = useToast();

  const routeState = location.state as MemoryRouteState | null;
  const initialMemory = routeState?.memory && routeState.memory.id === id ? routeState.memory : null;
  const [actionError, setActionError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reactionPending, setReactionPending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { topBarRef, topBarHeight } = useFixedTopBar();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const memoryQuery = useQuery({
    queryKey: ['memory', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Memory id is required');
      }
      const response = await memoriesApi.getById(id);
      return response.data as Memory;
    },
    enabled: Boolean(id),
    staleTime: 15_000,
    initialData: initialMemory ?? undefined,
  });
  const memory = memoryQuery.data ?? null;
  const errorMessage =
    actionError ||
    (memoryQuery.error instanceof Error
      ? memoryQuery.error.message
      : memoryQuery.error
        ? String(memoryQuery.error)
        : '');

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [id]);

  useEffect(() => {
    const fetchReactions = async () => {
      if (!id) return;
      try {
        const [reactionsRes, myReactionRes] = await Promise.all([
          reactionsApi.list(id),
          reactionsApi.getMine(id),
        ]);
        setLikeCount(reactionsRes.data.length);
        setIsLiked(myReactionRes.data !== null);
      } catch {
        setLikeCount(0);
        setIsLiked(false);
      }
    };

    fetchReactions();
  }, [id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleLike = async () => {
    if (!id || reactionPending) return;
    if (memory?.createdBy === user?.id) {
      return;
    }
    setReactionPending(true);
    try {
      const result = await reactionsApi.toggle(id);
      if (result.action === 'blocked') {
        return;
      }
      setIsLiked(result.action === 'added');
      setLikeCount(prev => result.action === 'added' ? prev + 1 : Math.max(prev - 1, 0));
    } catch {
      showToast('Failed to update reaction', 'error');
    } finally {
      setReactionPending(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await memoriesApi.delete(id);
      navigate('/memories');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete memory');
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!id) return;
    navigate(`/memory/${id}/edit`);
  };

  const handlePlayVoiceNote = () => {
    if (!memory?.voiceNote) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingVoice) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlayingVoice(false);
      return;
    }

    audio.preload = 'auto';
    audio.volume = 1;
    audio.muted = false;
    audio.currentTime = 0;
    void audio.play()
      .then(() => {
        setIsPlayingVoice(true);
      })
      .catch(() => {
        setIsPlayingVoice(false);
        showToast('Audio cannot be played in app. Please retry.', 'error');
      });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDayNumber = (memoryDate: string) => {
    if (!anniversaryDate) return null;
    const memory = new Date(memoryDate);
    const anniversary = new Date(anniversaryDate);
    const diffTime = memory.getTime() - anniversary.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : null;
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return 'sentiment_very_satisfied';
      case 'calm': return 'self_improvement';
      case 'together': return 'favorite';
      case 'excited': return 'auto_awesome';
      case 'moody': return 'filter_drama';
      default: return 'sentiment_satisfied';
    }
  };

  if (memoryQuery.isLoading && !memory && !errorMessage) {
    return (
      <div className="flex-1 flex flex-col bg-background-light min-h-screen">
        <div
          ref={topBarRef}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] px-4 pb-4 pt-safe-offset-4 flex justify-between items-center bg-background-light/95 backdrop-blur-md border-b border-black/[0.03]"
        >
          <div className="w-9 h-9 rounded-full bg-black/5 animate-pulse" />
          <div className="h-3 w-20 rounded bg-black/5 animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-black/5 animate-pulse" />
        </div>
        <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />
        <main className="flex-1 px-6 py-6 space-y-6">
          <div className="h-4 w-32 rounded bg-black/5 animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-black/5 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-black/5 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-black/5 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square rounded-xl bg-black/5 animate-pulse" />
            <div className="aspect-square rounded-xl bg-black/5 animate-pulse" />
            <div className="aspect-square rounded-xl bg-black/5 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (errorMessage || !memory) {
    return (
      <div className="flex-1 flex flex-col bg-background-light min-h-screen items-center justify-center px-6">
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
          {errorMessage || 'Memory not found'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-primary font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const dayNumber = calculateDayNumber(memory.createdAt);
  const isOwnMemory = memory.createdBy === user?.id;
  const authorAvatarUrl = isOwnMemory ? user?.avatar : partner?.user?.avatar;
  const authorName = isOwnMemory ? (user?.nickname || 'You') : (partner?.user?.nickname || 'Partner');
  const mediaUrls = memory.photos || [];
  const imageUrls = mediaUrls.filter((url) => !url.match(/\.(mp4|webm|mov|avi|m4v)$/i));
  const computedWordCount = memory.content ? countWords(memory.content) : 0;
  const wordCount = memory.wordCount ?? computedWordCount;

  return (
    <div
      className={`flex-1 flex flex-col bg-background-light min-h-screen relative transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
       {/* Header */}
       <div
         ref={topBarRef}
         className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] px-4 pb-4 pt-safe-offset-4 flex justify-between items-center bg-background-light/95 backdrop-blur-md border-b border-black/[0.03]"
       >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
             <span className="material-symbols-outlined text-ink">arrow_back</span>
          </button>
          <span className="text-sm font-bold uppercase tracking-widest text-ink/60">Memory</span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors"
            >
               <span className="material-symbols-outlined text-ink">more_horiz</span>
            </button>
            {showMenu && isOwnMemory && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-black/5 py-2 min-w-[160px] z-50">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-ink/70">edit</span>
                  <span className="text-sm font-medium text-ink">Edit Memory</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px] text-red-500">delete</span>
                  <span className="text-sm font-medium text-red-500">{isDeleting ? 'Deleting...' : 'Delete Memory'}</span>
                </button>
              </div>
            )}
          </div>
       </div>
       <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

       <main className="flex-1 overflow-y-auto no-scrollbar pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <div className="px-6 py-6">
             {/* Header Info */}
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-3">
                  {authorAvatarUrl ? (
                    <div className="size-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-stone-100">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${authorAvatarUrl}")` }}
                      />
                    </div>
                  ) : (
                    <div className="size-10 rounded-full bg-stone-100 flex items-center justify-center">
                      {authorName ? (
                        <span className="text-xs font-bold text-stone-500">
                          {authorName.slice(0, 1).toUpperCase()}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-stone-300 text-lg">person</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">
                        {isOwnMemory ? 'Your Memory' : `${authorName}'s Memory`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-soft-gray/80 text-[11px] font-bold uppercase tracking-widest">
                      <span>{formatDate(memory.createdAt)}</span>
                      {dayNumber && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          <span>Day {dayNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {memory.mood && (
                  <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center text-accent shadow-sm border border-primary/20">
                     <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 1"}}>{getMoodIcon(memory.mood)}</span>
                  </div>
                )}
             </div>

             {/* Text Content */}
             <div className="prose prose-p:text-ink/80 prose-headings:font-serif mb-8">
                <p className="font-serif text-lg leading-relaxed text-[#4A2B2B] italic">
                   "{memory.content}"
                </p>
             </div>

            {/* Media Grid (Photos, GIFs, Videos) */}
            {mediaUrls.length > 0 && (
               <div className="mb-8">
                <div className="grid grid-cols-3 gap-2">
                  {mediaUrls.map((url, index) => {
                    const isVideo = url.match(/\.(mp4|webm|mov|avi|m4v)$/i);
                    const isGif = url.match(/\.gif$/i);

                    if (isVideo) {
                      return (
                        <div key={index} className="aspect-square relative overflow-hidden rounded-xl bg-black">
                          <VideoPreview
                            src={url}
                            className="w-full h-full object-cover"
                            iconSize="sm"
                            enableFullscreen={true}
                          />
                        </div>
                      );
                    }

                    const imageIndex = imageUrls.indexOf(url);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (imageIndex < 0) return;
                          setViewerIndex(imageIndex);
                          setViewerOpen(true);
                        }}
                        className="aspect-square relative overflow-hidden rounded-xl bg-gray-100 active:scale-[0.98] transition-transform"
                      >
                        <img
                          src={url}
                          alt={`Memory media ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        {isGif && (
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded font-bold pointer-events-none">
                            GIF
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
               </div>
             )}

             {/* Meta Tags */}
             <div className="flex gap-2 flex-wrap mb-8">
                {memory.voiceNote && (
                  <audio
                    ref={audioRef}
                    src={memory.voiceNote}
                    preload="auto"
                    onEnded={() => setIsPlayingVoice(false)}
                    className="hidden"
                  />
                )}
                 {memory.location && (
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-primary/10 shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-soft-gray">location_on</span>
                      <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wide">{memory.location.name}</span>
                   </div>
                 )}
                 {memory.mood && (
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-primary/10 shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-soft-gray">mood</span>
                      <span className="text-[10px] font-bold text-soft-gray uppercase tracking-wide">{memory.mood}</span>
                   </div>
                 )}
                 {memory.voiceNote && (
                   <button
                     onClick={handlePlayVoiceNote}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm transition-all ${
                       isPlayingVoice
                         ? 'bg-accent/10 border-accent/30 text-accent'
                         : 'bg-white border-primary/10 text-soft-gray hover:bg-primary/5'
                     }`}
                   >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={isPlayingVoice ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {isPlayingVoice ? 'pause' : 'play_arrow'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        {isPlayingVoice ? 'Playing...' : 'Voice Note'}
                      </span>
                   </button>
                 )}
             </div>

             {/* Stickers */}
             {memory.stickers && memory.stickers.length > 0 && (
               <div className="mb-8">
                 <p className="text-[10px] font-bold text-soft-gray uppercase tracking-widest mb-3">Stickers</p>
                 <div className="flex gap-3 flex-wrap">
                   {memory.stickers.map((sticker, index) => (
                     <div
                       key={index}
                       className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                     >
                       <span
                         className="material-symbols-outlined text-2xl text-accent"
                         style={{ fontVariationSettings: "'FILL' 1" }}
                       >
                         {sticker}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Reactions */}
             <div className="border-t border-black/[0.05] pt-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleToggleLike}
                    disabled={reactionPending || isOwnMemory}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isLiked
                        ? 'bg-accent/10 text-accent'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    } ${(reactionPending || isOwnMemory) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`material-symbols-outlined text-xl transition-transform ${isLiked ? 'scale-110' : ''}`}
                      style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      favorite
                    </span>
                    <span className="text-sm font-medium">
                      {likeCount > 0 ? `${likeCount} ${likeCount === 1 ? 'Love' : 'Loves'}` : 'Love this'}
                    </span>
                  </button>

                  {wordCount > 0 && (
                    <span className="text-xs text-soft-gray">{wordCount} words</span>
                  )}
                </div>
             </div>
          </div>
       </main>

       {/* Floating Action / Edit - Only show for own memories */}
       {isOwnMemory && (
         <div className="fixed bottom-6 right-6 z-30 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={handleEdit}
              className="w-14 h-14 bg-primary text-ink rounded-full shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
               <span className="material-symbols-outlined text-2xl">edit</span>
            </button>
         </div>
       )}

      {imageUrls.length > 0 && (
        <EnhancedImageViewer
          images={imageUrls}
          initialIndex={viewerIndex}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default MemoryDetail;