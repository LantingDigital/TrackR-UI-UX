// ============================================
// useGeoFence — Location-Based Park Proximity
//
// Checks if the user is within ~1 mile of a park.
// Used to gate Google Directions API calls to
// only fire when the user is actually at the park.
// ============================================

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

/** ~1 mile in meters */
const GEO_FENCE_RADIUS_M = 1609;

/** Haversine distance in meters between two lat/lng points */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface GeoFenceState {
  isNearPark: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  loading: boolean;
  permissionDenied: boolean;
}

/** Dev bypass: skip real location check and always report near park */
const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS_GEOFENCE === 'true';

/**
 * Hook that checks if the user is within ~1 mile of a given park center.
 * @param parkCenter [longitude, latitude] — the park's center coordinate
 */
export function useGeoFence(parkCenter: [number, number]): GeoFenceState {
  const [state, setState] = useState<GeoFenceState>(
    DEV_BYPASS
      ? { isNearPark: true, userLocation: null, loading: false, permissionDenied: false }
      : { isNearPark: false, userLocation: null, loading: true, permissionDenied: false },
  );

  useEffect(() => {
    if (DEV_BYPASS) return;

    let cancelled = false;

    async function checkLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setState({ isNearPark: false, userLocation: null, loading: false, permissionDenied: true });
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        const userLat = location.coords.latitude;
        const userLng = location.coords.longitude;
        const parkLng = parkCenter[0];
        const parkLat = parkCenter[1];

        const distance = haversineDistance(userLat, userLng, parkLat, parkLng);

        setState({
          isNearPark: distance <= GEO_FENCE_RADIUS_M,
          userLocation: { latitude: userLat, longitude: userLng },
          loading: false,
          permissionDenied: false,
        });
      } catch {
        if (!cancelled) {
          setState({ isNearPark: false, userLocation: null, loading: false, permissionDenied: false });
        }
      }
    }

    checkLocation();
    return () => { cancelled = true; };
  }, [parkCenter[0], parkCenter[1]]);

  return state;
}
