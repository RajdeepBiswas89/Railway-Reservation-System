import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  styleType?: 'unboxed' | 'subtle';
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  styleType = 'subtle',
  showDot = true,
  className = '',
}) => {
  const dotColors = {
    neutral: 'bg-neutral-500',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-rose-600',
    info: 'bg-sky-600',
    accent: 'bg-[#93370D]',
  };

  const textColors = {
    neutral: 'text-neutral-700',
    success: 'text-emerald-700',
    warning: 'text-amber-800',
    danger: 'text-rose-700',
    info: 'text-sky-700',
    accent: 'text-[#7A2E0B]',
  };

  const subtleBgs = {
    neutral: 'bg-neutral-100/90 border border-neutral-200/60',
    success: 'bg-emerald-50/90 border border-emerald-200/60',
    warning: 'bg-amber-50/90 border border-amber-200/60',
    danger: 'bg-rose-50/90 border border-rose-200/60',
    info: 'bg-sky-50/90 border border-sky-200/60',
    accent: 'bg-orange-50/90 border border-orange-200/60',
  };

  if (styleType === 'unboxed') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColors[variant]} ${className}`}>
        {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
        <span>{children}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${subtleBgs[variant]} ${textColors[variant]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span className="truncate">{children}</span>
    </span>
  );
};
