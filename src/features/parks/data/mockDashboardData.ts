// ============================================
// Dashboard Data Interfaces
// ============================================

export interface HourlyForecast {
  hour: string;
  tempF: number;
  icon: string; // Ionicons name
}

export interface WeatherData {
  currentTempF: number;
  condition: string;
  icon: string;
  hourly: HourlyForecast[];
}

export interface StepsData {
  current: number;
  goal: number;
}

export interface RideWaitTime {
  id: string;
  name: string;
  waitMinutes: number;
  isOpen: boolean;
}

// ============================================
// Wait Time Color Tiers
// ============================================

export function getWaitColor(minutes: number, isOpen: boolean): string {
  'worklet';
  if (!isOpen) return '#999999';
  if (minutes <= 15) return '#28A745';
  if (minutes <= 30) return '#F9A825';
  if (minutes <= 45) return '#E8734A';
  return '#DC3545';
}

// ============================================
// Mock Data — Knott's Berry Farm
// ============================================

export const MOCK_WEATHER: WeatherData = {
  currentTempF: 78,
  condition: 'Sunny',
  icon: 'sunny',
  hourly: [
    { hour: '11a', tempF: 79, icon: 'sunny' },
    { hour: '12p', tempF: 82, icon: 'sunny' },
    { hour: '1p', tempF: 84, icon: 'partly-sunny' },
    { hour: '2p', tempF: 83, icon: 'partly-sunny' },
    { hour: '3p', tempF: 81, icon: 'partly-sunny' },
    { hour: '4p', tempF: 78, icon: 'cloud' },
    { hour: '5p', tempF: 75, icon: 'cloud' },
  ],
};

export const MOCK_STEPS: StepsData = {
  current: 7432,
  goal: 10000,
};

export const MOCK_RIDE_WAIT_TIMES: RideWaitTime[] = [
  { id: 'ride-ghostrider', name: 'GhostRider', waitMinutes: 60, isOpen: true },
  { id: 'ride-xcelerator', name: 'Xcelerator', waitMinutes: 45, isOpen: true },
  { id: 'ride-hangtime', name: 'HangTime', waitMinutes: 35, isOpen: true },
  { id: 'ride-silver-bullet', name: 'Silver Bullet', waitMinutes: 25, isOpen: true },
  { id: 'ride-montezooma', name: 'MonteZOOMa', waitMinutes: 0, isOpen: false },
  { id: 'ride-pony-express', name: 'Pony Express', waitMinutes: 20, isOpen: true },
  { id: 'ride-supreme-scream', name: 'Supreme Scream', waitMinutes: 15, isOpen: true },
  { id: 'ride-calico-river-rapids', name: 'Calico Rapids', waitMinutes: 30, isOpen: true },
  { id: 'ride-timber-mountain-log-ride', name: 'Timber Mtn', waitMinutes: 20, isOpen: true },
  { id: 'ride-jaguar', name: 'Jaguar!', waitMinutes: 10, isOpen: true },
  { id: 'ride-coast-rider', name: 'Coast Rider', waitMinutes: 5, isOpen: true },
  { id: 'ride-sol-spin', name: 'Sol Spin', waitMinutes: 15, isOpen: true },
];
