import { SavedPassenger, UserProfile } from '../types';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from './api';

export type AuthTokenPayload = {
  access_token: string;
  token_type: string;
  user: UserProfile;
};

async function normalizeUser(raw: any): Promise<UserProfile> {
  return {
    id: String(raw.id ?? raw.user_id ?? ''),
    fullName: raw.fullName ?? raw.full_name ?? 'User',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    role: raw.role ?? 'USER',
    savedPassengers: Array.isArray(raw.savedPassengers)
      ? raw.savedPassengers.map((passenger: any) => ({
          id: String(passenger.id ?? passenger.saved_passenger_id ?? ''),
          fullName: passenger.fullName ?? passenger.full_name ?? 'Passenger',
          age: Number(passenger.age ?? 25),
          gender: passenger.gender ?? 'MALE',
          idType: passenger.idType ?? passenger.id_type ?? 'AADHAAR',
          idNumber: passenger.idNumber ?? passenger.id_number ?? '',
          preference: passenger.preference ?? 'LOWER',
        }))
      : [],
    preferences: {
      preferredClass: raw.preferences?.preferredClass ?? '3A',
      preferredBerth: raw.preferences?.preferredBerth ?? 'LOWER',
      foodChoice: raw.preferences?.foodChoice ?? 'VEG',
      smsAlerts: raw.preferences?.smsAlerts ?? true,
      emailAlerts: raw.preferences?.emailAlerts ?? true,
    },
    metrics: {
      totalJourneys: Number(raw.metrics?.totalJourneys ?? raw.totalJourneys ?? 0),
      citiesVisited: Number(raw.metrics?.citiesVisited ?? raw.citiesVisited ?? 0),
      completedTrips: Number(raw.metrics?.completedTrips ?? raw.completedTrips ?? 0),
      upcomingTrips: Number(raw.metrics?.upcomingTrips ?? raw.upcomingTrips ?? 0),
      savedKms: Number(raw.metrics?.savedKms ?? raw.savedKms ?? 0),
    },
  };
}

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const data = await apiRequest<any>('/auth/me');
      return await normalizeUser(data);
    } catch {
      clearAuthToken();
      return null;
    }
  },

  async login(email: string, password: string): Promise<UserProfile> {
    const data = await apiRequest<AuthTokenPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(data.access_token);
    return await normalizeUser(data.user);
  },

  async register(name: string, email: string, phone: string, password: string): Promise<UserProfile> {
    const data = await apiRequest<AuthTokenPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: name, email, phone, password }),
    });

    setAuthToken(data.access_token);
    return await normalizeUser(data.user);
  },

  async logout(): Promise<void> {
    clearAuthToken();
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore server-side logout errors
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const raw = await apiRequest<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: updates.fullName,
        phone: updates.phone,
        preferences: updates.preferences,
      }),
    });
    return await normalizeUser(raw);
  },

  async getSavedPassengers(): Promise<SavedPassenger[]> {
    const raw = await apiRequest<any[]>('/auth/saved-passengers');
    return raw.map((passenger) => ({
      id: String(passenger.id ?? passenger.saved_passenger_id ?? ''),
      fullName: passenger.fullName ?? passenger.full_name ?? 'Passenger',
      age: Number(passenger.age ?? 25),
      gender: passenger.gender ?? 'MALE',
      idType: passenger.idType ?? passenger.id_type ?? 'AADHAAR',
      idNumber: passenger.idNumber ?? passenger.id_number ?? '',
      preference: passenger.preference ?? 'LOWER',
    }));
  },

  async addSavedPassenger(passenger: Omit<SavedPassenger, 'id'>): Promise<SavedPassenger> {
    const raw = await apiRequest<any>('/auth/saved-passengers', {
      method: 'POST',
      body: JSON.stringify({
        fullName: passenger.fullName,
        age: passenger.age,
        gender: passenger.gender,
        idType: passenger.idType,
        idNumber: passenger.idNumber,
        preference: passenger.preference,
      }),
    });

    return {
      id: String(raw.id ?? raw.saved_passenger_id ?? ''),
      fullName: raw.fullName ?? raw.full_name ?? passenger.fullName,
      age: Number(raw.age ?? passenger.age),
      gender: raw.gender ?? passenger.gender,
      idType: raw.idType ?? raw.id_type ?? passenger.idType,
      idNumber: raw.idNumber ?? raw.id_number ?? passenger.idNumber,
      preference: raw.preference ?? passenger.preference,
    };
  },

  async deleteSavedPassenger(id: string): Promise<void> {
    await apiRequest(`/auth/saved-passengers/${id}`, { method: 'DELETE' });
  },
};
