import React, { useState, useEffect } from 'react';
import { liveStatusService, LiveTrainStatus } from '../services/liveStatusService';
import { TRAINS } from '../data/mockData';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Train,
  Clock,
  MapPin,
  Gauge,
  Navigation,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

export const LiveStatusTrackerPage: React.FC = () => {
  const [selectedTrainNumber, setSelectedTrainNumber] = useState('12649');
  const [status, setStatus] = useState<LiveTrainStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = (num: string) => {
    setLoading(true);
    liveStatusService.getLiveStatus(num).then((res) => {
      setStatus(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchStatus(selectedTrainNumber);
  }, [selectedTrainNumber]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Live Train Running Status (GPS Telemetry)
            </h1>
            <Badge variant="success" styleType="subtle" showDot>
              LIVE GPS
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Track real-time train location, current speed, delay minutes, and upcoming platform arrivals.
          </p>
        </div>

        {/* Quick Train Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTrainNumber}
            onChange={(e) => setSelectedTrainNumber(e.target.value)}
            className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold text-neutral-900 shadow-2xs outline-none"
          >
            {TRAINS.slice(0, 8).map((t) => (
              <option key={t.number} value={t.number}>
                {t.number} - {t.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(selectedTrainNumber)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading || !status ? (
        <div className="p-12 text-center text-xs text-neutral-500 font-mono">
          Acquiring satellite locomotive beacon telemetry...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Telemetry Banner Card */}
          <div className="bg-[#121417] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-neutral-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="font-mono text-xs font-bold text-neutral-400">
                  {status.trainNumber} · SUPERFAST EXPRESS
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {status.trainName}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                  RUNNING ON-TIME (+{status.delayMinutes} MINS)
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {status.lastUpdated}
                </span>
              </div>
            </div>

            {/* Instrument Cockpit Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <div className="pt-2 sm:pt-0">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Current Speed
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 block">
                  {status.currentSpeedKmH} <span className="text-xs text-neutral-400 font-normal">km/h</span>
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Current Station
                </span>
                <span className="text-base font-bold text-white mt-1 block truncate">
                  {status.currentStation}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Next Stoppage
                </span>
                <span className="text-base font-bold text-[#D92D20] mt-1 block truncate">
                  {status.nextStation}
                </span>
              </div>

              <div className="pt-2 sm:pt-0 sm:pl-4">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Distance Completed
                </span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {status.distanceCoveredKm} / {status.totalDistanceKm} km
                </span>
              </div>
            </div>

            {/* Visual Route Progress Track */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <span>Origin (HWH)</span>
                <span>{Math.round((status.distanceCoveredKm / status.totalDistanceKm) * 100)}% Journey Completed</span>
                <span>Terminus (SBC)</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  style={{ width: `${(status.distanceCoveredKm / status.totalDistanceKm) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Stoppage Timeline Table with Status Indicators */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                Intermediate Stoppage Timeline & Platform Allocations
              </span>
              <span className="text-neutral-500 font-mono">6 Stops Total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
                  <tr>
                    <th className="p-3.5">Station</th>
                    <th className="p-3.5">Scheduled Arr/Dep</th>
                    <th className="p-3.5">Actual / Expected</th>
                    <th className="p-3.5">Platform</th>
                    <th className="p-3.5">Delay</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {status.halts.map((h) => {
                    const isPassed = h.status === 'PASSED';
                    const isCurrent = h.status === 'CURRENT';

                    return (
                      <tr
                        key={h.stationCode}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-amber-50/70 font-semibold'
                            : isPassed
                            ? 'bg-neutral-50/40 text-neutral-500'
                            : 'hover:bg-neutral-50/80'
                        }`}
                      >
                        <td className="p-3.5 font-sans font-bold text-neutral-900">
                          <span className="font-mono text-neutral-500 mr-2 bg-neutral-200/60 px-1 rounded">
                            {h.stationCode}
                          </span>
                          {h.stationName}
                        </td>
                        <td className="p-3.5 text-neutral-600">
                          {h.scheduledArrival} / {h.scheduledDeparture}
                        </td>
                        <td className="p-3.5 font-bold text-neutral-900">
                          {h.actualArrival} / {h.actualDeparture}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-neutral-900 text-white font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                            PF {h.platform}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {h.delayMinutes === 0 ? (
                            <span className="text-emerald-700 font-semibold">Right Time</span>
                          ) : (
                            <span className="text-amber-800 font-semibold">+{h.delayMinutes}m</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-sans">
                          <Badge
                            variant={
                              isPassed ? 'neutral' : isCurrent ? 'warning' : 'info'
                            }
                            styleType="subtle"
                            showDot
                          >
                            {isPassed ? 'DEPARTED' : isCurrent ? 'AT STATION' : 'UPCOMING'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
