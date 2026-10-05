import React from 'react';
import { Booking } from '../../types';
import { Logo } from '../common/Logo';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Calendar,
  Train,
  ShieldCheck,
} from 'lucide-react';

interface DigitalTicketCardProps {
  booking: Booking;
  onPrint?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export const DigitalTicketCard: React.FC<DigitalTicketCardProps> = ({
  booking,
  onPrint,
  onDownload,
  showActions = true,
}) => {
  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  const handleDownload = () => {
    if (onDownload) onDownload();
    else window.print();
  };

  const mainPassenger = booking.passengers[0];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Top action buttons */}
      {showActions && (
        <div className="no-print flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Valid Digital Electronic Reservation Slip (ERS)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Ticket
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Presentation-Grade Ticket Surface */}
      <div className="print-ticket-container bg-white rounded-2xl border-2 border-neutral-900 shadow-xl overflow-hidden relative font-sans text-neutral-900">
        {/* Ticket Header Banner */}
        <div className="bg-[#121417] text-white p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4 border-b-2 border-neutral-900">
          <div className="space-y-1">
            <Logo variant="light" size="md" showTagline />
            <p className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase pt-1">
              Official Electronic Reservation Slip · National Rail Network
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              RESERVATION CODE / PNR
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
              {booking.pnr}
            </span>
            <div className="mt-1 flex justify-end">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3" />
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Train & Journey Key Block */}
        <div className="p-6 sm:p-7 bg-[#FCFCFB] border-b border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Origin */}
            <div className="md:col-span-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Origin Station
              </span>
              <div className="text-2xl font-black font-mono text-neutral-900 mt-0.5">
                {booking.departureTime}
              </div>
              <div className="text-sm font-bold text-neutral-800">
                {booking.fromStation.name}
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                Code: {booking.fromStation.code} {booking.platform ? `· Platform ${booking.platform}` : ''}
              </div>
            </div>

