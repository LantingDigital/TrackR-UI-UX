/**
 * Health Store — Zustand store for HealthKit data.
 *
 * Manages authorization state and cached daily health stats.
 * Refreshes on demand (app foreground, manual pull) — not background.
 */
import { create } from 'zustand';
import {
  isHealthKitAvailable,
  requestHealthKitPermissions,
  getTodayHealthData,
  hasRequestedAuthorization,
  type DailyHealthData,
} from '../features/health/healthKitService';

interface HealthState {
  /** Whether HealthKit is available on this device (iOS only) */
  available: boolean;
  /** Whether we've already asked the user for permissions */
  permissionRequested: boolean;
  /** Whether the user denied or we never got data (HealthKit doesn't reveal denial) */
  enabled: boolean;
  /** Today's health data, null if not yet fetched or unavailable */
  today: DailyHealthData | null;
  /** Whether a refresh is in progress */
  loading: boolean;
}

interface HealthActions {
  /** Initialize: check availability and prior permission state */
  initialize: () => Promise<void>;
  /** Request HealthKit permissions and fetch initial data */
  requestPermissions: () => Promise<boolean>;
  /** Refresh today's health data from HealthKit */
  refresh: () => Promise<void>;
}

const REFRESH_COOLDOWN_MS = 30_000; // Don't re-query more than once per 30s
let lastRefreshTime = 0;

export const useHealthStore = create<HealthState & HealthActions>((set, get) => ({
  available: false,
  permissionRequested: false,
  enabled: false,
  today: null,
  loading: false,

  initialize: async () => {
    const available = isHealthKitAvailable();
    set({ available });

    if (!available) return;

    const requested = await hasRequestedAuthorization();
    set({ permissionRequested: requested });

    if (requested) {
      // Already requested before — try to fetch data.
      // If we get data, user granted. If null/0, they denied (but we can't tell).
      const data = await getTodayHealthData();
      const hasData = data !== null && (data.steps > 0 || data.distanceMiles > 0 || data.flightsClimbed > 0);
      set({ today: data, enabled: hasData });
      lastRefreshTime = Date.now();
    }
  },

  requestPermissions: async () => {
    const success = await requestHealthKitPermissions();
    set({ permissionRequested: true });

    if (success) {
      // Fetch data immediately after permission dialog
      const data = await getTodayHealthData();
      const hasData = data !== null && (data.steps > 0 || data.distanceMiles > 0 || data.flightsClimbed > 0);
      set({ today: data, enabled: hasData });
      lastRefreshTime = Date.now();
      return hasData;
    }
    return false;
  },

  refresh: async () => {
    const { available, loading } = get();
    if (!available || loading) return;

    // Cooldown to prevent hammering HealthKit
    if (Date.now() - lastRefreshTime < REFRESH_COOLDOWN_MS) return;

    set({ loading: true });
    const data = await getTodayHealthData();
    if (data) {
      const hasData = data.steps > 0 || data.distanceMiles > 0 || data.flightsClimbed > 0;
      set({ today: data, enabled: hasData, loading: false });
    } else {
      set({ loading: false });
    }
    lastRefreshTime = Date.now();
  },
}));
