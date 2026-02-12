import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useSpace } from '../shared/context/SpaceContext';
import { useAuth } from '../shared/context/AuthContext';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';
import { spacesApi } from '../shared/api/client';
import { resolveMediaUrl } from '../shared/utils/resolveMediaUrl';

interface SpaceData {
  id: string;
  createdAt: string;
  anniversaryDate: string;
  inviteCode: string;
  pendingInviteCode?: string;
  partners: Array<{ id: string; phone: string; nickname: string; avatar?: string }>;
}

const ConfirmPartner: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSpace } = useSpace();
  const { user } = useAuth();
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [partner, setPartner] = useState<{ nickname: string; avatar?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const partnerAvatarUrl = resolveMediaUrl(partner?.avatar);
  const { topBarRef, topBarHeight } = useFixedTopBar();

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingSpace');
    if (stored) {
      try {
        const data = JSON.parse(stored) as SpaceData;
        setSpaceData(data);
        // Find the partner (the other user)
        const partnerUser = data.partners.find(p => p.id !== user?.id);
        if (partnerUser) {
          setPartner({ nickname: partnerUser.nickname, avatar: partnerUser.avatar });
        }
      } catch {
        navigate('/join');
      }
    } else {
      navigate('/join');
    }
  }, [navigate, user?.id]);

  const handleConfirm = async () => {
    if (!spaceData?.pendingInviteCode) {
      navigate('/join');
      return;
    }

    setIsLoading(true);
    try {
      // Actually join the space now
      await spacesApi.join(spaceData.pendingInviteCode);
      await refreshSpace();
      sessionStorage.removeItem('pendingSpace');
      navigate('/celebration');
    } catch (err) {
      // If join fails, show error but don't navigate away
      console.error('Failed to join space:', err);
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!spaceData || !partner) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div
        ref={topBarRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] flex items-center px-4 pb-4 pt-safe-offset-4 justify-between bg-background-light/90 backdrop-blur-md border-b border-black/[0.03]"
      >
        <div
          className="text-ink flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-ink text-lg font-serif font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Confirm Partner</h2>
      </div>
      <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

      <div className="px-8 mt-2">
        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-3/4 rounded-full"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full flex flex-col items-center gap-2 mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] text-soft-gray font-bold">Connection Found</span>
          <h1 className="text-3xl font-serif text-ink text-center italic">Is this your TA?</h1>
        </div>

        <div className="w-full bg-white rounded-xl p-8 shadow-soft border border-gray-50 flex flex-col items-center animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
            {partnerAvatarUrl ? (
              <div
                className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full h-40 w-40 border-4 border-white shadow-sm"
                style={{ backgroundImage: `url("${partnerAvatarUrl}")` }}
              ></div>
            ) : (
              <div className="relative rounded-full h-40 w-40 border-4 border-white shadow-sm bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-ink text-2xl font-serif font-bold leading-tight tracking-tight text-center">
              {partner.nickname || 'Your Partner'}
            </p>
            <div className="flex items-center gap-2 py-1">
              <span className="material-symbols-outlined text-accent text-base filled" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <p className="text-ink text-lg font-medium leading-normal text-center tracking-tight">
                Anniversary: {formatDate(spaceData.anniversaryDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 px-4 text-center">
          <p className="text-soft-gray text-base leading-relaxed italic">
            "Once connected, you'll be able to share private notes and daily captures."
          </p>
        </div>
      </div>

      <div className="pb-12 px-6 flex flex-col gap-4">
        <Button onClick={handleConfirm} fullWidth disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Confirm & Connect'}
        </Button>
        <div className="flex items-center justify-center gap-1.5 opacity-60">
          <span className="material-symbols-outlined text-xs">lock</span>
          <p className="text-soft-gray text-xs font-normal leading-normal text-center">
            You can only connect with one partner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPartner;