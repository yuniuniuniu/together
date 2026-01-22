import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  overlayClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  showCloseButton = true,
  overlayClassName = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-ink/20 backdrop-blur-sm ${overlayClassName}`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto ${className}`}
      >
        {showCloseButton && (
          <button
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-ink/60">close</span>
          </button>
        )}

        {children}
      </div>
    </div>
  );
};
