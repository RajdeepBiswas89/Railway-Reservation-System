import { Station } from '../types';
import { apiRequest } from './api';

export function normalizeStation(raw: any): Station {
  return {
    code: String(raw.code ?? raw.station_code ?? ''),
    name: raw.name ?? raw.station_name ?? 'Station',
    city: raw.city ?? '',
    state: raw.state ?? '',
    zone: raw.zone ?? raw.railway_zone ?? '',
    platforms: Number(raw.platforms ?? 6),
    status: raw.status === 'MAINTENANCE' || raw.status === 'INACTIVE' ? 'MAINTENANCE' : 'ACTIVE',
  };
}

export const stationService = {
  async getStations(): Promise<Station[]> {
    const data = await apiRequest<any[]>('/stations');
    return (data ?? []).map(normalizeStation);
  },

  async searchStations(query: string): Promise<Station[]> {
    const data = await apiRequest<any[]>(`/stations/search?query=${encodeURIComponent(query)}`);
    return (data ?? []).map((item) => normalizeStation(item.station ?? item));
  },

  async getStationByCode(code: string): Promise<Station | null> {
    try {
      const data = await apiRequest<any>(`/stations/${encodeURIComponent(code)}`);
      return normalizeStation(data);
    } catch {
      return null;
    }
  },

  async addStation(station: Station): Promise<Station> {
    const data = await apiRequest<any>('/admin/stations', {
      method: 'POST',
      body: JSON.stringify(station),
    });
    return normalizeStation(data);
  },

  async updateStation(code: string, updates: Partial<Station>): Promise<Station> {
    const data = await apiRequest<any>(`/admin/stations/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return normalizeStation(data);
  },

  async deleteStation(code: string): Promise<void> {
    await apiRequest(`/admin/stations/${encodeURIComponent(code)}`, { method: 'DELETE' });
  },
};
