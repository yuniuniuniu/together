import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when opening or changing image
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Reset scale and position when changing images
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle double tap to zoom
  const handleDoubleTap = useCallback((clientX: number, clientY: number) => {
    if (scale === 1) {
      setScale(2);
      // Center zoom on tap position
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (centerX - clientX) * 1; // Scale - 1
        const offsetY = (centerY - clientY) * 1;
        setPosition({ x: offsetX, y: offsetY });
      }
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

      // Double tap detection
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
      }
    } else if (e.touches.length === 2) {
      lastTouchDistanceRef.current = getTouchDistance(e.touches);
    }
    setIsDragging(true);
  }, [handleDoubleTap]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      // Pinch to zoom
      const currentDistance = getTouchDistance(e.touches);
      const scaleDelta = currentDistance / lastTouchDistanceRef.current;
      setScale(prev => Math.min(Math.max(prev * scaleDelta, 1), 4));
      lastTouchDistanceRef.current = currentDistance;
    } else if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
      // Pan when zoomed
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchRef.current.x;
      const deltaY = touch.clientY - lastTouchRef.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [scale]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      lastTouchRef.current = null;
      lastTouchDistanceRef.current = null;
    } else if (e.touches.length === 1) {
      lastTouchDistanceRef.current = null;
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  // Handle swipe to change image
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (scale !== 1) return; // Don't swipe when zoomed

    if (direction === 'left' && currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [scale, currentIndex, images.length]);

  // Swipe detection
  const touchStartXRef = useRef<number>(0);
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (scale === 1) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  }, [scale]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (scale !== 1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      handleSwipe(diff > 0 ? 'left' : 'right');
    }
  }, [scale, handleSwipe]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={onClose}
          className="p-2 text-white/90 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        {images.length > 1 && (
          <span className="text-white/90 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        )}
        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden"
        onTouchStart={(e) => {
          handleTouchStart(e);
          handleSwipeStart(e);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          handleSwipeEnd(e);
        }}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? 'grab' : 'default',
          }}
          draggable={false}
        />
      </div>

      {/* Navigation Arrows (Desktop) */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          )}
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
