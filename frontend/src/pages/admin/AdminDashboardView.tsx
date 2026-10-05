import React, { useState, useEffect } from 'react';
import { AdminMetrics } from '../../types';
import { adminService } from '../../services/adminService';
import { bookingService } from '../../services/bookingService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Train,
  MapPin,
  Ticket,
  IndianRupee,
  Armchair,
  XCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Download,
  CheckCircle,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigateSection: (section: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateSection }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [classData, setClassData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    adminService.getMetrics().then(setMetrics);
    adminService.getRevenueTrends().then(setRevenueData);
    adminService.getClassDistribution().then(setClassData);
    bookingService.getBookings().then((b) => setRecentBookings(b.slice(0, 5)));
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-neutral-500">Loading system metrics...</div>;
  }

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));

  return (
    <div className="space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Central Railway Operations Console
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time telemetry, national inventory status, passenger throughput, and revenue ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateSection('reports')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Ledger
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateSection('trains')}
          >
            Manage Fleet
          </Button>
        </div>
      </div>

      {/* METRIC CARDS GRID (6 Key Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Trains */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Trains</span>
            <Train className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 mt-2">
            {metrics.totalTrains}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            +4 new Vande Bharat
          </span>
        </div>

        {/* Total Stations */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stations</span>
            <MapPin className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 mt-2">
            {metrics.totalStations.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-500 block mt-1">
            Across 18 zones
          </span>
        </div>

        {/* Today's Bookings */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Bookings</span>
            <Ticket className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 mt-2">
            {metrics.todaysBookings.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            +8.4% vs yesterday
          </span>
        </div>

        {/* Revenue */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900 mt-2 truncate">
            ₹{(metrics.totalRevenue / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-[11px] text-neutral-500 block mt-1">
            24h settled amount
          </span>
        </div>

        {/* Available Seats */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Inventory</span>
            <Armchair className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900 mt-2">
            {metrics.availableSeats.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-500 block mt-1">
            Berths open across rakes
          </span>
        </div>

        {/* On-Time Performance */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Punctuality</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-2">
            {metrics.onTimePerformance}%
          </div>
          <span className="text-[11px] text-neutral-500 block mt-1">
            412 cancellations
          </span>
        </div>
      </div>

      {/* CHARTS ROW (Revenue Trend & Class Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue & Bookings Trend (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">7-Day Ticket Revenue & Volume</h3>
              <p className="text-xs text-neutral-500">Daily gross turnover and passenger ticket confirmations.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-neutral-800">
                <span className="w-3 h-3 rounded-sm bg-neutral-900 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-neutral-500">
                <span className="w-3 h-3 rounded-sm bg-[#D92D20] inline-block" />
                Bookings Count
              </span>
            </div>
          </div>

          {/* Minimalist Tabular Bar Chart */}
          <div className="pt-2">
            <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-neutral-200">
              {revenueData.map((item) => {
                const heightPercent = Math.round((item.revenue / maxRevenue) * 100);
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-neutral-700 mb-1">
                      ₹{(item.revenue / 100000).toFixed(1)}L
                    </div>
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-1/2 bg-neutral-900 rounded-t-sm transition-all duration-300 hover:bg-neutral-800"
                      />
                      {/* Bookings Count Bar */}
                      <div
                        style={{ height: `${Math.round((item.bookings / 20000) * 100)}%` }}
                        className="w-1/2 bg-[#D92D20] rounded-t-sm transition-all duration-300 hover:bg-[#B42318]"
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-neutral-600 mt-2">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Class Distribution & Occupancy (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-4">
          <div className="pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Class Demand Distribution</h3>
            <p className="text-xs text-neutral-500">Seat volume allocation by coach class.</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {classData.map((cls) => (
              <div key={cls.className} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-neutral-800">{cls.className}</span>
                  <span className="font-bold text-neutral-900">{cls.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cls.percentage}%` }}
                    className="h-full bg-neutral-900 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Overall Fleet Occupancy:</span>
            <span className="font-bold font-mono text-emerald-700">89.4% Active</span>
          </div>
        </div>
      </div>

      {/* RECENT BOOKINGS AUDIT FEED */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Recent Passenger Bookings (Live Feed)</h3>
            <p className="text-xs text-neutral-500">Real-time CRS reservations across the national network.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateSection('bookings')}
          >
            All Bookings Table →
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
              <tr>
                <th className="p-3">PNR</th>
                <th className="p-3">Primary Passenger</th>
                <th className="p-3">Train</th>
                <th className="p-3">Journey Route</th>
                <th className="p-3">Date</th>
                <th className="p-3">Class/Seat</th>
                <th className="p-3">Fare</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {recentBookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-neutral-50/60">
                  <td className="p-3 font-bold text-neutral-900">{bk.pnr}</td>
                  <td className="p-3 font-sans font-medium text-neutral-800">{bk.userName}</td>
                  <td className="p-3 text-neutral-700">{bk.train.number} {bk.train.name}</td>
                  <td className="p-3 text-neutral-600">{bk.fromStation.code} → {bk.toStation.code}</td>
                  <td className="p-3 text-neutral-600">{bk.journeyDate}</td>
                  <td className="p-3 text-neutral-800">{bk.classCode} ({bk.coachNumber}-{bk.passengers[0]?.allocatedSeat || 'B4'})</td>
                  <td className="p-3 font-bold text-neutral-900">₹{bk.fareBreakdown.total}</td>
                  <td className="p-3 font-sans">
                    <Badge
                      variant={
                        bk.status === 'CONFIRMED'
                          ? 'success'
                          : bk.status === 'COMPLETED'
                          ? 'info'
                          : 'danger'
                      }
                      styleType="subtle"
                      showDot
                    >
                      {bk.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
