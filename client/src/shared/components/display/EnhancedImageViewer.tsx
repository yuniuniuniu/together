import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeableImageContainer } from './SwipeableImageContainer';
import { LazyImage } from './LazyImage';
import './ImageGallery.css';

export interface EnhancedImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedImageViewer: React.FC<EnhancedImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastTapTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);
  const lastPanPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Reset scale when changing images
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard navigation
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

  // Preload adjacent images with priority hints
  useEffect(() => {
    if (!isOpen) return;

    const preloadUrls: string[] = [];

    // Previous image (higher priority)
    if (currentIndex > 0) {
      preloadUrls.push(images[currentIndex - 1]);
    }

    // Next image (higher priority)
    if (currentIndex < images.length - 1) {
      preloadUrls.push(images[currentIndex + 1]);
    }

    // Next-next image (lower priority)
    if (currentIndex < images.length - 2) {
      preloadUrls.push(images[currentIndex + 2]);
    }

    const links: HTMLLinkElement[] = [];

    preloadUrls.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      links.push(link);
    });

    // Cleanup
    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          document.head.removeChild(link);
        }
      });
    };
  }, [currentIndex, images, isOpen]);

  // Non-passive touchmove listener for Android compatibility
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const handleTouchMoveNative = (e: TouchEvent) => {
      // Prevent default scrolling when zoomed or pinching
      if (scale > 1 || (e.touches.length === 2 && isPinchingRef.current)) {
        e.preventDefault();
      }
    };

    // Critical: passive: false makes preventDefault effective
    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleTouchMoveNative);
    };
  }, [isOpen, scale]);

  // Double tap to zoom
  const handleDoubleTap = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now();

    if (e.touches.length === 2) {
      // Pinch gesture starting
      isPinchingRef.current = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1) {
      // Single tap - check for double tap
      const tapDelay = 250; // Reduced from 300ms for better responsiveness
      if (now - lastTapTimeRef.current < tapDelay) {
        e.preventDefault(); // Prevent 300ms click delay
        handleDoubleTap();
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
      }

      // Pan gesture starting (when zoomed)
      if (scale > 1) {
        lastPanPositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    }
  }, [handleDoubleTap, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current && lastTouchDistanceRef.current) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scaleDelta = distance / lastTouchDistanceRef.current;
      setScale(prev => Math.min(Math.max(prev * scaleDelta, 1), 4));
      lastTouchDistanceRef.current = distance;
    } else if (scale > 1 && e.touches.length === 1 && lastPanPositionRef.current) {
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPanPositionRef.current.x;
      const deltaY = touch.clientY - lastPanPositionRef.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastPanPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    isPinchingRef.current = false;
    lastTouchDistanceRef.current = null;
    lastPanPositionRef.current = null;
  }, []);

  const handleSwipeLeft = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTapToClose = useCallback(() => {
    // Keep zoom interactions first; tap-to-close only in default scale.
    if (scale !== 1) return;
    onClose();
  }, [onClose, scale]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
        >
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent"
        >
          <button
            onClick={onClose}
            className="p-2 text-white/90 hover:text-white transition-colors"
            aria-label="Close viewer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          {images.length > 1 && (
            <span className="text-white/90 text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          <div className="w-10" />
        </motion.div>

        {/* Image Container */}
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden image-viewer-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleTapToClose}
          >
          <SwipeableImageContainer
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            canSwipeLeft={currentIndex < images.length - 1}
            canSwipeRight={currentIndex > 0}
            disabled={scale > 1}
          >
            <motion.div
              key={currentIndex}
              layoutId={`image-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 200,
                mass: 0.8,
              }}
              className="max-w-full max-h-full"
            >
              <motion.div
                animate={{
                  scale: scale,
                  x: position.x,
                  y: position.y,
                }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 300,
                }}
                className="relative"
              >
                <LazyImage
                  src={images[currentIndex]}
                  alt={`Image ${currentIndex + 1}`}
                  className="max-w-screen max-h-screen object-contain select-none"
                  showLoadingIndicator
                  priority
                />
              </motion.div>
            </motion.div>
          </SwipeableImageContainer>
          </div>

        {/* Navigation Arrows (Desktop) */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <motion.button
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </motion.button>
              )}
              {currentIndex < images.length - 1 && (
                <motion.button
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </motion.button>
              )}
            </>
          )}

        {/* Dots Indicator */}
          {images.length > 1 && images.length <= 9 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute bottom-6 left-0 right-0 flex justify-center gap-2"
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-6'
                      : 'bg-white/40 hover:bg-white/60 w-2'
                  }`}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
