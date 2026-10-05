import React from 'react';
import { FareBreakdown, Train, TrainClassCode } from '../../types';
import { ShieldCheck, Info } from 'lucide-react';

interface FareSummaryPanelProps {
  train: Train;
  classCode: TrainClassCode;
  journeyDate: string;
  passengerCount: number;
  selectedSeats?: string[];
  fareBreakdown: FareBreakdown;
}

export const FareSummaryPanel: React.FC<FareSummaryPanelProps> = ({
  train,
  classCode,
  journeyDate,
  passengerCount,
  selectedSeats = [],
  fareBreakdown,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-5 space-y-5 sticky top-20">
      {/* Journey Snapshot */}
      <div>
        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
          Journey Summary
        </span>
        <h4 className="text-sm font-bold text-neutral-900 mt-1">
          {train.number} {train.name}
        </h4>
        <div className="text-xs text-neutral-600 mt-0.5">
          {train.fromStation.code} → {train.toStation.code}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-1">
          <span>{journeyDate}</span>
          <span>·</span>
          <span>Dep: {train.departureTime}</span>
        </div>
      </div>

      {/* Class & Passengers Specs */}
      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-neutral-500">Travel Class:</span>
          <span className="font-bold text-neutral-900 font-mono">{classCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Passengers:</span>
          <span className="font-semibold text-neutral-900">{passengerCount}</span>
        </div>
        {selectedSeats.length > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-500">Seats:</span>
            <span className="font-bold font-mono text-[#D92D20]">
              {selectedSeats.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Itemized Fare Breakdown */}
      <div className="space-y-2.5 pt-2 border-t border-neutral-100 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>Base Ticket Fare ({passengerCount}x)</span>
          <span className="font-mono font-medium text-neutral-900">
            ₹{fareBreakdown.baseFare.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Reservation Fee</span>
          <span className="font-mono font-medium text-neutral-900">
            ₹{fareBreakdown.reservationFee.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Superfast Surcharge</span>
          <span className="font-mono font-medium text-neutral-900">
            ₹{fareBreakdown.superfastCharge.toLocaleString('en-IN')}
          </span>
        </div>
        {fareBreakdown.cateringCharge > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Onboard Catering Charge</span>
            <span className="font-mono font-medium text-neutral-900">
              ₹{fareBreakdown.cateringCharge.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        <div className="flex justify-between text-neutral-600">
          <span>Applicable GST (5%)</span>
          <span className="font-mono font-medium text-neutral-900">
            ₹{fareBreakdown.gst.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-neutral-500 text-[11px]">
          <span>Payment Gateway Fee</span>
          <span className="font-mono text-emerald-700 font-semibold">₹0 (Waived)</span>
        </div>
      </div>

      {/* TOTAL - Highly Visually Dominant */}
      <div className="p-4 bg-neutral-950 text-white rounded-xl shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            TOTAL AMOUNT DUE
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-white mt-0.5 block">
            ₹{fareBreakdown.total.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right text-[11px] text-neutral-400">
          <span>All taxes included</span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Official IRCTC/CRS authorized transparent fare calculation</span>
      </div>
    </div>
  );
};
