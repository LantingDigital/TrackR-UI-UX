import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker, PoiClickEvent, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { UnifiedParkMapData, ParkPOI, MapCategory } from '../types';
import { ParkMapConfig } from './parkMapRegistry';
import { MapInfoCard, INFO_CARD_HEIGHT } from './MapInfoCard';
import { MapControls } from './MapControls';
import { MapSearchBar } from './MapSearchBar';
import { poiToCoordinateWithBounds } from './mapboxConfig';
import { usePOIAction } from '../context/POIActionContext';
import { useTabBar } from '../../../contexts/TabBarContext';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { TIMING } from '../../../constants/animations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Google Maps custom style — clean, premium
// ============================================

const GOOGLE_MAP_STYLE = [
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9d6e3' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f0f0f0' }],
  },
];

// ============================================
// GoogleMapScreen
// ============================================

interface GoogleMapScreenProps {
  visible: boolean;
  onClose: () => void;
  mapData: UnifiedParkMapData;
  mapConfig: ParkMapConfig;
  targetPoi?: ParkPOI | null;
}

export function GoogleMapScreen({ visible, onClose, mapData, mapConfig, targetPoi }: GoogleMapScreenProps) {
  return (
    <GoogleMapScreenInner
      visible={visible}
      onClose={onClose}
      mapData={mapData}
      mapConfig={mapConfig}
      targetPoi={targetPoi}
    />
  );
}

/** Approximate tab bar height including safe area padding */
const TAB_BAR_TOTAL_HEIGHT = 90;

/** Convert [lng, lat] to { latitude, longitude } for react-native-maps */
function toLatLng(lngLat: [number, number]) {
  return { latitude: lngLat[1], longitude: lngLat[0] };
}

/** Calculate a delta that shows the park at the right zoom level.
 *  Higher zoom.min → smaller area → smaller delta */
function zoomToDelta(zoom: number): { latitudeDelta: number; longitudeDelta: number } {
  // Mapbox zoom level to approximate lat delta
  // zoom 15 ≈ 0.015, zoom 16 ≈ 0.0075, zoom 17 ≈ 0.00375
  const delta = 360 / Math.pow(2, zoom) / 2;
  return { latitudeDelta: delta, longitudeDelta: delta };
}

