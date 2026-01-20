import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  fallbackIcon = 'person',
  onClick,
}) => {
  const sizeStyles = {
    sm: 'size-10',
    md: 'size-16',
    lg: 'size-24',
    xl: 'size-[88px]',
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const baseStyles = 'rounded-full border-[3px] border-white dark:border-zinc-800 shadow-soft bg-cover bg-center ring-1 ring-primary/20';

  if (src) {
    return (
      <div
        className={`${baseStyles} ${sizeStyles[size]} ${onClick ? 'cursor-pointer transition-transform hover:scale-105 duration-300' : ''} ${className}`}
        style={{ backgroundImage: `url("${src}")` }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={alt}
      />
    );
  }

  return (
    <div
      className={`${baseStyles} ${sizeStyles[size]} flex items-center justify-center bg-soft-sand ${onClick ? 'cursor-pointer transition-transform hover:scale-105 duration-300' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={alt}
    >
      <span className={`material-symbols-outlined ${iconSizes[size]} text-soft-gray`}>
        {fallbackIcon}
      </span>
    </div>
  );
};
