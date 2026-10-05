import React, { useState, useEffect } from 'react';
import { pnrService, PnrDetailedStatus } from '../services/pnrService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Ticket,
  Search,
  CheckCircle2,
  AlertCircle,
  Train,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

interface PnrTrackerPageProps {
  initialPnr?: string;
  onViewTicket?: (pnr: string) => void;
}

export const PnrTrackerPage: React.FC<PnrTrackerPageProps> = ({
  initialPnr = '8A72K91',
  onViewTicket,
}) => {
  const { showToast } = useToast();
  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [details, setDetails] = useState<PnrDetailedStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await pnrService.checkPnrStatus(query);
    setDetails(res);
    setLoading(false);
    if (!res) {
      showToast(`No record found for PNR ${query}`, { type: 'error' });
    }
  };

  useEffect(() => {
    if (initialPnr) handleSearch(initialPnr);
  }, [initialPnr]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          PNR Reservation Status & Coach Position
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500">
          Check real-time chart preparation, berth confirmation probability, and platform coach positioning.
        </p>
      </div>

      {/* PNR Search Box */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Ticket className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
              placeholder="Enter 7-character PNR (e.g. 8A72K91)..."
              maxLength={10}
              className="w-full bg-neutral-50 text-sm font-mono font-bold tracking-wider rounded-xl border border-neutral-200 pl-10 pr-4 py-3 outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            isLoading={loading}
            onClick={() => handleSearch(pnrInput)}
            className="w-full sm:w-auto px-8"
          >
            Check Status
          </Button>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
          <span className="font-semibold">Quick test PNRs:</span>
          {['8A72K91', '4K91P82', '9Z38X77'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setPnrInput(sample);
                handleSearch(sample);
              }}
              className="font-mono font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {details && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Status Header Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-bold">
                  RESERVATION RECORD
                </span>
                <span className="text-2xl font-black font-mono text-neutral-900">
                  PNR {details.pnr}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="success" styleType="subtle" showDot>
                  {details.chartStatus.replace('_', ' ')}
                </Badge>
                {details.confirmationProbability && (
                  <Badge variant="info" styleType="subtle" showDot>
                    {details.confirmationProbability}% Confirmation Probability
                  </Badge>
                )}
              </div>
            </div>

            {/* Train Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Train Name & Number</span>
                <span className="font-bold text-neutral-900 text-sm font-sans">
                  {details.trainNumber} {details.trainName}
                </span>
                <span className="text-neutral-500 block">Class: {details.classCode}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Journey Route</span>
                <span className="font-bold text-neutral-900 text-sm font-sans">
                  {details.fromStation}
                </span>
                <span className="text-neutral-500 block">to {details.toStation}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Date of Travel</span>
                <span className="font-bold text-neutral-900 text-sm">{details.journeyDate}</span>
                <span className="text-emerald-700 font-semibold block">Confirmed Berth Allocated</span>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Passenger Current Status
              </h3>
              <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-neutral-100 font-sans text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Booking Status</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3">Coach</th>
                      <th className="p-3 text-right">Berth / Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {details.passengers.map((p) => (
                      <tr key={p.number} className="hover:bg-neutral-50/70">
                        <td className="p-3 font-bold text-neutral-400">P{p.number}</td>
                        <td className="p-3 text-neutral-600">{p.bookingStatus}</td>
                        <td className="p-3 font-bold text-emerald-700">{p.currentStatus}</td>
                        <td className="p-3 font-bold text-[#D92D20]">{p.coach}</td>
                        <td className="p-3 text-right font-bold text-neutral-900">
                          Seat {p.berth} ({p.berthType})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Rake Coach Layout Position from Engine */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Platform Coach Position From Locomotive Engine
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Your Coach: <strong className="text-[#D92D20]">{details.targetCoach}</strong>
                </span>
              </div>

              {/* Coach sequence track */}
              <div className="p-3 bg-neutral-950 text-white rounded-xl overflow-x-auto flex items-center gap-1.5 font-mono text-[11px]">
                {details.coachPositionFromEngine.map((c) => {
                  const isTarget = c === details.targetCoach;
                  const isLoco = c === 'LOCO';
                  return (
                    <div
                      key={c}
                      className={`h-9 px-2.5 rounded flex items-center justify-center font-bold shrink-0 transition-all ${
                        isLoco
                          ? 'bg-neutral-800 text-amber-400 border border-amber-400/30'
                          : isTarget
                          ? 'bg-[#D92D20] text-white ring-2 ring-white scale-105 shadow-md'
                          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            {onViewTicket && (
              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onViewTicket(details.pnr)}
                >
                  Open Full Digital Boarding Ticket
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
