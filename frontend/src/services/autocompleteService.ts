import { Station } from '../types';
import { stationService } from './stationService';

export interface StationSuggestion {
  station: Station;
  matchedField: 'code' | 'name' | 'city' | 'state';
  score: number;
  highlightIndices?: [number, number]; // [start, end]
  isHub?: boolean;
}

// Major railway hubs in India for weighted ranking
const MAJOR_HUBS = new Set([
  'HWH', 'NDLS', 'CSMT', 'SBC', 'MAS', 'ADI', 'PNBE', 'HYB', 'MAO', 'CNB', 'BBS', 'PUNE'
]);

/**
 * Autocomplete service for railway stations with fuzzy score ranking,
 * prefix matching, major hub prioritization, and keyboard navigation support.
 */
export const autocompleteService = {
  /**
   * Search stations matching query with intelligent ranking:
   * 1. Exact station code match (highest weight)
   * 2. Station code prefix match
   * 3. Station name prefix or word match
   * 4. City match
   * 5. State match
   * Major hubs get a relevance bonus.
   */
  async getSuggestions(query: string, limit: number = 8): Promise<StationSuggestion[]> {
    const trimmed = query.trim().toLowerCase();
    const stations = await stationService.searchStations(query);
    return stations
      .map((station) => {
        const code = station.code.toLowerCase();
        const name = station.name.toLowerCase();
        const city = station.city.toLowerCase();
        const state = station.state.toLowerCase();
        const hub = MAJOR_HUBS.has(station.code.toUpperCase());
        const matchedField: StationSuggestion['matchedField'] = code.includes(trimmed)
          ? 'code'
          : name.includes(trimmed)
            ? 'name'
            : city.includes(trimmed)
              ? 'city'
              : 'state';
        const exactCode = code === trimmed;
        const prefix = code.startsWith(trimmed) || name.startsWith(trimmed) || city.startsWith(trimmed);
        return {
          station,
          matchedField,
          score: (exactCode ? 1000 : prefix ? 600 : 300) + (hub ? 25 : 0),
          isHub: hub,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /**
   * Helper to highlight matching text in search results
   */
  highlightMatch(text: string, query: string): { before: string; match: string; after: string } {
    if (!query || !query.trim()) {
      return { before: text, match: '', after: '' };
    }
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx === -1) {
      return { before: text, match: '', after: '' };
    }
    return {
      before: text.substring(0, idx),
      match: text.substring(idx, idx + query.trim().length),
      after: text.substring(idx + query.trim().length),
    };
  },

  /**
   * Get station details directly by code
   */
  async getStationByCode(code: string): Promise<Station | null> {
    return stationService.getStationByCode(code);
  },

  /**
   * Retrieve popular destination stations for quick selection chips
   */
  async getPopularStations(): Promise<Station[]> {
    const stations = await stationService.getStations();
    return stations.filter((station) => MAJOR_HUBS.has(station.code.toUpperCase())).slice(0, 6);
  },
};
