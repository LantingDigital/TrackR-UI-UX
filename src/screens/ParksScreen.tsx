import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { SPRINGS } from '../constants/animations';
import { useSettingsStore } from '../stores/settingsStore';
import { useWallet } from '../hooks/useWallet';
import { haptics } from '../services/haptics';
import { PassDetailView } from '../components/wallet/PassDetailView';
import { usePOIAction } from '../features/parks/context/POIActionContext';

// Parks Hub components
import { ParkHubHeader } from '../features/parks/components/ParkHubHeader';
import { QuickActionRow } from '../features/parks/components/QuickActionRow';
import { ParkDashboard } from '../features/parks/components/ParkDashboard';
import {
  MOCK_WEATHER,
  MOCK_STEPS,
  MOCK_RIDE_WAIT_TIMES,
} from '../features/parks/data/mockDashboardData';
import { MyPassCard } from '../features/parks/components/MyPassCard';
import { ParkGuidesSection, GuideBottomSheet } from '../features/parks/components/ParkGuidesSection';
import { TripPlannerSection } from '../features/parks/tripPlanner/TripPlannerSection';

// Parks Hub modals (remaining — Guide is now handled by MorphingPill)
import { ParkSwitcherModal } from '../features/parks/modals/ParkSwitcherModal';
import { TripPlannerSheet } from '../features/parks/tripPlanner/TripPlannerSheet';
import { useTripPlannerStore } from '../features/parks/tripPlanner/tripPlannerStore';

// Map
import { MapboxMapScreen } from '../features/parks/map/MapboxMapScreen';

// Data
import { buildParkList } from '../features/parks/utils/parkDataUtils';
import { KNOTTS_GUIDES } from '../features/parks/data/mockParkGuides';
import { KNOTTS_MAP_DATA } from '../features/parks/data/knottsMapData';
import { ParkGuide, ParkData, ParkPOI } from '../features/parks/types';
import { useTourTarget } from '../features/tour';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getPOIByCoasterId } from '../features/parks/data/poiNameMap';

type ParksRouteParams = { Parks: { targetCoasterId?: string } };

// ============================================
// Constants
// ============================================

const COLLAPSE_THRESHOLD = 20; // Collapse after this many px of scroll
const HEADER_SPRING = { damping: 18, stiffness: 180, mass: 0.8 };

// Header layout height — used for scroll content offset & fog sizing
// paddingTop(8) + parkName line(~30) + location(~17) + marginTop(2) + paddingBottom(8) = ~65
const HEADER_HEIGHT = 65;

// Fog container extends to full screen — eliminates any compositing edge artifact
const SCREEN_HEIGHT = Dimensions.get('window').height;
const FOG_FADE_PX = 200; // Pixels of gradual fade below header
const FOG_OFFSET = 56;   // Start fade this many pixels ABOVE header bottom

// Page color in rgba for fog gradient
// colors.background.page = #F7F7F7 = rgb(247, 247, 247)
const PAGE_RGBA = 'rgba(247, 247, 247,';

// ============================================
// Staggered section wrapper
// ============================================

