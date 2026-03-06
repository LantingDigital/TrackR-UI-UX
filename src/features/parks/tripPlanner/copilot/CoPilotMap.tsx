// ============================================
// Co-Pilot Map — Collapsible mini-map panel
//
// Shows walking route, pulsing next pin, and
// dimmed upcoming stops. Tap to expand/collapse.
// ============================================

import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { shadows } from '../../../../theme/shadows';
import { SPRINGS } from '../../../../constants/animations';
import {
  MAPBOX_AVAILABLE,
  KNOTTS_CENTER,
  MAP_STYLE_URL,
  poiToCoordinate,
} from '../../map/mapboxConfig';
import { findShortestPath } from '../../utils/pathfinding';
import type { TripPlan, TripStop } from '../types';
import type { UnifiedParkMapData, ParkPOI, MapNode } from '../../types';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 120;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.45;

// ============================================
// Props
// ============================================

interface CoPilotMapProps {
  plan: TripPlan;
  currentStop: TripStop;
  poiMap: Map<string, ParkPOI>;
  mapData: UnifiedParkMapData;
}

// ============================================
// Component
// ============================================

function CoPilotMapInner({ plan, currentStop, poiMap, mapData }: CoPilotMapProps) {
  const isExpanded = useSharedValue(false);
  const mapHeight = useSharedValue(COLLAPSED_HEIGHT);
  const cameraRef = useRef<any>(null);

  // Pulsing ring for next stop
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 }),
      ),
      -1,
      false,
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    height: mapHeight.value,
  }));

  const toggleExpand = useCallback(() => {
    const expanding = !isExpanded.value;
    isExpanded.value = expanding;
    mapHeight.value = withSpring(
      expanding ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      SPRINGS.responsive,
    );
  }, []);

  // Derive GeoJSON for next stop pin
  const nextStopCoord = useMemo(() => {
    const poi = poiMap.get(currentStop.poiId);
    if (!poi) return null;
    if (poi.lng != null && poi.lat != null) return [poi.lng, poi.lat];
    return poiToCoordinate(poi.x, poi.y);
  }, [currentStop.poiId, poiMap]);

  // Derive GeoJSON for upcoming stops (dimmed)
  const upcomingGeoJSON = useMemo(() => {
    const features = plan.stops
      .filter((s) => s.state === 'pending' && s.id !== currentStop.id)
      .map((s, i) => {
        const poi = poiMap.get(s.poiId);
        if (!poi) return null;
        const coord = poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : poiToCoordinate(poi.x, poi.y);
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: coord },
          properties: { name: s.name, order: i + 1 },
        };
      })
      .filter(Boolean);

    return { type: 'FeatureCollection' as const, features };
  }, [plan.stops, currentStop.id, poiMap]);

  // Derive GeoJSON for completed stops
  const completedGeoJSON = useMemo(() => {
    const features = plan.stops
      .filter((s) => s.state === 'done')
      .map((s) => {
        const poi = poiMap.get(s.poiId);
        if (!poi) return null;
        const coord = poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : poiToCoordinate(poi.x, poi.y);
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: coord },
          properties: { name: s.name },
        };
      })
      .filter(Boolean);

    return { type: 'FeatureCollection' as const, features };
  }, [plan.stops, poiMap]);

  // Walking route line
  const routeGeoJSON = useMemo(() => {
    if (!nextStopCoord) return null;

    // Find the previous completed stop to draw route from
    const doneStops = plan.stops.filter((s) => s.state === 'done');
    const lastDone = doneStops[doneStops.length - 1];
    if (!lastDone) return null;

    const fromPoi = poiMap.get(lastDone.poiId);
    const toPoi = poiMap.get(currentStop.poiId);
    if (!fromPoi || !toPoi) return null;

    // Use walkway graph for pathfinding
    const nodes: MapNode[] = mapData.walkwayNodes.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      type: 'intersection' as const,
    }));
    const poiNodes: MapNode[] = mapData.pois.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      type: p.type as MapNode['type'],
      name: p.name,
    }));
    const allNodes = [...nodes, ...poiNodes];
    const path = findShortestPath(allNodes, mapData.edges, fromPoi.id, toPoi.id);

    if (!path || path.length < 2) return null;

    const coordinates = path.map((nodeId) => {
      const poi = poiMap.get(nodeId);
      if (poi) {
        return poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : poiToCoordinate(poi.x, poi.y);
      }
      const walkNode = mapData.walkwayNodes.find((n) => n.id === nodeId);
      if (walkNode) return poiToCoordinate(walkNode.x, walkNode.y);
      return KNOTTS_CENTER;
    });

    return {
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates },
      properties: {},
    };
  }, [plan.stops, currentStop.poiId, poiMap, mapData]);

  // Center camera on next stop when it changes
  useEffect(() => {
    if (cameraRef.current && nextStopCoord) {
      cameraRef.current.setCamera({
        centerCoordinate: nextStopCoord,
        zoomLevel: 17,
        animationDuration: 1000,
      });
    }
  }, [nextStopCoord]);

  if (!MAPBOX_AVAILABLE || !MapboxGL) {
    return (
      <Pressable onPress={toggleExpand} style={styles.unavailable}>
        <Text style={styles.unavailableText}>Map requires native build</Text>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable onPress={toggleExpand} style={styles.expandHandle}>
        <View style={styles.handleBar} />
      </Pressable>

      <MapboxGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: nextStopCoord ?? KNOTTS_CENTER,
            zoomLevel: 17,
          }}
        />

        {/* User location */}
        <MapboxGL.UserLocation visible animated />

        {/* Walking route line */}
        {routeGeoJSON && (
          <MapboxGL.ShapeSource id="copilot-route" shape={routeGeoJSON}>
            <MapboxGL.LineLayer
              id="copilot-route-line"
              style={{
                lineColor: colors.accent.primary,
                lineWidth: 3,
                lineOpacity: 0.6,
                lineCap: 'round',
                lineJoin: 'round',
                lineDasharray: [2, 3],
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Next stop — coral pin */}
        {nextStopCoord && (
          <MapboxGL.PointAnnotation
            id="next-stop"
            coordinate={nextStopCoord}
          >
            <View style={styles.nextPinContainer}>
              <View style={styles.nextPinDot} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Upcoming stops — dimmed */}
        <MapboxGL.ShapeSource id="upcoming-stops" shape={upcomingGeoJSON}>
          <MapboxGL.CircleLayer
            id="upcoming-circles"
            style={{
              circleRadius: 5,
              circleColor: colors.text.meta,
              circleOpacity: 0.3,
              circleStrokeWidth: 1,
              circleStrokeColor: '#FFFFFF',
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Completed stops — green */}
        <MapboxGL.ShapeSource id="completed-stops" shape={completedGeoJSON}>
          <MapboxGL.CircleLayer
            id="completed-circles"
            style={{
              circleRadius: 5,
              circleColor: colors.status.success,
              circleOpacity: 0.7,
              circleStrokeWidth: 1.5,
              circleStrokeColor: '#FFFFFF',
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
    </Animated.View>
  );
}

export const CoPilotMap = memo(CoPilotMapInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    ...shadows.small,
  },
  expandHandle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  map: {
    flex: 1,
  },
  unavailable: {
    height: COLLAPSED_HEIGHT,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  nextPinContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextPinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
});
