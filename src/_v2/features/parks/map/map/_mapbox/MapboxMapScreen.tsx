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
  MAP_STYLE_URL,
  poiToCoordinate,
  poiToCoordinateWithBounds,
} from './mapboxConfig';
import { ParkMapConfig } from './parkMapRegistry';
import { MapInfoCard, INFO_CARD_HEIGHT } from './MapInfoCard';
import { MiniRouteBar, MINI_ROUTE_BAR_HEIGHT } from './MiniRouteBar';
import { MapControls } from './MapControls';
import { MapSearchBar } from './MapSearchBar';
import { RouteLayer } from './RouteLayer';
import { useDirections } from './useDirections';
import { useGeoFence } from './useGeoFence';
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

// ============================================
// MapboxMapScreen
// ============================================

interface MapboxMapScreenProps {
  visible: boolean;
  onClose: () => void;
  mapData: UnifiedParkMapData;
  /** Park map configuration (center, bounds, zoom). Required for multi-park support. */
  mapConfig: ParkMapConfig;
  /** Optional POI to fly to and auto-select when opening (e.g. from "View on Map") */
  targetPoi?: ParkPOI | null;
}

export function MapboxMapScreen({ visible, onClose, mapData, mapConfig, targetPoi }: MapboxMapScreenProps) {
  if (!MAPBOX_AVAILABLE || !MapboxGL) {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>Map requires a native build.</Text>
      </View>
    );
  }

  return (
    <MapboxMapScreenInner visible={visible} onClose={onClose} mapData={mapData} mapConfig={mapConfig} targetPoi={targetPoi} />
  );
}

/** Approximate tab bar height including safe area padding */
const TAB_BAR_TOTAL_HEIGHT = 90;

