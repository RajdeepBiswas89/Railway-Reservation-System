import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap shrink-0 active:scale-[0.99]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5 h-8',
    md: 'text-sm px-4 py-2 rounded-lg gap-2 h-10',
    lg: 'text-base px-6 py-2.5 rounded-lg gap-2.5 h-12',
  };

  const variantStyles = {
    primary:
      'bg-[#121417] text-white hover:bg-[#22262B] shadow-xs focus-visible:ring-[#121417]',
    secondary:
      'bg-neutral-100 text-neutral-800 hover:bg-neutral-200/80 focus-visible:ring-neutral-400',
    outline:
      'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-neutral-400 shadow-xs',
    ghost:
      'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300',
    danger:
      'bg-[#D92D20] text-white hover:bg-[#B42318] shadow-xs focus-visible:ring-[#D92D20]',
    accent:
      'bg-[#93370D] text-white hover:bg-[#7A2E0B] shadow-xs focus-visible:ring-[#93370D]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
