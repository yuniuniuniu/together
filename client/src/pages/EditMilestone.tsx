import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { milestonesApi, uploadApi } from '../shared/api/client';
import { MILESTONES_QUERY_KEY } from '../shared/hooks/useMilestonesQuery';
import { Platform } from '../shared/utils/platform';
import { mapWithConcurrency } from '../shared/utils/concurrency';
import { compressImage } from '../shared/utils/imageCompress';

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

const EditMilestone: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Milestone');
  const [date, setDate] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMilestone = async () => {
      if (!id) return;
      try {
        const response = await milestonesApi.getById(id);
        const data = response.data;
        setMilestone(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setType(data.type);
        setDate(data.date);
        setPhotos(data.photos || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load milestone');
      }
    };
    fetchMilestone();
  }, [id]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const formatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return isToday ? `Today, ${formatted}` : formatted;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const concurrency = Platform.isNative() ? 2 : 4;
      const maxAttempts = 2;

      type UploadOutcome =
        | { ok: true; url: string }
        | { ok: false; error: Error };

      const outcomes = await mapWithConcurrency(Array.from(files), concurrency, async (file): Promise<UploadOutcome> => {
        // Compress images before upload
        const fileToUpload = await compressImage(file);
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            const result = await uploadApi.uploadDirect(fileToUpload, 'images');
            return { ok: true, url: result.url };
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to upload photos');
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              continue;
            }
            return { ok: false, error };
          }
        }
        return { ok: false, error: new Error('Failed to upload photos') };
      });

      const urls = outcomes.filter((o): o is Extract<UploadOutcome, { ok: true }> => o.ok).map((o) => o.url);
      const failedCount = outcomes.length - urls.length;

      if (urls.length > 0) {
        setPhotos((prev) => [...prev, ...urls]);
      }
      if (failedCount > 0) {
        const firstError = outcomes.find((o): o is Extract<UploadOutcome, { ok: false }> => !o.ok)?.error;
        setError(firstError?.message || `${failedCount} photo(s) failed to upload. Please retry.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const categories = [
    { icon: 'celebration', label: 'Milestone' },
    { icon: 'flight', label: 'Trip' },
    { icon: 'favorite_border', label: 'Anniversary' },
    { icon: 'home', label: 'Life Event' },
  ];

  const handleSave = async () => {
    if (!id || !title.trim()) {
      setError('Please enter a title');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await milestonesApi.update(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        type,
        photos: photos.length > 0 ? photos : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY });
      navigate(`/milestone/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone');
    } finally {
      setIsSaving(false);
    }
  };

  if (!milestone) {
    if (!error) {
      return null;
    }
    return (
      <div className="flex-1 flex flex-col bg-milestone-cream dark:bg-milestone-zinc-dark min-h-screen items-center justify-center px-6">
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
          {error || 'Milestone not found'}
        </div>
        <button onClick={() => navigate(-1)} className="mt-4 text-milestone-pink font-medium">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-milestone-cream dark:bg-milestone-zinc-dark h-[100dvh] min-h-[100dvh] overflow-hidden relative font-manrope antialiased text-zinc-900 dark:text-zinc-100">
      <main className="flex-1 min-h-0 flex flex-col w-full max-w-md mx-auto overflow-y-auto no-scrollbar sm:shadow-2xl bg-milestone-cream dark:bg-milestone-zinc-dark">
        {/* Top Navigation Bar */}
        <header
          className="sticky top-0 z-50 w-full flex items-center justify-between px-5 pb-4 pt-safe-offset-4 bg-milestone-cream/90 dark:bg-milestone-zinc-dark/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/80 transition-all"
        >
          <button
            onClick={() => navigate(-1)}
            className="text-zinc-500 dark:text-zinc-400 text-base font-medium hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-1 opacity-80">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">Edit Milestone</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="bg-milestone-pink hover:bg-milestone-pink/90 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-milestone-pink/20 transition-all transform active:scale-95 flex items-center gap-1 disabled:opacity-50"
          >
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-6 pb-10 pt-2 gap-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer transition-all">
            {photos.length > 0 ? (
              <div className="absolute inset-0">
                <div
                  role="img"
                  aria-label="Cover"
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${photos[0]}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-white text-sm font-medium">
                      {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors"
                      >
                        Add more
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(0)}
                        className="px-3 py-1.5 bg-red-500/80 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                {photos.length > 1 && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    {photos.slice(1, 4).map((photo, index) => (
                      <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md">
                        <div
                          role="img"
                          aria-label={`Photo ${index + 2}`}
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url("${photo}")` }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(index + 1);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </div>
                    ))}
                    {photos.length > 4 && (
                      <div className="w-12 h-12 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-white text-xs font-bold">+{photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="absolute inset-0 border-[1.5px] border-dashed border-gold/40 rounded-2xl group-hover:border-gold/70 transition-colors"></div>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="absolute inset-0 bg-gold/5 dark:bg-gold/10 flex flex-col items-center justify-center gap-4 p-6 transition-colors group-hover:bg-gold/10 dark:group-hover:bg-gold/20"
                >
                  {isUploading ? (
                    <>
                      <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-900 dark:text-zinc-100 text-base font-bold">Uploading...</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-gold">
                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-900 dark:text-zinc-100 text-base font-bold">Add Cover Photo</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Capture the essence of this moment</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Title & Date Section */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="w-full relative">
              <input
                className="w-full bg-transparent text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 border-none focus:ring-0 p-0 leading-tight"
                placeholder="Moving In Together"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="group flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:border-gold/30 transition-all"
              >
                <span className="material-symbols-outlined text-gold text-[20px]">calendar_month</span>
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-milestone-pink transition-colors">{formatDisplayDate(date)}</span>
                <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 text-[16px]">edit</span>
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 p-4 z-50">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    className="bg-transparent border border-zinc-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-milestone-pink/30"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-4 py-2 opacity-60">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
            <span className="material-symbols-outlined text-gold text-[10px]">diamond</span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
          </div>

          {/* Feelings Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-milestone-pink uppercase tracking-widest">Our Feelings</label>
              <span className="material-symbols-outlined text-gold/60 text-lg">favorite</span>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-milestone-pink/20 to-gold/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <textarea
                className="relative w-full bg-white dark:bg-zinc-800/80 rounded-xl border-0 ring-1 ring-zinc-100 dark:ring-zinc-700/50 p-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-200 shadow-sm focus:ring-2 focus:ring-milestone-pink/20 focus:bg-white dark:focus:bg-zinc-800 resize-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                placeholder="How did this moment make us feel?"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Category Tags */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Categorize</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = type === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setType(cat.label)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-milestone-pink text-white shadow-md shadow-milestone-pink/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-gold/10 hover:text-gold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default EditMilestone;
