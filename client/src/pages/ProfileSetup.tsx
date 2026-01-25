import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { uploadApi } from '../shared/api/client';

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile, user } = useAuth();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasInitialized && user) {
      setNickname(user.nickname || '');
      setAvatar(user.avatar || '');
      setHasInitialized(true);
    }
  }, [hasInitialized, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    try {
      const result = await uploadApi.uploadFile(file);
      setAvatar(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    setError('');
    try {
      await updateProfile({
        nickname: nickname.trim(),
        ...(avatar && { avatar }),
      });
      navigate('/sanctuary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light relative pt-safe">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
        <div className="w-full max-w-[320px]">
          <div className="text-center mb-10">
            <h1 className="text-[32px] font-extrabold tracking-tight text-ink mb-3 leading-tight">
              Let's get to know you
            </h1>
            <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
              Add a photo and details so your partner recognizes you instantly.
            </p>
          </div>

          <div className="flex justify-center mb-14">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div
              className="relative group cursor-pointer"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="w-40 h-40 rounded-full bg-white border border-primary/20 shadow-soft flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.02]">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[64px] text-primary/60 relative z-10" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
                    )}
                  </>
                )}
              </div>
              <div className="absolute bottom-1 right-2 bg-primary text-white rounded-full w-10 h-10 shadow-lg border-4 border-background-light flex items-center justify-center transition-transform group-hover:scale-110">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span className="material-symbols-outlined text-[20px] font-bold">{avatar ? 'edit' : 'add'}</span>
                )}
              </div>
            </div>
          </div>

          <form className="space-y-10 w-full" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg text-center">
                {error}
              </div>
            )}
            <div className="space-y-2 relative group">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4" htmlFor="nickname">
                What should we call you?
              </label>
              <div className="relative">
                <input
                  className="w-full py-3 bg-transparent border-b-[1.5px] border-gray-200 focus:border-primary focus:ring-0 text-xl font-semibold text-ink placeholder-gray-300 text-center transition-colors outline-none rounded-none"
                  id="nickname"
                  placeholder="e.g. Honey"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <div className="absolute right-0 bottom-3 text-gray-300 pointer-events-none group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-background-light via-background-light to-transparent z-20">
        <button
          onClick={handleSubmit}
          disabled={isLoading || !nickname.trim()}
          className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white text-[17px] font-bold rounded-full shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{isLoading ? 'Saving...' : 'Save & Continue'}</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;