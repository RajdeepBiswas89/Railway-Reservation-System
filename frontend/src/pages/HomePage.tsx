import React from 'react';
import { SearchParams, Train } from '../types';
import { MainTrainSearch } from '../components/search/MainTrainSearch';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  ShieldCheck,
  Zap,
  Tag,
  Smartphone,
  ArrowRight,
  Clock,
  Train as TrainIcon,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface HomePageProps {
  onSearch: (params: SearchParams) => void;
  onSelectTrain: (trainId: string) => void;
  onBookTrain: (train: Train, classCode: any) => void;
  onNavigate: (path: string) => void;
  popularTrains: Train[];
  initialSearchParams: SearchParams;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  onSelectTrain,
  onBookTrain,
  onNavigate,
  popularTrains,
  initialSearchParams,
}) => {
  const popularJourneys = popularTrains.slice(0, 5).map((train) => ({
    fromCode: train.fromStation.code,
    fromName: train.fromStation.city,
    toCode: train.toStation.code,
    toName: train.toStation.city,
    duration: train.duration,
    startingFare: Math.min(...train.classes.map((entry) => entry.baseFare)),
    trainsCount: 1,
    tag: 'Scheduled Train',
  }));

  const handlePopularJourneyClick = (from: string, to: string) => {
    onSearch({
      fromStation: from,
      toStation: to,
      journeyDate: '2026-10-20',
      passengersCount: 1,
      classCode: 'ALL',
    });
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* Cinematic Hero Section */}
      <section className="relative pt-8 pb-16 sm:pb-24 lg:pt-16 bg-radial from-neutral-900 to-[#121417] text-white overflow-hidden">
        {/* Architectural Railway Background */}
        <div className="absolute inset-0 opacity-40 mix-blend-luminosity pointer-events-none overflow-hidden">
          <img
            src="/src/assets/images/hero_railway_express_1791177648474.jpg"
            alt="Railnex High-Speed Railway"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121417] via-[#121417]/70 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="max-w-3xl mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-neutral-300 border border-white/10 text-xs font-medium mb-4 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D92D20]" />
              <span>Next-Generation Railway Technology</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] text-balance">
              Your Journey. Reimagined.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-neutral-300 max-w-2xl font-normal leading-relaxed">
              Discover trains, compare journeys, reserve your seat in real time, and travel with unwavering confidence across the national network.
            </p>
          </div>

          {/* Primary Interactive Search Module */}
          <div className="relative z-10">
            <MainTrainSearch initialValues={initialSearchParams} onSearch={onSearch} />
          </div>
        </div>
      </section>

      {/* POPULAR JOURNEYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
              Direct Corridors
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
              Popular Journeys
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/search')}
            className="text-xs font-bold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all scheduled routes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {popularJourneys.map((j) => (
            <div
              key={`${j.fromCode}-${j.toCode}`}
              onClick={() => handlePopularJourneyClick(j.fromCode, j.toCode)}
              className="group p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-neutral-900 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-2">
                  <span>{j.tag}</span>
                  <span className="text-neutral-400">{j.trainsCount} daily</span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#D92D20] transition-colors flex items-center gap-1.5">
                  <span>{j.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  <span>{j.toName}</span>
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-2 font-mono">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{j.duration}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">
                    From
                  </span>
                  <span className="text-sm font-bold font-mono text-neutral-900">
                    ₹{j.startingFare}
                  </span>
                </div>
                <span className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-900">
                  View trains →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR TRAINS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
              Flagship Fleet
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
              Popular Express Trains
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/search')}
            className="text-xs font-bold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View entire fleet schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularTrains.map((train) => {
            const minFare = Math.min(...train.classes.map((c) => c.baseFare));
            return (
              <div
                key={train.id}
                className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {train.number}
                    </span>
                    <Badge variant="neutral" styleType="subtle" showDot={false}>
                      {train.type}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                    {train.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1">
                    <span>{train.fromStation.name}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                    <span>{train.toStation.name}</span>
                  </div>

                  {/* Timings */}
                  <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase">
                        Departs
                      </span>
                      <span className="font-bold text-neutral-900">
                        {train.departureTime}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        {train.fromStation.code}
                      </span>
                    </div>

                    <div className="text-center px-2">
                      <span className="text-[10px] text-neutral-400 block">
                        {train.duration}
                      </span>
                      <div className="w-12 h-0.5 bg-neutral-300 mx-auto my-1" />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block uppercase">
                        Arrives
                      </span>
                      <span className="font-bold text-neutral-900">
                        {train.arrivalTime}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        {train.toStation.code}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">
                      Starting Fare
                    </span>
                    <span className="text-base font-bold font-mono text-neutral-900">
                      ₹{minFare}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectTrain(train.id)}
                    >
                      View Train
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onBookTrain(train, train.classes[0]?.code)}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY RAILNEX - 4 ELEGANT FEATURE BLOCKS */}
      <section className="bg-neutral-100/70 py-16 border-y border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
              Built For Modern Commuters
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mt-1">
              Why Travelers Choose Railnex
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
              Engineered with transactional discipline, transparent fares, and instant ticket fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Secure Booking</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Bank-grade tokenized payments, encrypted transactions, and official railway CRS integration.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Real-time Availability</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sub-second synchronization across all 5,000+ national network stations without stale cached states.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
                <Tag className="w-5 h-5 text-sky-700" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Transparent Pricing</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Zero hidden booking surcharges. Complete visibility into base fare, IRCTC reservation fee, and GST.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#D92D20]" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Digital Tickets</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Instant SMS and digital QR pass. Seamless contactless gate boarding and onboard TTE verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-[#121417] text-white rounded-2xl shadow-xl border border-neutral-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-800">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white">
                10M+
              </div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                Completed Journeys
              </div>
            </div>

            <div className="pt-4 md:pt-0 md:pl-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white">
                5,000+
              </div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                Connected Stations
              </div>
            </div>

            <div className="pt-4 md:pt-0 md:pl-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white">
                2,000+
              </div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                Active Routes
              </div>
            </div>

            <div className="pt-4 md:pt-0 md:pl-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-emerald-400">
                99.9%
              </div>
              <div className="text-xs sm:text-sm text-neutral-400 font-medium mt-1">
                Booking Reliability
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center">
            <span className="text-[11px] font-mono text-neutral-500">
              Prototype metrics verified for DBMS presentation sandbox
            </span>
          </div>
        </div>
      </section>

      {/* SAMPLE TICKET PREVIEW CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="accent" styleType="subtle" showDot>
              Featured Presentation Screen
            </Badge>
            <h3 className="text-lg font-bold text-neutral-900 mt-1">
              Examine the Official Railnex Digital Ticket
            </h3>
            <p className="text-xs text-neutral-600 max-w-xl">
              Inspect sample confirmed PNR 8A72K91 for Howrah Junction to KSR Bengaluru aboard 12649 Karnataka Express with complete QR code and coach seat allocation.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('/ticket/8A72K91')}
            className="shrink-0"
          >
            Open Sample Ticket (PNR 8A72K91)
          </Button>
        </div>
      </section>
    </div>
  );
};
