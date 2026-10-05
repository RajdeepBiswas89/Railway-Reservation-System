import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../types';
import { bookingService } from '../../services/bookingService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/Toast';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

export const AdminBookingManagementView: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [inspectBooking, setInspectBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    const list = await bookingService.getBookings();
    setBookings(list);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (pnr: string, status: BookingStatus) => {
    try {
      await bookingService.updateBookingStatus(pnr, status);
      showToast(`Updated PNR ${pnr} status to ${status}`);
      fetchBookings();
      if (inspectBooking && inspectBooking.pnr === pnr) {
        setInspectBooking((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (e) {
      showToast('Error updating booking status', { type: 'error' });
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    try {
      await bookingService.cancelBooking(cancelTarget.pnr);
      showToast(`Cancelled reservation ${cancelTarget.pnr}. Refund scheduled.`);
      setCancelTarget(null);
      fetchBookings();
    } catch (e) {
      showToast('Failed to cancel', { type: 'error' });
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.train.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.train.number.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Passenger Reservations Audit
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit master PNR ledger, passenger allocations, payment records, and cancellations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={() => showToast('Exporting booking manifest to CSV...')}
        >
          Export CSV Ledger
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search PNR, passenger, or train #..."
              className="w-full bg-neutral-50 text-xs rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 text-xs outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div className="text-neutral-500 font-mono">
          Showing {paginated.length} of {filtered.length} bookings
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
              <tr>
                <th className="p-3.5">PNR #</th>
                <th className="p-3.5">Passenger</th>
                <th className="p-3.5">Train</th>
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Class / Coach</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Booking Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {paginated.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50/70">
                  <td className="p-3.5 font-bold text-neutral-900">{b.pnr}</td>
                  <td className="p-3.5 font-sans font-semibold text-neutral-900">{b.userName}</td>
                  <td className="p-3.5 text-neutral-700">
                    {b.train.number} {b.train.name}
                  </td>
                  <td className="p-3.5 text-neutral-600">
                    {b.fromStation.code} → {b.toStation.code}
                  </td>
                  <td className="p-3.5 text-neutral-800">
                    {b.classCode} ({b.coachNumber}-{b.passengers[0]?.allocatedSeat || 'B4'})
                  </td>
                  <td className="p-3.5 font-bold text-neutral-900">
                    ₹{b.fareBreakdown.total.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-neutral-500">{b.bookingDate}</td>
                  <td className="p-3.5 font-sans">
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
                  </td>
                  <td className="p-3.5 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectBooking(b)}
                        className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                        title="Inspect record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => setCancelTarget(b)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Cancel ticket"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Inspector Modal */}
      {inspectBooking && (
        <Modal
          isOpen={true}
          onClose={() => setInspectBooking(null)}
          title={`Booking Details: PNR ${inspectBooking.pnr}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Train</span>
                <span className="font-bold text-neutral-900 font-sans text-sm">
                  {inspectBooking.train.number} {inspectBooking.train.name}
                </span>
                <span className="text-neutral-500 block font-mono">
                  {inspectBooking.fromStation.name} → {inspectBooking.toStation.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Status</span>
                <Badge
                  variant={
                    inspectBooking.status === 'CONFIRMED'
                      ? 'success'
                      : inspectBooking.status === 'COMPLETED'
                      ? 'info'
                      : 'danger'
                  }
                  styleType="subtle"
                  showDot
                >
                  {inspectBooking.status}
                </Badge>
                <span className="text-neutral-500 block font-mono mt-1">
                  Booked: {inspectBooking.bookingDate}
                </span>
              </div>
            </div>

            {/* Passenger breakdown */}
            <div>
              <span className="font-bold text-neutral-700 uppercase tracking-wider text-[10px] block mb-1">
                Passenger Manifest
              </span>
              <div className="border border-neutral-200 rounded-lg p-3 space-y-1.5 font-mono">
                {inspectBooking.passengers.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span className="font-sans font-bold text-neutral-800">{p.fullName}</span>
                    <span className="text-neutral-500">{p.age}y / {p.gender}</span>
                    <span className="text-neutral-600">{p.idType}: {p.idNumber}</span>
                    <span className="font-bold text-[#D92D20]">
                      {inspectBooking.coachNumber}-{p.allocatedSeat || 'B4'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fare Breakdown */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Base Fare:</span>
                <span>₹{inspectBooking.fareBreakdown.baseFare}</span>
              </div>
              <div className="flex justify-between">
                <span>Reservation Fee:</span>
                <span>₹{inspectBooking.fareBreakdown.reservationFee}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{inspectBooking.fareBreakdown.gst}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-neutral-200">
                <span>Total Settled:</span>
                <span>₹{inspectBooking.fareBreakdown.total}</span>
              </div>
            </div>

            {/* Admin Override Controls */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <span className="font-bold text-neutral-600 text-xs">Status Override:</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(inspectBooking.pnr, 'COMPLETED')}
                >
                  Mark Completed
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleUpdateStatus(inspectBooking.pnr, 'CANCELLED')}
                >
                  Cancel PNR
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation */}
      {cancelTarget && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelBooking}
          title="Force Cancel Reservation?"
          message={`Are you sure you want to cancel PNR ${cancelTarget.pnr} on behalf of ${cancelTarget.userName}? The seat will be immediately released back into the central booking pool.`}
          confirmText="Confirm Cancellation"
          cancelText="Dismiss"
          variant="danger"
        />
      )}
    </div>
  );
};
