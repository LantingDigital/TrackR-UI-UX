import React from 'react';

import { MAPBOX_AVAILABLE } from './mapboxConfig';
import { colors } from '../../../theme/colors';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

// ============================================
// Route Layer
//
// Renders a walking route on the Mapbox map.
// Two lines stacked: white background for contrast,
// accent-colored foreground for the route itself.
// ============================================

interface RouteLayerProps {
  route: GeoJSON.Feature<GeoJSON.LineString>;
}

export function RouteLayer({ route }: RouteLayerProps) {
  if (!MapboxGL) return null;

  return (
    <MapboxGL.ShapeSource id="route-source" shape={route}>
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
