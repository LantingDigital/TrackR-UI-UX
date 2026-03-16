import React, { useMemo } from 'react';

import { MAPBOX_AVAILABLE } from './mapboxConfig';
import { colors } from '../../../theme/colors';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

// ============================================
// Route Layer
//
// Renders a walking route on the Mapbox map.
// Two lines stacked: white background for contrast,
// accent-colored foreground for the route itself.
//
// IMPORTANT: The ShapeSource stays mounted permanently
// to prevent Mapbox GL internal state corruption when
// sources are added/removed. When there is no route,
// we render an empty FeatureCollection.
// ============================================

const EMPTY_ROUTE: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

interface RouteLayerProps {
  route: GeoJSON.Feature<GeoJSON.LineString> | null;
}

export function RouteLayer({ route }: RouteLayerProps) {
  if (!MapboxGL) return null;

  // Wrap single feature in a FeatureCollection, or use empty collection
  const shape = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!route) return EMPTY_ROUTE;
    return { type: 'FeatureCollection', features: [route] };
  }, [route]);

  return (
    <MapboxGL.ShapeSource id="route-source" shape={shape}>
      {/* Background stroke for contrast */}
      <MapboxGL.LineLayer
        id="route-background"
        style={{
          lineColor: '#FFFDF7',
          lineWidth: 7,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Foreground accent route */}
      <MapboxGL.LineLayer
        id="route-foreground"
        style={{
          lineColor: colors.accent.primary,
          lineWidth: 4,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
