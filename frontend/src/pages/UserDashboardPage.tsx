import React, { useState, useEffect } from 'react';
import { Booking, UserProfile } from '../types';
import { bookingService } from '../services/bookingService';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Train,
  ArrowRight,
  Ticket,
  MapPin,
  Calendar,
  Clock,
  Compass,
  CreditCard,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface UserDashboardPageProps {
  user: UserProfile;
  onViewBooking: (pnr: string) => void;
  onNavigateSearch: () => void;
  onNavigateBookings: () => void;
  onNavigateProfile: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  user,
  onViewBooking,
  onNavigateSearch,
  onNavigateBookings,
  onNavigateProfile,
}) => {
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    bookingService.getUpcomingBooking(user.id).then(setUpcomingBooking);
    bookingService.getBookings(user.id).then((bks) => {
      setRecentBookings(bks.slice(0, 3));
    });
  }, [user.id]);

  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Good morning, {firstName}.
            </h1>
            <Badge variant="success" styleType="subtle" showDot>
              Frequent Commuter
            </Badge>
          </div>
          <p className="text-sm text-neutral-500">
            Ready for your next journey? Track active itineraries, reservations, and passenger records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNavigateProfile}>
            Account Settings
          </Button>
          <Button variant="primary" size="sm" onClick={onNavigateSearch}>
            Book New Journey
          </Button>
        </div>
      </div>

      {/* Hero UPCOMING JOURNEY Card */}
      {upcomingBooking ? (
        <div className="bg-gradient-to-br from-[#121417] to-[#1C2024] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D92D20] font-bold">
                NEXT UPCOMING JOURNEY
              </span>
              <span className="text-white/20">·</span>
              <span className="text-xs font-mono text-neutral-300">
                PNR: {upcomingBooking.pnr}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">
                {upcomingBooking.status}
              </span>
            </div>
          </div>

          <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Origin & Departure */}
            <div className="md:col-span-4 space-y-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                Departing
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {upcomingBooking.departureTime}
              </div>
              <div className="text-sm font-bold text-neutral-200">
                {upcomingBooking.fromStation.name}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                {upcomingBooking.fromStation.code} {upcomingBooking.platform ? `· Platform ${upcomingBooking.platform}` : ''}
              </div>
            </div>

            {/* Travel Line */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-4">
              <span className="text-xs font-bold text-neutral-300">
                {upcomingBooking.train.number} {upcomingBooking.train.name}
              </span>
              <div className="w-full flex items-center my-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                <div className="h-0.5 flex-1 bg-white/30" />
                <Train className="w-4 h-4 text-white mx-1" />
                <div className="h-0.5 flex-1 bg-white/30" />
                <div className="w-2 h-2 rounded-full bg-[#D92D20]" />
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {upcomingBooking.duration} · Class {upcomingBooking.classCode}
              </span>
            </div>

            {/* Destination & Arrival */}
            <div className="md:col-span-4 text-left md:text-right space-y-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                Arriving
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {upcomingBooking.arrivalTime}
              </div>
              <div className="text-sm font-bold text-neutral-200">
                {upcomingBooking.toStation.name}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                {upcomingBooking.toStation.code}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Coach, Seat, View Ticket CTA */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Journey Date</span>
                <span className="font-bold text-white text-sm">{upcomingBooking.journeyDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Coach</span>
                <span className="font-bold text-[#D92D20] text-sm">{upcomingBooking.coachNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Seat / Berth</span>
                <span className="font-bold text-[#D92D20] text-sm">
                  {upcomingBooking.passengers[0]?.allocatedSeat || 'B4'} (LOWER)
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              leftIcon={<Ticket className="w-4 h-4" />}
              onClick={() => onViewBooking(upcomingBooking.pnr)}
              className="bg-white text-neutral-900 hover:bg-neutral-100 border-none font-bold"
            >
              View Digital Ticket
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-2xl border border-neutral-200 text-center space-y-3">
          <Train className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900">No active upcoming journeys</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Explore routes across India and book your next train journey with instant confirmation.
          </p>
          <Button variant="primary" size="sm" onClick={onNavigateSearch}>
            Search Trains Now
          </Button>
        </div>
      )}

      {/* Travel Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Total Journeys
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            {user.metrics.totalJourneys}
          </span>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">Lifetime bookings</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Cities Visited
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            {user.metrics.citiesVisited}
          </span>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">Across 5 state zones</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Completed Trips
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            {user.metrics.completedTrips}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">100% on-time arrival</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Track Kilometers
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            {user.metrics.savedKms.toLocaleString()} km
          </span>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">Rail travel distance</span>
        </div>
      </div>

      {/* Recent Bookings Feed & Saved Journeys */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Bookings (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Recent Booking Records</h3>
              <p className="text-xs text-neutral-500">Access previous travel receipts and ticket passes.</p>
            </div>
            <button
              onClick={onNavigateBookings}
              className="text-xs font-bold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View all bookings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-neutral-50/60 p-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                      {b.pnr}
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      {b.train.number} {b.train.name}
                    </span>
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
                  <div className="text-xs text-neutral-500 mt-1 font-mono">
                    {b.fromStation.code} → {b.toStation.code} · {b.journeyDate} · ₹{b.fareBreakdown.total}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewBooking(b.pnr)}
                  >
                    Ticket
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Travel Preferences & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Passenger Profile
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Name:</span>
                <span className="font-semibold text-neutral-900">{user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Email:</span>
                <span className="font-semibold text-neutral-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Phone:</span>
                <span className="font-mono text-neutral-900">{user.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Preferred Class:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {user.preferences.preferredClass}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={onNavigateProfile}
              className="mt-2"
            >
              Manage Saved Passengers ({user.savedPassengers.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
