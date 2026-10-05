import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { bookingService } from '../services/bookingService';
import { DigitalTicketCard } from '../components/ticket/DigitalTicketCard';
import { Button } from '../components/common/Button';
import { ArrowLeft, Ticket } from 'lucide-react';

interface DigitalTicketPageProps {
  pnr: string;
  onNavigateBack: () => void;
}

export const DigitalTicketPage: React.FC<DigitalTicketPageProps> = ({ pnr, onNavigateBack }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getBookingByPnr(pnr).then((b) => {
      setBooking(b);
      setLoading(false);
    });
  }, [pnr]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-neutral-500 font-mono">Retrieving CRS reservation ticket...</div>;
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <Ticket className="w-10 h-10 text-neutral-400 mx-auto" />
        <h3 className="text-base font-bold text-neutral-900">PNR Record Not Found</h3>
        <p className="text-xs text-neutral-500">We could not retrieve an active reservation for PNR {pnr}.</p>
        <Button variant="primary" size="sm" onClick={onNavigateBack}>
          Return
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="no-print flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onNavigateBack}
        >
          Back
        </Button>
        <div className="text-xs text-neutral-500 font-mono">
          PNR: {booking.pnr} · Status: {booking.status}
        </div>
      </div>

      <DigitalTicketCard booking={booking} />
    </div>
  );
};