function StaggeredSection({
  index,
  children,
  style,
}: {
  index: number;
  children: React.ReactNode;
  style?: any;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 80,
      withSpring(1, SPRINGS.responsive),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ============================================
// ParksScreen
// ============================================

export function ParksScreen() {
  const insets = useSafeAreaInsets();
  const { homeParkName, setHomeParkName } = useSettingsStore();
  const route = useRoute<RouteProp<ParksRouteParams, 'Parks'>>();
  const navigation = useNavigation<any>();

  // ---- Tour targets ----
  const quickActionTourRef = useTourTarget('parks-quick-action-row');
  const dashboardTourRef = useTourTarget('parks-dashboard');
  const { tickets } = useWallet();
  const { openPOI, registerMapHandler } = usePOIAction();
  const tripStore = useTripPlannerStore();

  // ---- Guide bottom sheet state (rendered at screen level, not inside scroll) ----
  const [selectedGuide, setSelectedGuide] = useState<ParkGuide | null>(null);
  const handleGuidePress = useCallback((guide: ParkGuide) => setSelectedGuide(guide), []);
  const handleGuideClose = useCallback(() => setSelectedGuide(null), []);

  // ---- Map center for "View on Map" from POI action sheet ----
  const [mapTargetPoi, setMapTargetPoi] = useState<ParkPOI | null>(null);

  // Register map handler so POIActionContext can open the map and fly to a POI
  useEffect(() => {
    registerMapHandler((poi: ParkPOI) => {
      // Close guide sheet if open (so map comes to foreground)
      setSelectedGuide(null);
      setMapTargetPoi(poi);
      setMapModalVisible(true);
    });
  }, [registerMapHandler]);

  // Cross-tab navigation: open map targeting a specific coaster (from HomeScreen search)
  useEffect(() => {
    const coasterId = route.params?.targetCoasterId;
    if (!coasterId) return;
    // Consume param immediately to prevent re-triggering
    navigation.setParams({ targetCoasterId: undefined });
    const poi = getPOIByCoasterId(coasterId);
    if (!poi) return;
    setSelectedGuide(null);
    setMapTargetPoi(poi);
    setMapModalVisible(true);
  }, [route.params?.targetCoasterId, navigation]);

  // Fog covers full screen — gradient handles the visual boundary
  const fogTotalHeight = SCREEN_HEIGHT;

  // Compute gradient stops from actual pixel positions (not fixed percentages)
  const fogGradient = useMemo(() => {
    const headerEnd = (insets.top + HEADER_HEIGHT - FOG_OFFSET) / fogTotalHeight;
    const step = (FOG_FADE_PX / fogTotalHeight) / 10;
    return {
      colors: [
        `${PAGE_RGBA} 0.94)`,
        `${PAGE_RGBA} 0.94)`,
        `${PAGE_RGBA} 0.94)`,
        `${PAGE_RGBA} 0.82)`,
        `${PAGE_RGBA} 0.65)`,
        `${PAGE_RGBA} 0.45)`,
        `${PAGE_RGBA} 0.28)`,
        `${PAGE_RGBA} 0.15)`,
        `${PAGE_RGBA} 0.06)`,
        `${PAGE_RGBA} 0.02)`,
        `${PAGE_RGBA} 0.005)`,
        'transparent',
      ],
      locations: [
        0,
        headerEnd * 0.5,
        headerEnd,
        headerEnd + step * 1,
        headerEnd + step * 2,
        headerEnd + step * 3,
        headerEnd + step * 4,
        headerEnd + step * 5,
        headerEnd + step * 6,
        headerEnd + step * 7,
        headerEnd + step * 8,
        1,
      ],
    };
  }, [insets.top, fogTotalHeight]);

  // ---- Scroll-driven header animation ----
  // Pure distance-based: expanded at top, collapsed once scrolled past threshold
  const headerProgress = useSharedValue(1); // 1=expanded, 0=collapsed
  const isCollapsed = useSharedValue(0);

  const triggerCollapseHaptic = useCallback(() => haptics.tick(), []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const offsetY = event.contentOffset.y;

      if (offsetY <= 5) {
        // At the top — always expanded
        if (isCollapsed.value) {
          isCollapsed.value = 0;
          headerProgress.value = withSpring(1, HEADER_SPRING);
          runOnJS(triggerCollapseHaptic)();
        }
      } else if (offsetY > COLLAPSE_THRESHOLD && !isCollapsed.value) {
        // Scrolled past threshold — collapse
        isCollapsed.value = 1;
        headerProgress.value = withSpring(0, HEADER_SPRING);
        runOnJS(triggerCollapseHaptic)();
      }
    },
  });


  // ---- Data ----
  const parks = useMemo(() => buildParkList(), []);

  const currentPark = useMemo<ParkData | null>(() => {
    if (!homeParkName) return null;
    return parks.find((p) => p.name === homeParkName) ?? null;
  }, [parks, homeParkName]);

  const guides = useMemo<ParkGuide[]>(() => {
    if (currentPark?.name === "Knott's Berry Farm") return KNOTTS_GUIDES;
    return [];
  }, [currentPark]);

  // ---- Modal state ----
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tripPlannerVisible, setTripPlannerVisible] = useState(false);
  const [passDetailVisible, setPassDetailVisible] = useState(false);

  // ---- Handlers ----
  const openSwitcher = useCallback(() => setSwitcherVisible(true), []);
  const closeSwitcher = useCallback(() => setSwitcherVisible(false), []);

  const handleParkSelect = useCallback(
    (parkName: string) => {
      setHomeParkName(parkName);
      setSwitcherVisible(false);
    },
    [setHomeParkName],
  );

  const openMap = useCallback(() => {
    setMapTargetPoi(null);
    setMapModalVisible(true);
  }, []);
  const closeMap = useCallback(() => {
    setMapModalVisible(false);
    setMapTargetPoi(null);
  }, []);

  const openTripPlanner = useCallback(() => setTripPlannerVisible(true), []);
  const closeTripPlanner = useCallback(() => setTripPlannerVisible(false), []);

  const openPassDetail = useCallback(() => setPassDetailVisible(true), []);
  const closePassDetail = useCallback(() => setPassDetailVisible(false), []);

  // Quick action: Food placeholder
  const handleFoodPress = useCallback(() => {
    // Future: food search feature
    haptics.tap();
  }, []);

  // ---- First-time experience: no park selected ----
  if (!homeParkName || !currentPark) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎢</Text>
          <Text style={styles.emptyTitle}>Welcome to Parks</Text>
          <Text style={styles.emptySubtitle}>
            Choose your home park to get started
          </Text>
          <Pressable
            onPress={openSwitcher}
            style={({ pressed }) => [
              styles.chooseParkBtn,
              pressed && styles.chooseParkBtnPressed,
            ]}
          >
            <Text style={styles.chooseParkBtnText}>Choose Park</Text>
          </Pressable>
        </View>

        <ParkSwitcherModal
          visible={switcherVisible}
          onClose={closeSwitcher}
          onSelectPark={handleParkSelect}
          currentPark=""
        />
      </View>
    );
  }

  // ---- Hub layout ----
  const passTickets = tickets.filter(
    (t) => t.parkName === currentPark.name && t.status !== 'expired'
  );

  return (
    <View style={styles.container}>
      {/* Scroll content — fills entire screen, scrolls behind header */}
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          // Push content below header + safe area; extra gap keeps buttons clear of fog
          { paddingTop: insets.top + HEADER_HEIGHT + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Quick actions */}
        <StaggeredSection index={0}>
          <View ref={quickActionTourRef} collapsable={false}>
            <QuickActionRow
              onMapPress={openMap}
              onFoodPress={handleFoodPress}
              onRidesPress={openTripPlanner}
              onPassPress={openPassDetail}
            />
          </View>
        </StaggeredSection>

        <View style={styles.sectionGap} />

        {/* Map preview */}
        <StaggeredSection index={1}>
          <View ref={dashboardTourRef} collapsable={false}>
            <ParkDashboard
              weather={MOCK_WEATHER}
              steps={MOCK_STEPS}
              waitTimes={MOCK_RIDE_WAIT_TIMES}
              onRidePress={openPOI}
            />
          </View>
        </StaggeredSection>

        <View style={styles.sectionGap} />

        {/* My pass */}
        <StaggeredSection index={2} style={styles.sectionPadded}>
          <MyPassCard parkName={currentPark.name} onPress={openPassDetail} />
        </StaggeredSection>

        <View style={styles.sectionGap} />

        {/* Park guides (MorphingPill handled internally) */}
        {guides.length > 0 && (
          <>
            <StaggeredSection index={3}>
              <ParkGuidesSection guides={guides} onGuidePress={handleGuidePress} />
            </StaggeredSection>
            <View style={styles.sectionGap} />
          </>
        )}

        {/* Trip planner */}
        <StaggeredSection index={4} style={styles.sectionPadded}>
          <TripPlannerSection
            currentPlan={tripStore.currentPlan}
            onPress={openTripPlanner}
          />
        </StaggeredSection>

        <View style={{ height: insets.bottom + 100 }} />
      </Animated.ScrollView>

      {/* Fog gradient overlay — translucent, content visible through it */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: fogTotalHeight,
          zIndex: 5,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={fogGradient.colors as [string, string, ...string[]]}
          locations={fogGradient.locations as [number, number, ...number[]]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header — transparent, floats over content */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top },
        ]}
      >
        <ParkHubHeader
          parkName={currentPark.name}
          location={currentPark.location}
          parkHours="Open Today: 10:00 AM – 10:00 PM"
          parks={parks}
          onSelectPark={handleParkSelect}
          progress={headerProgress}
        />
      </View>

      {/* ---- Guide bottom sheet (rendered at screen level so it covers everything) ---- */}
      <GuideBottomSheet
        guide={selectedGuide}
        visible={!!selectedGuide}
        onClose={handleGuideClose}
      />

      {/* ---- Modals ---- */}
      {currentPark?.name === "Knott's Berry Farm" && (
        <MapboxMapScreen
          visible={mapModalVisible}
          onClose={closeMap}
          mapData={KNOTTS_MAP_DATA}
          targetPoi={mapTargetPoi}
        />
      )}

      <TripPlannerSheet
        visible={tripPlannerVisible}
        onClose={closeTripPlanner}
        parkId={currentPark.name}
        parkName={currentPark.name}
        mapData={KNOTTS_MAP_DATA}
      />

      {/* PassDetailView uses RN Modal (stays as-is) */}
      {passTickets.length > 0 && (
        <PassDetailView
          tickets={passTickets}
          initialIndex={0}
          visible={passDetailVisible}
          onClose={closePassDetail}
        />
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    // paddingTop is set inline (depends on insets)
  },
  sectionPadded: {
    paddingHorizontal: spacing.xl,
  },
  sectionGap: {
    height: spacing.lg,
  },

  // Empty state (first-time)
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  chooseParkBtn: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
  },
  chooseParkBtnPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  chooseParkBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
