import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import {
  MAPBOX_AVAILABLE,
  KNOTTS_CENTER,
  ZOOM,
  MAP_STYLE_URL,
  PARK_BOUNDS,
} from '../map/mapboxConfig';
import { UnifiedParkMapData } from '../types';
import { poisToGeoJSON } from '../map/poiGeoJSON';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

// Park title point at park center
const PREVIEW_TITLE_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: KNOTTS_CENTER },
      properties: { name: "Knott's Berry Farm" },
    },
  ],
};

interface MapPreviewCardProps {
  onPress: (center?: [number, number]) => void;
  mapData?: UnifiedParkMapData;
}

export function MapPreviewCard({ onPress, mapData }: MapPreviewCardProps) {
  const poiGeoJSON = useMemo(() => {
    if (!mapData) return null;
    return poisToGeoJSON(mapData.pois);
  }, [mapData]);

  const showLiveMap = MAPBOX_AVAILABLE && MapboxGL && poiGeoJSON;

  // MapView tap → open full map centered on tapped coordinate
  const handleMapTap = useCallback(
    (feature: any) => {
      const coords = feature?.geometry?.coordinates as [number, number] | undefined;
      onPress(coords);
    },
    [onPress],
  );

  if (!showLiveMap) {
    return (
      <View style={styles.outerPadding}>
        <Pressable onPress={() => onPress()}>
          <View style={styles.card}>
            <View style={styles.placeholder}>
              <Ionicons name="map-outline" size={40} color={colors.text.meta} />
              <Text style={styles.placeholderTitle}>Park Map</Text>
              <Text style={styles.placeholderText}>Tap to explore</Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.outerPadding}>
      <View style={styles.card}>
        <MapboxGL.MapView
          style={StyleSheet.absoluteFill}
          styleURL={MAP_STYLE_URL}
          scrollEnabled={true}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          attributionEnabled={false}
          logoEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onPress={handleMapTap}
        >
          <MapboxGL.Camera
            defaultSettings={{
              centerCoordinate: KNOTTS_CENTER,
              zoomLevel: ZOOM.default,
            }}
            maxBounds={{ ne: PARK_BOUNDS.ne, sw: PARK_BOUNDS.sw }}
          />

          {/* Park title — large and prominent */}
          <MapboxGL.ShapeSource id="preview-title" shape={PREVIEW_TITLE_GEOJSON}>
            <MapboxGL.SymbolLayer
              id="preview-title-label"
              style={{
                textField: "Knott's Berry Farm",
                textSize: 20,
                textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                textColor: '#1A1A1A',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 2.5,
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
          </MapboxGL.ShapeSource>

          {/* POI dots — coasters featured, rides as subtle context */}
          <MapboxGL.ShapeSource id="preview-pois" shape={poiGeoJSON}>
            <MapboxGL.CircleLayer
              id="preview-coaster-dots"
              filter={['==', ['get', 'mapCategory'], 'coaster']}
              style={{
                circleRadius: 5,
                circleColor: ['get', 'color'],
                circleStrokeWidth: 1.5,
                circleStrokeColor: '#FFFFFF',
              }}
            />
            <MapboxGL.SymbolLayer
              id="preview-coaster-labels"
              filter={['==', ['get', 'mapCategory'], 'coaster']}
              style={{
                textField: ['get', 'name'],
                textSize: 9,
                textFont: ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                textAnchor: 'top',
                textOffset: [0, 0.8],
                textAllowOverlap: false,
                textPadding: 4,
                textHaloColor: '#FFFFFF',
                textHaloWidth: 1.5,
                textColor: '#D4442A',
              }}
            />
            <MapboxGL.CircleLayer
              id="preview-ride-dots"
              filter={['==', ['get', 'mapCategory'], 'ride']}
              style={{
                circleRadius: 2.5,
                circleColor: '#4A90D9',
                circleOpacity: 0.4,
                circleStrokeWidth: 0.5,
                circleStrokeColor: '#FFFFFF',
                circleStrokeOpacity: 0.4,
              }}
            />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>

        {/* Gradient overlay — taps pass through to map */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={styles.gradient}
          pointerEvents="none"
        >
          <View style={styles.labelRow}>
            <Ionicons name="map" size={18} color={colors.text.inverse} />
            <Text style={styles.label}>Explore Map</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerPadding: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    height: 180,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    color: colors.text.inverse,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  placeholderText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },
});
