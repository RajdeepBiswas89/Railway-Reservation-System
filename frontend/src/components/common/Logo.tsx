import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'dark',
  showTagline = false,
  size = 'md',
}) => {
  const isLight = variant === 'light';

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Railway Icon */}
      <div
        className={`${iconSizes[size]} flex items-center justify-center rounded-lg ${
          isLight ? 'bg-white/10 text-white' : 'bg-[#121417] text-white shadow-xs'
        } relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Dual Parallel Tracks curving with forward dynamism */}
          <path
            d="M6 22L11 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M17 22L22 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Railway Cross Sleepers */}
          <path
            d="M7.8 17.5H18.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          <path
            d="M9.8 11.5H20.2"
            stroke="#D92D20"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`font-extrabold tracking-tight font-sans ${sizeClasses[size]} ${
            isLight ? 'text-white' : 'text-[#121417]'
          }`}
        >
          RAILNEX
        </span>
        {showTagline && (
          <span
            className={`text-[10px] tracking-wide font-medium mt-0.5 ${
              isLight ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Your Journey. Reimagined.
          </span>
        )}
      </div>
    </div>
  );
};