function GoogleMapScreenInner({ visible, onClose, mapData, mapConfig, targetPoi }: GoogleMapScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<ParkPOI | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MapCategory>>(new Set());
  const [searchHighlightIds, setSearchHighlightIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { openCoasterSheet } = usePOIAction();
  const pendingTargetRef = useRef<ParkPOI | null>(null);

  // Park-specific coordinate converter
  const toCoord = useCallback(
    (x: number, y: number): [number, number] =>
      poiToCoordinateWithBounds(x, y, mapConfig.poiBoundsNE, mapConfig.poiBoundsSW),
    [mapConfig],
  );

  // Modal animation
  const contentTranslateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Zoom controls bottom offset
  const defaultZoomBottom = TAB_BAR_TOTAL_HEIGHT + spacing.lg;
  const elevatedZoomBottom = INFO_CARD_HEIGHT + insets.bottom + spacing.md;
  const zoomBottomOffset = useSharedValue(defaultZoomBottom);

  // Hide tab bar when map is visible
  const tabBar = useTabBar();

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

  // Category filter toggle
  const handleFilterToggle = useCallback((category: MapCategory) => {
    setSearchHighlightIds(new Set());
    setSearchQuery('');
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }, []);

  // Search-as-filter
  const handleSearchFilter = useCallback((query: string, poiIds: Set<string>) => {
    setActiveFilters(new Set());
    setSearchHighlightIds(poiIds);
    setSearchQuery(query);
    setSelectedPoi(null);
    // Zoom back to overview
    const center = toLatLng(mapConfig.center);
    const deltas = zoomToDelta(mapConfig.zoom.default);
    mapRef.current?.animateToRegion({ ...center, ...deltas }, 1000);
  }, [mapConfig]);

  // Zoom out when category filters are activated
  useEffect(() => {
    if (activeFilters.size > 0) {
      if (selectedPoi) {
        setSelectedPoi(null);
      }
      const center = toLatLng(mapConfig.center);
      const deltas = zoomToDelta(mapConfig.zoom.default);
      mapRef.current?.animateToRegion({ ...center, ...deltas }, 1000);
    }
  }, [activeFilters, mapConfig]);

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

        const flyTimer = setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              ...toLatLng(coord),
              latitudeDelta: 0.003,
              longitudeDelta: 0.003,
            },
            1200,
          );
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
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      contentTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Fly to a POI and select it. Optional overrideCoordinate uses Google's
  // more-accurate position instead of our parkMapRegistry data.
  const selectAndFlyToPoi = useCallback(
    (poi: ParkPOI, overrideCoordinate?: { latitude: number; longitude: number }) => {
      setSelectedPoi(poi);
      setSearchHighlightIds(new Set());
      setSearchQuery('');
      setActiveFilters(new Set());

      const target = overrideCoordinate ?? (() => {
        const [lng, lat] = poi.lng != null && poi.lat != null
          ? [poi.lng, poi.lat]
          : toCoord(poi.x, poi.y);
        return { latitude: lat, longitude: lng };
      })();

      mapRef.current?.animateToRegion(
        {
          ...target,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        1000,
      );
    },
    [toCoord],
  );

  // Handle POI tap — Google Maps built-in POIs via onPoiClick.
  // Uses fuzzy name matching and leverages Google's coordinate (more accurate
  // than our parkMapRegistry data) for camera animation and navigation.
  const handlePoiClick = useCallback((event: PoiClickEvent) => {
    const { coordinate, name, placeId } = event.nativeEvent;

    // Fuzzy match: strip non-alphanumeric chars and compare
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedPoi = mapData.pois.find((p) => {
      const normalizedPoiName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        normalizedPoiName === normalizedName ||
        normalizedPoiName.includes(normalizedName) ||
        normalizedName.includes(normalizedPoiName)
      );
    });

    if (matchedPoi) {
      // Use Google's coordinate — it's positioned on the actual POI
      selectAndFlyToPoi(matchedPoi, coordinate);
    } else {
      // Unknown POI from Google Maps — show basic info with a temporary POI object
      const tempPoi: ParkPOI = {
        id: `google-${placeId || Date.now()}`,
        name,
        x: 0,
        y: 0,
        lng: coordinate.longitude,
        lat: coordinate.latitude,
        type: 'attraction',
        area: '' as ParkPOI['area'],
      };
      setSelectedPoi(tempPoi);
      mapRef.current?.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        1000,
      );
    }
  }, [mapData.pois, selectAndFlyToPoi]);

  // Handle map background tap — deselect
  const handleMapPress = useCallback(() => {
    if (selectedPoi) {
      setSelectedPoi(null);
    }
  }, [selectedPoi]);

  const handleInfoCardClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // Open Apple Maps (or Google Maps fallback) for walking directions to a POI
  const handleGetDirections = useCallback(
    (poi: ParkPOI) => {
      const [lng, lat] = poi.lng != null && poi.lat != null
        ? [poi.lng, poi.lat]
        : toCoord(poi.x, poi.y);

      // Apple Maps deep link with walking directions
      const appleMapsUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
      // Google Maps fallback
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

      Linking.canOpenURL(appleMapsUrl).then((supported) => {
        if (supported) {
          Linking.openURL(appleMapsUrl);
        } else {
          Linking.openURL(googleMapsUrl);
        }
      });
    },
    [toCoord],
  );

  // Zoom controls
  const currentZoomRef = useRef<number>(mapConfig.zoom.default);

  const handleRegionChange = useCallback((region: Region) => {
    // Approximate zoom from latitudeDelta
    const zoom = Math.log2(360 / region.latitudeDelta) - 1;
    currentZoomRef.current = zoom;
  }, []);

  const handleZoomIn = useCallback(() => {
    const next = Math.min(currentZoomRef.current + 0.75, mapConfig.zoom.max);
    currentZoomRef.current = next;
    const deltas = zoomToDelta(next);
    // Get current center from mapRef (or fall back to config)
    mapRef.current?.getCamera().then((camera) => {
      if (camera?.center) {
        mapRef.current?.animateToRegion(
          {
            latitude: camera.center.latitude,
            longitude: camera.center.longitude,
            ...deltas,
          },
          300,
        );
      }
    });
  }, [mapConfig]);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(currentZoomRef.current - 0.75, mapConfig.zoom.min);
    currentZoomRef.current = next;
    const deltas = zoomToDelta(next);
    mapRef.current?.getCamera().then((camera) => {
      if (camera?.center) {
        mapRef.current?.animateToRegion(
          {
            latitude: camera.center.latitude,
            longitude: camera.center.longitude,
            ...deltas,
          },
          300,
        );
      }
    });
  }, [mapConfig]);

  // Filtered POIs for custom markers
  const filteredPois = useMemo(() => {
    let pois = mapData.pois;

    // Category filter
    if (activeFilters.size > 0) {
      pois = pois.filter(p => activeFilters.has(getMapCategory(p)));
    }

    // Search filter
    if (searchHighlightIds.size > 0) {
      pois = pois.filter(p => searchHighlightIds.has(p.id));
    }

    return pois;
  }, [mapData.pois, activeFilters, searchHighlightIds]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (!mounted) return null;

  const initialRegion = {
    ...toLatLng(mapConfig.center),
    ...zoomToDelta(mapConfig.zoom.default),
  };

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <Animated.View style={[styles.content, contentStyle]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          customMapStyle={GOOGLE_MAP_STYLE}
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          showsScale={false}
          showsTraffic={false}
          showsBuildings={false}
          showsIndoors={false}
          showsPointsOfInterest={false}
          toolbarEnabled={false}
          mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          minZoomLevel={mapConfig.zoom.min}
          maxZoomLevel={mapConfig.zoom.max}
          onMapReady={() => {
            // Add slight padding to park bounds to prevent feeling cramped at edges
            const PAD = 0.002;
            mapRef.current?.setMapBoundaries(
              { latitude: mapConfig.boundsNE[1] + PAD, longitude: mapConfig.boundsNE[0] + PAD },
              { latitude: mapConfig.boundsSW[1] - PAD, longitude: mapConfig.boundsSW[0] - PAD },
            );
          }}
          onPress={handleMapPress}
          onPoiClick={handlePoiClick}
          onRegionChangeComplete={handleRegionChange}
        >
          {/* Custom POI markers — compact icon-only, label on select */}
          {filteredPois.map((poi) => {
            const [lng, lat] = poi.lng != null && poi.lat != null
              ? [poi.lng, poi.lat]
              : toCoord(poi.x, poi.y);
            const isSelected = selectedPoi?.id === poi.id;
            const category = getMapCategory(poi);
            return (
              <Marker
                key={poi.id}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => selectAndFlyToPoi(poi)}
                tracksViewChanges={isSelected}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={markerStyles.container}>
                  <View style={[markerStyles.dot, { backgroundColor: getCategoryColor(category) }]}>
                    <Ionicons name={getCategoryIcon(category)} size={8} color="#FFFFFF" />
                  </View>
                  {isSelected && (
                    <View style={markerStyles.labelContainer}>
                      <Text style={markerStyles.label} numberOfLines={1}>{poi.name}</Text>
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>

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
          onNavigate={handleGetDirections}
          onViewDetails={openCoasterSheet}
          coordConverter={toCoord}
        />
      </Animated.View>
    </View>
  );
}

// ============================================
// Category helpers
// ============================================

/**
 * Determine the map rendering category for a POI.
 * Rides with a coasterId are promoted to 'coaster';
 * theater / attraction types map to 'show'.
 */
function getMapCategory(poi: ParkPOI): MapCategory {
  if (poi.type === 'ride' && poi.coasterId) return 'coaster';
  if (poi.type === 'theater' || poi.type === 'attraction') return 'show';
  if (poi.type === 'ride') return 'ride';
  if (poi.type === 'food') return 'food';
  if (poi.type === 'shop') return 'shop';
  if (poi.type === 'service') return 'service';
  return 'service';
}

function getCategoryColor(category: MapCategory): string {
  switch (category) {
    case 'coaster': return '#E53935';   // red
    case 'ride': return '#E53935';      // red (same as coasters — rides/coasters group)
    case 'food': return '#FF9800';      // orange
    case 'shop': return '#1E88E5';      // blue
    case 'show': return '#7B1FA2';      // purple
    case 'service': return '#757575';   // gray
    default: return '#00897B';          // teal
  }
}

function getCategoryIcon(category: MapCategory): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'coaster': return 'flash';
    case 'ride': return 'happy';
    case 'food': return 'restaurant';
    case 'shop': return 'bag';
    case 'show': return 'musical-notes';
    case 'service': return 'information-circle';
    default: return 'ellipse';
  }
}

// ============================================
// Styles
// ============================================

const markerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  labelContainer: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    maxWidth: 120,
  },
  label: {
    fontSize: 9,
    fontWeight: typography.weights.semibold as '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});

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
});
