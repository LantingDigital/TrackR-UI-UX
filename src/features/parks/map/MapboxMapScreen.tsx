import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UnifiedParkMapData, ParkPOI, MapCategory } from '../types';
import {
  MAPBOX_AVAILABLE,
  KNOTTS_CENTER,
  ZOOM,
  PARK_BOUNDS,
  MAP_STYLE_URL,
  poiToCoordinate,
} from './mapboxConfig';
import { MapInfoCard, INFO_CARD_HEIGHT } from './MapInfoCard';
import { MapControls } from './MapControls';
import { MapSearchBar } from './MapSearchBar';
import { RouteLayer } from './RouteLayer';
import { useDirections } from './useDirections';
import { POILayers } from './POILayers';
import { poisToGeoJSON } from './poiGeoJSON';
import { usePOIAction } from '../context/POIActionContext';
import { useTabBar } from '../../../contexts/TabBarContext';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { TIMING } from '../../../constants/animations';

// Conditionally import Mapbox
const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---- Park title GeoJSON (single point at park center) ----
const PARK_TITLE_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: KNOTTS_CENTER,
      },
      properties: { name: "Knott's Berry Farm" },
    },
  ],
};

// ============================================
// MapboxMapScreen
// ============================================

interface MapboxMapScreenProps {
  visible: boolean;
  onClose: () => void;
  mapData: UnifiedParkMapData;
  /** Optional POI to fly to and auto-select when opening (e.g. from "View on Map") */
  targetPoi?: ParkPOI | null;
}

export function MapboxMapScreen({ visible, onClose, mapData, targetPoi }: MapboxMapScreenProps) {
  if (!MAPBOX_AVAILABLE || !MapboxGL) {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>Map requires a native build.</Text>
      </View>
    );
  }

  return (
    <MapboxMapScreenInner visible={visible} onClose={onClose} mapData={mapData} targetPoi={targetPoi} />
  );
}

/** Approximate tab bar height including safe area padding */
const TAB_BAR_TOTAL_HEIGHT = 90;

