import { Booking, BookingStatus, FareBreakdown, Passenger, PaymentDetails, Train, TrainClassCode } from '../types';
import { apiRequest } from './api';

function normalizeBooking(raw: any): Booking {
  return {
    id: String(raw.id ?? raw.booking_id ?? ''),
    pnr: raw.pnr ?? '',
    userId: String(raw.userId ?? raw.user_id ?? ''),
    userEmail: raw.userEmail ?? raw.user_email ?? '',
    userName: raw.userName ?? raw.user_name ?? raw.booked_by ?? 'User',
    train: {
      id: String(raw.train?.id ?? raw.train_id ?? raw.train?.train_id ?? ''),
      number: String(raw.train?.number ?? raw.train_number ?? '0'),
      name: raw.train?.name ?? raw.train_name ?? 'Train',
      type: raw.train?.type ?? raw.train_type ?? 'Express',
    },
    fromStation: raw.fromStation ?? {
      code: raw.sourceCode ?? raw.source_code ?? 'SRC',
      name: raw.sourceStation ?? raw.source_station ?? 'Source',
      city: raw.sourceCity ?? raw.source_city ?? 'Source',
    },
    toStation: raw.toStation ?? {
      code: raw.destinationCode ?? raw.destination_code ?? 'DST',
      name: raw.destinationStation ?? raw.destination_station ?? 'Destination',
      city: raw.destinationCity ?? raw.destination_city ?? 'Destination',
    },
    journeyDate: raw.journeyDate ?? raw.journey_date ?? '',
    departureTime: raw.departureTime ?? '00:00',
    arrivalTime: raw.arrivalTime ?? '00:00',
    duration: raw.duration ?? '0h 0m',
    classCode: raw.classCode ?? raw.class_code ?? '3A',
    coachNumber: raw.coachNumber ?? raw.coach_number ?? 'B1',
    passengers: Array.isArray(raw.passengers) ? raw.passengers.map((p: any) => ({
      id: String(p.id ?? p.passenger_id ?? ''),
      fullName: p.fullName ?? p.full_name ?? 'Passenger',
      age: Number(p.age ?? 25),
      gender: p.gender ?? 'MALE',
      nationality: p.nationality ?? 'Indian',
      idType: p.idType ?? p.id_type ?? 'AADHAAR',
      idNumber: p.idNumber ?? p.id_number ?? 'XXXX',
      seatPreference: p.seatPreference ?? p.seat_preference ?? 'NO_PREF',
      mealPreference: p.mealPreference ?? p.meal_preference ?? 'NO_MEAL',
      allocatedCoach: p.allocatedCoach ?? p.allocated_coach ?? raw.coachNumber,
      allocatedSeat: p.allocatedSeat ?? p.allocated_seat ?? '1',
      allocatedBerth: p.allocatedBerth ?? p.allocated_berth ?? 'LOWER',
    })) : [],
    fareBreakdown: raw.fareBreakdown ?? {
      baseFare: Number(raw.baseFare ?? raw.total_fare ?? 0),
      reservationFee: Number(raw.reservationFee ?? 40),
      superfastCharge: Number(raw.superfastCharge ?? 45),
      gst: Number(raw.gst ?? 0),
      cateringCharge: Number(raw.cateringCharge ?? 0),
      total: Number(raw.total ?? raw.total_fare ?? 0),
    },
    payment: raw.payment ?? {
      method: raw.paymentMethod ?? raw.payment_method ?? 'UPI',
      transactionId: raw.transactionId ?? raw.transaction_ref ?? 'TXN',
      timestamp: raw.timestamp ?? new Date().toISOString(),
      status: raw.paymentStatus ?? raw.payment_status ?? 'SUCCESS',
      upiId: raw.upiId ?? '',
    },
    status: raw.status ?? raw.booking_status ?? 'CONFIRMED',
    bookingDate: raw.bookingDate ?? raw.booking_date ?? new Date().toISOString().split('T')[0],
    platform: raw.platform ?? '02',
  };
}

export const bookingService = {
  async getBookings(userId?: string): Promise<Booking[]> {
    const data = await apiRequest<any[]>('/bookings/me');
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeBooking);
  },

  async getBookingByPnr(pnr: string): Promise<Booking | null> {
    try {
      const data = await apiRequest<any>(`/bookings/${pnr}`);
      return normalizeBooking(data);
    } catch {
      return null;
    }
  },

  async getUpcomingBooking(userId: string): Promise<Booking | null> {
    const list = await this.getBookings(userId);
    return list.find((booking) => booking.status === 'CONFIRMED') ?? null;
  },

  async createBooking(params: {
    userId: string;
    userName: string;
    userEmail: string;
    train: Train;
    journeyDate: string;
    classCode: TrainClassCode;
    coachNumber: string;
    passengers: Passenger[];
    fareBreakdown: FareBreakdown;
    payment: PaymentDetails;
  }): Promise<Booking> {
    const payload = {
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      train: {
        id: params.train.id,
        number: params.train.number,
        name: params.train.name,
        type: params.train.type,
        fromStation: params.train.fromStation,
        toStation: params.train.toStation,
      },
      journeyDate: params.journeyDate,
      classCode: params.classCode,
      coachNumber: params.coachNumber,
      passengers: params.passengers,
      fareBreakdown: params.fareBreakdown,
      payment: params.payment,
    };

    const data = await apiRequest<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeBooking(data);
  },

  async cancelBooking(pnr: string, reason?: string): Promise<Booking> {
    const data = await apiRequest<any>(`/bookings/${pnr}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? 'User requested cancellation' }),
    });
    return normalizeBooking(data);
  },

  async updateBookingStatus(pnr: string, status: BookingStatus): Promise<Booking> {
    const data = await apiRequest<any>(`/bookings/${pnr}`, { method: 'PATCH' });
    return normalizeBooking({ ...data, status });
  },
};
