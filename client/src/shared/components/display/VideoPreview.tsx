import { useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
  src: string;
  className?: string;
  overlayClassName?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  enableFullscreen?: boolean;
}

/**
 * Weibo-style video preview:
 * - keep card thumbnail static
 * - optionally open fullscreen player on tap
 */
export function VideoPreview({
  src,
  className = 'w-full h-full object-cover',
  overlayClassName = '',
  iconSize = 'lg',
  enableFullscreen = false
}: VideoPreviewProps) {
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const iconSizeClass = {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-5xl'
  }[iconSize];

  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60);
    const remainSeconds = wholeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`;
  };

  const handleOpenFullscreen = (e: React.MouseEvent) => {
    if (!enableFullscreen) return;
    e.stopPropagation();
    e.preventDefault();
    setIsFullscreenOpen(true);
  };

  const handleCloseFullscreen = () => {
    const video = fullscreenVideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.muted = true;
    }
    setIsFullscreenOpen(false);
  };

  const handleFullscreenVideoReady = () => {
    const video = fullscreenVideoRef.current;
    if (!video) return;

    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => {
        // Let user tap native controls if autoplay remains blocked.
      });
    });
  };

  useEffect(() => {
    if (!isFullscreenOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreenOpen]);

  useEffect(() => {
    if (!isFullscreenOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseFullscreen();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreenOpen]);

  return (
    <>
      <div className="relative w-full h-full" onClick={handleOpenFullscreen}>
        <video
          src={src}
          className={className}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration);
          }}
        />
        <div className={`absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none ${overlayClassName}`}>
          <span className={`material-symbols-outlined text-white ${iconSizeClass} drop-shadow-lg`}>
            play_circle
          </span>
        </div>
        {duration !== null && (
          <div className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white pointer-events-none">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {isFullscreenOpen && enableFullscreen && (
        <div className="fixed inset-0 z-[90] bg-black/95 flex flex-col" onClick={handleCloseFullscreen}>
          <div className="flex items-center justify-end px-4 py-[calc(env(safe-area-inset-top)+0.75rem)]">
            <button
              type="button"
              className="size-9 rounded-full bg-white/15 text-white flex items-center justify-center"
              onClick={(event) => {
                event.stopPropagation();
                handleCloseFullscreen();
              }}
              aria-label="Close video"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <video
              ref={fullscreenVideoRef}
              src={src}
              className="max-h-full max-w-full rounded-lg bg-black"
              controls
              controlsList="nodownload"
              autoPlay
              playsInline
              onCanPlay={handleFullscreenVideoReady}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