function MapboxMapScreenInner({ visible, onClose, mapData, targetPoi }: MapboxMapScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<ParkPOI | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MapCategory>>(new Set());
  const [searchHighlightIds, setSearchHighlightIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const cameraRef = useRef<any>(null);
  const mapViewRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const { openCoasterSheet } = usePOIAction();
  const pendingTargetRef = useRef<ParkPOI | null>(null);

  // Hide base style labels (POI labels, water labels) on style load
  const handleStyleLoaded = useCallback(() => {
    // Hide base style POI labels (italic "Knott's Berry Farm" etc.)
    mapViewRef.current?.setSourceVisibility(false, 'composite', 'poi_label');
    // Hide water labels ("Reflection Lake" etc.)
    mapViewRef.current?.setSourceVisibility(false, 'composite', 'natural_label');
    mapViewRef.current?.setSourceVisibility(false, 'composite', 'water_label');
  }, []);

  // Modal animation
  const contentTranslateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Zoom controls bottom offset — animates between resting above tab bar vs above info card
  const defaultZoomBottom = TAB_BAR_TOTAL_HEIGHT + spacing.lg;
  const elevatedZoomBottom = INFO_CARD_HEIGHT + insets.bottom + spacing.md;
  const zoomBottomOffset = useSharedValue(defaultZoomBottom);

  // Camera padding when info card is visible — keeps POI visually centered in the gap
  // between the search bar and the info card, biased slightly lower for a natural feel
  const chipRowHeight = 30 + spacing.md; // chip height + gap
  const searchBarHeight = insets.top + spacing.md + 40 + spacing.md + chipRowHeight;
  const infoPaddingBottom = INFO_CARD_HEIGHT + insets.bottom + spacing.lg;
  const infoPaddingTop = searchBarHeight + 60; // extra 60px pushes dot lower than mathematical center

  // Hide tab bar when map is visible; adjust zoom controls when info card shows
  const tabBar = useTabBar();

  // Always hide tab bar while map is open — cleanup guarantees balanced hide/show
  useEffect(() => {
    if (!visible) return;
    tabBar?.hideTabBar(0);
    return () => tabBar?.showTabBar();
  }, [visible]);

  // Adjust zoom controls position based on info card visibility
  useEffect(() => {
    if (selectedPoi) {
      zoomBottomOffset.value = withTiming(elevatedZoomBottom, { duration: TIMING.normal });
    } else {
      zoomBottomOffset.value = withTiming(defaultZoomBottom, { duration: TIMING.normal });
    }
  }, [selectedPoi]);

  // Directions
  const { route, fetchRoute, clearRoute } = useDirections(mapData);

  // Category filter toggle
  const handleFilterToggle = useCallback((category: MapCategory) => {
    setSearchHighlightIds(new Set()); // clear search highlight when using category chips
    setSearchQuery('');
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }, []);

  // Search-as-filter: highlight specific POI IDs on the map
  const handleSearchFilter = useCallback((query: string, poiIds: Set<string>) => {
    setActiveFilters(new Set()); // clear category filters
    setSearchHighlightIds(poiIds);
    setSearchQuery(query);
    // Deselect any POI and zoom out
    setSelectedPoi(null);
    clearRoute();
    cameraRef.current?.setCamera({
      centerCoordinate: KNOTTS_CENTER,
      zoomLevel: ZOOM.default,
      padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
      animationDuration: 1000,
    });
  }, [clearRoute]);

  // Zoom out to overview when category filters are activated; deselect any POI
  useEffect(() => {
    if (activeFilters.size > 0) {
      if (selectedPoi) {
        setSelectedPoi(null);
        clearRoute();
      }
      cameraRef.current?.setCamera({
        centerCoordinate: KNOTTS_CENTER,
        zoomLevel: ZOOM.default,
        padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
        animationDuration: 1000,
      });
    }
  }, [activeFilters]);

  // Build GeoJSON from POI data
  const poiGeoJSON = useMemo(() => poisToGeoJSON(mapData.pois), [mapData.pois]);

  // Open / close animation
  useEffect(() => {
    if (visible) {
      setMounted(true);
      pendingTargetRef.current = targetPoi ?? null;
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      contentTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });

      // If we have a target POI, fly to it after the map slide-in completes
      if (targetPoi) {
        const coord: [number, number] =
          targetPoi.lng != null && targetPoi.lat != null
            ? [targetPoi.lng, targetPoi.lat]
            : poiToCoordinate(targetPoi.x, targetPoi.y);

        // Wait for slide-in (300ms) + a brief pause, then fly camera and auto-select
        const flyTimer = setTimeout(() => {
          cameraRef.current?.setCamera({
            centerCoordinate: coord,
            zoomLevel: 18,
            padding: { paddingTop: infoPaddingTop, paddingBottom: infoPaddingBottom, paddingLeft: 0, paddingRight: 0 },
            animationDuration: 1200,
          });
          // Select the POI after camera starts moving so the info card appears mid-flight
          const selectTimer = setTimeout(() => {
            if (pendingTargetRef.current?.id === targetPoi.id) {
              setSelectedPoi(targetPoi);
            }
          }, 400);
          return () => clearTimeout(selectTimer);
        }, 450);
        return () => clearTimeout(flyTimer);
      }
    } else {
      pendingTargetRef.current = null;
      setSelectedPoi(null);
      setActiveFilters(new Set());
      setSearchHighlightIds(new Set());
      setSearchQuery('');
      clearRoute();
      // Reset camera padding
      cameraRef.current?.setCamera({
        padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
        animationDuration: 0,
      });
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      contentTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Handle POI tap — toggle selection
  const handlePoiPress = useCallback(
    (poi: ParkPOI) => {
      if (selectedPoi?.id === poi.id) {
        // Tap same POI → deselect
        setSelectedPoi(null);
        clearRoute();
        // Animate camera back to true center (remove bottom padding)
        const [lng, lat] = poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : poiToCoordinate(poi.x, poi.y);
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
          animationDuration: 400,
        });
      } else {
        selectAndFlyToPoi(poi);
      }
    },
    [selectedPoi, clearRoute],
  );

  // Shared helper — select a POI and fly the camera to it with cinematic zoom
  const selectAndFlyToPoi = useCallback(
    (poi: ParkPOI) => {
      setSelectedPoi(poi);
      setSearchHighlightIds(new Set());
      setSearchQuery('');
      setActiveFilters(new Set());
      clearRoute();
      const [lng, lat] = poi.lng != null && poi.lat != null
        ? [poi.lng, poi.lat]
        : poiToCoordinate(poi.x, poi.y);
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 18,
        padding: { paddingTop: infoPaddingTop, paddingBottom: infoPaddingBottom, paddingLeft: 0, paddingRight: 0 },
        animationDuration: 1000,
      });
    },
    [clearRoute, infoPaddingTop, infoPaddingBottom],
  );

  // Handle map background tap → deselect
  const handleMapPress = useCallback(() => {
    if (selectedPoi) {
      setSelectedPoi(null);
      clearRoute();
      // Remove bottom padding so map re-centers
      cameraRef.current?.setCamera({
        padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
        animationDuration: 300,
      });
    }
  }, [selectedPoi, clearRoute]);

  const handleInfoCardClose = useCallback(() => {
    setSelectedPoi(null);
    clearRoute();
    cameraRef.current?.setCamera({
      padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
      animationDuration: 300,
    });
  }, [clearRoute]);

  // Navigate to POI (directions)
  const handleNavigate = useCallback(
    (poi: ParkPOI) => {
      const entrancePoi = mapData.pois.find((p) => p.id === 'entrance-main');
      if (!entrancePoi) return;

      fetchRoute(
        poiToCoordinate(entrancePoi.x, entrancePoi.y),
        poiToCoordinate(poi.x, poi.y),
        entrancePoi.id,
        poi.id,
      );

      if (cameraRef.current) {
        const origin = poiToCoordinate(entrancePoi.x, entrancePoi.y);
        const dest = poiToCoordinate(poi.x, poi.y);
        const sw: [number, number] = [
          Math.min(origin[0], dest[0]),
          Math.min(origin[1], dest[1]),
        ];
        const ne: [number, number] = [
          Math.max(origin[0], dest[0]),
          Math.max(origin[1], dest[1]),
        ];
        cameraRef.current.fitBounds(ne, sw, [80, 80, 320, 80], 1000);
      }
    },
    [mapData.pois, fetchRoute],
  );

  // Track actual camera zoom so +/- buttons stay in sync after fly-to or pinch
  const currentZoomRef = useRef<number>(ZOOM.default);
  const handleRegionChange = useCallback((feature: any) => {
    const zoom = feature?.properties?.zoomLevel;
    if (zoom != null) {
      currentZoomRef.current = zoom;
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const next = Math.min(currentZoomRef.current + 0.75, ZOOM.max as number);
    currentZoomRef.current = next;
    cameraRef.current?.zoomTo(next, 300);
  }, []);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(currentZoomRef.current - 0.75, ZOOM.min as number);
    currentZoomRef.current = next;
    cameraRef.current?.zoomTo(next, 300);
  }, []);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <Animated.View style={[styles.content, contentStyle]}>
        <MapboxGL.MapView
          ref={mapViewRef}
          style={styles.map}
          styleURL={MAP_STYLE_URL}
          rotateEnabled={false}
          pitchEnabled={false}
          attributionEnabled={false}
          logoEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onPress={handleMapPress}
          onDidFinishLoadingStyle={handleStyleLoaded}
          onRegionIsChanging={handleRegionChange}
          onRegionDidChange={handleRegionChange}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: KNOTTS_CENTER,
              zoomLevel: ZOOM.default,
            }}
            minZoomLevel={ZOOM.min}
            maxZoomLevel={ZOOM.max}
            maxBounds={{
              ne: PARK_BOUNDS.ne,
              sw: PARK_BOUNDS.sw,
            }}
          />

          {/* Park title — bold, visible at overview zoom, fades as user zooms in.
              Hidden when any filter or search is active (the dots speak for themselves). */}
          <MapboxGL.ShapeSource id="park-title" shape={PARK_TITLE_GEOJSON}>
            <MapboxGL.SymbolLayer
              id="park-title-label"
              style={{
                textField: "Knott's Berry Farm",
                textSize: [
                  'interpolate', ['linear'], ['zoom'],
                  15.7, 24,
                  16.1, 18,
                ],
                textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                textColor: '#333333',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 2,
                textAllowOverlap: true,
                textIgnorePlacement: true,
                textOpacity: activeFilters.size > 0 || searchHighlightIds.size > 0
                  ? 0
                  : [
                      'interpolate', ['linear'], ['zoom'],
                      15.7, 1,
                      15.9, 0.6,
                      16.2, 0,
                    ],
                textOpacityTransition: { duration: 400, delay: 0 },
              }}
            />
          </MapboxGL.ShapeSource>

          {/* POI dot + label layers */}
          <POILayers
            geoJSON={poiGeoJSON}
            selectedPoi={selectedPoi}
            onPoiPress={handlePoiPress}
            pois={mapData.pois}
            activeFilters={activeFilters}
            searchHighlightIds={searchHighlightIds}
          />

          {/* Walking route */}
          {route && <RouteLayer route={route} />}
        </MapboxGL.MapView>

        <MapSearchBar
          pois={mapData.pois}
          onSelectPoi={selectAndFlyToPoi}
          onSearchFilter={handleSearchFilter}
          onClose={onClose}
          insetTop={insets.top}
          activeFilters={activeFilters}
          onFilterToggle={handleFilterToggle}
        />

        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          bottomOffset={zoomBottomOffset}
        />

        <MapInfoCard
          poi={selectedPoi}
          onClose={handleInfoCardClose}
          onNavigate={handleNavigate}
          onViewDetails={openCoasterSheet}
        />
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
  },
  content: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  unavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.page,
  },
  unavailableText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
