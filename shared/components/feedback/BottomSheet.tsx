import React from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  height?: string;
  showHandle?: boolean;
  overlayClassName?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  height = 'h-[60vh]',
  showHandle = true,
  overlayClassName = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-ink/10 pointer-events-auto backdrop-blur-[2px] ${overlayClassName}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative bg-white/90 backdrop-blur-2xl rounded-t-[2.5rem] w-full max-w-xl mx-auto bottom-sheet pointer-events-auto ${height} flex flex-col ${className}`}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing"
            onClick={onClose}
          >
            <div className="w-10 h-1 bg-ink/10 rounded-full" />
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};
