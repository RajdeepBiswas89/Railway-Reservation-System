import { ADMIN_METRICS, CLASS_DISTRIBUTION_DATA, REVENUE_TREND_DATA } from '../data/mockData';
import { AdminMetrics } from '../types';

export const adminService = {
  async getMetrics(): Promise<AdminMetrics> {
    return { ...ADMIN_METRICS };
  },

  async getRevenueTrends() {
    return [...REVENUE_TREND_DATA];
  },

  async getClassDistribution() {
    return [...CLASS_DISTRIBUTION_DATA];
  },

  async getReports(filterDateRange: string) {
    // Generate date-filtered metrics
    return {
      dateRange: filterDateRange,
      totalTicketsSold: 8940,
      totalGrossRevenue: 21840000,
      cancellationLoss: 482000,
      netRevenue: 21358000,
      occupancyRate: 88.4,
      punctualityIndex: 94.6,
      topRoutes: [
        { route: 'Howrah → KSR Bengaluru', bookings: 2180, revenue: 4680000 },
        { route: 'New Delhi → Mumbai CSMT', bookings: 3410, revenue: 8120000 },
        { route: 'Chennai Central → Bengaluru', bookings: 1940, revenue: 1920000 },
        { route: 'Mumbai CSMT → Madgaon', bookings: 1410, revenue: 1560000 },
      ],
    };
  },
};
