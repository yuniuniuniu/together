import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  showLoadingIndicator?: boolean;
  placeholderClassName?: string;
  onLoad?: () => void;
  priority?: boolean; // Skip lazy loading for priority images
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  showLoadingIndicator = false,
  placeholderClassName = '',
  onLoad,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            data-testid="lazy-image-placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 bg-gray-200 ${placeholderClassName}`}
          >
            {showLoadingIndicator && !isError && (
              <div
                data-testid="lazy-image-loading"
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded && !isError ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Error State */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
          >
            <span className="material-symbols-outlined text-gray-400 text-4xl">
              broken_image
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
