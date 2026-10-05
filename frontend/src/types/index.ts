export type TrainType = 'Vande Bharat' | 'Rajdhani' | 'Shatabdi' | 'Duronto' | 'Superfast' | 'Express';

export type TrainClassCode = '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | 'EC';

export interface TrainClassInfo {
  code: TrainClassCode;
  name: string;
  baseFare: number;
  seatsAvailable: number;
  status: 'AVAILABLE' | 'LIMITED' | 'WAITLIST' | 'NOT_AVAILABLE';
  coachPrefix: string;
}

export interface Amenity {
  id: 'wifi' | 'food' | 'charging' | 'bedding' | 'ac' | 'water';
  label: string;
  available: boolean;
}

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
  platforms?: number;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface RouteStop {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  haltMinutes: number;
  distanceKm: number;
  day: number;
  sequence: number;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: TrainType;
  fromStation: {
    code: string;
    name: string;
    city: string;
  };
  toStation: {
    code: string;
    name: string;
    city: string;
  };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  distanceKm: number;
  operatingDays: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  classes: TrainClassInfo[];
  amenities: Amenity[];
  status: 'ON_TIME' | 'DELAYED' | 'RESCHEDULED';
  delayMinutes?: number;
  pantryAvailable: boolean;
}

export type SeatBerthType = 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE_LOWER' | 'SIDE_UPPER' | 'WINDOW' | 'AISLE';

export interface Seat {
  id: string;
  seatNumber: number;
  coachNumber: string;
  classCode: TrainClassCode;
  berthType: SeatBerthType;
  status: 'AVAILABLE' | 'SELECTED' | 'OCCUPIED' | 'RESERVED';
  price: number;
}

export interface Passenger {
  id: string;
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  idType: 'AADHAAR' | 'PASSPORT' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENSE';
  idNumber: string;
  seatPreference: 'NO_PREF' | 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE_LOWER' | 'SIDE_UPPER' | 'WINDOW' | 'AISLE';
  mealPreference?: 'VEG' | 'NON_VEG' | 'NO_MEAL';
  allocatedCoach?: string;
  allocatedSeat?: string;
  allocatedBerth?: SeatBerthType;
}

export interface FareBreakdown {
  baseFare: number;
  reservationFee: number;
  superfastCharge: number;
  gst: number;
  cateringCharge: number;
  total: number;
}

export interface PaymentDetails {
  method: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
  transactionId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  upiId?: string;
  cardLast4?: string;
}

export type BookingStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  pnr: string;
  userId: string;
  userEmail: string;
  userName: string;
  train: {
    id: string;
    number: string;
    name: string;
    type: TrainType;
  };
  fromStation: {
    code: string;
    name: string;
    city: string;
  };
  toStation: {
    code: string;
    name: string;
    city: string;
  };
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classCode: TrainClassCode;
  coachNumber: string;
  passengers: Passenger[];
  fareBreakdown: FareBreakdown;
  payment: PaymentDetails;
  status: BookingStatus;
  bookingDate: string;
  platform?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  savedPassengers: SavedPassenger[];
  preferences: {
    preferredClass: TrainClassCode;
    preferredBerth: string;
    foodChoice: 'VEG' | 'NON_VEG';
    smsAlerts: boolean;
    emailAlerts: boolean;
  };
  metrics: {
    totalJourneys: number;
    citiesVisited: number;
    completedTrips: number;
    upcomingTrips: number;
    savedKms: number;
  };
}

export interface SavedPassenger {
  id: string;
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  idType: 'AADHAAR' | 'PASSPORT' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENSE';
  idNumber: string;
  preference: string;
}

export interface SearchParams {
  fromStation: string;
  toStation: string;
  journeyDate: string;
  passengersCount: number;
  classCode: TrainClassCode | 'ALL';
}

export interface FilterOptions {
  departureTimes: ('morning' | 'afternoon' | 'evening' | 'night')[];
  arrivalTimes: ('morning' | 'afternoon' | 'evening' | 'night')[];
  trainTypes: TrainType[];
  classes: TrainClassCode[];
  availableOnly: boolean;
  maxPrice: number;
  sortBy: 'RECOMMENDED' | 'DEPARTURE' | 'ARRIVAL' | 'DURATION' | 'PRICE_LOW' | 'PRICE_HIGH';
}

export interface AdminMetrics {
  totalTrains: number;
  totalStations: number;
  todaysBookings: number;
  totalRevenue: number;
  availableSeats: number;
  cancelledTickets: number;
  activePassengers: number;
  onTimePerformance: number;
}