            {/* Travel Line */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs font-bold text-neutral-700 mb-1">
                {booking.train.number} {booking.train.name}
              </span>
              <div className="w-full flex items-center my-1">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-neutral-900 bg-white" />
                <div className="h-0.5 flex-1 bg-neutral-900 border-t border-dashed border-neutral-400" />
                <Train className="w-4 h-4 text-neutral-900 mx-1 shrink-0" />
                <div className="h-0.5 flex-1 bg-neutral-900 border-t border-dashed border-neutral-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                {booking.duration} · Class {booking.classCode}
              </span>
            </div>

            {/* Destination */}
            <div className="md:col-span-4 text-left md:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Destination Station
              </span>
              <div className="text-2xl font-black font-mono text-neutral-900 mt-0.5">
                {booking.arrivalTime}
              </div>
              <div className="text-sm font-bold text-neutral-800">
                {booking.toStation.name}
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                Code: {booking.toStation.code}
              </div>
            </div>
          </div>
        </div>

        {/* Perforated Edge Separation */}
        <div className="relative flex items-center justify-between px-2 bg-neutral-100 py-1 border-y border-dashed border-neutral-300">
          <div className="w-4 h-6 bg-[#FBFBFA] rounded-r-full -ml-3 border-r border-neutral-300" />
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase select-none">
            FOLD OR DETACH AT BOARDING GATE
          </span>
          <div className="w-4 h-6 bg-[#FBFBFA] rounded-l-full -mr-3 border-l border-neutral-300" />
        </div>

        {/* Passenger Manifest & Coach Allocation */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Date of Journey
              </span>
              <span className="text-sm font-bold font-mono text-neutral-900 mt-0.5 block">
                {booking.journeyDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Coach
              </span>
              <span className="text-xl font-black font-mono text-[#D92D20] mt-0.5 block">
                {booking.coachNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Seat / Berth
              </span>
              <span className="text-xl font-black font-mono text-[#D92D20] mt-0.5 block">
                {mainPassenger.allocatedSeat || 'B4'} ({mainPassenger.allocatedBerth || 'LOWER'})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                Total Fare Paid
              </span>
              <span className="text-lg font-extrabold font-mono text-neutral-900 mt-0.5 block">
                ₹{booking.fareBreakdown.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Passenger Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
              Passenger Manifest (1 Adult)
            </h4>
            <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-100 text-neutral-600 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Passenger Name</th>
                    <th className="p-2.5">Age / Sex</th>
                    <th className="p-2.5">ID Verification</th>
                    <th className="p-2.5">Booking Status</th>
                    <th className="p-2.5 font-bold text-right">Coach / Berth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {booking.passengers.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-mono text-neutral-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-neutral-900">{p.fullName}</td>
                      <td className="p-2.5 text-neutral-700 font-mono">
                        {p.age} / {p.gender === 'MALE' ? 'M' : p.gender === 'FEMALE' ? 'F' : 'O'}
                      </td>
                      <td className="p-2.5 font-mono text-neutral-600">
                        {p.idType}: {p.idNumber}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">CONFIRMED</td>
                      <td className="p-2.5 font-mono font-bold text-right text-neutral-900">
                        {booking.coachNumber} - {p.allocatedSeat || 'B4'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* QR Code, Security Barcode, Terms */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-neutral-200 items-center">
            {/* SVG Authentic QR Code Placeholder */}
            <div className="md:col-span-3 flex flex-col items-center text-center p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 text-neutral-900"
                fill="currentColor"
              >
                {/* Simulated high-fidelity 2D railway barcode matrix */}
                <rect x="0" y="0" width="30" height="30" rx="3" fill="#121417" />
                <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
                <rect x="9" y="9" width="12" height="12" fill="#121417" />

                <rect x="70" y="0" width="30" height="30" rx="3" fill="#121417" />
                <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
                <rect x="79" y="9" width="12" height="12" fill="#121417" />

                <rect x="0" y="70" width="30" height="30" rx="3" fill="#121417" />
                <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
                <rect x="9" y="79" width="12" height="12" fill="#121417" />

                {/* Internal data modules */}
                <rect x="40" y="5" width="8" height="8" fill="#121417" />
                <rect x="52" y="10" width="8" height="8" fill="#121417" />
                <rect x="40" y="25" width="8" height="8" fill="#121417" />
                <rect x="52" y="35" width="16" height="8" fill="#121417" />
                <rect x="35" y="50" width="8" height="18" fill="#121417" />
                <rect x="48" y="55" width="12" height="8" fill="#121417" />
                <rect x="65" y="45" width="8" height="15" fill="#121417" />
                <rect x="80" y="40" width="14" height="8" fill="#121417" />
                <rect x="75" y="65" width="8" height="16" fill="#121417" />
                <rect x="40" y="80" width="16" height="8" fill="#121417" />
                <rect x="60" y="80" width="8" height="12" fill="#121417" />
                <rect x="85" y="85" width="10" height="10" fill="#121417" />
              </svg>
              <span className="text-[9px] font-mono text-neutral-400 mt-1 uppercase">
                Scan for TTE Verification
              </span>
            </div>

            {/* Travel Rules & ID Warning */}
            <div className="md:col-span-9 text-xs text-neutral-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mandatory Travel Instructions:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-500 leading-relaxed">
                <li>Passenger must carry original Government Photo ID (Aadhaar / Voter ID / Passport) during journey.</li>
                <li>Digital ticket on phone/tablet is valid. Printing paper slip is optional.</li>
                <li>Free cancellation available up to 48 hours before scheduled departure via Railnex portal.</li>
                <li>Boarding without a confirmed reservation attracts standard penalty under Section 138 of the Railways Act.</li>
              </ul>
              <div className="pt-2 flex items-center justify-between text-[10px] text-neutral-400 font-mono border-t border-neutral-100">
                <span>TXN: {booking.payment.transactionId}</span>
                <span>BOOKED: {booking.bookingDate}</span>
                <span>HASH: SHA256-8A72-9104-NX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
