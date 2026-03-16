// ============================================
// Google Directions API — Walking Routes
//
// Fetches real walking directions for in-park
// navigation via the Google Maps Directions API.
// Returns a GeoJSON LineString for RouteLayer.
// ============================================

/** Decode a Google Maps encoded polyline string into [lng, lat] pairs */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    // Google returns lat/lng as integers * 1e5; we need [lng, lat] for Mapbox
    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

/**
 * Fetch walking directions from Google Maps Directions API.
 * Returns a GeoJSON LineString feature, or null on failure.
 */
export async function fetchWalkingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  apiKey: string,
): Promise<GeoJSON.Feature<GeoJSON.LineString> | null> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.latitude},${origin.longitude}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      `&mode=walking` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK' || !data.routes?.length) return null;

    const route = data.routes[0];
    const encodedPolyline = route.overview_polyline?.points;
    if (!encodedPolyline) return null;

    const coordinates = decodePolyline(encodedPolyline);
    if (coordinates.length < 2) return null;

    // Extract distance and duration from the first leg
    const leg = route.legs?.[0];
    const distanceMeters = leg?.distance?.value ?? 0;
    const durationSeconds = leg?.duration?.value ?? 0;

    return {
      type: 'Feature',
      properties: {
        source: 'google-directions',
        distance: distanceMeters,
        duration: durationSeconds,
      },
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };
  } catch {
    return null;
  }
}
