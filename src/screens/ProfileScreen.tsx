/**
 * ProfileScreen — Social-Style Centered Profile
 *
 * Centered avatar, stats card with 3 columns,
 * segmented tab pills (My Rides / Rankings / Badges),
 * and a Pro upgrade card at the bottom.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withDelay,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress, useSubtlePress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import {
  useSettingsStore,
  setProfileImageUri,
  type RiderType,
} from '../stores/settingsStore';
import {
  getCreditCount,
  getTotalRideCount,
  subscribe as subscribeRideLog,
} from '../stores/rideLogStore';
import { GlassHeader } from '../components/GlassHeader';
import { TrackRLogo } from '../components/TrackRLogo';

// ============================================
// Constants
// ============================================
const HEADER_HEIGHT = 48;
const AVATAR_SIZE = 88;
const CAMERA_BADGE_SIZE = 28;

const MOCK_PARKS_VISITED = 34;
const MOCK_GAMES_PLAYED = 18;
const MOCK_JOIN_DATE = 'March 2026';

const MOCK_TOP_COASTERS = [
  { name: 'Steel Vengeance', park: 'Cedar Point', rating: 9.8 },
  { name: 'Velocicoaster', park: 'Islands of Adventure', rating: 9.6 },
  { name: 'Iron Gwazi', park: 'Busch Gardens Tampa', rating: 9.5 },
  { name: 'El Toro', park: 'Six Flags Great Adventure', rating: 9.3 },
  { name: 'Fury 325', park: 'Carowinds', rating: 9.1 },
];

const MOCK_RECENT_RIDES = [
  { name: 'Steel Vengeance', park: 'Cedar Point', date: 'Mar 8', rating: 9.8 },
  { name: 'Millennium Force', park: 'Cedar Point', date: 'Mar 8', rating: 8.4 },
  { name: 'Maverick', park: 'Cedar Point', date: 'Mar 7', rating: 9.0 },
  { name: 'Top Thrill 2', park: 'Cedar Point', date: 'Mar 7', rating: 8.7 },
];

const MOCK_ACHIEVEMENTS = {
  unlocked: 12,
  total: 50,
  badges: ['trophy', 'flash', 'ribbon', 'star', 'medal'] as const,
};


// Tab definitions
const TABS = ['My Rides', 'Rankings', 'Badges'] as const;
type TabKey = (typeof TABS)[number];

// ============================================
// Stagger entrance
// ============================================
function useStaggerEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ============================================
// Animated Tab Pill
// ============================================
// ============================================
// Sliding Segmented Tab Control (matches Logbook pattern)
// ============================================

const TAB_COUNT = TABS.length;

const TabLabel: React.FC<{
  tab: TabKey;
  index: number;
  indicatorX: SharedValue<number>;
}> = ({ tab, index, indicatorX }) => {
  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      indicatorX.value,
      [index - 1, index, index + 1],
      [colors.text.secondary, colors.text.inverse, colors.text.secondary],
    ),
  }));

  return (
    <Animated.Text style={[styles.tabLabel, colorStyle]}>{tab}</Animated.Text>
  );
};

const ProfileTabBar: React.FC<{
  selected: TabKey;
  onSelect: (tab: TabKey) => void;
}> = ({ selected, onSelect }) => {
  const activeIndex = TABS.indexOf(selected);
  const indicatorX = useSharedValue(activeIndex);

  useEffect(() => {
    indicatorX.value = withSpring(TABS.indexOf(selected), {
      damping: 18,
      stiffness: 200,
      mass: 0.8,
    });
  }, [selected]);

  const [containerWidth, setContainerWidth] = React.useState(0);
  const pillWidth = containerWidth > 0 ? (containerWidth - spacing.xs * 2) / TAB_COUNT : 0;

  const indicatorStyle = useAnimatedStyle(() => {
    if (pillWidth <= 0) return { opacity: 0 };
    return {
      opacity: 1,
      width: pillWidth,
      transform: [{ translateX: indicatorX.value * pillWidth }],
    };
  });

  return (
    <View
      style={styles.tabBar}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Sliding indicator pill */}
      <Animated.View style={[styles.tabIndicator, indicatorStyle]} />

      {/* Labels */}
      {TABS.map((tab, i) => (
        <Pressable
          key={tab}
          style={styles.tabChip}
          onPress={() => {
            haptics.tap();
            onSelect(tab);
          }}
        >
          <TabLabel tab={tab} index={i} indicatorX={indicatorX} />
        </Pressable>
      ))}
    </View>
  );
};

