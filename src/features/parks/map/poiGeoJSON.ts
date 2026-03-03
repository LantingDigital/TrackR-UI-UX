import { ParkPOI, POIType, MapCategory } from '../types';
import { poiToCoordinate } from './mapboxConfig';

// ============================================
// POI → GeoJSON Conversion
// ============================================

/** Map rendering category — local alias for convenience */
export type { MapCategory };

/** Hex color for each map category */
export const MAP_CATEGORY_COLORS: Record<MapCategory, string> = {
  coaster: '#D4442A',
  ride:    '#4A90D9',
  food:    '#E8943A',
  show:    '#8B5CF6',
  shop:    '#10B981',
  service: '#7B8794',
};

export interface POIFeatureProperties {
  id: string;
  name: string;
  type: POIType;            // original app type
  mapCategory: MapCategory; // map rendering category
  area: string;
  color: string;            // hex color for the category
  mapNumber?: number;
  waitTimeMinutes?: number;
}

/**
 * Determine the map rendering category for a POI.
 * Rides with a coasterId are promoted to 'coaster';
 * theater / attraction types map to 'show'.
 */
function getMapCategory(poi: ParkPOI): MapCategory {
  // Rides with a coasterId are roller coasters
  if (poi.type === 'ride' && poi.coasterId) return 'coaster';
  // Theater and attraction types map to 'show'
  if (poi.type === 'theater' || poi.type === 'attraction') return 'show';
  // Direct type matches
  if (poi.type === 'ride') return 'ride';
  if (poi.type === 'food') return 'food';
  if (poi.type === 'shop') return 'shop';
  if (poi.type === 'service') return 'service';
  return 'service'; // fallback
}

/**
 * Convert an array of ParkPOIs into a GeoJSON FeatureCollection.
 * Each feature is a Point with properties used for SymbolLayer styling.
 *
 * Prefers real lng/lat coordinates when available on the POI,
 * falling back to the legacy poiToCoordinate(x, y) projection.
 */
export function poisToGeoJSON(
  pois: ParkPOI[],
): GeoJSON.FeatureCollection<GeoJSON.Point, POIFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: pois.map((poi) => {
      const [lng, lat] =
        poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : poiToCoordinate(poi.x, poi.y);

      const mapCategory = getMapCategory(poi);

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          mapCategory,
          area: poi.area,
          color: MAP_CATEGORY_COLORS[mapCategory],
          mapNumber: poi.mapNumber,
          waitTimeMinutes: poi.waitTimeMinutes,
        },
      };
    }),
  };
}

/** Type icon emoji for each POI type */
export const TYPE_ICONS: Record<POIType, string> = {
  ride: '\u{1F3A2}',
  food: '\u{1F355}',
  shop: '\u{1F6CD}',
  theater: '\u{1F3AD}',
  attraction: '\u{1F4F8}',
  service: '\u{1F6BB}',
};
