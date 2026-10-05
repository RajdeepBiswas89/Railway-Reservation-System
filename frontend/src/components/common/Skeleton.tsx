import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-200/80 rounded ${className}`}
    />
  );
};

export const TrainCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-48 h-6" />
        </div>
        <Skeleton className="w-20 h-6" />
      </div>
      <div className="flex items-center justify-between py-2 border-y border-neutral-100">
        <Skeleton className="w-28 h-10" />
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-28 h-10" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  );
};
