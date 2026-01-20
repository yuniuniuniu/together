import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2';

  const sizeStyles = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-4 px-6 text-base',
    lg: 'py-5 px-8 text-lg',
  };

  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-ink shadow-soft',
    secondary: 'bg-white border border-primary/20 text-ink hover:bg-gray-50',
    ghost: 'bg-transparent text-ink/50 hover:text-ink',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const iconElement = icon && (
    <span className="material-symbols-outlined">{icon}</span>
  );

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {iconPosition === 'left' && iconElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </button>
  );
};
