/**
 * ProfileScreen
 *
 * Premium profile hub with large avatar, editable display name,
 * stats row, top coasters carousel, and quick-action navigation.
 * Staggered spring entrance on every section.
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress, useStrongPress } from '../hooks/useSpringPress';
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

// ============================================
// Rider type display labels
// ============================================
const RIDER_LABELS: Record<NonNullable<RiderType>, string> = {
  thrills: 'Thrill Seeker',
  data: 'Data Nerd',
  planner: 'Trip Planner',
  newbie: 'Fresh Rider',
};

// ============================================
// Mock data
// ============================================
const MOCK_PARKS_VISITED = 34;
const MOCK_GAMES_PLAYED = 18;
const MOCK_JOIN_DATE = 'March 2026';

const MOCK_TOP_COASTERS = [
  { name: 'Steel Vengeance', park: 'Cedar Point' },
  { name: 'Velocicoaster', park: 'Islands of Adventure' },
  { name: 'Iron Gwazi', park: 'Busch Gardens Tampa' },
  { name: 'El Toro', park: 'Six Flags Great Adventure' },
  { name: 'Fury 325', park: 'Carowinds' },
];

// ============================================
// Stagger entrance helper
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
// ProfileScreen
// ============================================
export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    riderType,
    displayName,
    username,
    profileImageUri,
    homeParkName,
  } = useSettingsStore();
  // Ride log stats (reactive)
  const [creditCount, setCreditCount] = React.useState(getCreditCount());
  const [totalRides, setTotalRides] = React.useState(getTotalRideCount());

  useEffect(() => {
    const unsub = subscribeRideLog(() => {
      setCreditCount(getCreditCount());
      setTotalRides(getTotalRideCount());
    });
    return unsub;
  }, []);

  // Staggered entrance animations
  const headerAnim = useStaggerEntrance(0);
  const statsAnim = useStaggerEntrance(1);
  const topCoastersAnim = useStaggerEntrance(2);
  const actionsAnim = useStaggerEntrance(3);

  // Press states
  const avatarPress = useStrongPress();
  const settingsPress = useSpringPress();

  const riderLabel = riderType ? RIDER_LABELS[riderType] : 'Enthusiast';
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
  const handleCoasterPress = useCallback((coaster: { name: string; park: string }) => {
    navigation.navigate('Parks', { targetCoasterName: coaster.name });
  }, [navigation]);

  // Stats data
  const stats = [
    { label: 'Rides', value: creditCount },
    { label: 'Parks', value: MOCK_PARKS_VISITED },
    { label: 'Games', value: MOCK_GAMES_PLAYED },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <Animated.View style={[styles.headerSection, headerAnim]}>
          {/* Avatar with camera overlay */}
          <Pressable
            {...avatarPress.pressHandlers}
            onPress={handleAvatarPress}
          >
            <Animated.View style={[styles.avatarWrapper, avatarPress.animatedStyle]}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={14} color={colors.text.inverse} />
              </View>
            </Animated.View>
          </Pressable>

          {/* Name + username */}
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>{username}</Text>

          {/* Rider type badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons
                name="flash"
                size={12}
                color={colors.accent.primary}
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>{riderLabel}</Text>
            </View>
          </View>

          {/* Join date + home park */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.text.meta} />
              <Text style={styles.metaText}>Joined {MOCK_JOIN_DATE}</Text>
            </View>
            {homeParkName && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={colors.text.meta} />
                <Text style={styles.metaText}>{homeParkName}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View style={[styles.statsCard, statsAnim]}>
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>

        {/* ── Top Coasters ── */}
        <Animated.View style={topCoastersAnim}>
          <Text style={styles.sectionTitle}>My Top Coasters</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.coasterScroll}
            contentContainerStyle={styles.coasterList}
          >
            {MOCK_TOP_COASTERS.map((coaster, index) => (
              <CoasterCard key={coaster.name} coaster={coaster} rank={index + 1} onPress={handleCoasterPress} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View style={[styles.actionsSection, actionsAnim]}>
          <View style={styles.settingsButtonWrapper}>
            <Pressable
              {...settingsPress.pressHandlers}
              onPress={() => {
                haptics.tap();
                navigation.navigate('Settings');
              }}
            >
              <Animated.View style={[styles.settingsButton, settingsPress.animatedStyle]}>
                <Ionicons name="settings-outline" size={18} color={colors.accent.primary} />
                <Text style={styles.settingsButtonText}>Settings</Text>
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ============================================
// Coaster Card sub-component
// ============================================
type CoasterCardProps = {
  coaster: { name: string; park: string };
  rank: number;
  onPress: (coaster: { name: string; park: string }) => void;
};

const CoasterCard = React.memo(({ coaster, rank, onPress }: CoasterCardProps) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97 });

  const handlePress = useCallback(() => {
    haptics.tap();
    onPress(coaster);
  }, [coaster, onPress]);

  return (
    <Pressable
      {...pressHandlers}
      onPress={handlePress}
    >
      <Animated.View style={[styles.coasterCard, animatedStyle]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <Text style={styles.coasterName} numberOfLines={1}>
          {coaster.name}
        </Text>
        <Text style={styles.coasterPark} numberOfLines={1}>
          {coaster.park}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  // ── Header ──
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  // Avatar
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.page,
  },

  // Name / handle
  displayName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },

  // Badge
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryLight,
  },
  badgeIcon: {
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Meta row (join date, home park)
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },

  // ── Stats ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadows.section,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
  },

  // ── Top Coasters ──
  sectionTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  coasterScroll: {
    overflow: 'visible',
    marginBottom: spacing.xxl,
  },
  coasterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.base,
  },
  coasterCard: {
    width: 150,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  rankText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  coasterName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  coasterPark: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },

  // ── Quick Actions ──
  actionsSection: {
    paddingHorizontal: spacing.lg,
  },
  settingsButtonWrapper: {
    flex: 1,
  },
  settingsButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.background.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  settingsButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});

export default ProfileScreen;
