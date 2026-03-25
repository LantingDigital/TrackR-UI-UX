/**
 * OnboardingParksEmbed — Full Parks Hub demo for onboarding.
 * Recreates the real ParksScreen layout: header, quick actions, wait times,
 * pass card, park guides. Auto-demos:
 *  - Wait time carousel scroll
 *  - Quick action tap → Food overlay
 *  - My Pass card tap → pass overlay
 *  - Park guide tap → guide overlay
 *  - "Change" pill → park switcher morph (arc-based transform animation)
 *
 * Self-contained — no stores, contexts, or navigation.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Demo Data — Cedar Point
// ============================================

interface WaitTimeEntry {
  id: string;
  name: string;
  waitMinutes: number;
  isOpen: boolean;
}

const CEDAR_POINT_WAIT_TIMES: WaitTimeEntry[] = [
  { id: 'sv', name: 'Steel Vengeance', waitMinutes: 45, isOpen: true },
  { id: 'mf', name: 'Millennium Force', waitMinutes: 30, isOpen: true },
  { id: 'mav', name: 'Maverick', waitMinutes: 60, isOpen: true },
  { id: 'tt2', name: 'Top Thrill 2', waitMinutes: 0, isOpen: false },
  { id: 'rap', name: 'Raptor', waitMinutes: 15, isOpen: true },
  { id: 'val', name: 'Valravn', waitMinutes: 25, isOpen: true },
  { id: 'gem', name: 'Gemini', waitMinutes: 10, isOpen: true },
  { id: 'gk', name: 'GateKeeper', waitMinutes: 20, isOpen: true },
];

function getWaitColor(minutes: number, isOpen: boolean): string {
  if (!isOpen) return colors.text.meta;
  if (minutes <= 15) return '#28A745';
  if (minutes <= 30) return '#F9A825';
  if (minutes <= 45) return '#E8734A';
  return '#DC3545';
}

// Quick actions
const QUICK_ACTIONS = [
  { key: 'stats', label: 'Stats', icon: 'stats-chart-outline' as const, color: '#5B8DEF' },
  { key: 'food', label: 'Food', icon: 'restaurant-outline' as const, color: '#E8734A' },
  { key: 'rides', label: 'Rides', icon: 'flash-outline' as const, color: '#9B6DD7' },
  { key: 'pass', label: 'Pass', icon: 'ticket-outline' as const, color: colors.accent.primary },
];

// Park switcher list
const PARK_LIST = [
  { name: 'Cedar Point', location: 'Sandusky, Ohio', count: 17, current: true },
  { name: 'Kings Island', location: 'Mason, Ohio', count: 15, current: false },
  { name: 'Carowinds', location: 'Charlotte, NC', count: 14, current: false },
  { name: 'Busch Gardens Tampa', location: 'Tampa, Florida', count: 12, current: false },
  { name: 'Dollywood', location: 'Pigeon Forge, TN', count: 10, current: false },
  { name: 'Hersheypark', location: 'Hershey, PA', count: 15, current: false },
];

// Park guides
const PARK_GUIDES = [
  { id: 'g1', icon: 'restaurant-outline' as const, title: 'Best Food Spots', preview: 'Top rated restaurants and snack stands', category: 'FOOD', readTime: '3 min' },
  { id: 'g2', icon: 'timer-outline' as const, title: 'Beat the Lines', preview: 'Pro tips for minimizing wait times', category: 'TIPS', readTime: '5 min' },
  { id: 'g3', icon: 'people-outline' as const, title: 'Family Guide', preview: 'Best rides for families with kids', category: 'FAMILY', readTime: '4 min' },
];

// Demo food items
const FOOD_ITEMS = [
  { name: 'Hugo\'s Italian Kitchen', type: 'Restaurant', rating: '4.3' },
  { name: 'BackBeatQue', type: 'BBQ', rating: '4.5' },
  { name: 'Melt Bar & Grilled', type: 'American', rating: '4.1' },
  { name: 'Miss Keat\'s Smokehouse', type: 'Smokehouse', rating: '4.0' },
];

// ============================================
// Animation constants
// ============================================
const ENTRANCE_TIMING = { duration: 250, easing: Easing.out(Easing.cubic) };
const STAGGER_DELAY = 80;

// Morph dimensions
const PILL_W = 80;
const PILL_H = 32;
const EXPANDED_W = SCREEN_WIDTH - 32;
const EXPANDED_H = 420;

// ============================================
// Component
// ============================================

interface OnboardingParksEmbedProps {
  isActive: boolean;
}

export const OnboardingParksEmbed: React.FC<OnboardingParksEmbedProps> = ({ isActive }) => {
  // ── Timer management ──
  const allTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoActiveRef = useRef(false);
  const wtScrollRef = useRef<ScrollView>(null);
  const morphPillRef = useRef<MorphingPillRef>(null);

  const clearAllTimers = useCallback(() => {
    allTimersRef.current.forEach(t => clearTimeout(t));
    allTimersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    allTimersRef.current.push(t);
    return t;
  }, []);

  // ── Shared values ──
  // Entrance stagger
  const headerEntrance = useSharedValue(0);
  const quickActionEntrance = useSharedValue(0);
  const waitTimesEntrance = useSharedValue(0);
  const passEntrance = useSharedValue(0);
  const guidesEntrance = useSharedValue(0);

  // Individual QA pill stagger
  const qa0 = useSharedValue(0);
  const qa1 = useSharedValue(0);
  const qa2 = useSharedValue(0);
  const qa3 = useSharedValue(0);

  // Wait time pill stagger
  const wt0 = useSharedValue(0);
  const wt1 = useSharedValue(0);
  const wt2 = useSharedValue(0);
  const wt3 = useSharedValue(0);
  const wt4 = useSharedValue(0);
  const wt5 = useSharedValue(0);
  const wt6 = useSharedValue(0);
  const wt7 = useSharedValue(0);
  const wtValues = [wt0, wt1, wt2, wt3, wt4, wt5, wt6, wt7];

  // Park switcher highlight
  const highlightIndex = useSharedValue(-1);

  // Overlays (food, pass, guide)
  const foodOverlay = useSharedValue(0);
  const passOverlay = useSharedValue(0);
  const guideOverlay = useSharedValue(0);

  // QA highlight (which pill is "tapped")
  const qaHighlight = useSharedValue(-1);

  // ── Animated styles (entrance) ──
  const makeEntranceStyle = (sv: SharedValue<number>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ translateY: (1 - sv.value) * 20 }],
    }));

  const headerStyle = makeEntranceStyle(headerEntrance);
  const quickActionStyle = makeEntranceStyle(quickActionEntrance);
  const waitTimesStyle = makeEntranceStyle(waitTimesEntrance);
  const passStyle = makeEntranceStyle(passEntrance);
  const guidesStyle = makeEntranceStyle(guidesEntrance);

  // Individual QA pill styles
  const qaStyles = [qa0, qa1, qa2, qa3].map(sv =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ translateY: (1 - sv.value) * 12 }],
    }))
  );

  // Wait time pill styles
  const wtStyles = wtValues.map(sv =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ translateY: (1 - sv.value) * 12 }],
    }))
  );

  // ── Overlay styles ──
  const foodOverlayStyle = useAnimatedStyle(() => ({
    opacity: foodOverlay.value,
    transform: [{ translateY: interpolate(foodOverlay.value, [0, 1], [40, 0], Extrapolation.CLAMP) }],
    pointerEvents: foodOverlay.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  const passOverlayStyle = useAnimatedStyle(() => ({
    opacity: passOverlay.value,
    transform: [{ translateY: interpolate(passOverlay.value, [0, 1], [40, 0], Extrapolation.CLAMP) }],
    pointerEvents: passOverlay.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  const guideOverlayStyle = useAnimatedStyle(() => ({
    opacity: guideOverlay.value,
    transform: [{ translateY: interpolate(guideOverlay.value, [0, 1], [40, 0], Extrapolation.CLAMP) }],
    pointerEvents: guideOverlay.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  // QA highlight pulse (shows which pill is being "tapped")
  const qaHighlightStyles = [0, 1, 2, 3].map(i =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: qaHighlight.value === i ? 0.6 : 1,
      transform: [{ scale: qaHighlight.value === i ? 0.93 : 1 }],
    }))
  );

  // ── Reset ──
  const resetAnimations = useCallback(() => {
    headerEntrance.value = 0;
    quickActionEntrance.value = 0;
    waitTimesEntrance.value = 0;
    passEntrance.value = 0;
    guidesEntrance.value = 0;
    qa0.value = 0; qa1.value = 0; qa2.value = 0; qa3.value = 0;
    wtValues.forEach(sv => { sv.value = 0; });
    highlightIndex.value = -1;
    morphPillRef.current?.reset();
    foodOverlay.value = 0;
    passOverlay.value = 0;
    guideOverlay.value = 0;
    qaHighlight.value = -1;
  }, []);

  // ── Demo loop ──
  const startDemoRef = useRef<() => void>(() => {});

  const startDemo = useCallback(() => {
    if (!demoActiveRef.current) return;

    let t = 0;

    // ── Phase 1: Staggered entrance (0-1.2s) ──
    headerEntrance.value = withTiming(1, ENTRANCE_TIMING);
    quickActionEntrance.value = withDelay(STAGGER_DELAY, withTiming(1, ENTRANCE_TIMING));

    // QA pills stagger
    qa0.value = withDelay(STAGGER_DELAY * 2, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));
    qa1.value = withDelay(STAGGER_DELAY * 2 + 80, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));
    qa2.value = withDelay(STAGGER_DELAY * 2 + 160, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));
    qa3.value = withDelay(STAGGER_DELAY * 2 + 240, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));

    waitTimesEntrance.value = withDelay(STAGGER_DELAY * 3, withTiming(1, ENTRANCE_TIMING));

    // WT pills stagger
    wtValues.forEach((sv, i) => {
      sv.value = withDelay(STAGGER_DELAY * 4 + i * 60, withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 }));
    });

    passEntrance.value = withDelay(STAGGER_DELAY * 5, withTiming(1, ENTRANCE_TIMING));
    guidesEntrance.value = withDelay(STAGGER_DELAY * 6, withTiming(1, ENTRANCE_TIMING));

    t = 1800;

    // ── Phase 2: Wait time carousel scroll (slow with pause at each end) ──
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      wtScrollRef.current?.scrollTo({ x: 250, animated: true });
    }, t);
    t += 2500; // pause at scrolled position

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      wtScrollRef.current?.scrollTo({ x: 0, animated: true });
    }, t);
    t += 1500;

    // ── Phase 3: Tap "Food" quick action → food overlay (4.3s) ──
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      // Highlight the Food pill
      qaHighlight.value = 1;
    }, t);
    t += 300;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      qaHighlight.value = -1;
      // Show food overlay
      foodOverlay.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    }, t);
    t += 2000;

    // Close food overlay
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      foodOverlay.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    }, t);
    t += 600;

    // ── Phase 4: Tap Pass card → pass overlay (7.2s) ──
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      passOverlay.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    }, t);
    t += 2000;

    // Close pass overlay
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      passOverlay.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    }, t);
    t += 600;

    // ── Phase 5: Tap guide card → guide overlay (9.8s) ──
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      guideOverlay.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    }, t);
    t += 2000;

    // Close guide overlay
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      guideOverlay.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    }, t);
    t += 600;

    // ── Phase 6: Change pill morph → park switcher (real MorphingPill) ──
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      morphPillRef.current?.open();
    }, t);
    t += 1500;

    // Highlight Kings Island row
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      highlightIndex.value = 1;
    }, t);
    t += 1500;

    // Close morph
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      highlightIndex.value = -1;
      morphPillRef.current?.close();
    }, t);
    t += 1000;

    // ── Phase 7: Brief hold then loop ──
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      resetAnimations();
      wtScrollRef.current?.scrollTo({ x: 0, animated: false });
      scheduleTimer(() => {
        startDemoRef.current();
      }, 300);
    }, t);
  }, []);

  startDemoRef.current = startDemo;

  // ── isActive lifecycle ──
  useEffect(() => {
    if (isActive) {
      demoActiveRef.current = true;
      resetAnimations();
      scheduleTimer(() => startDemoRef.current(), 300);
    } else {
      demoActiveRef.current = false;
      clearAllTimers();
      resetAnimations();
    }
    return () => {
      clearAllTimers();
      demoActiveRef.current = false;
    };
  }, [isActive, clearAllTimers, scheduleTimer, resetAnimations]);

  // ── Render ──
  const openCount = CEDAR_POINT_WAIT_TIMES.filter(r => r.isOpen).length;

  return (
    <View style={styles.container}>
      {/* ── Header (ParkHubHeader recreation) ── */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.parkNameText}>Cedar Point</Text>
            <Text style={styles.locationText}>Sandusky, Ohio, USA</Text>
            <Text style={styles.hoursText}>Open Today: 10:00 AM – 10:00 PM</Text>
          </View>

          {/* Change pill — real MorphingPill component */}
          <MorphingPill
            ref={morphPillRef}
            pillContent={<Text style={styles.changePillText}>Change</Text>}
            pillWidth={PILL_W}
            pillHeight={PILL_H}
            pillBorderRadius={radius.pill}
            pillStyle={{ backgroundColor: colors.accent.primary }}
            expandedContent={<SwitcherContent highlightIndex={highlightIndex} />}
            expandedWidth={SCREEN_WIDTH - 32}
            expandedHeight={420}
            expandedBorderRadius={radius.card}
            expandedStyle={{ backgroundColor: colors.background.card }}
            backdropType="blur"
            blurIntensity={15}
          />
        </View>
      </Animated.View>

      {/* ── Quick Action Row ── */}
      <Animated.View style={[styles.quickActionContainer, quickActionStyle]}>
        {QUICK_ACTIONS.map((action, i) => (
          <Animated.View key={action.key} style={[styles.qaPill, qaStyles[i], qaHighlightStyles[i]]}>
            <View style={[styles.qaIconCircle, { backgroundColor: `${action.color}15` }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={styles.qaLabel}>{action.label}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      <View style={styles.sectionGap} />

      {/* ── Wait Times Card ── */}
      <Animated.View style={[styles.waitTimesContainer, waitTimesStyle]}>
        <View style={styles.waitTimesCardBg} />

        <View style={styles.wtHeader}>
          <Text style={styles.wtTitle}>Wait Times</Text>
          <View style={styles.wtCountBadge}>
            <Text style={styles.wtCountText}>{openCount}</Text>
          </View>
          <View style={styles.wtLiveGroup}>
            <View style={styles.wtLiveDot} />
            <Text style={styles.wtLiveLabel}>LIVE</Text>
          </View>
        </View>

        <ScrollView
          ref={wtScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wtScrollContent}
          scrollEnabled={false}
        >
          {CEDAR_POINT_WAIT_TIMES.map((ride, i) => (
            <Animated.View key={ride.id} style={[styles.wtPill, wtStyles[i]]}>
              <Text style={styles.wtPillName} numberOfLines={1}>
                {ride.name}
              </Text>
              <Text style={[styles.wtPillWait, { color: getWaitColor(ride.waitMinutes, ride.isOpen) }]}>
                {ride.isOpen ? `${ride.waitMinutes} min` : 'Closed'}
              </Text>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.sectionGap} />

      {/* ── My Pass Card ── */}
      <Animated.View style={[styles.passCardContainer, passStyle]}>
        <View style={styles.passCard}>
          <LinearGradient
            colors={[`${colors.accent.primary}08`, 'rgba(207,103,105,0)']}
            style={styles.passGradient}
          />
          <View style={styles.passRow}>
            <View style={styles.passPreview}>
              <LinearGradient
                colors={[colors.accent.primary, '#A05456']}
                style={styles.passPreviewGradient}
              >
                <Text style={styles.passPreviewText}>CP</Text>
              </LinearGradient>
            </View>
            <View style={styles.passTextColumn}>
              <Text style={styles.passLabel}>MY PASS</Text>
              <Text style={styles.passParkName}>Cedar Point</Text>
              <Text style={styles.passType}>Season Pass</Text>
            </View>
            <View style={styles.passArrow}>
              <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.sectionGap} />

      {/* ── Park Guides ── */}
      <Animated.View style={[styles.guidesContainer, guidesStyle]}>
        <View style={styles.guidesHeader}>
          <Text style={styles.guidesSectionTitle}>Park Guides</Text>
          <View style={styles.guidesCountBadge}>
            <Text style={styles.guidesCountText}>{PARK_GUIDES.length}</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.guidesScroll}
          scrollEnabled={false}
        >
          {PARK_GUIDES.map(guide => (
            <View key={guide.id} style={styles.guideCardWrapper}>
              <View style={styles.guideCardShadow} />
              <View style={styles.guideCard}>
                <Ionicons name={guide.icon} size={18} color={colors.accent.primary} style={{ marginBottom: spacing.xs }} />
                <Text style={styles.guideTitle} numberOfLines={1}>{guide.title}</Text>
                <Text style={styles.guidePreview} numberOfLines={1}>{guide.preview}</Text>
                <View style={styles.guideFooter}>
                  <View style={styles.guideCategoryPill}>
                    <Text style={styles.guideCategoryText}>{guide.category}</Text>
                  </View>
                  <Text style={styles.guideReadTime}>{guide.readTime}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Bottom spacer */}
      <View style={{ height: 100 }} />

      {/* ═══════════════════════════════════════════ */}
      {/* OVERLAYS — rendered above hub content      */}
      {/* ═══════════════════════════════════════════ */}

      {/* Food list overlay */}
      <Animated.View style={[styles.overlayContainer, foodOverlayStyle]}>
        <View style={styles.overlaySheet}>
          <View style={styles.overlayDragHandle} />
          <Text style={styles.overlayTitle}>Food & Dining</Text>
          <Text style={styles.overlaySubtitle}>Cedar Point</Text>
          {FOOD_ITEMS.map((item, i) => (
            <View key={i} style={styles.foodRow}>
              <View style={styles.foodIcon}>
                <Ionicons name="restaurant-outline" size={18} color="#E8734A" />
              </View>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodType}>{item.type}</Text>
              </View>
              <View style={styles.foodRating}>
                <Ionicons name="star" size={12} color="#F9A825" />
                <Text style={styles.foodRatingText}>{item.rating}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Pass preview overlay */}
      <Animated.View style={[styles.overlayContainer, passOverlayStyle]}>
        <View style={styles.overlaySheet}>
          <View style={styles.overlayDragHandle} />
          <View style={styles.passOverlayContent}>
            <View style={styles.passOverlayCard}>
              <LinearGradient
                colors={[colors.accent.primary, '#A05456']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.passOverlayGradient}
              >
                <Text style={styles.passOverlayPark}>Cedar Point</Text>
                <Text style={styles.passOverlayHolder}>Caleb Lanting</Text>
                <Text style={styles.passOverlayType}>Season Pass</Text>
              </LinearGradient>
            </View>
            <View style={styles.passOverlayMeta}>
              <Text style={styles.passOverlayMetaText}>Valid: Jan 1 – Dec 31, 2026</Text>
              <Text style={styles.passOverlayMetaLabel}>Tap to scan</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Guide preview overlay */}
      <Animated.View style={[styles.overlayContainer, guideOverlayStyle]}>
        <View style={styles.overlaySheet}>
          <View style={styles.overlayDragHandle} />
          <Ionicons name="restaurant-outline" size={28} color={colors.accent.primary} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.overlayTitle}>Best Food Spots</Text>
          <View style={styles.guideOverlayMeta}>
            <View style={styles.guideCategoryPill}>
              <Text style={styles.guideCategoryText}>FOOD</Text>
            </View>
            <Text style={styles.guideReadTime}>3 min read</Text>
          </View>
          <Text style={styles.guideOverlayBody}>
            Cedar Point has dozens of dining options, from quick-service to sit-down restaurants. Hugo's Italian Kitchen near the front of the park is a fan favorite for a reason...
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================
// SwitcherContent — park list inside morph
// ============================================

function SwitcherContent({ highlightIndex }: { highlightIndex: SharedValue<number> }) {
  return (
    <View style={switcherStyles.container}>
      <Text style={switcherStyles.title}>Choose a Park</Text>
      <View style={switcherStyles.searchWrap}>
        <View style={switcherStyles.searchInput}>
          <Ionicons name="search" size={16} color={colors.text.meta} />
          <Text style={switcherStyles.searchPlaceholder}>Search parks...</Text>
        </View>
      </View>
      {PARK_LIST.map((park, i) => (
        <ParkRow key={park.name} park={park} index={i} highlightIndex={highlightIndex} />
      ))}
    </View>
  );
}

function ParkRow({
  park,
  index,
  highlightIndex,
}: {
  park: typeof PARK_LIST[0];
  index: number;
  highlightIndex: SharedValue<number>;
}) {
  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: highlightIndex.value === index
      ? colors.interactive.pressed
      : 'transparent',
  }));

  return (
    <Animated.View style={[switcherStyles.row, rowStyle]}>
      <View style={switcherStyles.rowText}>
        <Text style={switcherStyles.parkName}>{park.name}</Text>
        <Text style={switcherStyles.parkLocation}>{park.location}</Text>
      </View>
      <View style={switcherStyles.rowRight}>
        <View style={switcherStyles.countBadge}>
          <Text style={switcherStyles.countText}>{park.count}</Text>
        </View>
        {park.current && (
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.accent.primary}
            style={switcherStyles.checkIcon}
          />
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// Main Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    overflow: 'hidden',
    paddingTop: 60, // space for dynamic island + breathing room below notch
  },

  // ── Header ──
  headerContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
    marginRight: spacing.base,
  },
  parkNameText: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  locationText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  hoursText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: '#28A745',
    marginTop: 2,
  },

  // ── Change pill text ──
  changePillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // ── Quick Actions ──
  quickActionContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  qaPill: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  qaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  qaLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  sectionGap: {
    height: spacing.base,
  },

  // ── Wait Times ──
  waitTimesContainer: {
    paddingHorizontal: spacing.xl,
  },
  waitTimesCardBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.card,
  },
  wtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  wtTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  wtCountBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.md,
  },
  wtCountText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  wtLiveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  wtLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#28A745',
  },
  wtLiveLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: '#28A745',
    letterSpacing: 0.5,
  },
  wtScrollContent: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xxxl,
  },
  wtPill: {
    width: 100,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  wtPillName: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  wtPillWait: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },

  // ── My Pass ──
  passCardContainer: {
    paddingHorizontal: spacing.xl,
  },
  passCard: {
    height: 100,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  passGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passPreview: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  passPreviewGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passPreviewText: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  passTextColumn: {
    flex: 1,
    marginLeft: spacing.base,
  },
  passLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  passParkName: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  passType: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  passArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Park Guides ──
  guidesContainer: {
    paddingLeft: spacing.xl,
  },
  guidesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  guidesSectionTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  guidesCountBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.md,
  },
  guidesCountText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  guidesScroll: {
    gap: spacing.base,
    paddingRight: spacing.xl,
  },
  guideCardWrapper: {
    width: 200,
    height: 110,
  },
  guideCardShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.card,
    ...shadows.small,
  },
  guideCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    overflow: 'hidden',
  },
  guideTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  guidePreview: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    flex: 1,
  },
  guideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  guideCategoryPill: {
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  guideCategoryText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  guideReadTime: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginLeft: spacing.md,
  },

  // ── Overlays (shared base) ──
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  overlaySheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
    maxHeight: '92%',
    ...shadows.modal,
  },
  overlayDragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  overlayTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  overlaySubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  // ── Food overlay ──
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8734A15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  foodType: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  foodRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  foodRatingText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // ── Pass overlay ──
  passOverlayContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  passOverlayCard: {
    width: 260,
    height: 160,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  passOverlayGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  passOverlayPark: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  passOverlayHolder: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.85)',
  },
  passOverlayType: {
    fontSize: typography.sizes.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  passOverlayMeta: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  passOverlayMetaText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  passOverlayMetaLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },

  // ── Guide overlay ──
  guideOverlayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  guideOverlayBody: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
});

// ============================================
// Switcher Styles
// ============================================

const switcherStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.searchBar,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  searchPlaceholder: {
    fontSize: typography.sizes.input,
    color: colors.text.meta,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  rowText: {
    flex: 1,
  },
  parkName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  parkLocation: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  checkIcon: {
    marginLeft: spacing.md,
  },
});
