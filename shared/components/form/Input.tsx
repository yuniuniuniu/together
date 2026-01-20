import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightAction?: React.ReactNode;
  variant?: 'underline' | 'bordered';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  rightAction,
  variant = 'underline',
  className = '',
  ...props
}) => {
  const variantStyles = {
    underline: 'border-b border-primary/50 focus:border-accent bg-transparent',
    bordered: 'border border-primary/20 rounded-xl bg-white focus:border-accent px-4',
  };

  return (
    <div className="group">
      {label && (
        <label className="text-soft-gray text-[11px] font-bold uppercase tracking-wider px-0 block mb-1">
          {label}
        </label>
      )}
      <div className={`flex items-center ${variant === 'underline' ? 'border-b border-primary/50 focus-within:border-accent' : ''} transition-all`}>
        <input
          className={`flex-grow border-none focus:ring-0 text-base py-2 bg-transparent placeholder:text-soft-gray/40 ${className}`}
          {...props}
        />
        {rightAction}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};
