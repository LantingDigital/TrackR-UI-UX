import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
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
import { AddTicketFlow } from '../components/wallet/AddTicketFlow';
import { Ticket } from '../types/wallet';
import { usePOIAction } from '../features/parks/context/POIActionContext';

// Parks Hub components
import { ParkHubHeader } from '../features/parks/components/ParkHubHeader';
import { QuickActionRow } from '../features/parks/components/QuickActionRow';
import { ParkDashboard } from '../features/parks/components/ParkDashboard';
import {
  MOCK_WEATHER,
  MOCK_STEPS,
  RideWaitTime,
} from '../features/parks/data/mockDashboardData';
import { fetchWaitTimes } from '../services/waitTimes';
import { parkNameToSlug } from '../utils/parkAssets';
import { MyPassCard } from '../features/parks/components/MyPassCard';
import { ParkGuidesSection, GuideBottomSheet } from '../features/parks/components/ParkGuidesSection';
import { RideListView } from '../features/parks/components/RideListView';
import { FoodListView } from '../features/parks/components/FoodListView';
// Parks Hub modals (remaining — Guide is now handled by MorphingPill)
import { ParkSwitcherModal } from '../features/parks/modals/ParkSwitcherModal';

// Data
import { buildParkList } from '../features/parks/utils/parkDataUtils';
import { getGuidesForPark } from '../features/parks/data/mockParkGuides';
import { ParkGuide, ParkData, ParkPOI, ParkWaitTimesResponse } from '../features/parks/types';

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

