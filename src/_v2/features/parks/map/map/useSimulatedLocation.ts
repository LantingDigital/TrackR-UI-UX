import { useState, useCallback } from 'react';

// ============================================
// useSimulatedLocation — Dev-Mode GPS Simulator
//
// Allows setting a fake GPS position by long-pressing
// the park map. Used for testing in-park navigation
// without physically being at the park.
//
// Only active when __DEV__ is true or the geofence
// bypass env var is set.
// ============================================

export interface SimulatedLocation {
  latitude: number;
  longitude: number;
}

/** Dev bypass: matches the same env var used by useGeoFence */
const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS_GEOFENCE === 'true';

/** Whether the location simulator should be enabled */
export const SIMULATION_ENABLED = __DEV__ || DEV_BYPASS;

/**
 * Hook that manages a simulated GPS location for dev/testing.
 *
 * Returns the simulated location state and handlers for setting/clearing it.
 * Only meaningful when SIMULATION_ENABLED is true.
 */
export function useSimulatedLocation() {
  const [simulatedLocation, setSimulatedLocation] = useState<SimulatedLocation | null>(null);

  /** Set simulated location from a map long-press event's coordinates */
  const setLocationFromMapEvent = useCallback((longitude: number, latitude: number) => {
    if (!SIMULATION_ENABLED) return;
    setSimulatedLocation({ latitude, longitude });
  }, []);

  /** Clear the simulated location */
  const clearSimulatedLocation = useCallback(() => {
    setSimulatedLocation(null);
  }, []);

  return {
    simulatedLocation,
    setLocationFromMapEvent,
    clearSimulatedLocation,
    isSimulating: SIMULATION_ENABLED && simulatedLocation !== null,
  };
}
