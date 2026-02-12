import { useEffect, useRef, useState, type MouseEvent } from 'react';

interface VideoPreviewProps {
  src: string;
  className?: string;
  overlayClassName?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  enableFullscreen?: boolean;
  enableInlinePlayback?: boolean;
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
  enableFullscreen = false,
  enableInlinePlayback = false
}: VideoPreviewProps) {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isInlinePlaying, setIsInlinePlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [hasTriedWarmupPlay, setHasTriedWarmupPlay] = useState(false);

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

  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>) => {
    if (enableFullscreen) {
      e.stopPropagation();
      e.preventDefault();
      setIsFullscreenOpen(true);
      return;
    }

    if (!enableInlinePlayback) return;
    e.stopPropagation();
    e.preventDefault();

    const video = previewVideoRef.current;
    if (!video) return;

    if (isInlinePlaying) {
      video.pause();
      setIsInlinePlaying(false);
      return;
    }

    video.muted = true;
    video.loop = true;
    void video.play()
      .then(() => {
        setIsInlinePlaying(true);
      })
      .catch(() => {
        setIsInlinePlaying(false);
      });
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

  const seekPreviewFrame = (video: HTMLVideoElement) => {
    const totalDuration = video.duration;
    if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
      return;
    }

    // Skip black intro frames by seeking to an informative early point.
    const targetTime = Math.min(Math.max(totalDuration * 0.2, 0.35), Math.max(totalDuration - 0.1, 0));
    if (targetTime <= 0) return;

    try {
      video.currentTime = targetTime;
    } catch {
      // Some devices can reject early seek; keep first frame as fallback.
    }
  };

  const warmupAndSeekPreviewFrame = (video: HTMLVideoElement) => {
    if (previewReady || hasTriedWarmupPlay) return;
    setHasTriedWarmupPlay(true);

    // Some Android WebViews only render a visible frame after a muted play/pause cycle.
    void video.play()
      .then(() => {
        video.pause();
        seekPreviewFrame(video);
      })
      .catch(() => {
        seekPreviewFrame(video);
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
    const previewVideo = previewVideoRef.current;
    if (previewVideo) {
      previewVideo.pause();
    }
    setIsInlinePlaying(false);
    setPreviewReady(false);
    setHasTriedWarmupPlay(false);
  }, [src]);

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
      <div className="relative w-full h-full" onClick={handlePreviewClick}>
        <video
          ref={previewVideoRef}
          src={src}
          className={className}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDuration(video.duration);
            seekPreviewFrame(video);
          }}
          onLoadedData={(event) => {
            if (previewReady) return;
            warmupAndSeekPreviewFrame(event.currentTarget);
          }}
          onCanPlay={(event) => {
            if (previewReady) return;
            warmupAndSeekPreviewFrame(event.currentTarget);
          }}
          onSeeked={() => {
            setPreviewReady(true);
          }}
        />
        <div className={`absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none ${overlayClassName}`}>
          <span className={`material-symbols-outlined text-white ${iconSizeClass} drop-shadow-lg`}>
            {isInlinePlaying ? 'pause_circle' : 'play_circle'}
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
