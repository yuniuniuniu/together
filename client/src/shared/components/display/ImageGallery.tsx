import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnhancedImageViewer } from './EnhancedImageViewer';
import { LazyImage } from './LazyImage';
import { ImageGalleryErrorBoundary } from './ImageGalleryErrorBoundary';
import './ImageGallery.css';

export interface ImageGalleryProps {
  images: string[];
  className?: string;
}

const ImageGalleryInner: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter out videos - they're handled separately
  const imageUrls = images.filter(url => {
    const isVideo = url.match(/\.(mp4|webm|mov|avi|m4v)$/i);
    return !isVideo;
  });

  if (imageUrls.length === 0) return null;

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const gridCols =
    imageUrls.length === 1 ? 'grid-cols-1' :
    imageUrls.length === 2 ? 'grid-cols-2' :
    'grid-cols-3';

  return (
    <>
      <div className={`grid gap-1.5 ${gridCols} ${className} image-gallery-grid`}>
        {imageUrls.map((imageUrl, index) => {
          const isGif = imageUrl.match(/\.gif$/i);

          return (
            <motion.div
              key={index}
              layoutId={`image-${index}`}
              className="aspect-square relative group overflow-hidden bg-gray-100 cursor-pointer rounded-lg image-gallery-item"
              onClick={() => handleImageClick(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
            >
              <LazyImage
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-full"
              />

              {isGif && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold pointer-events-none">
                  GIF
                </div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none"
              >
                <span className="material-symbols-outlined text-white text-2xl drop-shadow-lg">
                  fullscreen
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <EnhancedImageViewer
        images={imageUrls}
        initialIndex={selectedIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
};

export const ImageGallery: React.FC<ImageGalleryProps> = (props) => {
  return (
    <ImageGalleryErrorBoundary>
      <ImageGalleryInner {...props} />
    </ImageGalleryErrorBoundary>
  );
};
