import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { TIMING } from '../constants/animations';
import { useStrongPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import { useSettingsStore, type RiderType } from '../stores/settingsStore';
import { useTourTarget } from '../features/tour';

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
const MOCK_STATS = [
  { label: 'Credits', value: 247 },
  { label: 'Parks', value: 34 },
  { label: 'This Year', value: 52 },
];

const MOCK_TOP_COASTERS = [
  { name: 'Steel Vengeance', park: 'Cedar Point' },
  { name: 'Velocicoaster', park: 'Islands of Adventure' },
  { name: 'Iron Gwazi', park: 'Busch Gardens Tampa' },
  { name: 'El Toro', park: 'Six Flags Great Adventure' },
  { name: 'Fury 325', park: 'Carowinds' },
];

// ============================================
// ProfileScreen
// ============================================
export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { riderType } = useSettingsStore();
  const settingsTourRef = useTourTarget('profile-settings-button');

  const editProfilePress = useStrongPress();
  const settingsPress = useStrongPress();

  // Single shared value drives all staggered entrances
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: TIMING.slow });
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.2], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.2], [16, 0], Extrapolation.CLAMP) }],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.1, 0.3], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.1, 0.3], [16, 0], Extrapolation.CLAMP) }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.15, 0.35], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.15, 0.35], [16, 0], Extrapolation.CLAMP) }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.25, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.25, 0.5], [16, 0], Extrapolation.CLAMP) }],
  }));

  const topCoastersStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.4, 0.65], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.4, 0.65], [16, 0], Extrapolation.CLAMP) }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.55, 0.8], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.55, 0.8], [16, 0], Extrapolation.CLAMP) }],
  }));

  const riderLabel = riderType ? RIDER_LABELS[riderType] : 'Enthusiast';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* -- Header Area -- */}
        <View style={styles.headerSection}>
          <Animated.View style={[styles.avatar, avatarStyle]}>
            <Text style={styles.avatarInitials}>CR</Text>
          </Animated.View>

          <Animated.View style={nameStyle}>
            <Text style={styles.displayName}>Coaster Rider</Text>
          </Animated.View>

          <Animated.View style={[styles.badgeContainer, badgeStyle]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{riderLabel}</Text>
            </View>
          </Animated.View>
        </View>

        {/* -- Stats Row -- */}
        <Animated.View style={[styles.statsRow, statsStyle]}>
          {MOCK_STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* -- Top Coasters Section -- */}
        <Animated.View style={topCoastersStyle}>
          <Text style={styles.sectionTitle}>My Top Coasters</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coasterList}
            style={{ overflow: 'visible' }}
          >
            {MOCK_TOP_COASTERS.map((coaster, index) => (
              <View key={coaster.name} style={styles.coasterCard}>
                <Text style={styles.coasterRank}>#{index + 1}</Text>
                <Text style={styles.coasterName} numberOfLines={1}>
                  {coaster.name}
                </Text>
                <Text style={styles.coasterPark} numberOfLines={1}>
                  {coaster.park}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* -- Quick Actions -- */}
        <Animated.View style={[styles.actionsSection, actionsStyle]}>
          <Pressable
            {...editProfilePress.pressHandlers}
            onPress={() => haptics.tap()}
          >
            <Animated.View style={[styles.outlinedButton, editProfilePress.animatedStyle]}>
              <Ionicons name="pencil-outline" size={18} color={colors.text.primary} />
              <Text style={styles.outlinedButtonText}>Edit Profile</Text>
            </Animated.View>
          </Pressable>

          <View ref={settingsTourRef} collapsable={false}>
            <Pressable
              {...settingsPress.pressHandlers}
              onPress={() => {
                haptics.tap();
                navigation.navigate('Settings');
              }}
            >
              <Animated.View style={[styles.outlinedButton, settingsPress.animatedStyle]}>
                <Ionicons name="settings-outline" size={18} color={colors.text.primary} />
                <Text style={styles.outlinedButtonText}>Settings</Text>
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
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
    paddingBottom: spacing.xxxl,
  },

  // -- Header --
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  avatarInitials: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  displayName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryLight,
  },
  badgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // -- Stats Row --
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.small,
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

  // -- Top Coasters --
  sectionTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  coasterList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  coasterCard: {
    width: 160,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  coasterRank: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    marginBottom: spacing.sm,
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

  // -- Quick Actions --
  actionsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.base,
  },
  outlinedButton: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.small,
  },
  outlinedButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});

export default ProfileScreen;
