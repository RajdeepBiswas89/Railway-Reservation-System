import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  number: string;
  label: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps?: Step[];
  onStepClick?: (stepIndex: number) => void;
}

const DEFAULT_STEPS: Step[] = [
  { number: '01', label: 'Journey' },
  { number: '02', label: 'Passenger' },
  { number: '03', label: 'Seat' },
  { number: '04', label: 'Review' },
  { number: '05', label: 'Payment' },
  { number: '06', label: 'Confirmed' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  steps = DEFAULT_STEPS,
  onStepClick,
}) => {
  return (
    <div className="w-full py-4 border-b border-neutral-200/80 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between gap-1 sm:gap-2">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isClickable = onStepClick && idx < currentStep;

              return (
                <li key={step.number} className="flex-1 min-w-0">
                  <div
                    onClick={() => isClickable && onStepClick(idx)}
                    className={`group flex flex-col items-center sm:items-start text-center sm:text-left transition-colors ${
                      isClickable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {/* Top Progress Line / Indicator */}
                    <div className="w-full flex items-center mb-2">
                      <div
                        className={`h-1 w-full rounded-full transition-colors ${
                          isCompleted
                            ? 'bg-[#121417]'
                            : isCurrent
                            ? 'bg-[#D92D20]'
                            : 'bg-neutral-200'
                        }`}
                      />
                    </div>

                    {/* Step Number & Label */}
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span
                        className={`text-[10px] font-mono font-bold shrink-0 ${
                          isCurrent
                            ? 'text-[#D92D20]'
                            : isCompleted
                            ? 'text-neutral-900'
                            : 'text-neutral-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3 h-3 text-[#121417] inline" />
                        ) : (
                          step.number
                        )}
                      </span>
                      <span
                        className={`text-xs font-semibold truncate ${
                          isCurrent
                            ? 'text-neutral-900 font-bold'
                            : isCompleted
                            ? 'text-neutral-700'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
