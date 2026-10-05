import { TRAINS } from '../data/mockData';

export interface StationLiveHalt {
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  actualArrival: string;
  scheduledDeparture: string;
  actualDeparture: string;
  delayMinutes: number;
  platform: string;
  distanceKm: number;
  status: 'PASSED' | 'CURRENT' | 'UPCOMING';
}

export interface LiveTrainStatus {
  trainNumber: string;
  trainName: string;
  currentStation: string;
  nextStation: string;
  statusMessage: string;
  delayMinutes: number;
  currentSpeedKmH: number;
  distanceCoveredKm: number;
  totalDistanceKm: number;
  lastUpdated: string;
  halts: StationLiveHalt[];
}

export const liveStatusService = {
  async getLiveStatus(trainNumberOrId: string): Promise<LiveTrainStatus | null> {
    const train = TRAINS.find((t) => t.number === trainNumberOrId || t.id === trainNumberOrId) || TRAINS[0];

    return {
      trainNumber: train.number,
      trainName: train.name,
      currentStation: 'Bhubaneswar (BBS)',
      nextStation: 'Visakhapatnam Junction (VSKP)',
      statusMessage: 'Running on-time · Departed BBS platform 04',
      delayMinutes: 4,
      currentSpeedKmH: 104,
      distanceCoveredKm: 580,
      totalDistanceKm: train.distanceKm,
      lastUpdated: '2 mins ago via GPS Tracker',
      halts: [
        {
          stationCode: 'HWH',
          stationName: 'Howrah Junction',
          scheduledArrival: 'Source',
          actualArrival: 'Source',
          scheduledDeparture: train.departureTime,
          actualDeparture: train.departureTime,
          delayMinutes: 0,
          platform: '09',
          distanceKm: 0,
          status: 'PASSED',
        },
        {
          stationCode: 'KGP',
          stationName: 'Kharagpur Junction',
          scheduledArrival: '23:00',
          actualArrival: '23:02',
          scheduledDeparture: '23:05',
          actualDeparture: '23:07',
          delayMinutes: 2,
          platform: '03',
          distanceKm: 115,
          status: 'PASSED',
        },
        {
          stationCode: 'BBS',
          stationName: 'Bhubaneswar',
          scheduledArrival: '04:15',
          actualArrival: '04:19',
          scheduledDeparture: '04:20',
          actualDeparture: '04:24',
          delayMinutes: 4,
          platform: '04',
          distanceKm: 437,
          status: 'CURRENT',
        },
        {
          stationCode: 'VSKP',
          stationName: 'Visakhapatnam Junction',
          scheduledArrival: '11:30',
          actualArrival: '11:34 (Exp)',
          scheduledDeparture: '11:50',
          actualDeparture: '11:54 (Exp)',
          delayMinutes: 4,
          platform: '01',
          distanceKm: 880,
          status: 'UPCOMING',
        },
        {
          stationCode: 'BZA',
          stationName: 'Vijayawada Junction',
          scheduledArrival: '17:10',
          actualArrival: '17:12 (Exp)',
          scheduledDeparture: '17:25',
          actualDeparture: '17:25 (Exp)',
          delayMinutes: 0,
          platform: '06',
          distanceKm: 1230,
          status: 'UPCOMING',
        },
        {
          stationCode: 'SBC',
          stationName: 'KSR Bengaluru',
          scheduledArrival: train.arrivalTime,
          actualArrival: `${train.arrivalTime} (Exp)`,
          scheduledDeparture: 'Destination',
          actualDeparture: 'Destination',
          delayMinutes: 0,
          platform: '01',
          distanceKm: train.distanceKm,
          status: 'UPCOMING',
        },
      ],
    };
  },
};
