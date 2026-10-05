import { FilterOptions, RouteStop, SearchParams, Train } from '../types';
import { apiRequest } from './api';

function normalizeTrain(raw: any): Train {
  return {
    id: String(raw.id ?? raw.train_id ?? 'tr-0'),
    number: String(raw.number ?? raw.train_number ?? '0'),
    name: raw.name ?? raw.train_name ?? 'Train',
    type: (raw.type ?? raw.train_type ?? 'Express') as Train['type'],
    fromStation: {
      code: raw.fromStation?.code ?? raw.from_station_code ?? raw.from_code ?? 'SRC',
      name: raw.fromStation?.name ?? raw.from_station_name ?? raw.from_name ?? 'Source',
      city: raw.fromStation?.city ?? raw.from_station_city ?? raw.from_city ?? 'Source',
    },
    toStation: {
      code: raw.toStation?.code ?? raw.to_station_code ?? raw.to_code ?? 'DST',
      name: raw.toStation?.name ?? raw.to_station_name ?? raw.to_name ?? 'Destination',
      city: raw.toStation?.city ?? raw.to_station_city ?? raw.to_city ?? 'Destination',
    },
    departureTime: raw.departureTime ?? raw.departure_time ?? '00:00',
    arrivalTime: raw.arrivalTime ?? raw.arrival_time ?? '00:00',
    duration: raw.duration ?? '0h 0m',
    distanceKm: Number(raw.distanceKm ?? raw.distance_km ?? 0),
    operatingDays: Array.isArray(raw.operatingDays) ? raw.operatingDays : (raw.operating_days ?? []),
    classes: Array.isArray(raw.classes)
      ? raw.classes.map((entry: any) => ({
          code: entry.code,
          name: entry.name,
          baseFare: Number(entry.baseFare ?? entry.base_fare ?? 0),
          seatsAvailable: Number(entry.seatsAvailable ?? entry.seats_available ?? 0),
          status: entry.status ?? 'AVAILABLE',
          coachPrefix: entry.coachPrefix ?? 'B',
        }))
      : [],
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.map((entry: any) => ({
          id: entry.id ?? 'wifi',
          label: entry.label ?? 'Amenity',
          available: Boolean(entry.available),
        }))
      : [],
    status: raw.status ?? 'ON_TIME',
    delayMinutes: Number(raw.delayMinutes ?? 0),
    pantryAvailable: raw.pantryAvailable ?? true,
  };
}

