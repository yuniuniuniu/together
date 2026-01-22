import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backPath?: string;
  rightAction?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'transparent';
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBack,
  backPath,
  rightAction,
  className = '',
  variant = 'default',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const baseStyles = 'sticky top-0 z-50 px-6 py-4 flex items-center justify-between';
  const variantStyles = {
    default: 'bg-background-light/90 backdrop-blur-md border-b border-black/[0.03]',
    transparent: 'bg-transparent',
  };

  return (
    <header className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <div className="w-10 h-10 flex items-center justify-start">
        {showBack && (
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -ml-2"
            onClick={handleBack}
          >
            <span className="material-symbols-outlined text-ink/80">arrow_back</span>
          </button>
        )}
      </div>

      {title && (
        <h1 className="text-xs font-bold tracking-[0.15em] uppercase text-soft-gray text-center">
          {title}
        </h1>
      )}

      <div className="w-10 h-10 flex items-center justify-end">
        {rightAction || <div className="w-10" />}
      </div>
    </header>
  );
};
