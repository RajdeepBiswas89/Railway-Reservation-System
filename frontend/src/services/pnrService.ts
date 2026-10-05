import { INITIAL_BOOKINGS } from '../data/mockData';
import { Booking } from '../types';

export interface PnrDetailedStatus {
  pnr: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  fromStation: string;
  toStation: string;
  boardingPoint: string;
  reservedUpto: string;
  classCode: string;
  chartStatus: 'CHART_PREPARED' | 'CHART_NOT_PREPARED';
  confirmationProbability?: number; // e.g. 96 for 96% chance
  coachPositionFromEngine: string[];
  targetCoach: string;
  passengers: {
    number: number;
    bookingStatus: string;
    currentStatus: string;
    coach: string;
    berth: string;
    berthType: string;
  }[];
}

export const pnrService = {
  async checkPnrStatus(pnrQuery: string): Promise<PnrDetailedStatus | null> {
    const cleanPnr = pnrQuery.trim().toUpperCase();
    const existingBooking = INITIAL_BOOKINGS.find((b) => b.pnr.toUpperCase() === cleanPnr);

    if (existingBooking) {
      return {
        pnr: existingBooking.pnr,
        trainNumber: existingBooking.train.number,
        trainName: existingBooking.train.name,
        journeyDate: existingBooking.journeyDate,
        fromStation: `${existingBooking.fromStation.name} (${existingBooking.fromStation.code})`,
        toStation: `${existingBooking.toStation.name} (${existingBooking.toStation.code})`,
        boardingPoint: existingBooking.fromStation.code,
        reservedUpto: existingBooking.toStation.code,
        classCode: existingBooking.classCode,
        chartStatus: 'CHART_PREPARED',
        coachPositionFromEngine: ['LOCO', 'EOG', 'GS', 'S1', 'S2', 'S3', 'PC', 'B1', 'B2', 'B3', 'A1', 'H1', 'SLR'],
        targetCoach: existingBooking.coachNumber,
        passengers: existingBooking.passengers.map((p, idx) => ({
          number: idx + 1,
          bookingStatus: `CNF / ${existingBooking.coachNumber} / ${p.allocatedSeat || '4'}`,
          currentStatus: `CNF / ${existingBooking.coachNumber} / ${p.allocatedSeat || '4'}`,
          coach: existingBooking.coachNumber,
          berth: p.allocatedSeat || '4',
          berthType: p.allocatedBerth || 'LOWER',
        })),
      };
    }

    // If query is any other 7-character string, generate a simulated prediction response
    if (cleanPnr.length >= 6) {
      return {
        pnr: cleanPnr,
        trainNumber: '12649',
        trainName: 'Karnataka Express',
        journeyDate: '2026-10-20',
        fromStation: 'Howrah Junction (HWH)',
        toStation: 'KSR Bengaluru (SBC)',
        boardingPoint: 'HWH',
        reservedUpto: 'SBC',
        classCode: '3A',
        chartStatus: 'CHART_PREPARED',
        confirmationProbability: 98,
        coachPositionFromEngine: ['LOCO', 'EOG', 'GS', 'S1', 'S2', 'S3', 'PC', 'B1', 'B2', 'B3', 'A1', 'H1', 'SLR'],
        targetCoach: 'B2',
        passengers: [
          {
            number: 1,
            bookingStatus: 'WL 12',
            currentStatus: 'CNF / B2 / 14',
            coach: 'B2',
            berth: '14',
            berthType: 'LOWER',
          },
        ],
      };
    }

    return null;
  },
};