export const trainService = {
  async getAllTrains(): Promise<Train[]> {
    const data = await apiRequest<any[]>('/trains');
    return data.map(normalizeTrain);
  },

  async getTrainById(id: string): Promise<Train | null> {
    try {
      const data = await apiRequest<any>(`/trains/${id}`);
      return normalizeTrain(data);
    } catch {
      return null;
    }
  },

  async searchTrains(params: SearchParams, filters?: Partial<FilterOptions>): Promise<Train[]> {
    const query = new URLSearchParams({
      fromStation: params.fromStation,
      toStation: params.toStation,
      journeyDate: params.journeyDate,
      passengersCount: String(params.passengersCount),
      classCode: params.classCode,
    });

    const data = await apiRequest<any[]>(`/trains/search?${query.toString()}`);
    let results = (data || []).map(normalizeTrain);

    if (!filters) return results;

    if (filters.trainTypes && filters.trainTypes.length) {
      results = results.filter((train) => filters.trainTypes!.includes(train.type));
    }

    if (filters.classes && filters.classes.length) {
      results = results.filter((train) => train.classes.some((cls) => filters.classes!.includes(cls.code)));
    }

    if (filters.availableOnly) {
      results = results.filter((train) => train.classes.some((cls) => cls.status === 'AVAILABLE' && cls.seatsAvailable > 0));
    }

    if (filters.maxPrice) {
      results = results.filter((train) => train.classes.some((cls) => cls.baseFare <= filters.maxPrice!));
    }

    if (filters.departureTimes && filters.departureTimes.length) {
      results = results.filter((train) => {
        const hour = Number(train.departureTime.split(':')[0]);
        return filters.departureTimes!.some((range) => {
          if (range === 'morning') return hour >= 6 && hour < 12;
          if (range === 'afternoon') return hour >= 12 && hour < 17;
          if (range === 'evening') return hour >= 17 && hour < 21;
          if (range === 'night') return hour >= 21 || hour < 6;
          return false;
        });
      });
    }

    if (filters.sortBy) {
      results = [...results].sort((a, b) => {
        if (filters.sortBy === 'PRICE_LOW') {
          return Math.min(...a.classes.map((c) => c.baseFare)) - Math.min(...b.classes.map((c) => c.baseFare));
        }
        if (filters.sortBy === 'PRICE_HIGH') {
          return Math.min(...b.classes.map((c) => c.baseFare)) - Math.min(...a.classes.map((c) => c.baseFare));
        }
        if (filters.sortBy === 'DEPARTURE') {
          return a.departureTime.localeCompare(b.departureTime);
        }
        if (filters.sortBy === 'ARRIVAL') {
          return a.arrivalTime.localeCompare(b.arrivalTime);
        }
        if (filters.sortBy === 'DURATION') {
          return Number(a.duration.replace(/[^0-9]/g, '')) - Number(b.duration.replace(/[^0-9]/g, ''));
        }
        return 0;
      });
    }

    return results;
  },

  async getPopularTrains(): Promise<Train[]> {
    const data = await this.getAllTrains();
    return data.slice(0, 5);
  },

  async getPopularJourneys() {
    return [
      { from: 'Kolkata', to: 'Delhi', label: 'Fastest route', image: 'kolkata-delhi' },
      { from: 'Bengaluru', to: 'Mumbai', label: 'Weekend favorite', image: 'blr-mum' },
    ];
  },

  async getRouteStops(trainId: string): Promise<RouteStop[]> {
    try {
      const data = await apiRequest<any>(`/trains/${trainId}/route`);
      const stops = Array.isArray(data) ? data : data?.route ?? [];
      return stops.map((stop: any) => ({
        sequence: Number(stop.sequence ?? 1),
        stationCode: stop.stationCode ?? stop.station_code ?? 'SRC',
        stationName: stop.stationName ?? stop.station_name ?? 'Station',
        arrivalTime: stop.arrivalTime ?? stop.arrival_time ?? '00:00',
        departureTime: stop.departureTime ?? stop.departure_time ?? '00:00',
        haltMinutes: Number(stop.haltMinutes ?? stop.halt_minutes ?? 0),
        distanceKm: Number(stop.distanceKm ?? stop.distance_km ?? 0),
        day: Number(stop.day ?? 1),
      }));
    } catch {
      return [];
    }
  },

  async addTrain(trainData: Omit<Train, 'id'>): Promise<Train> {
    const payload = {
      number: String(trainData.number),
      name: trainData.name,
      type: trainData.type,
      fromStationCode: trainData.fromStation.code,
      toStationCode: trainData.toStation.code,
      fromStation: trainData.fromStation,
      toStation: trainData.toStation,
      departureTime: trainData.departureTime,
      arrivalTime: trainData.arrivalTime,
      duration: trainData.duration,
      distanceKm: Number(trainData.distanceKm || 0),
      operatingDays: trainData.operatingDays,
      classes: trainData.classes,
      status: trainData.status,
      pantryAvailable: trainData.pantryAvailable,
      amenities: trainData.amenities,
      baseFare: trainData.classes[0]?.baseFare ?? 1200,
    };

    const data = await apiRequest<any>('/admin/trains', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return normalizeTrain(data?.train ?? data);
  },

  async updateTrain(id: string, updates: Partial<Train>): Promise<Train> {
    const payload = {
      ...updates,
      number: updates.number ? String(updates.number) : undefined,
      fromStationCode: updates.fromStation?.code,
      toStationCode: updates.toStation?.code,
      baseFare: updates.classes?.[0]?.baseFare,
    };

    const data = await apiRequest<any>(`/admin/trains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return normalizeTrain(data?.train ?? data);
  },

  async deleteTrain(id: string): Promise<void> {
    await apiRequest(`/admin/trains/${id}`, { method: 'DELETE' });
  },
};
