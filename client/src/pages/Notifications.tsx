import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../shared/context/NotificationContext';
import { useToast } from '../shared/components/feedback/Toast';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { notifications, unreadCount, error, markAsRead, markAllAsRead } = useNotifications();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const { topBarRef, topBarHeight } = useFixedTopBar();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
      showToast('All notifications marked as read', 'success');
    } catch {
      showToast('Failed to mark all as read', 'error');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    const actionUrl = notification.actionUrl?.trim();
    // Avoid sending users back to the landing page for notifications without a deep link
    if (actionUrl && actionUrl !== '/') {
      navigate(actionUrl);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'nudge': return 'waving_hand';
      case 'memory': return 'photo_library';
      case 'milestone': return 'celebration';
      case 'reaction': return 'favorite';
      case 'profile': return 'person';
      case 'reminder': return 'event';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'nudge': return 'text-amber-500 bg-amber-100';
      case 'memory': return 'text-blue-500 bg-blue-100';
      case 'milestone': return 'text-purple-500 bg-purple-100';
      case 'reaction': return 'text-pink-500 bg-pink-100';
      case 'profile': return 'text-teal-500 bg-teal-100';
      case 'reminder': return 'text-orange-500 bg-orange-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const todayNotifications = notifications.filter((n: Notification) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });
  const earlierNotifications = notifications.filter((n: Notification) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    return date.toDateString() !== today.toDateString();
  }); 

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#1b100e] dark:text-[#fcf9f8] min-h-screen">
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative pb-8">
        
        {/* Header */}
        <div
          ref={topBarRef}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/[0.03] dark:border-zinc-800/80 flex items-center px-6 pb-4 pt-safe-offset-4 justify-between"
        >
          <div className="text-[#1b100e] dark:text-white flex size-10 shrink-0 items-center justify-start -ml-2">
            <span 
              onClick={() => navigate(-1)}
              className="material-symbols-outlined cursor-pointer text-2xl hover:text-primary transition-colors"
            >
              arrow_back
            </span>
          </div>
          <h2 className={`text-[#1b100e] dark:text-white text-xl font-bold ${notifications.length === 0 ? 'tracking-[0.2em]' : 'tracking-widest'} flex-1 text-center font-display uppercase`}>
            Notifications
          </h2>
          <div className="flex size-10 items-center justify-end -mr-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {isMarkingAllRead ? '...' : 'Read All'}
              </button>
            )}
          </div>
        </div>
        <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="px-6">
            {/* Today Section */}
            {todayNotifications.length > 0 && (
              <>
                <div className="flex items-center justify-between pt-4 pb-4">
                  <h3 className="text-[#1b100e] dark:text-white text-2xl font-bold leading-tight tracking-tight font-serif italic">Today</h3>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b100e] bg-dusty-rose/30 dark:bg-dusty-rose/20 px-3 py-1.5 rounded-full">
                      <svg className="w-2.5 h-2.5 fill-orange-primary" viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"></path></svg>
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {todayNotifications.map((notification) => (
                  <div key={notification.id} className="mb-4">
                    <div
                      className="relative flex items-center gap-4 rounded-[2rem] bg-white dark:bg-[#36312d] p-5 warm-shadow border border-stone-100 dark:border-stone-800 transition-transform active:scale-[0.98] cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${getNotificationColor(notification.type)}`}>
                        <span className="material-symbols-outlined text-2xl">{getNotificationIcon(notification.type)}</span>
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-apricot dark:text-amber-200">{notification.type}</span>
                          <span className="text-[10px] text-stone-400 font-medium">{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                        <p className="text-[#1b100e] dark:text-white text-base font-medium font-serif leading-snug">{notification.title}</p>
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-normal font-light">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <div className="absolute top-5 right-5">
                          <div className="w-2 h-2 rounded-full bg-orange-primary"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Earlier Section */}
            {earlierNotifications.length > 0 && (
              <>
                <div className="flex items-center justify-between pt-4 pb-4">
                  <h3 className="text-[#1b100e] dark:text-white text-xl font-bold leading-tight tracking-tight font-serif italic">Earlier</h3>
                </div>

                {earlierNotifications.map((notification) => (
                  <div key={notification.id} className="mb-4">
                    <div
                      className={`relative flex items-center gap-4 rounded-[2rem] bg-white dark:bg-[#36312d] p-5 warm-shadow border border-stone-100 dark:border-stone-800 transition-transform active:scale-[0.98] cursor-pointer ${notification.read ? 'opacity-70' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${getNotificationColor(notification.type)}`}>
                        <span className="material-symbols-outlined text-2xl">{getNotificationIcon(notification.type)}</span>
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-apricot dark:text-amber-200">{notification.type}</span>
                          <span className="text-[10px] text-stone-400 font-medium">{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                        <p className="text-[#1b100e] dark:text-white text-base font-medium font-serif leading-snug">{notification.title}</p>
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-normal font-light">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <div className="absolute top-5 right-5">
                          <div className="w-2 h-2 rounded-full bg-orange-primary"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-dusty-rose/10 dark:bg-dusty-rose/5 rounded-full blur-3xl"></div>
              <svg className="w-24 h-24 text-dusty-rose-dark/60 dark:text-dusty-rose/40 relative z-10 hand-drawn" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path d="M12 18s-4.5-1-4.5-5.5S11 7 11 7s1 1 1.5 2C13 8 14 7 14 7s3.5 1 3.5 5.5S13 18 12 18z"></path>
                <path d="M11 7c0-2 1-3 1-3s1 1 1 3"></path>
                <path d="M10.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="currentColor"></path>
                <path d="M14.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="currentColor"></path>
                <path d="M11.5 12.5c.33.17.67.17 1 0"></path>
                <path d="M4 20c4 0 7-1 8-3s4-3 8-3" strokeDasharray="0.5 2"></path>
              </svg>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-[#1b100e] dark:text-white text-2xl font-semibold font-serif italic tracking-tight">
                Your space is quiet for now
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-base font-light leading-relaxed max-w-[240px] mx-auto">
                Moments from TA will appear here
              </p>
            </div>
            <div className="mt-12 flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose/60"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose/40"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;