function MapboxMapScreenInner({ visible, onClose, mapData, mapConfig, targetPoi }: MapboxMapScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<ParkPOI | null>(null);
  const [routePoi, setRoutePoi] = useState<ParkPOI | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MapCategory>>(new Set());
  const [searchHighlightIds, setSearchHighlightIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const cameraRef = useRef<any>(null);
  const mapViewRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const { openCoasterSheet } = usePOIAction();
  const pendingTargetRef = useRef<ParkPOI | null>(null);

  // Park-specific coordinate converter
  const toCoord = useCallback(
    (x: number, y: number): [number, number] =>
      poiToCoordinateWithBounds(x, y, mapConfig.poiBoundsNE, mapConfig.poiBoundsSW),
    [mapConfig],
  );

  // Park title GeoJSON (dynamic per park)
  const parkTitleGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: mapConfig.center },
      properties: { name: mapConfig.displayName },
    }],
  }), [mapConfig]);

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

  // Geo-fence: check if user is within ~1 mile of the park
  const { isNearPark, userLocation } = useGeoFence(mapConfig.center);

  // Directions (with park-specific coordinate converter)
  const { route, fetchRoute, clearRoute, poiCoordinate } = useDirections(mapData, toCoord);

  // Adjust zoom controls position based on info card / mini bar visibility
  const miniBarZoomBottom = MINI_ROUTE_BAR_HEIGHT + spacing.md + spacing.lg;
  useEffect(() => {
    if (selectedPoi) {
      zoomBottomOffset.value = withTiming(elevatedZoomBottom, { duration: TIMING.normal });
    } else if (routePoi && route) {
      // Mini bar is visible — lift controls just above it
      zoomBottomOffset.value = withTiming(miniBarZoomBottom, { duration: TIMING.normal });
    } else {
      zoomBottomOffset.value = withTiming(defaultZoomBottom, { duration: TIMING.normal });
    }
  }, [selectedPoi, routePoi, route]);

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
    setRoutePoi(null);
    clearRoute();
    cameraRef.current?.setCamera({
      centerCoordinate: mapConfig.center,
      zoomLevel: mapConfig.zoom.default,
      padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
      animationDuration: 1000,
    });
  }, [clearRoute, mapConfig]);

  // Zoom out to overview when category filters are activated; deselect any POI
  useEffect(() => {
    if (activeFilters.size > 0) {
      if (selectedPoi) {
        setSelectedPoi(null);
        setRoutePoi(null);
        clearRoute();
      }
      cameraRef.current?.setCamera({
        centerCoordinate: mapConfig.center,
        zoomLevel: mapConfig.zoom.default,
        padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
        animationDuration: 1000,
      });
    }
  }, [activeFilters, mapConfig]);

  // Build GeoJSON from POI data (using park-specific coordinate converter)
  const poiGeoJSON = useMemo(() => poisToGeoJSON(mapData.pois, toCoord), [mapData.pois, toCoord]);

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
            : toCoord(targetPoi.x, targetPoi.y);

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
      setRoutePoi(null);
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
        setRoutePoi(null);
        clearRoute();
        // Animate camera back to true center (remove bottom padding)
        const [lng, lat] = poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : toCoord(poi.x, poi.y);
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
          animationDuration: 400,
        });
      } else {
        selectAndFlyToPoi(poi);
      }
    },
    [selectedPoi, clearRoute, toCoord],
  );

  // Shared helper — select a POI and fly the camera to it with cinematic zoom
  const selectAndFlyToPoi = useCallback(
    (poi: ParkPOI) => {
      setSelectedPoi(poi);
      setSearchHighlightIds(new Set());
      setSearchQuery('');
      setActiveFilters(new Set());
      setRoutePoi(null);
      clearRoute();
      const [lng, lat] = poi.lng != null && poi.lat != null
        ? [poi.lng, poi.lat]
        : toCoord(poi.x, poi.y);
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 18,
        padding: { paddingTop: infoPaddingTop, paddingBottom: infoPaddingBottom, paddingLeft: 0, paddingRight: 0 },
        animationDuration: 1000,
      });
    },
    [clearRoute, infoPaddingTop, infoPaddingBottom, toCoord],
  );

  // Handle map background tap → deselect
  const handleMapPress = useCallback(() => {
    if (selectedPoi) {
      setSelectedPoi(null);
      setRoutePoi(null);
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
    // Do NOT clear the route or routePoi — mini bar appears when info card closes with active route.
    cameraRef.current?.setCamera({
      padding: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 },
      animationDuration: 300,
    });
  }, []);

  // Navigate to POI (directions)
  const handleNavigate = useCallback(
    (poi: ParkPOI) => {
      // Use real user location as origin when at the park, else fall back to entrance POI
      let origin: [number, number];
      let originId: string | undefined;

      if (isNearPark && userLocation) {
        origin = [userLocation.longitude, userLocation.latitude];
      } else {
        const entrancePoi = mapData.pois.find((p) => p.id.startsWith('entrance-'));
        if (!entrancePoi) return;
        origin = poiCoordinate(entrancePoi);
        originId = entrancePoi.id;
      }

      const dest = poiCoordinate(poi);

      setRoutePoi(poi);
      fetchRoute(origin, dest, originId, poi.id, isNearPark);

      if (cameraRef.current) {
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
    [mapData.pois, fetchRoute, poiCoordinate, isNearPark, userLocation],
  );

  // Mini route bar — tapping re-opens the info card for the route destination
  const handleMiniBarTap = useCallback(() => {
    if (routePoi) {
      selectAndFlyToPoi(routePoi);
      // Re-set routePoi after selectAndFlyToPoi clears it (the route is still valid)
      // We don't re-fetch the route — just re-show the card
    }
  }, [routePoi, selectAndFlyToPoi]);

  const handleMiniBarDismiss = useCallback(() => {
    setRoutePoi(null);
    clearRoute();
  }, [clearRoute]);

  // Track actual camera zoom so +/- buttons stay in sync after fly-to or pinch
  const currentZoomRef = useRef<number>(mapConfig.zoom.default);
  const handleRegionChange = useCallback((feature: any) => {
    const zoom = feature?.properties?.zoomLevel;
    if (zoom != null) {
      currentZoomRef.current = zoom;
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const next = Math.min(currentZoomRef.current + 0.75, mapConfig.zoom.max);
    currentZoomRef.current = next;
    cameraRef.current?.zoomTo(next, 300);
  }, [mapConfig]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(currentZoomRef.current - 0.75, mapConfig.zoom.min);
    currentZoomRef.current = next;
    cameraRef.current?.zoomTo(next, 300);
  }, [mapConfig]);

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
              centerCoordinate: mapConfig.center,
              zoomLevel: mapConfig.zoom.default,
            }}
            minZoomLevel={mapConfig.zoom.min}
            maxZoomLevel={mapConfig.zoom.max}
            maxBounds={{
              ne: mapConfig.boundsNE,
              sw: mapConfig.boundsSW,
            }}
          />

          {/* Park title — bold, visible at overview zoom, fades as user zooms in.
              Hidden when any filter or search is active (the dots speak for themselves). */}
          <MapboxGL.ShapeSource id="park-title" shape={parkTitleGeoJSON}>
            <MapboxGL.SymbolLayer
              id="park-title-label"
              style={{
                textField: mapConfig.displayName,
                textSize: [
                  'interpolate', ['linear'], ['zoom'],
                  mapConfig.zoom.min, 24,
                  mapConfig.zoom.min + 0.4, 18,
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
                      mapConfig.zoom.min, 1,
                      mapConfig.zoom.min + 0.2, 0.6,
                      mapConfig.zoom.min + 0.5, 0,
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
            minZoom={mapConfig.zoom.min}
            coordConverter={toCoord}
          />

          {/* Walking route — always mounted to prevent map state corruption */}
          <RouteLayer route={route} />
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
          coordConverter={toCoord}
        />

        <MiniRouteBar
          poi={routePoi}
          visible={!!routePoi && !!route && !selectedPoi}
          onTap={handleMiniBarTap}
          onDismiss={handleMiniBarDismiss}
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
