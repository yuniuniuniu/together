import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { useSpace } from '../shared/context/SpaceContext';
import { useMilestonesQuery } from '../shared/hooks/useMilestonesQuery';

interface Milestone {
  id: string;
  spaceId: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  icon?: string;
  photos: string[];
  createdAt: string;
  createdBy: string;
}

const MilestoneTimeline: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anniversaryDate } = useSpace();
  const { data: milestones = [], isLoading, error } = useMilestonesQuery();
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : '';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  return (
    <div className="bg-milestone-cream dark:bg-milestone-zinc-dark font-manrope antialiased text-zinc-900 dark:text-zinc-100 min-h-screen pb-32 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-milestone-cream/95 dark:bg-milestone-zinc-dark/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-zinc-900 dark:text-zinc-100 text-lg font-bold tracking-tight">Milestones</h2>
          </div>
          <button
            onClick={() => navigate('/milestone/new')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-milestone-pink">add</span>
          </button>
        </div>
      </nav>

      {isLoading ? (
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milestone-pink"></div>
            <p className="text-zinc-500 text-sm">Loading milestones...</p>
          </div>
        </main>
      ) : error ? (
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
            {errorMessage || 'Failed to load milestones'}
          </div>
        </main>
      ) : milestones.length > 0 ? (
        <main className="flex-1 px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-100 italic">Our Journey</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 font-bold tracking-widest uppercase">
              {milestones.length} {milestones.length === 1 ? 'Milestone' : 'Milestones'}
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-milestone-pink via-gold to-milestone-pink/20"></div>

            {milestones.map((milestone, index) => {
              const dayNumber = calculateDayNumber(milestone.date);
              return (
                <div key={milestone.id} className="relative pl-16 pb-8">
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-milestone-cream dark:bg-milestone-zinc-dark border-4 border-milestone-pink shadow-sm"></div>

                  {/* Card */}
                  <div
                    className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => navigate(`/milestone/${milestone.id}`)}
                  >
                    {/* Cover photo */}
                    {milestone.photos && milestone.photos.length > 0 ? (
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <img
                          src={milestone.photos[0]}
                          alt={milestone.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white text-xl font-bold">{milestone.title}</h3>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 pb-0">
                        <h3 className="text-zinc-900 dark:text-zinc-100 text-xl font-bold">{milestone.title}</h3>
                      </div>
                    )}

                    <div className="p-5">
                      {/* Meta info */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(milestone.type)}`}>
                          <span className="material-symbols-outlined text-[14px]">{getTypeIcon(milestone.type)}</span>
                          {milestone.type}
                        </span>
                        {dayNumber && (
                          <span className="text-xs font-bold text-gold uppercase tracking-wider">
                            Day {dayNumber}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-3">
                        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        <span>{formatDate(milestone.date)}</span>
                      </div>

                      {/* Description */}
                      {milestone.description && (
                        <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed line-clamp-2">
                          {milestone.description}
                        </p>
                      )}

                      {/* Author */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {milestone.createdBy === user?.id ? 'You' : 'Partner'}
                          </span>
                        </div>
                        {milestone.photos && milestone.photos.length > 1 && (
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">photo_library</span>
                            {milestone.photos.length} photos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative w-48 h-48 mb-8">
            <div className="absolute inset-0 bg-gold/20 rounded-full blur-3xl"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="bg-white dark:bg-zinc-800 rounded-full p-8 shadow-lg">
                <span className="material-symbols-outlined text-6xl text-gold" style={{fontVariationSettings: "'FILL' 1"}}>flag</span>
              </div>
            </div>
          </div>
          <div className="text-center space-y-3 max-w-xs mx-auto mb-10">
            <h3 className="text-2xl font-serif text-zinc-900 dark:text-zinc-100 font-medium italic">
              No milestones yet
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Create your first milestone to mark the special moments in your journey together.
            </p>
          </div>
          <button
            onClick={() => navigate('/milestone/new')}
            className="bg-milestone-pink hover:bg-milestone-pink/90 text-white px-8 py-4 rounded-full shadow-lg shadow-milestone-pink/25 flex items-center gap-3 font-bold tracking-wide transition-all transform hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span className="uppercase text-xs tracking-widest">Create Milestone</span>
          </button>
        </main>
      )}

      {/* FAB */}
      {milestones.length > 0 && (
        <div className="fixed bottom-28 right-6 z-40">
          <button
            onClick={() => navigate('/milestone/new')}
            className="bg-milestone-pink text-white w-14 h-14 rounded-full shadow-lg shadow-milestone-pink/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
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
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/memories')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">favorite</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Memories</span>
          </button>
          <button className="flex flex-col items-center gap-1 group w-16">
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

export default MilestoneTimeline;
