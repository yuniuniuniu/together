import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { milestonesApi } from '../shared/api/client';
import { useAuth } from '../shared/context/AuthContext';
import { useSpace } from '../shared/context/SpaceContext';
import { MILESTONES_QUERY_KEY } from '../shared/hooks/useMilestonesQuery';

interface Milestone {
  id: string;
  spaceId: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  icon?: string;
  photos: string[];
  location?: { name: string; address?: string; latitude?: number; longitude?: number };
  createdAt: string;
  createdBy: string;
}

const MilestoneDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { partner, anniversaryDate } = useSpace();

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMilestone = async () => {
      if (!id) return;
      try {
        const response = await milestonesApi.getById(id);
        setMilestone(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load milestone');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMilestone();
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

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this milestone? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await milestonesApi.delete(id);
      await queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY });
      navigate('/milestones');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete milestone');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const calculateDayNumber = (milestoneDate: string) => {
    if (!anniversaryDate) return null;
    const milestone = new Date(milestoneDate);
    const anniversary = new Date(anniversaryDate);
    const diffTime = milestone.getTime() - anniversary.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : null;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'trip': return 'flight';
      case 'anniversary': return 'favorite';
      case 'life event': return 'home';
      default: return 'celebration';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'trip': return 'bg-blue-100 text-blue-600';
      case 'anniversary': return 'bg-pink-100 text-pink-600';
      case 'life event': return 'bg-green-100 text-green-600';
      default: return 'bg-amber-100 text-amber-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-milestone-cream dark:bg-milestone-zinc-dark min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milestone-pink"></div>
        <p className="text-zinc-500 text-sm mt-4">Loading milestone...</p>
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <div className="flex-1 flex flex-col bg-milestone-cream dark:bg-milestone-zinc-dark min-h-screen items-center justify-center px-6">
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
          {error || 'Milestone not found'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-milestone-pink font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const dayNumber = calculateDayNumber(milestone.date);
  const isOwnMilestone = milestone.createdBy === user?.id;

  return (
    <div className="flex-1 flex flex-col bg-milestone-cream dark:bg-milestone-zinc-dark min-h-screen font-manrope">
      {/* Header with Hero Image */}
      <div className="relative">
        {/* Cover Photo or Gradient */}
        {milestone.photos && milestone.photos.length > 0 ? (
          <div className="relative h-72 overflow-hidden">
            <img
              src={milestone.photos[currentPhotoIndex]}
              alt={milestone.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

            {/* Photo Navigation Dots */}
            {milestone.photos.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                {milestone.photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-milestone-pink/30 via-gold/20 to-milestone-cream"></div>
        )}

        {/* Top Navigation */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white">more_horiz</span>
            </button>
            {showMenu && isOwnMilestone && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-black/5 py-2 min-w-[160px] z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/milestone/${id}/edit`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-zinc-600">edit</span>
                  <span className="text-sm font-medium text-zinc-700">Edit Milestone</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px] text-red-500">delete</span>
                  <span className="text-sm font-medium text-red-500">{isDeleting ? 'Deleting...' : 'Delete Milestone'}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(milestone.type)}`}>
              <span className="material-symbols-outlined text-[14px]">{getTypeIcon(milestone.type)}</span>
              {milestone.type}
            </span>
            {dayNumber && (
              <span className="text-xs font-bold text-gold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                Day {dayNumber}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{milestone.title}</h1>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-8 -mt-4 bg-milestone-cream dark:bg-milestone-zinc-dark rounded-t-3xl relative z-10">
        {/* Date Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-gold text-xl">calendar_month</span>
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</p>
            <p className="text-zinc-800 dark:text-zinc-200 font-semibold">{formatDate(milestone.date)}</p>
          </div>
        </div>

        {/* Location Section */}
        {milestone.location && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-xl">location_on</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</p>
              <p className="text-zinc-800 dark:text-zinc-200 font-semibold truncate">{milestone.location.name}</p>
              {milestone.location.address && (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm truncate">{milestone.location.address}</p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {milestone.description && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-milestone-pink uppercase tracking-wider mb-3">Our Feelings</h2>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-700">
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif italic">
                "{milestone.description}"
              </p>
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {milestone.photos && milestone.photos.length > 1 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Photos</h2>
            <div className="grid grid-cols-3 gap-2">
              {milestone.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`aspect-square rounded-xl overflow-hidden ${
                    index === currentPhotoIndex ? 'ring-2 ring-milestone-pink ring-offset-2' : ''
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Created by</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {isOwnMilestone ? 'You' : partner?.nickname || 'Partner'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Added on</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(milestone.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="flex items-center justify-center gap-4 py-8 opacity-60">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
          <span className="material-symbols-outlined text-gold text-sm" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-8 pt-4 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto px-6">
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/dashboard')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">home</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Home</span>
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
            <div className="bg-milestone-pink/10 rounded-2xl px-4 py-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-milestone-pink text-[26px]" style={{fontVariationSettings: "'FILL' 1"}}>flag</span>
            </div>
            <span className="text-[10px] font-bold text-milestone-pink">Milestones</span>
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

export default MilestoneDetail;
