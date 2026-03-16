import React, { useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ParkPOI, MapCategory } from '../types';
import { MAPBOX_AVAILABLE, ZOOM as DEFAULT_ZOOM, CATEGORY_ZOOM as DEFAULT_CATEGORY_ZOOM, poiToCoordinate } from './mapboxConfig';
import { MAP_CATEGORY_COLORS } from './poiGeoJSON';
import { SPRINGS } from '../../../constants/animations';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

// ============================================
// POI Layers — GPU-rendered category dots + labels
//
// 6 category CircleLayer + SymbolLayer pairs with progressive
// zoom disclosure, plus a selected-poi glow/dot overlay.
//
// IMPORTANT: Layers must be direct children of ShapeSource (no
// React.Fragment wrapping) so that sourceID is auto-injected.
// We use flatMap to produce a flat array of layer elements.
// ============================================

const CATEGORIES: MapCategory[] = ['coaster', 'ride', 'food', 'show', 'shop', 'service'];

const CATEGORY_TEXT: Record<MapCategory, { size: [number, number]; font: string[] }> = {
  coaster: { size: [11, 14], font: ['DIN Pro Bold', 'Arial Unicode MS Bold'] },
  ride:    { size: [10, 12], font: ['DIN Pro Medium', 'Arial Unicode MS Regular'] },
  food:    { size: [9, 11],  font: ['DIN Pro Regular', 'Arial Unicode MS Regular'] },
  show:    { size: [9, 11],  font: ['DIN Pro Regular', 'Arial Unicode MS Regular'] },
  shop:    { size: [9, 11],  font: ['DIN Pro Regular', 'Arial Unicode MS Regular'] },
  service: { size: [9, 11],  font: ['DIN Pro Regular', 'Arial Unicode MS Regular'] },
};

interface POILayersProps {
  geoJSON: GeoJSON.FeatureCollection;
  selectedPoi: ParkPOI | null;
  onPoiPress: (poi: ParkPOI) => void;
  pois: ParkPOI[];
  activeFilters: Set<MapCategory>;
  searchHighlightIds: Set<string>;
  /** Minimum zoom level for this park (defaults to Knott's 15.7) */
  minZoom?: number;
  /** Coordinate converter for selected pin marker (defaults to Knott's bounds) */
  coordConverter?: (x: number, y: number) => [number, number];
}

