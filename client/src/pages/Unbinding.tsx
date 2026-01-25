import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../shared/context/SpaceContext';

const Unbinding: React.FC = () => {
  const navigate = useNavigate();
  const { space, requestUnbind, cancelUnbind, getUnbindStatus } = useSpace();
  const [isUnbinding, setIsUnbinding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<{
    id: string;
    spaceId: string;
    requestedBy: string;
    requestedAt: string;
    expiresAt: string;
    status: 'pending' | 'cancelled' | 'completed';
  } | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);

  useEffect(() => {
    if (!space) return;
    const fetchStatus = async () => {
      setIsFetchingStatus(true);
      try {
        const response = await getUnbindStatus();
        setStatus(response);
      } catch {
        setStatus(null);
      } finally {
        setIsFetchingStatus(false);
      }
    };
    fetchStatus();
  }, [space, getUnbindStatus]);

  const handleUnbind = async () => {
    if (!space) return;
    if (!window.confirm('Are you sure you want to start unbinding? You can cancel within 7 days.')) {
      return;
    }

    setError('');
    setIsUnbinding(true);
    try {
      const response = await requestUnbind();
      setStatus(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unbind');
    } finally {
      setIsUnbinding(false);
    }
  };

  const handleCancelUnbind = async () => {
    if (!space) return;
    setError('');
    setIsCancelling(true);
    try {
      await cancelUnbind();
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel unbind');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isPending = status?.status === 'pending';

  return (
    <div className="flex-1 flex flex-col bg-background-light relative h-full min-h-screen">
      {/* Header */}
      <div className="flex items-center px-6 pb-6 pt-safe-offset-6 justify-between relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <span className="material-symbols-outlined text-ink" style={{fontSize: '20px'}}>arrow_back</span>
        </button>
        <h2 className="text-sm font-semibold tracking-wide uppercase text-soft-gray">Unbinding</h2>
        <div className="size-10"></div>
      </div>

      {/* Illustration */}
      <div className="px-6 pt-2 pb-6">
        <div className="w-full aspect-[4/3] bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm relative group">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105" 
            style={{backgroundImage: 'url("/images/unbinding-hero.png")'}}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background-light/40 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 flex flex-col">
        <h1 className="text-3xl font-medium leading-tight tracking-tight text-center mb-4 text-ink">
          A pause, <br/>not a goodbye
        </h1>
        <p className="text-base text-ink/60 text-center leading-relaxed font-normal mb-8 max-w-[90%] mx-auto">
          Unbinding is a big step. We've set aside a <span className="text-ink font-medium bg-primary/30 px-1 rounded">7-day cooling-off period</span> where your shared journal remains safe.
        </p>

        {/* Timeline Card */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6 border border-gray-100">
          <div className="grid grid-cols-[32px_1fr] gap-x-4">
            {/* Item 1 */}
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-primary/30 flex items-center justify-center text-ink">
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>schedule</span>
              </div>
              <div className="w-0.5 bg-gray-100 h-full min-h-[2rem]"></div>
            </div>
            <div className="pb-6 pt-1">
              <p className="text-sm font-semibold text-ink">Unbind Requested</p>
              <p className="text-xs text-ink/50 mt-0.5">Your connection pauses today</p>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-ink/40">
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>event_busy</span>
              </div>
              <div className="w-0.5 bg-gray-100 h-full min-h-[2rem]"></div>
            </div>
            <div className="pb-6 pt-1">
              <p className="text-sm font-semibold text-ink">Cooling-off Period</p>
              <p className="text-xs text-ink/50 mt-0.5">Restore anytime for 7 days</p>
            </div>

            {/* Item 3 */}
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-ink/40">
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete_forever</span>
              </div>
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold text-ink">Permanent Deletion</p>
              <p className="text-xs text-ink/50 mt-0.5">Data removed after 7 days</p>
            </div>
          </div>
        </div>

        {(isFetchingStatus || isPending) && (
          <div className="bg-white rounded-3xl p-6 shadow-soft mb-6 border border-primary/20">
            <h3 className="text-sm font-semibold text-ink mb-2">
              {isFetchingStatus ? 'Checking unbind status...' : 'Unbind request active'}
            </h3>
            {isPending && (
              <p className="text-xs text-ink/50">
                Requested on {formatDateTime(status.requestedAt)} · Expires on {formatDateTime(status.expiresAt)}
              </p>
            )}
          </div>
        )}

        {/* Backup Tip */}
        <div className="flex items-start gap-3 px-2 mb-6 opacity-80">
          <span className="material-symbols-outlined text-ink/40 shrink-0" style={{fontSize: '20px'}}>inventory_2</span>
          <p className="text-xs text-ink/50 leading-relaxed">
            Tip: We recommend downloading a backup of your shared memories before proceeding with the unbinding process.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="mt-auto pb-6 space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all rounded-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-ink font-semibold text-lg"
          >
            <span>Back to Our Space</span>
            <span className="material-symbols-outlined" style={{fontSize: '20px', fontVariationSettings: "'FILL' 1"}}>favorite</span>
          </button>
          {isPending ? (
            <button
              onClick={handleCancelUnbind}
              disabled={isCancelling || isLoading}
              className="w-full h-12 rounded-full flex items-center justify-center text-ink/40 hover:text-ink transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Unbind Request'}
            </button>
          ) : (
            <button
              onClick={handleUnbind}
              disabled={isUnbinding || isLoading}
              className="w-full h-12 rounded-full flex items-center justify-center text-ink/40 hover:text-red-500 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isUnbinding ? 'Submitting...' : 'Start Unbinding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unbinding;