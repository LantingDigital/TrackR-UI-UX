import React, { useMemo } from 'react';

import { MAPBOX_AVAILABLE } from './mapboxConfig';
import { SimulatedLocation } from './useSimulatedLocation';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

// ============================================
// Simulated Location Marker — "Blue Dot"
//
// Renders a pulsing blue GPS-style dot at the
// simulated location on the map. Uses Mapbox
// ShapeSource + CircleLayers for native perf.
//
// The marker has three concentric circles:
// 1. Outer translucent halo (accuracy ring)
// 2. White border ring
// 3. Inner solid blue dot
// ============================================

/** Blue dot color — matches iOS location indicator */
const BLUE_DOT_COLOR = '#007AFF';

interface SimulatedLocationMarkerProps {
  location: SimulatedLocation | null;
}

export function SimulatedLocationMarker({ location }: SimulatedLocationMarkerProps) {
  if (!MapboxGL || !location) return null;

  const geoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: location
      ? [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          properties: {},
        }]
      : [],
  }), [location?.latitude, location?.longitude]);

  return (
    <MapboxGL.ShapeSource id="simulated-location-source" shape={geoJSON}>
      {/* Outer halo / accuracy ring */}
      <MapboxGL.CircleLayer
        id="simulated-location-halo"
        style={{
          circleRadius: 20,
          circleColor: BLUE_DOT_COLOR,
          circleOpacity: 0.15,
          circlePitchAlignment: 'map',
        }}
      />
      {/* White border ring */}
      <MapboxGL.CircleLayer
        id="simulated-location-border"
        style={{
          circleRadius: 9,
          circleColor: '#FFFFFF',
          circleOpacity: 1,
          circlePitchAlignment: 'map',
        }}
      />
      {/* Inner blue dot */}
      <MapboxGL.CircleLayer
        id="simulated-location-dot"
        style={{
          circleRadius: 6,
          circleColor: BLUE_DOT_COLOR,
          circleOpacity: 1,
          circlePitchAlignment: 'map',
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