// ============================================
// ProfileScreen
// ============================================
export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    displayName,
    username,
    profileImageUri,
    homeParkName,
  } = useSettingsStore();

  const [creditCount, setCreditCount] = useState(getCreditCount());
  const [totalRides, setTotalRides] = useState(getTotalRideCount());
  const [selectedTab, setSelectedTab] = useState<TabKey>('My Rides');
  // Visual tab tracks pill highlight immediately; selectedTab tracks content (delayed for crossfade)
  const [visualTab, setVisualTab] = useState<TabKey>('My Rides');

  useEffect(() => {
    const unsub = subscribeRideLog(() => {
      setCreditCount(getCreditCount());
      setTotalRides(getTotalRideCount());
    });
    return unsub;
  }, []);

  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const updateScrollRef = useCallback((y: number) => { scrollYRef.current = y; }, []);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(updateScrollRef)(event.contentOffset.y);
    },
  });

  // Fog fades IN as user scrolls (invisible at top, full opacity after 80px scroll)
  const fogAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], 'clamp'),
  }));
  const viewportHeightRef = useRef(0);

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      if (tab === visualTab) return;
      haptics.select();
      setVisualTab(tab);
      setSelectedTab(tab);
      // Don't scroll immediately — onContentSizeChange handles it
    },
    [visualTab],
  );

  // Only scroll up when new tab content is shorter than current scroll position
  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    const maxScroll = Math.max(0, h - viewportHeightRef.current);
    if (scrollYRef.current > maxScroll) {
      scrollRef.current?.scrollTo({ y: maxScroll, animated: true });
    }
  }, []);

  // Staggered entrance animations
  const heroAnim = useStaggerEntrance(0);
  const statsAnim = useStaggerEntrance(1);
  const metaAnim = useStaggerEntrance(2);
  const tabsAnim = useStaggerEntrance(3);
  const contentAnim = useStaggerEntrance(4);
  const proCardAnim = useStaggerEntrance(5);

  // Press states
  const settingsPress = useSpringPress();
  const avatarPress = useSubtlePress();
  const proPress = useSubtlePress();

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Avatar photo picker
  const handleAvatarPress = useCallback(async () => {
    haptics.select();
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setProfileImageUri(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setProfileImageUri(result.assets[0].uri);
          }
        },
      },
      ...(profileImageUri
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: () => setProfileImageUri(null),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, [profileImageUri]);

  // Navigate to coaster in Parks
  const handleCoasterPress = useCallback(
    (coasterName: string) => {
      haptics.tap();
      navigation.navigate('Parks', { targetCoasterName: coasterName });
    },
    [navigation],
  );

  const topBarHeight = insets.top + HEADER_HEIGHT;

  // ── Tab content renderers ──

  const renderMyRides = () => (
    <>
      {MOCK_RECENT_RIDES.map((ride, index) => (
        <Pressable
          key={`${ride.name}-${ride.date}`}
          onPress={() => handleCoasterPress(ride.name)}
        >
          <View
            style={[
              styles.rideRow,
              index < MOCK_RECENT_RIDES.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={styles.rideInfo}>
              <Text style={styles.rideName} numberOfLines={1}>
                {ride.name}
              </Text>
              <Text style={styles.rideMeta} numberOfLines={1}>
                {ride.park} {'\u00B7'} {ride.date}
              </Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color={colors.accent.primary} />
              <Text style={styles.ratingText}>{ride.rating}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </>
  );

  const getMedalStyle = (rank: number) => {
    switch (rank) {
      case 1: return { bg: '#FFF8E1', text: '#D4A017' }; // Gold
      case 2: return { bg: '#F0F0F0', text: '#888888' }; // Silver
      case 3: return { bg: '#FBE9E7', text: '#BF6D3A' }; // Bronze
      default: return null;
    }
  };

  const renderRankings = () => (
    <>
      {MOCK_TOP_COASTERS.map((coaster, index) => {
        const medal = getMedalStyle(index + 1);
        return (
        <Pressable
          key={coaster.name}
          onPress={() => handleCoasterPress(coaster.name)}
        >
          <View
            style={[
              styles.rankRow,
              index < MOCK_TOP_COASTERS.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={[styles.rankBadge, medal && { backgroundColor: medal.bg }]}>
              <Text style={[styles.rankText, medal && { color: medal.text }]}>{index + 1}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName} numberOfLines={1}>
                {coaster.name}
              </Text>
              <Text style={styles.rankPark} numberOfLines={1}>
                {coaster.park}
              </Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color={colors.accent.primary} />
              <Text style={styles.ratingText}>{coaster.rating}</Text>
            </View>
          </View>
        </Pressable>
        );
      })}
    </>
  );

  const renderBadges = () => (
    <View style={styles.badgesInner}>
      <Text style={styles.badgesProgress}>
        {MOCK_ACHIEVEMENTS.unlocked}{' '}
        <Text style={styles.badgesTotal}>/ {MOCK_ACHIEVEMENTS.total} unlocked</Text>
      </Text>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${(MOCK_ACHIEVEMENTS.unlocked / MOCK_ACHIEVEMENTS.total) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.badgeIconRow}>
        {MOCK_ACHIEVEMENTS.badges.map((badge) => (
          <View key={badge} style={styles.badgeCircle}>
            <Ionicons
              name={`${badge}-outline` as any}
              size={18}
              color={colors.accent.primary}
            />
          </View>
        ))}
        <View style={styles.badgeMore}>
          <Text style={styles.badgeMoreText}>
            +{MOCK_ACHIEVEMENTS.unlocked - MOCK_ACHIEVEMENTS.badges.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'My Rides':
        return renderMyRides();
      case 'Rankings':
        return renderRankings();
      case 'Badges':
        return renderBadges();
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topBarHeight + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onLayout={(e: any) => { viewportHeightRef.current = e.nativeEvent.layout.height; }}
        onContentSizeChange={handleContentSizeChange}
      >
        {/* ── Hero: Centered avatar + name + username ── */}
        <Animated.View style={[styles.heroSection, heroAnim]}>
          <Pressable
            {...avatarPress.pressHandlers}
            onPress={handleAvatarPress}
          >
            <Animated.View style={[styles.avatarContainer, avatarPress.animatedStyle]}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              {/* Camera badge overlay */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera-outline" size={14} color={colors.text.inverse} />
              </View>
            </Animated.View>
          </Pressable>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username.replace(/^@+/, '')}</Text>
        </Animated.View>

        {/* ── Stats card: 3 columns ── */}
        <Animated.View style={[styles.statsCardWrapper, statsAnim]}>
          <View style={styles.statsCard}>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{creditCount}</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{MOCK_PARKS_VISITED}</Text>
              <Text style={styles.statLabel}>Parks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{MOCK_GAMES_PLAYED}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Meta row: home park + join date ── */}
        <Animated.View style={[styles.metaRow, metaAnim]}>
          {homeParkName ? (
            <>
              <Ionicons name="location-outline" size={13} color={colors.text.meta} />
              <Text style={styles.metaText}>{homeParkName}</Text>
              <Text style={styles.metaDot}>{'\u00B7'}</Text>
            </>
          ) : null}
          <Ionicons name="calendar-outline" size={13} color={colors.text.meta} />
          <Text style={styles.metaText}>Joined {MOCK_JOIN_DATE}</Text>
        </Animated.View>

        {/* ── Segment tabs (sliding pill) ── */}
        <Animated.View style={[styles.tabBarWrapper, tabsAnim]}>
          <ProfileTabBar selected={visualTab} onSelect={handleTabChange} />
        </Animated.View>

        {/* ── Tab content: Layout auto-animates height, FadeIn/Out crossfades ── */}
        <Animated.View
          style={[styles.tabContentCard, contentAnim]}
          layout={LinearTransition.duration(350).easing(Easing.out(Easing.cubic))}
        >
          <Animated.View
            key={selectedTab}
            entering={FadeIn.duration(200).delay(100)}
            exiting={FadeOut.duration(100)}
          >
            {renderTabContent()}
          </Animated.View>
        </Animated.View>

        {/* Fixed spacer */}
        <Animated.View
          style={{ height: spacing.xl }}
          layout={LinearTransition.duration(350).easing(Easing.out(Easing.cubic))}
        />

        {/* ── TrackR Pro card ── */}
        <Animated.View
          style={[styles.proCardWrapper, proCardAnim]}
          layout={LinearTransition.duration(350).easing(Easing.out(Easing.cubic))}
        >
          <Pressable
            {...proPress.pressHandlers}
            onPress={() => {
              haptics.tap();
              // Navigate to Pro upgrade
            }}
          >
            <Animated.View style={[styles.proCard, proPress.animatedStyle]}>
              <View style={styles.proHeader}>
                <View style={styles.proBadge}>
                  <Ionicons name="diamond-outline" size={14} color={colors.accent.primary} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.proTitle}>Upgrade to <TrackRLogo suffix=" Pro" /></Text>
              <Text style={styles.proDescription}>
                Unlimited ride stats, advanced analytics, custom badges, and ad-free experience.
              </Text>
              <View style={styles.proButton}>
                <Text style={styles.proButtonText}>Upgrade</Text>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.ScrollView>

      {/* Clean fog overlay — crossfades in as user scrolls */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, fogAnimStyle]}>
        <GlassHeader headerHeight={topBarHeight} />
      </Animated.View>

      {/* Floating header: "PROFILE" + settings gear */}
      <View style={[styles.topBar, { top: insets.top }]}>
        <View style={styles.topBarSpacer} />
        <View style={styles.topBarCenter}>
          <Text style={styles.screenTitle}>@{username.replace(/^@+/, '')}</Text>
        </View>
        <Pressable
          {...settingsPress.pressHandlers}
          onPress={() => {
            haptics.tap();
            navigation.navigate('Settings');
          }}
        >
          <Animated.View style={[styles.settingsButton, settingsPress.animatedStyle]}>
            <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // ── Top bar ──
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: HEADER_HEIGHT,
    zIndex: 10,
  },
  topBarSpacer: {
    width: 40,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    color: colors.text.primary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },

  // ── Hero (centered) ──
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: spacing.base,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: CAMERA_BADGE_SIZE,
    height: CAMERA_BADGE_SIZE,
    borderRadius: CAMERA_BADGE_SIZE / 2,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.page,
  },
  displayName: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  username: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Stats card ──
  statsCardWrapper: {
    marginBottom: spacing.lg,
    // Shadow-safe padding
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    ...shadows.small,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
  },

  // ── Meta row ──
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    gap: 4,
  },
  metaText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
  metaDot: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginHorizontal: 2,
  },

  // ── Segment tab bar (sliding pill) ──
  tabBarWrapper: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: radius.button,
    padding: spacing.xs,
    position: 'relative',
    ...shadows.small,
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.button - spacing.xs,
    backgroundColor: colors.accent.primary,
    ...shadows.small,
  },
  tabChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },

  // ── Tab content card (Layout animation handles height morph) ──
  tabContentCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.small,
  },

  // ── My Rides tab ──
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  rideInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rideName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  rideMeta: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginTop: 1,
  },

  // ── Rankings tab ──
  // rankingsCard removed — tabContentCard is the card now
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  rankText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  rankInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rankName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  rankPark: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // ── Shared rating pill ──
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryLight,
  },
  ratingText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // ── Badges tab ──
  // badgesCard removed — tabContentCard is the card now
  badgesInner: {
    padding: spacing.lg,
  },
  badgesProgress: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  badgesTotal: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.input,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
  },
  badgeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  badgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMoreText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },

  // ── TrackR Pro ──
  proCardWrapper: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  proCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    ...shadows.small,
  },
  proHeader: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryLight,
  },
  proBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    letterSpacing: 1,
  },
  proTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  proDescription: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  proButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
  },
  proButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});

export default ProfileScreen;
