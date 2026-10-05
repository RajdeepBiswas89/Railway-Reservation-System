import React, { useState } from 'react';
import { Passenger, Seat, TrainClassCode } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Armchair, Check, AlertCircle, Info } from 'lucide-react';

interface SeatSelectionMapProps {
  classCode: TrainClassCode;
  passengers: Passenger[];
  selectedSeatIds: string[];
  onSeatToggle: (seatId: string, seatInfo: { number: number; coach: string; berth: any }) => void;
  onAutoAssign: () => void;
}

export const SeatSelectionMap: React.FC<SeatSelectionMapProps> = ({
  classCode,
  passengers,
  selectedSeatIds,
  onSeatToggle,
  onAutoAssign,
}) => {
  const [selectedCoach, setSelectedCoach] = useState('B2');

  const coachesForClass: Record<TrainClassCode, string[]> = {
    '1A': ['H1', 'H2'],
    '2A': ['A1', 'A2', 'A3'],
    '3A': ['B1', 'B2', 'B3', 'B4'],
    '3E': ['M1', 'M2'],
    'CC': ['C1', 'C2', 'C3', 'C4'],
    'EC': ['E1', 'E2'],
    'SL': ['S1', 'S2', 'S3', 'S4', 'S5'],
  };

  const availableCoaches = coachesForClass[classCode] || ['B1', 'B2'];

  // Generate 48 realistic seats for the coach
  const generateSeatsForCoach = (): Seat[] => {
    const seats: Seat[] = [];
    const total = 48;
    // Preset some occupied seats for realistic feeling
    const occupiedSeatNumbers = new Set([2, 5, 8, 9, 14, 15, 21, 22, 29, 30, 36, 41, 42]);
    const reservedNumbers = new Set([11, 23]);

    for (let i = 1; i <= total; i++) {
      let berthType: any = 'LOWER';
      const mod = i % 8;
      if (mod === 1 || mod === 4) berthType = 'LOWER';
      else if (mod === 2 || mod === 5) berthType = 'MIDDLE';
      else if (mod === 3 || mod === 6) berthType = 'UPPER';
      else if (mod === 7) berthType = 'SIDE_LOWER';
      else berthType = 'SIDE_UPPER';

      let status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' = 'AVAILABLE';
      if (occupiedSeatNumbers.has(i)) status = 'OCCUPIED';
      else if (reservedNumbers.has(i)) status = 'RESERVED';

      seats.push({
        id: `${selectedCoach}-${i}`,
        seatNumber: i,
        coachNumber: selectedCoach,
        classCode,
        berthType,
        status,
        price: 0,
      });
    }
    return seats;
  };

  const coachSeats = generateSeatsForCoach();

  // Group into compartments / bays (6 main seats + 2 side seats per compartment)
  const compartments = [];
  for (let c = 0; c < 6; c++) {
    const base = c * 8;
    compartments.push({
      bayNumber: c + 1,
      mainSeats: coachSeats.slice(base, base + 6),
      sideSeats: coachSeats.slice(base + 6, base + 8),
    });
  }

  const seatsNeeded = passengers.length;
  const seatsSelectedCount = selectedSeatIds.length;
  const isSelectionComplete = seatsSelectedCount === seatsNeeded;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header and Coach Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-bold text-neutral-900">
            Interactive Coach Seat Selector
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Select {seatsNeeded} {seatsNeeded === 1 ? 'seat' : 'seats'} for your party. Currently selected: {seatsSelectedCount} / {seatsNeeded}
          </p>
        </div>

        {/* Coach Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-600">Select Coach:</span>
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            {availableCoaches.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCoach(c)}
                className={`px-3 py-1 text-xs font-bold font-mono rounded-md transition-all ${
                  selectedCoach === c
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAutoAssign}
            className="text-xs"
          >
            Auto Assign
          </Button>
        </div>
      </div>

      {/* Seat Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-neutral-300 bg-white" />
            <span className="text-neutral-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
            <span className="text-neutral-900 font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-neutral-200 text-neutral-400 border border-neutral-300 flex items-center justify-center text-[9px] font-mono">
              ✕
            </div>
            <span className="text-neutral-400">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-100 text-amber-800 border border-amber-300" />
            <span className="text-amber-800">Reserved Quota</span>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 font-mono">
          Coach {selectedCoach} ({classCode}) · LHB Sleeper Config
        </div>
      </div>

      {/* Realistic Coach Layout Viewport */}
      <div className="relative border-2 border-neutral-300 rounded-2xl p-4 sm:p-6 bg-[#FAF9F6] overflow-x-auto">
        {/* Carriage Chassis Header */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-neutral-500 pb-4 mb-4 border-b border-dashed border-neutral-300 min-w-[620px]">
          <span>◄ ENTRY DOOR / VESTIBULE</span>
          <span className="bg-neutral-200/80 px-3 py-1 rounded text-neutral-800">
            COACH {selectedCoach}
          </span>
          <span>TOILET & EMERGENCY EXIT ►</span>
        </div>

        {/* Coach Bays */}
        <div className="space-y-4 min-w-[620px]">
          {compartments.map((comp) => (
            <div
              key={comp.bayNumber}
              className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center justify-between gap-4"
            >
              {/* Bay Tag */}
              <div className="w-12 shrink-0 text-center border-r border-neutral-200 pr-2">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">Bay</span>
                <span className="text-sm font-bold font-mono text-neutral-700">{comp.bayNumber}</span>
              </div>

              {/* Main 6 Berths Bay (3 facing 3) */}
              <div className="flex-1 grid grid-cols-6 gap-2">
                {comp.mainSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isOccupied = seat.status === 'OCCUPIED';
                  const isReserved = seat.status === 'RESERVED';

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isOccupied || isReserved}
                      onClick={() =>
                        onSeatToggle(seat.id, {
                          number: seat.seatNumber,
                          coach: selectedCoach,
                          berth: seat.berthType,
                        })
                      }
                      className={`h-14 rounded-lg flex flex-col items-center justify-center text-xs font-mono transition-all duration-150 relative ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-bold shadow-md scale-102 ring-2 ring-neutral-900'
                          : isOccupied
                          ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                          : isReserved
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span className="font-bold text-xs">{seat.seatNumber}</span>
                      <span className="text-[9px] uppercase tracking-tighter mt-0.5 opacity-80">
                        {seat.berthType === 'LOWER'
                          ? 'LB'
                          : seat.berthType === 'MIDDLE'
                          ? 'MB'
                          : 'UB'}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D92D20] text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* AISLE Divider */}
              <div className="w-8 flex flex-col items-center justify-center text-[9px] font-mono font-bold tracking-widest text-neutral-400 select-none py-1 border-x border-neutral-100">
                <span>A</span>
                <span>I</span>
                <span>S</span>
                <span>L</span>
                <span>E</span>
              </div>

              {/* Side Berths (2 Berths: Side Lower, Side Upper) */}
              <div className="w-36 grid grid-cols-2 gap-2">
                {comp.sideSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isOccupied = seat.status === 'OCCUPIED';
                  const isReserved = seat.status === 'RESERVED';

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isOccupied || isReserved}
                      onClick={() =>
                        onSeatToggle(seat.id, {
                          number: seat.seatNumber,
                          coach: selectedCoach,
                          berth: seat.berthType,
                        })
                      }
                      className={`h-14 rounded-lg flex flex-col items-center justify-center text-xs font-mono transition-all duration-150 relative ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-bold shadow-md scale-102 ring-2 ring-neutral-900'
                          : isOccupied
                          ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                          : isReserved
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span className="font-bold text-xs">{seat.seatNumber}</span>
                      <span className="text-[9px] uppercase tracking-tighter mt-0.5 opacity-80">
                        {seat.berthType === 'SIDE_LOWER' ? 'SL' : 'SU'}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D92D20] text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Seats Assignment Summary */}
      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-neutral-800 block">
            Seat Allocations:
          </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {passengers.map((p, idx) => {
              const seatId = selectedSeatIds[idx];
              return (
                <div
                  key={p.id}
                  className="px-2.5 py-1 bg-white rounded border border-neutral-200 text-xs font-mono flex items-center gap-1.5"
                >
                  <span className="font-sans font-semibold text-neutral-700">
                    {p.fullName || `Passenger ${idx + 1}`}:
                  </span>
                  {seatId ? (
                    <span className="font-bold text-[#D92D20]">{seatId}</span>
                  ) : (
                    <span className="text-neutral-400 italic">Not chosen</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!isSelectionComplete && (
          <div className="text-xs text-amber-700 flex items-center gap-1.5">
            <Info className="w-4 h-4 shrink-0" />
            <span>Select {seatsNeeded - seatsSelectedCount} more seat(s) or use Auto Assign</span>
          </div>
        )}
      </div>
    </div>
  );
};
