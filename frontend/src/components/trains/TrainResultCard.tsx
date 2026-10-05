import React, { useState } from 'react';
import { Train, TrainClassCode, TrainClassInfo } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Wifi,
  Coffee,
  Zap,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';

interface TrainResultCardProps {
  train: Train;
  selectedClass?: TrainClassCode;
  onSelectClass?: (classCode: TrainClassCode) => void;
  onBookNow: (train: Train, classCode: TrainClassCode) => void;
  onViewFullDetails: (train: Train) => void;
}

export const TrainResultCard: React.FC<TrainResultCardProps> = ({
  train,
  selectedClass,
  onSelectClass,
  onBookNow,
  onViewFullDetails,
}) => {
  const [activeClassCode, setActiveClassCode] = useState<TrainClassCode>(
    selectedClass || train.classes[0]?.code || '3A'
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const activeClass =
    train.classes.find((c) => c.code === activeClassCode) || train.classes[0];

  const handleClassClick = (code: TrainClassCode) => {
    setActiveClassCode(code);
    if (onSelectClass) onSelectClass(code);
  };

  const getStatusBadge = (status: TrainClassInfo['status'], seats: number) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <Badge variant="success" styleType="subtle" showDot>
            AVAILABLE {seats}
          </Badge>
        );
      case 'LIMITED':
        return (
          <Badge variant="warning" styleType="subtle" showDot>
            FEW SEATS ({seats})
          </Badge>
        );
      case 'WAITLIST':
        return (
          <Badge variant="danger" styleType="subtle" showDot>
            WL 14
          </Badge>
        );
      case 'NOT_AVAILABLE':
        return (
          <Badge variant="neutral" styleType="subtle" showDot>
            REGRET
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
            {train.number}
          </span>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">
            {train.name}
          </h3>
          <span className="text-xs font-medium text-neutral-500">
            {train.type}
          </span>
        </div>

        {/* Operating days */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
          <span>Runs:</span>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
            const operates = train.operatingDays.includes(day);
            return (
              <span
                key={day}
                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                  operates
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-300 bg-neutral-50'
                }`}
              >
                {day.charAt(0)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Schedule & Journey Timeline */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Schedule Column (8 cols) */}
          <div className="md:col-span-8 flex items-center justify-between gap-2 sm:gap-6">
            {/* Departure */}
            <div className="text-left min-w-0">
              <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-neutral-900">
                {train.departureTime}
              </div>
              <div className="text-xs font-bold text-neutral-700 mt-0.5 truncate">
                {train.fromStation.code}
              </div>
              <div className="text-[11px] text-neutral-500 truncate">
                {train.fromStation.city}
              </div>
            </div>

            {/* Travel Duration Indicator */}
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[11px] font-medium text-neutral-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                {train.duration}
              </span>
              <div className="w-full flex items-center">
                <div className="w-2 h-2 rounded-full border border-neutral-900 bg-white" />
                <div className="h-0.5 flex-1 bg-neutral-300 relative">
                  <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-neutral-400 transform rotate-45" />
                </div>
                <div className="w-2 h-2 rounded-full bg-neutral-900" />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1">
                {train.distanceKm} km
              </span>
            </div>

            {/* Arrival */}
            <div className="text-right min-w-0">
              <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-neutral-900">
                {train.arrivalTime}
              </div>
              <div className="text-xs font-bold text-neutral-700 mt-0.5 truncate">
                {train.toStation.code}
              </div>
              <div className="text-[11px] text-neutral-500 truncate">
                {train.toStation.city}
              </div>
            </div>
          </div>

          {/* Quick Actions (4 cols) */}
          <div className="md:col-span-4 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 md:pl-5">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Starting from
              </span>
              <span className="text-xl font-bold font-mono text-neutral-900">
                ₹{activeClass?.baseFare.toLocaleString('en-IN') || '---'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewFullDetails(train)}
              >
                Details
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onBookNow(train, activeClassCode)}
                disabled={activeClass?.status === 'NOT_AVAILABLE'}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>

        {/* Classes Selector Grid */}
        <div className="mt-5 pt-4 border-t border-neutral-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {train.classes.map((cls) => {
              const isSelected = cls.code === activeClassCode;
              return (
                <div
                  key={cls.code}
                  onClick={() => handleClassClick(cls.code)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-[#121417] bg-neutral-50/80 ring-1 ring-[#121417]'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-neutral-900 font-mono">
                      {cls.code}
                    </span>
                    <span className="font-bold text-xs font-mono text-neutral-900">
                      ₹{cls.baseFare}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate mb-1.5">
                    {cls.name}
                  </div>
                  <div>{getStatusBadge(cls.status, cls.seatsAvailable)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expandable Details Toggle */}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Instant Confirmation
            </span>
            <span className="inline-flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Free Cancellation Option
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Route & Policy' : 'View Route & Policy'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable In-Card Drawer */}
        {isExpanded && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200/70 text-xs animate-in fade-in duration-150 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] block mb-1">
                  Amenities Onboard
                </span>
                <div className="space-y-1 text-neutral-600">
                  {train.amenities.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] block mb-1">
                  Cancellation Guidelines
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-neutral-600 text-[11px]">
                  <li>Full refund up to 48 hours prior to departure.</li>
                  <li>Flat ₹60/clerkage deduction for confirmed tickets.</li>
                  <li>Instant refund to original payment source.</li>
                </ul>
              </div>

              <div>
                <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] block mb-1">
                  Coach Configuration
                </span>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  LHB rake with bio-vacuum toilets and enhanced safety couplers. Catering services available on payment.
                </p>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewFullDetails(train)}
                    className="w-full text-xs"
                  >
                    View Complete Stoppage Timeline →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