const StaggeredSection = memo(function StaggeredSection({
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
});

// ============================================
// ParksScreen
// ============================================

export function ParksScreen() {
  const insets = useSafeAreaInsets();
  const { homeParkName, setHomeParkName } = useSettingsStore();
  const route = useRoute<RouteProp<ParksRouteParams, 'Parks'>>();
  const navigation = useNavigation<any>();

  const { tickets, addTicket } = useWallet();
  const { openPOI } = usePOIAction();
  // ---- Guide bottom sheet state (rendered at screen level, not inside scroll) ----
  const [selectedGuide, setSelectedGuide] = useState<ParkGuide | null>(null);
  const handleGuidePress = useCallback((guide: ParkGuide) => setSelectedGuide(guide), []);
  const handleGuideClose = useCallback(() => setSelectedGuide(null), []);

  // Cross-tab navigation: navigate to park detail for a specific coaster
  useEffect(() => {
    const coasterId = route.params?.targetCoasterId;
    if (!coasterId) return;
    // Consume param immediately to prevent re-triggering
    navigation.setParams({ targetCoasterId: undefined });
    const poi = getPOIByCoasterId(coasterId);
    if (!poi) return;
    // v2: will open map. For now, just open POI action sheet.
    openPOI(poi.id);
  }, [route.params?.targetCoasterId, navigation, openPOI]);

  // Fog only covers header + fade region — not full screen (reduces GPU compositing cost)
  const fogTotalHeight = useMemo(
    () => insets.top + HEADER_HEIGHT - FOG_OFFSET + FOG_FADE_PX,
    [insets.top],
  );

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
    if (!currentPark) return [];
    return getGuidesForPark(parkNameToSlug(currentPark.name));
  }, [currentPark]);

  // ---- Dynamic wait times from service ----
  const [waitTimesResponse, setWaitTimesResponse] = useState<ParkWaitTimesResponse | null>(null);

  useEffect(() => {
    if (!currentPark) return;
    const slug = parkNameToSlug(currentPark.name);
    fetchWaitTimes(slug).then((response) => {
      setWaitTimesResponse(response);
    });
  }, [currentPark]);

  // Simplified format for ParkDashboard's existing WaitTimesCard
  const waitTimes = useMemo<RideWaitTime[]>(() => {
    if (!waitTimesResponse) return [];
    return waitTimesResponse.rides.map((r) => ({
      id: r.id,
      name: r.name,
      waitMinutes: r.waitMinutes,
      isOpen: r.status === 'open',
    }));
  }, [waitTimesResponse]);

  // ---- Modal state ----
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [passDetailVisible, setPassDetailVisible] = useState(false);
  const [addTicketVisible, setAddTicketVisible] = useState(false);
  const [ridesListVisible, setRidesListVisible] = useState(false);
  const [foodListVisible, setFoodListVisible] = useState(false);

  // ---- Force-close MorphingPill switcher on tab blur ----
  const [forceCloseSwitcher, setForceCloseSwitcher] = useState(false);

  // ---- Auto-close all modals/sheets when tab loses focus ----
  useFocusEffect(
    useCallback(() => {
      // On focus: reset forceClose flag
      setForceCloseSwitcher(false);
      return () => {
        // On blur: close everything
        setSwitcherVisible(false);
        setPassDetailVisible(false);
        setAddTicketVisible(false);
        setRidesListVisible(false);
        setFoodListVisible(false);
        setSelectedGuide(null);
        setForceCloseSwitcher(true);
      };
    }, []),
  );

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

  // Quick action: Park stats — navigates to ParkDetailScreen
  const handleStatsPress = useCallback(() => {
    haptics.tap();
    if (currentPark) {
      navigation.navigate('ParkDetail', { parkName: currentPark.name });
    }
  }, [navigation, currentPark]);

  const closePassDetail = useCallback(() => setPassDetailVisible(false), []);
  const closeAddTicket = useCallback(() => setAddTicketVisible(false), []);

  // Quick action: Food list view
  const handleFoodPress = useCallback(() => {
    haptics.tap();
    setFoodListVisible(true);
  }, []);
  const closeFood = useCallback(() => setFoodListVisible(false), []);

  // Quick action: Rides list view
  const handleRidesPress = useCallback(() => {
    haptics.tap();
    setRidesListVisible(true);
  }, []);
  const closeRides = useCallback(() => setRidesListVisible(false), []);

  // ---- Hub layout (hooks MUST be above any early return to avoid hook count mismatch) ----
  const passTickets = useMemo(
    () => currentPark ? tickets.filter((t) => t.parkName === currentPark.name && t.status !== 'expired') : [],
    [tickets, currentPark],
  );

  // Unified pass handler: opens detail if pass exists, add-ticket flow otherwise
  const openPassDetail = useCallback(() => {
    if (passTickets.length > 0) {
      setPassDetailVisible(true);
    } else {
      setAddTicketVisible(true);
    }
  }, [passTickets.length]);

  const handleAddTicketComplete = useCallback(async (ticketData: Omit<Ticket, 'id' | 'addedAt' | 'isDefault' | 'isFavorite'>) => {
    try {
      await addTicket(ticketData);
    } catch (err) {
      console.error('Failed to add ticket:', err);
    }
    setAddTicketVisible(false);
  }, [addTicket]);

  // Stable POI arrays — empty for now (POIs were map-specific, v2)
  const pois = useMemo(() => [] as ParkPOI[], []);

  // Memoize inline styles that depend on insets (stable between renders for same insets)
  const scrollContentStyle = useMemo(
    () => [styles.scrollContent, { paddingTop: insets.top + HEADER_HEIGHT + spacing.xxl }],
    [insets.top],
  );
  const bottomSpacerStyle = useMemo(
    () => ({ height: insets.bottom + 100 }),
    [insets.bottom],
  );
  const fogContainerStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: fogTotalHeight,
      zIndex: 5,
    }),
    [fogTotalHeight],
  );
  const headerWrapperStyle = useMemo(
    () => [styles.headerContainer, { paddingTop: insets.top }],
    [insets.top],
  );

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

  return (
    <View style={styles.container}>
      {/* Scroll content — fills entire screen, scrolls behind header */}
      <Animated.ScrollView
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        removeClippedSubviews
      >
        {/* Quick actions */}
        <StaggeredSection index={0}>
          <QuickActionRow
            onStatsPress={handleStatsPress}
            onFoodPress={handleFoodPress}
            onRidesPress={handleRidesPress}
            onPassPress={openPassDetail}
          />
        </StaggeredSection>

        <View style={styles.sectionGap} />

        {/* Map preview */}
        <StaggeredSection index={1}>
          <ParkDashboard
            weather={MOCK_WEATHER}
            steps={MOCK_STEPS}
            waitTimes={waitTimes}
            onRidePress={openPOI}
          />
        </StaggeredSection>

        <View style={styles.sectionGap} />

        {/* My pass */}
        <StaggeredSection index={3} style={styles.sectionPadded}>
          <MyPassCard parkName={currentPark.name} onPress={openPassDetail} />
        </StaggeredSection>

        <View style={styles.sectionGap} />

        {/* Park guides (MorphingPill handled internally) */}
        {guides.length > 0 && (
          <>
            <StaggeredSection index={4}>
              <ParkGuidesSection guides={guides} onGuidePress={handleGuidePress} />
            </StaggeredSection>
            <View style={styles.sectionGap} />
          </>
        )}

        <View style={bottomSpacerStyle} />
      </Animated.ScrollView>

      {/* Fog gradient overlay — translucent, content visible through it */}
      <View style={fogContainerStyle} pointerEvents="none">
        <LinearGradient
          colors={fogGradient.colors as [string, string, ...string[]]}
          locations={fogGradient.locations as [number, number, ...number[]]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header — transparent, floats over content */}
      <View style={headerWrapperStyle}>
        <ParkHubHeader
          parkName={currentPark.name}
          location={currentPark.location}
          parkHours="Open Today: 10:00 AM – 10:00 PM"
          parks={parks}
          onSelectPark={handleParkSelect}
          progress={headerProgress}
          forceClose={forceCloseSwitcher}
        />
      </View>

      {/* ---- Ride & Food list views (z-index 140, below Guide at 150) ---- */}
      <RideListView
        visible={ridesListVisible}
        onClose={closeRides}
        pois={pois}
        waitTimes={waitTimes}
      />
      <FoodListView
        visible={foodListVisible}
        onClose={closeFood}
        pois={pois}
      />

      {/* ---- Guide bottom sheet (rendered at screen level so it covers everything) ---- */}
      <GuideBottomSheet
        guide={selectedGuide}
        visible={!!selectedGuide}
        onClose={handleGuideClose}
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

      {/* Add Ticket Flow (when no pass exists) */}
      <AddTicketFlow
        visible={addTicketVisible}
        onClose={closeAddTicket}
        onComplete={handleAddTicketComplete}
        existingTickets={tickets}
        initialParkName={currentPark.name}
      />
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
