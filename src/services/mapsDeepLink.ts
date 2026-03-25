/**
 * Maps Deep Link Generator
 *
 * Generates platform-appropriate deep links for walking directions.
 * Supports Google Maps and Apple Maps.
 *
 * Geo-locked: device must be inside park geofence to use.
 * The geo-lock check happens at the UI layer, not here.
 */

import { Platform, Linking } from 'react-native';

/**
 * Generate a walking directions deep link.
 *
 * @param destinationLat POI latitude
 * @param destinationLng POI longitude
 * @param destinationName POI name (for label)
 * @param platform Force a specific platform ('google' | 'apple'). Auto-detects if omitted.
 * @returns URL string for the maps app
 */
export function getWalkingDirectionsLink(
  destinationLat: number,
  destinationLng: number,
  destinationName: string,
  platform?: 'google' | 'apple',
): string {
  const target = platform || (Platform.OS === 'ios' ? 'apple' : 'google');
  const encodedName = encodeURIComponent(destinationName);

  if (target === 'apple') {
    // Apple Maps: walking directions to destination
    return `https://maps.apple.com/?daddr=${destinationLat},${destinationLng}&dirflg=w&q=${encodedName}`;
  }

  // Google Maps: walking directions to destination
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&destination_place_id=&travelmode=walking`;
}

/**
 * Open walking directions in the user's preferred maps app.
 *
 * @param destinationLat POI latitude
 * @param destinationLng POI longitude
 * @param destinationName POI name
 * @param preferGoogleMaps If true, prefer Google Maps even on iOS
 */
export async function openWalkingDirections(
  destinationLat: number,
  destinationLng: number,
  destinationName: string,
  preferGoogleMaps = false,
): Promise<void> {
  if (preferGoogleMaps) {
    // Try Google Maps app first
    const googleMapsUrl = `comgooglemaps://?daddr=${destinationLat},${destinationLng}&directionsmode=walking`;
    const canOpen = await Linking.canOpenURL(googleMapsUrl);
    if (canOpen) {
      await Linking.openURL(googleMapsUrl);
      return;
    }
  }

  // Default: use web link (opens default maps app)
  const link = getWalkingDirectionsLink(destinationLat, destinationLng, destinationName);
  await Linking.openURL(link);
}

/**
 * Open a POI location in the maps app (no directions, just show on map).
 *
 * @param lat POI latitude
 * @param lng POI longitude
 * @param name POI name
 */
export async function openLocationOnMap(
  lat: number,
  lng: number,
  name: string,
): Promise<void> {
  const encodedName = encodeURIComponent(name);

  if (Platform.OS === 'ios') {
    await Linking.openURL(`https://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`);
  } else {
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  }
}
