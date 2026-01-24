import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { useSpace } from '../shared/context/SpaceContext';
import { uploadApi, spacesApi } from '../shared/api/client';
import { useToast } from '../shared/components/feedback/Toast';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isLoading: authLoading } = useAuth();
  const { space, partner, daysCount, anniversaryDate, isLoading: spaceLoading, refreshSpace } = useSpace();
  const { showToast } = useToast();

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(user?.nickname || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newAnniversaryDate, setNewAnniversaryDate] = useState('');
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await uploadApi.uploadFile(file);
      await updateProfile({ avatar: result.url });
      showToast('Avatar updated successfully', 'success');
    } catch {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleSaveNickname = async () => {
    if (!newNickname.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ nickname: newNickname.trim() });
      setIsEditingNickname(false);
      showToast('Nickname updated successfully', 'success');
    } catch {
      showToast('Failed to save nickname', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatAnniversaryDate = () => {
    if (!anniversaryDate) return 'Not set';
    return anniversaryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSaveAnniversaryDate = async () => {
    if (!newAnniversaryDate || !space?.id) return;
    setIsSavingDate(true);
    try {
      await spacesApi.update(space.id, { anniversaryDate: newAnniversaryDate });
      await refreshSpace();
      setIsEditingDate(false);
      showToast('Anniversary date updated successfully', 'success');
    } catch {
      showToast('Failed to update anniversary date', 'error');
    } finally {
      setIsSavingDate(false);
    }
  };

  const isLoading = authLoading || spaceLoading;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light pb-32">
      <header className="sticky top-0 z-50 bg-background-light/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-black/[0.03]">
        <button 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <span className="material-symbols-outlined text-ink/80">arrow_back</span>
        </button>
        <h1 className="text-xs font-bold tracking-[0.15em] uppercase text-soft-gray text-center">Couple Settings</h1>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -mr-2"
          >
            <span className="material-symbols-outlined text-ink/80">more_horiz</span>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-lg border border-black/5 overflow-hidden z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    showToast('Help & Support coming soon', 'info');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-soft-gray text-[20px]">help</span>
                  <span className="text-sm font-medium text-ink">Help & Support</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    showToast('About page coming soon', 'info');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-soft-gray text-[20px]">info</span>
                  <span className="text-sm font-medium text-ink">About</span>
                </button>
                <div className="h-px bg-black/5 mx-3"></div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    showToast('Export feature coming soon', 'info');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-soft-gray text-[20px]">download</span>
                  <span className="text-sm font-medium text-ink">Export Data</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 px-6">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <section className="py-10 flex flex-col items-center">
              {/* Hidden file input for avatar upload */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center mb-8 w-full">
                {/* User Avatar - Clickable to change */}
                <div
                  className="relative cursor-pointer group"
                  onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                >
                  {user?.avatar ? (
                    <div
                      className="w-24 h-24 rounded-full border-4 border-white bg-cover bg-center shadow-lg relative z-10 group-hover:opacity-80 transition-opacity"
                      style={{ backgroundImage: `url("${user.avatar}")` }}
                    ></div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg relative z-10 bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                  )}
                  {/* Edit overlay */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors z-20">
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <span className="material-symbols-outlined text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                        photo_camera
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-12 h-[2px] bg-primary/40 -mx-3 flex items-center justify-center relative z-0">
                  <div className="bg-background-light p-1 rounded-full border border-primary/20 shadow-sm">
                    <span className="material-symbols-outlined text-accent text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </div>
                </div>
                {/* Partner Avatar - Not editable */}
                {partner?.user?.avatar ? (
                  <div
                    className="w-24 h-24 rounded-full border-4 border-white bg-cover bg-center shadow-lg relative z-10"
                    style={{ backgroundImage: `url("${partner.user.avatar}")` }}
                  ></div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg relative z-10 bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                )}
              </div>
              <h2 className="font-serif text-3xl font-medium text-center tracking-tight mb-2 text-ink">
                Together for {daysCount || 0} days
              </h2>
              <p className="text-soft-gray/80 text-sm font-medium tracking-wide">
                Since {formatAnniversaryDate()}
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-soft-gray/60">Relationship Info</h3>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-black/[0.02]">
                {/* Item 1 - My Nickname */}
                <div className="w-full flex items-center gap-4 px-5 py-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-soft-gray shrink-0">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest mb-1">My Nickname</p>
                    {isEditingNickname ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          className="font-serif text-lg text-ink leading-none border-b border-primary focus:outline-none bg-transparent w-full"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveNickname}
                          disabled={isSaving}
                          className="text-primary font-medium text-sm"
                        >
                          {isSaving ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingNickname(false);
                            setNewNickname(user?.nickname || '');
                          }}
                          className="text-gray-400 font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="font-serif text-lg text-ink leading-none">{user?.nickname || 'Not set'}</p>
                    )}
                  </div>
                  {!isEditingNickname && (
                    <button
                      onClick={() => setIsEditingNickname(true)}
                      className="text-gray-300 hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  )}
                </div>
                <div className="h-[1px] bg-black/[0.03] mx-5"></div>

                {/* Item 2 - Partner's Nickname */}
                <div className="w-full flex items-center gap-4 px-5 py-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-soft-gray shrink-0">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest mb-1">My Partner</p>
                    <p className="font-serif text-lg text-ink leading-none">{partner?.user?.nickname || 'Waiting for partner...'}</p>
                  </div>
                </div>
                <div className="h-[1px] bg-black/[0.03] mx-5"></div>

                {/* Item 3 - Anniversary */}
                <div className="w-full flex items-center gap-4 px-5 py-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-soft-gray shrink-0">
                    <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold text-soft-gray/60 uppercase tracking-widest mb-1">Anniversary Date</p>
                    {isEditingDate ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={newAnniversaryDate}
                          onChange={(e) => setNewAnniversaryDate(e.target.value)}
                          className="font-serif text-lg text-ink leading-none border-b border-primary focus:outline-none bg-transparent"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveAnniversaryDate}
                          disabled={isSavingDate}
                          className="text-primary font-medium text-sm"
                        >
                          {isSavingDate ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingDate(false);
                            setNewAnniversaryDate('');
                          }}
                          className="text-gray-400 font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="font-serif text-lg text-ink leading-none">{formatAnniversaryDate()}</p>
                    )}
                  </div>
                  {!isEditingDate && (
                    <button
                      onClick={() => {
                        setIsEditingDate(true);
                        setNewAnniversaryDate(anniversaryDate ? anniversaryDate.toISOString().split('T')[0] : '');
                      }}
                      className="text-gray-300 hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

          </>
        )}

        <section className="mt-10 mb-8 space-y-4">
          <p className="text-center text-xs text-gray-400 mb-6 px-8 leading-relaxed font-medium">
            Unbinding your account will archive your shared gallery. You will need a new invite code to reconnect.
          </p>
          <button
            onClick={() => navigate('/settings/unbind')}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-primary/20 text-[#5A3E3E] font-bold shadow-sm hover:shadow-md hover:bg-primary/30 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">heart_broken</span>
            <span>Unbind Connection</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Log Out</span>
          </button>
        </section>
      </main>

      {/* Bottom Nav */}
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
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">flag</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Milestones</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 group w-16"
          >
            <div className="bg-primary/10 rounded-2xl px-4 py-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-[26px]" style={{fontVariationSettings: "'FILL' 1"}}>settings</span>
            </div>
            <span className="text-[10px] font-bold text-primary">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;