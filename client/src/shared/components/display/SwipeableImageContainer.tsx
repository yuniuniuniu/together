import React, { ReactNode } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';

export interface SwipeableImageContainerProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  disabled?: boolean;
}

export const SwipeableImageContainer: React.FC<SwipeableImageContainerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  disabled = false,
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100; // pixels
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Determine if swipe is strong enough
    const shouldSwipe = Math.abs(offset) > threshold || Math.abs(velocity) > 500;

    if (shouldSwipe) {
      if (offset > 0 && canSwipeRight) {
        // Swipe right (previous image)
        animate(x, 400, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }).then(() => {
          onSwipeRight();
          x.set(0);
        });
      } else if (offset < 0 && canSwipeLeft) {
        // Swipe left (next image)
        animate(x, -400, {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }).then(() => {
          onSwipeLeft();
          x.set(0);
        });
      } else {
        // Bounce back
        animate(x, 0, {
          type: 'spring',
          stiffness: 400,
          damping: 30,
        });
      }
    } else {
      // Bounce back
      animate(x, 0, {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      });
    }
  };

  return (
    <motion.div
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, opacity, scale }}
      className="w-full h-full flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
};