export function POILayers({ geoJSON, selectedPoi, onPoiPress, pois, activeFilters, searchHighlightIds, minZoom, coordConverter }: POILayersProps) {
  if (!MapboxGL) return null;

  // Derive zoom constants from park's min zoom (allows progressive disclosure to work across parks)
  const ZOOM = minZoom != null ? { min: minZoom } : DEFAULT_ZOOM;
  const baseMin = ZOOM.min as number;
  const CATEGORY_ZOOM: Record<MapCategory, number> = minZoom != null
    ? {
        coaster: baseMin + 0.5,
        ride:    baseMin + 0.8,
        food:    baseMin + 1.3,
        show:    baseMin + 1.3,
        shop:    baseMin + 1.6,
        service: baseMin + 1.8,
      }
    : DEFAULT_CATEGORY_ZOOM;
  const toCoord = coordConverter ?? poiToCoordinate;

  const isSelected = selectedPoi !== null;

  // Dim unselected layers when a POI is selected
  const dimDot = isSelected ? 0.3 : 1;
  const dimLabel = isSelected ? 0.3 : 1;

  // Filter mode (category chips OR search highlight)
  const hasFilters = activeFilters.size > 0;
  const hasSearchHighlight = searchHighlightIds.size > 0;

  // ShapeSource tap → look up full ParkPOI, prioritizing visible/highlighted POIs
  const handlePress = useCallback(
    (event: any) => {
      if (!event.features?.length) return;

      let bestPoi: ParkPOI | undefined;

      for (const feature of event.features) {
        const poiId = feature.properties?.id;
        if (!poiId) continue;
        const poi = pois.find((p) => p.id === poiId);
        if (!poi) continue;

        if (hasSearchHighlight) {
          // Only accept highlighted POIs — skip dimmed ones
          if (searchHighlightIds.has(poiId)) { bestPoi = poi; break; }
          continue;
        }

        if (hasFilters) {
          // Only accept POIs in active categories
          if (activeFilters.has(getMapCategory(poi))) { bestPoi = poi; break; }
          continue;
        }

        // No filters — accept first hit
        bestPoi = poi;
        break;
      }

      if (bestPoi) onPoiPress(bestPoi);
    },
    [pois, onPoiPress, hasFilters, hasSearchHighlight, activeFilters, searchHighlightIds],
  );
  const highlightIdArray = useMemo(
    () => Array.from(searchHighlightIds),
    [searchHighlightIds],
  );

  return (
    <>
      {/* ---- All POI dots + labels (6 category tiers) ---- */}
      <MapboxGL.ShapeSource
        id="park-pois"
        shape={geoJSON}
        onPress={handlePress}
        hitbox={{ width: 44, height: 44 }}
      >
        {CATEGORIES.flatMap((cat) => {
          const minZ = CATEGORY_ZOOM[cat];
          const color = MAP_CATEGORY_COLORS[cat];
          const text = CATEGORY_TEXT[cat];
          const filter: any[] = ['==', ['get', 'mapCategory'], cat];

          const overviewZ = ZOOM.min as number;
          const labelMinZ = minZ + 1.2;
          const dotMaxZ = Math.max(minZ + 1, 18);
          const textMaxZ = Math.max(labelMinZ + 1, 18);

          // Filter-aware rendering
          const isActive = activeFilters.has(cat);

          // Search highlight uses Mapbox expressions to check POI ID membership
          // ['case', ['in', ['get','id'], ['literal',[...]]], highlighted, dimmed]
          let dotOpacity: any;
          let dotRadius: any;
          let strokeWidth: any;
          let strokeOpacity: any;
          let effectiveLabelMinZ: number;
          let labelOpacity: any;

          if (hasSearchHighlight) {
            // Search highlight mode — highlight matching IDs, dim everything else
            const inSet: any[] = ['in', ['get', 'id'], ['literal', highlightIdArray]];
            dotOpacity = ['case', inSet, 1.0, 0.08];
            dotRadius = ['case', inSet, 5, 3];
            strokeWidth = ['case', inSet, 1.5, 0];
            strokeOpacity = ['case', inSet, 1.0, 0];
            effectiveLabelMinZ = overviewZ;
            labelOpacity = ['case', inSet, 1.0, 0];
          } else if (hasFilters) {
            // Category filter mode
            dotOpacity = isActive ? 1.0 : 0.08;
            dotRadius = isActive ? 5 : [
              'interpolate', ['linear'], ['zoom'],
              overviewZ, 3, minZ, 4, dotMaxZ, 7,
            ];
            strokeWidth = isActive ? 1.5 : 0;
            strokeOpacity = isActive ? 1.0 : 0;
            effectiveLabelMinZ = isActive ? overviewZ : labelMinZ;
            labelOpacity = isActive ? 1.0 : 0;
          } else {
            // Normal progressive disclosure
            dotOpacity = [
              'interpolate', ['linear'], ['zoom'],
              overviewZ, 0.2 * dimDot,
              minZ, dimDot,
            ];
            dotRadius = [
              'interpolate', ['linear'], ['zoom'],
              overviewZ, 3, minZ, 4, dotMaxZ, 7,
            ];
            strokeWidth = [
              'interpolate', ['linear'], ['zoom'],
              overviewZ, 0,
              minZ, 1.5,
            ];
            strokeOpacity = [
              'interpolate', ['linear'], ['zoom'],
              overviewZ, 0,
              minZ, dimDot,
            ];
            effectiveLabelMinZ = labelMinZ;
            labelOpacity = [
              'interpolate', ['linear'], ['zoom'],
              labelMinZ, 0,
              labelMinZ + 0.4, dimLabel,
            ];
          }

          return [
            <MapboxGL.CircleLayer
              key={`dots-${cat}`}
              id={`dots-${cat}`}
              filter={filter}
              minZoomLevel={overviewZ}
              style={{
                circleRadius: dotRadius,
                circleColor: color,
                circleStrokeWidth: strokeWidth,
                circleStrokeColor: '#FFFFFF',
                circleOpacity: dotOpacity,
                circleStrokeOpacity: strokeOpacity,
              }}
            />,
            <MapboxGL.SymbolLayer
              key={`label-${cat}`}
              id={`label-${cat}`}
              filter={filter}
              minZoomLevel={effectiveLabelMinZ}
              style={{
                textField: ['get', 'name'],
                textSize: [
                  'interpolate', ['linear'], ['zoom'],
                  effectiveLabelMinZ, text.size[0],
                  textMaxZ, text.size[1],
                ],
                textFont: text.font,
                textAnchor: 'top',
                textOffset: [0, 0.7],
                textAllowOverlap: false,
                textPadding: 5,
                textHaloColor: '#FFFFFF',
                textHaloWidth: 1.5,
                textColor: color,
                textOpacity: labelOpacity,
              }}
            />,
          ];
        })}
      </MapboxGL.ShapeSource>

      {/* ---- Selected POI pin marker ---- */}
      {selectedPoi && <SelectedPinMarker poi={selectedPoi} coordConverter={toCoord} />}
    </>
  );
}

