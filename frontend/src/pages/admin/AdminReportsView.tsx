import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Percent,
} from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('October 2026');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    adminService.getReports(dateRange).then(setReportData);
  }, [dateRange]);

  const handleExportCsv = () => {
    showToast('Report CSV compiled and downloaded.');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Executive Analytics & Performance Reports
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Comprehensive audit of seat utilization, corridor yield, ticket turnover, and cancellation rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-neutral-700">Period Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 font-semibold text-neutral-900 outline-none"
          >
            <option value="October 2026">Current Month (October 2026)</option>
            <option value="Q3 2026">Q3 2026 (Jul - Sep)</option>
            <option value="FY 2026-27">Financial Year 2026-27</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-neutral-500 font-mono">
          <span>Generated: 2026-10-04 22:20 UTC</span>
          <span>·</span>
          <span>Status: Verified Audit</span>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Tickets Issued
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            {reportData.totalTicketsSold.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            +12.4% vs last period
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Net Revenue
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            ₹{(reportData.netRevenue / 100000).toFixed(1)} Lakhs
          </span>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">After clerkage deductions</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Fleet Occupancy
          </span>
          <span className="text-2xl font-black font-mono text-neutral-900 mt-1 block">
            {reportData.occupancyRate}%
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            High operational load
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Punctuality Score
          </span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">
            {reportData.punctualityIndex}%
          </span>
          <span className="text-[11px] text-neutral-500 mt-0.5 block">Departures on schedule</span>
        </div>
      </div>

      {/* Top Performing Corridors */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900">Highest Yield Corridors</h3>
          <p className="text-xs text-neutral-500">Route-wise passenger density and gross ticket settlement.</p>
        </div>

        <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Corridor</th>
                <th className="p-3">Confirmed Bookings</th>
                <th className="p-3">Gross Passenger Fare</th>
                <th className="p-3 text-right">Avg Ticket Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {reportData.topRoutes.map((r: any, idx: number) => (
                <tr key={r.route} className="hover:bg-neutral-50/60">
                  <td className="p-3 font-bold text-neutral-400">0{idx + 1}</td>
                  <td className="p-3 font-sans font-bold text-neutral-900">{r.route}</td>
                  <td className="p-3 text-neutral-700">{r.bookings.toLocaleString()} tickets</td>
                  <td className="p-3 font-bold text-neutral-900">₹{(r.revenue / 100000).toFixed(2)} Lakhs</td>
                  <td className="p-3 text-right text-neutral-700">₹{Math.round(r.revenue / r.bookings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
