import { useRef, useState } from 'react';

interface VideoPreviewProps {
  src: string;
  className?: string;
  overlayClassName?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  enableFullscreen?: boolean;
}

/**
 * Video preview component that shows a play button overlay.
 * Click to play/pause the video inline, or enable fullscreen mode with controls.
 */
export function VideoPreview({
  src,
  className = 'w-full h-full object-cover',
  overlayClassName = '',
  iconSize = 'lg',
  enableFullscreen = false
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const iconSizeClass = {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-5xl'
  }[iconSize];

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      video.muted = true;
      setIsPlaying(false);
    } else {
      video.muted = false;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay was prevented, try muted
        video.muted = true;
        video.play().then(() => {
          setIsPlaying(true);
        });
      });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if (enableFullscreen) {
      e.stopPropagation();
    } else {
      handleTogglePlay(e);
    }
  };

  return (
    <div className="relative w-full h-full" onClick={handleVideoClick}>
      <video
        ref={videoRef}
        src={src}
        className={className}
        muted={!enableFullscreen}
        playsInline
        controls={enableFullscreen}
        controlsList={enableFullscreen ? "nodownload" : undefined}
        onEnded={handleVideoEnded}
        onClick={(e) => enableFullscreen && e.stopPropagation()}
      />
      {!isPlaying && !enableFullscreen && (
        <div className={`absolute inset-0 flex items-center justify-center bg-black/20 ${overlayClassName}`}>
          <span className={`material-symbols-outlined text-white ${iconSizeClass} drop-shadow-lg`}>
            play_circle
          </span>
        </div>
      )}
    </div>
  );
}
