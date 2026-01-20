import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2";
  const sizeStyles = "py-4 px-6 text-base";
  
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-ink shadow-soft",
    secondary: "bg-white border border-primary/20 text-ink hover:bg-gray-50",
    ghost: "bg-transparent text-ink/50 hover:text-ink"
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
      {icon && <span className="material-symbols-outlined">{icon}</span>}
    </button>
  );
};