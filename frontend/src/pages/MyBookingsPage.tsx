import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../types';
import { bookingService } from '../services/bookingService';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import {
  Ticket,
  ArrowRight,
  Clock,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Train,
} from 'lucide-react';

interface MyBookingsPageProps {
  userId: string;
  onViewTicket: (pnr: string) => void;
  onBookNew: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  userId,
  onViewTicket,
  onBookNew,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPnr, setSearchPnr] = useState('');

  // Cancellation modal state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    const data = await bookingService.getBookings(userId);
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const handleCancelConfirm = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(cancelModalBooking.pnr);
      showToast(`Booking ${cancelModalBooking.pnr} has been cancelled. Refund initiated.`);
      setCancelModalBooking(null);
      fetchBookings();
    } catch (e) {
      showToast('Failed to cancel booking', { type: 'error' });
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings by tab and search
  const filteredBookings = bookings.filter((b) => {
    const matchesTab =
      activeTab === 'UPCOMING'
        ? b.status === 'CONFIRMED'
        : activeTab === 'COMPLETED'
        ? b.status === 'COMPLETED'
        : b.status === 'CANCELLED';

    const matchesSearch =
      !searchPnr ||
      b.pnr.toLowerCase().includes(searchPnr.toLowerCase()) ||
      b.train.name.toLowerCase().includes(searchPnr.toLowerCase()) ||
      b.fromStation.name.toLowerCase().includes(searchPnr.toLowerCase()) ||
      b.toStation.name.toLowerCase().includes(searchPnr.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            My Booking History
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Review your confirmed, completed, and cancelled railway reservations.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onBookNew}>
          + Book New Journey
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-neutral-200">
        {/* Segmented Filter Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
          {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
            const count = bookings.filter((b) =>
              tab === 'UPCOMING'
                ? b.status === 'CONFIRMED'
                : tab === 'COMPLETED'
                ? b.status === 'COMPLETED'
                : b.status === 'CANCELLED'
            ).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* PNR Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchPnr}
            onChange={(e) => setSearchPnr(e.target.value)}
            placeholder="Search PNR or train..."
            className="w-full bg-neutral-50 text-xs rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-6 h-6 text-neutral-400" />}
          title={`No ${activeTab.toLowerCase()} bookings found`}
          description={
            searchPnr
              ? 'No reservations matched your PNR search query.'
              : `You have no ${activeTab.toLowerCase()} journeys at this time.`
          }
          actionText={activeTab === 'UPCOMING' ? 'Search Trains & Book' : undefined}
          onAction={onBookNew}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs p-5 hover:border-neutral-400 transition-all space-y-4"
            >
              {/* Card Top Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                    PNR: {b.pnr}
                  </span>
                  <span className="font-bold text-sm text-neutral-900">
                    {b.train.number} {b.train.name}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    Class {b.classCode}
                  </span>
                </div>

                <div>
                  <Badge
                    variant={
                      b.status === 'CONFIRMED'
                        ? 'success'
                        : b.status === 'COMPLETED'
                        ? 'info'
                        : 'danger'
                    }
                    styleType="subtle"
                    showDot
                  >
                    {b.status}
                  </Badge>
                </div>
              </div>

              {/* Journey Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 flex items-center justify-between gap-4">
                  {/* Origin */}
                  <div>
                    <span className="text-xl font-bold font-mono text-neutral-900">
                      {b.departureTime}
                    </span>
                    <p className="text-xs font-bold text-neutral-800">{b.fromStation.code}</p>
                    <p className="text-[11px] text-neutral-500">{b.fromStation.city}</p>
                  </div>

                  {/* Midline */}
                  <div className="flex-1 flex flex-col items-center px-4">
                    <span className="text-[11px] font-mono text-neutral-500 mb-1">
                      {b.duration}
                    </span>
                    <div className="w-full flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                      <div className="h-0.5 flex-1 bg-neutral-300" />
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 font-mono">
                      {b.journeyDate}
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-neutral-900">
                      {b.arrivalTime}
                    </span>
                    <p className="text-xs font-bold text-neutral-800">{b.toStation.code}</p>
                    <p className="text-[11px] text-neutral-500">{b.toStation.city}</p>
                  </div>
                </div>

                {/* Right Specs & Actions */}
                <div className="md:col-span-4 flex flex-col items-start md:items-end justify-between pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 md:pl-5 gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block md:text-right">
                      Seat Assignment
                    </span>
                    <span className="text-sm font-bold font-mono text-neutral-900">
                      Coach {b.coachNumber} · Seat {b.passengers[0]?.allocatedSeat || 'B4'}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 block md:text-right">
                      Fare: ₹{b.fareBreakdown.total}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Ticket className="w-3.5 h-3.5" />}
                      onClick={() => onViewTicket(b.pnr)}
                    >
                      View Ticket
                    </Button>

                    {b.status === 'CONFIRMED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelModalBooking(b)}
                        className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Cancellation */}
      {cancelModalBooking && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setCancelModalBooking(null)}
          onConfirm={handleCancelConfirm}
          title="Cancel Railway Reservation?"
          message={`Are you sure you wish to cancel ticket ${cancelModalBooking.pnr} (${cancelModalBooking.train.name})? Under IRCTC regulations, a clerkage deduction of ₹60 per passenger applies. An estimated refund of ₹${cancelModalBooking.fareBreakdown.total - 60} will be credited to original payment source.`}
          confirmText="Yes, Cancel Reservation"
          cancelText="Keep Ticket"
          variant="danger"
          isLoading={isCancelling}
        />
      )}
    </div>
  );
};
