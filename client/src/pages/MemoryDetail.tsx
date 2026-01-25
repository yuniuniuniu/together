import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { memoriesApi, reactionsApi } from '../shared/api/client';
import { useAuth } from '../shared/context/AuthContext';
import { useSpace } from '../shared/context/SpaceContext';
import { useToast } from '../shared/components/feedback/Toast';
import { LoadingScreen } from '../shared/components/feedback';
import { ImageViewer } from '../shared/components/display/ImageViewer';

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

const MemoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { partner, daysCount, anniversaryDate } = useSpace();
  const { showToast } = useToast();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchMemory = async () => {
      if (!id) return;
      try {
        const response = await memoriesApi.getById(id);
        setMemory(response.data);

        // Fetch reactions
        const [reactionsRes, myReactionRes] = await Promise.all([
          reactionsApi.list(id),
          reactionsApi.getMine(id),
        ]);
        setLikeCount(reactionsRes.data.length);
        setIsLiked(myReactionRes.data !== null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memory');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemory();
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
    if (!id) return;
    try {
      const result = await reactionsApi.toggle(id);
      setIsLiked(result.action === 'added');
      setLikeCount(prev => result.action === 'added' ? prev + 1 : Math.max(prev - 1, 0));
    } catch {
      showToast('Failed to update reaction', 'error');
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
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!id) return;
    navigate(`/memory/${id}/edit`);
  };

  const handlePlayVoiceNote = () => {
    if (!memory?.voiceNote) return;

    if (isPlayingVoice && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingVoice(false);
      return;
    }

    const audio = new Audio(memory.voiceNote);
    audioRef.current = audio;
    audio.play();
    setIsPlayingVoice(true);

    audio.onended = () => {
      setIsPlayingVoice(false);
    };
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

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerOpen(true);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !memory) {
    return (
      <div className="flex-1 flex flex-col bg-background-light min-h-screen items-center justify-center px-6">
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
          {error || 'Memory not found'}
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
  const computedWordCount = memory.content
    ? memory.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const wordCount = memory.wordCount ?? computedWordCount;

  return (
    <div className="flex-1 flex flex-col bg-background-light min-h-screen relative">
       {/* Header */}
       <div className="sticky top-0 z-20 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex justify-between items-center bg-background-light/95 backdrop-blur-md border-b border-black/[0.03]">
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

       <main className="flex-1 overflow-y-auto no-scrollbar pb-[calc(6rem+env(safe-area-inset-bottom))]">
          <div className="px-6 py-6">
             {/* Header Info */}
             <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-xs font-bold text-accent uppercase tracking-wider">
                       {isOwnMemory ? 'Your Memory' : `${partner?.nickname || 'Partner'}'s Memory`}
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
             {memory.photos && memory.photos.length > 0 && (
               <div className={`grid gap-1.5 mb-8 rounded-2xl overflow-hidden ${
                 memory.photos.length === 1 ? 'grid-cols-1' :
                 memory.photos.length === 2 ? 'grid-cols-2' :
                 'grid-cols-3'
               }`}>
                  {memory.photos.map((mediaUrl, index) => {
                    const isVideo = mediaUrl.match(/\.(mp4|webm|mov|avi|m4v)$/i);
                    const isGif = mediaUrl.match(/\.gif$/i);

                    return (
                      <div
                        key={index}
                        className="aspect-square relative group overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => !isVideo && handleImageClick(index)}
                      >
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                          />
                        ) : (
                          <>
                            <img
                              src={mediaUrl}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              alt={`Memory ${index + 1}`}
                            />
                            {isGif && (
                              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                GIF
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                                fullscreen
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
               </div>
             )}

             {/* Meta Tags */}
             <div className="flex gap-2 flex-wrap mb-8">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isLiked
                        ? 'bg-accent/10 text-accent'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
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

       {/* Image Viewer */}
       {memory.photos && memory.photos.length > 0 && (
         <ImageViewer
           images={memory.photos}
           initialIndex={selectedImageIndex}
           isOpen={imageViewerOpen}
           onClose={() => setImageViewerOpen(false)}
         />
       )}
    </div>
  );
};

export default MemoryDetail;