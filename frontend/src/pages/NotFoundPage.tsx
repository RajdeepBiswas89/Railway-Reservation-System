import React from 'react';
import { Button } from '../components/common/Button';
import { Train, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  code?: '404' | '403' | '500';
  onReturnHome: () => void;
}

export const NotFoundPage: React.FC<ErrorPageProps> = ({ code = '404', onReturnHome }) => {
  const titles = {
    '404': "Looks like this track doesn't exist.",
    '403': 'Restricted Railway Clearance (403)',
    '500': 'CRS Junction Signal Interruption (500)',
  };

  const descriptions = {
    '404': 'The route or station identifier you requested has been moved, rescheduled, or decommissioned.',
    '403': 'Administrative privileges are required to access this railway control node.',
    '500': 'An internal signaling error occurred while communicating with the central dispatch engine.',
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-800 mb-2">
        <Train className="w-8 h-8" />
      </div>

      <span className="font-mono text-xs font-bold text-[#D92D20] bg-rose-50 px-2 py-0.5 rounded">
        ERROR {code}
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
        {titles[code]}
      </h1>

      <p className="text-xs sm:text-sm text-neutral-500 max-w-md leading-relaxed">
        {descriptions[code]}
      </p>

      <div className="pt-4">
        <Button
          variant="primary"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onReturnHome}
        >
          Return to Safe Route (Home)
        </Button>
      </div>
    </div>
  );
};