// ============================================
// Pin marker for selected POI
// ============================================

const PIN_SIZE = 32;
const PIN_POINT_HEIGHT = 10;
const PIN_TOTAL_HEIGHT = PIN_SIZE + PIN_POINT_HEIGHT;

function getMapCategory(poi: ParkPOI): MapCategory {
  if (poi.type === 'ride' && poi.coasterId) return 'coaster';
  if (poi.type === 'theater' || poi.type === 'attraction') return 'show';
  if (poi.type === 'ride') return 'ride';
  if (poi.type === 'food') return 'food';
  if (poi.type === 'shop') return 'shop';
  return 'service';
}

function SelectedPinMarker({ poi, coordConverter }: { poi: ParkPOI; coordConverter?: (x: number, y: number) => [number, number] }) {
  if (!MapboxGL) return null;

  const toCoord = coordConverter ?? poiToCoordinate;
  const coordinate: [number, number] =
    poi.lng != null && poi.lat != null
      ? [poi.lng, poi.lat]
      : toCoord(poi.x, poi.y);

  const color = MAP_CATEGORY_COLORS[getMapCategory(poi)];

  // Spring scale animation — grows in when POI changes
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = 0;
    scale.value = withSpring(1, SPRINGS.responsive);
  }, [poi.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <MapboxGL.MarkerView
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
    >
      <Animated.View style={[pinStyles.container, animatedStyle]}>
        {/* Glow behind pin */}
        <View style={[pinStyles.glow, { backgroundColor: color }]} />
        {/* Circle head */}
        <View style={[pinStyles.head, { backgroundColor: color }]} />
        {/* Triangle point */}
        <View
          style={[
            pinStyles.point,
            {
              borderTopColor: color,
            },
          ]}
        />
      </Animated.View>
    </MapboxGL.MarkerView>
  );
}

const pinStyles = StyleSheet.create({
  container: {
    width: PIN_SIZE + 16,
    height: PIN_TOTAL_HEIGHT + 8,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: 0,
    width: PIN_SIZE + 12,
    height: PIN_SIZE + 12,
    borderRadius: (PIN_SIZE + 12) / 2,
    opacity: 0.15,
    alignSelf: 'center',
  },
  head: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginTop: 6,
  },
  point: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: PIN_POINT_HEIGHT,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
