/**
 * Geofence Service
 *
 * Checks if a device is inside a park's geofence using Haversine distance.
 * Used by:
 * - Maps deep links: gate "Open in Maps" behind park presence
 * - Core data: gold border GPS verification for ride logs
 */

const EARTH_RADIUS_METERS = 6_371_000;

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export interface GeofenceData {
  center: { lat: number; lng: number };
  radiusMeters: number;
  parkName: string;
  testMockLocation: { lat: number; lng: number };
}

/**
 * Check if a user's coordinates are inside a park's geofence.
 *
 * @param userLat User's current latitude
 * @param userLng User's current longitude
 * @param geofence The park's geofence data from Firestore
 * @returns true if user is inside the park
 */
export function isInsidePark(
  userLat: number,
  userLng: number,
  geofence: GeofenceData,
): boolean {
  const distance = haversineDistance(
    userLat,
    userLng,
    geofence.center.lat,
    geofence.center.lng,
  );
  return distance <= geofence.radiusMeters;
}

/**
 * Get the distance from user to park center in meters.
 * Useful for showing "X miles away" in the UI.
 */
export function distanceToPark(
  userLat: number,
  userLng: number,
  geofence: GeofenceData,
): number {
  return haversineDistance(userLat, userLng, geofence.center.lat, geofence.center.lng);
}

/**
 * Check if coordinates are inside a park using the test mock location.
 * For dev testing only — simulates being inside the park.
 */
export function isInsideParkMock(geofence: GeofenceData): boolean {
  return isInsidePark(
    geofence.testMockLocation.lat,
    geofence.testMockLocation.lng,
    geofence,
  );
}
