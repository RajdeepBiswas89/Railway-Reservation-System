import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-white text-neutral-900 text-sm rounded-lg border transition-all duration-150 py-2.5 pl-3.5 pr-9 cursor-pointer ${
              error
                ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                : 'border-neutral-300 focus:border-[#121417] focus:ring-1 focus:ring-[#121417]'
            } disabled:bg-neutral-50 disabled:text-neutral-400 outline-none shadow-2xs ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
              </option>
            ))}
          </select>
          <div className="absolute right-3 flex items-center pointer-events-none text-neutral-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
        {!error && hint && <span className="text-xs text-neutral-500">{hint}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
