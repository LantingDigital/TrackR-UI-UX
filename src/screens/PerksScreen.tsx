/**
 * PerksScreen
 *
 * Achievements, milestones, and rewards for the TrackR community.
 * Accessible from the Profile screen. Matches the premium design language.
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import { useToast } from '../components/feedback/useToast';
import { FogHeader } from '../components/FogHeader';
import { TrackRLogo } from '../components/TrackRLogo';

const HEADER_HEIGHT = 52;
import {
  getCreditCount,
  getTotalRideCount,
  subscribe as subscribeRideLog,
} from '../stores/rideLogStore';

// ============================================
// Types
// ============================================

interface Achievement {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  progress: number; // 0 to 1
  unlocked: boolean;
  accentColor: string;
}

interface Milestone {
  id: string;
  count: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  reached: boolean;
}

interface PerkTier {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features: string[];
  current: boolean;
}

// ============================================
// Mock data (will be replaced by real data from stores)
// ============================================

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-log',
    icon: 'flash',
    title: 'First Log',
    description: 'Log your first ride on TrackR',
    progress: 1,
    unlocked: true,
    accentColor: '#B8797A', // muted rose
  },
  {
    id: 'park-hopper',
    icon: 'location',
    title: 'Park Hopper',
    description: 'Visit 5 different parks',
    progress: 0.6,
    unlocked: false,
    accentColor: '#7BA3C4', // muted blue
  },
  {
    id: 'century-club',
    icon: 'ribbon',
    title: 'Century Club',
    description: 'Log 100 unique coasters',
    progress: 0.34,
    unlocked: false,
    accentColor: '#C4A66A', // muted gold
  },
  {
    id: 'rate-master',
    icon: 'star',
    title: 'Rate Master',
    description: 'Rate 50 rides with full criteria',
    progress: 0.22,
    unlocked: false,
    accentColor: '#7FB893', // muted green
  },
  {
    id: 'social-butterfly',
    icon: 'people',
    title: 'Social Butterfly',
    description: 'Make 10 friends on TrackR',
    progress: 0,
    unlocked: false,
    accentColor: '#9B8EC4', // muted purple
  },
  {
    id: 'streak-rider',
    icon: 'flame',
    title: 'Streak Rider',
    description: 'Log rides 7 days in a row',
    progress: 0.43,
    unlocked: false,
    accentColor: '#C48472', // muted coral
  },
];

const MILESTONES: Milestone[] = [
  { id: 'm-10', count: 10, label: 'credits', icon: 'medal-outline', reached: true },
  { id: 'm-25', count: 25, label: 'credits', icon: 'medal-outline', reached: true },
  { id: 'm-50', count: 50, label: 'credits', icon: 'trophy-outline', reached: false },
  { id: 'm-100', count: 100, label: 'credits', icon: 'trophy-outline', reached: false },
  { id: 'm-250', count: 250, label: 'credits', icon: 'diamond-outline', reached: false },
  { id: 'm-500', count: 500, label: 'credits', icon: 'diamond-outline', reached: false },
];

const PERK_TIERS: PerkTier[] = [
  {
    name: 'Free',
    icon: 'person-outline',
    color: colors.text.secondary,
    features: [
      'Log unlimited rides',
      'Rate with 5 default criteria',
      'Basic stats dashboard',
      'Community access',
    ],
    current: true,
  },
  {
    name: 'Pro',
    icon: 'rocket-outline',
    color: colors.accent.primary,
    features: [
      'Unlimited custom criteria',
      'Advanced statistics & charts',
      'Shareable stat cards',
      'AI ride comparison',
      'Offline mode',
      'No ads',
    ],
    current: false,
  },
];

// ============================================
// Stagger entrance helper
// ============================================
function useStaggerEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

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
// AchievementCard
// ============================================
const AchievementCard: React.FC<{ achievement: Achievement; index: number }> = ({
  achievement,
  index,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.98 });
  const entranceAnim = useStaggerEntrance(index + 2); // offset for header sections
  const progressAnim = useSharedValue(0);

  const progressPercent = Math.round(achievement.progress * 100);

  // Animate progress bar fill on entry
  useEffect(() => {
    if (!achievement.unlocked && achievement.progress > 0) {
      const delay = (index + 2) * TIMING.stagger + 200; // after card entrance
      progressAnim.value = withDelay(
        delay,
        withTiming(achievement.progress, { duration: 600, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progressAnim.value * 100)}%` as any,
    backgroundColor: achievement.accentColor,
  }));

  return (
    <Animated.View style={entranceAnim}>
      <Pressable {...pressHandlers} onPress={() => haptics.tap()}>
        <Animated.View style={[styles.achievementCard, animatedStyle]}>
          {/* Icon */}
          <View
            style={[
              styles.achievementIcon,
              {
                backgroundColor: achievement.unlocked
                  ? `${achievement.accentColor}15`
                  : colors.background.input,
              },
            ]}
          >
            <Ionicons
              name={achievement.icon}
              size={22}
              color={achievement.unlocked ? achievement.accentColor : colors.text.meta}
            />
          </View>

          {/* Text */}
          <View style={styles.achievementTextContainer}>
            <View style={styles.achievementTitleRow}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              {achievement.unlocked && (
                <Ionicons name="checkmark-circle" size={16} color="#7FB893" />
              )}
            </View>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>

            {/* Animated progress bar */}
            {!achievement.unlocked && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
                </View>
                <Text style={styles.progressText}>{progressPercent}%</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// ============================================
// PerksScreen
// ============================================
export const PerksScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const { pressHandlers: proCTAPressHandlers, animatedStyle: proCTAAnimatedStyle } = useSpringPress({ scale: 0.97 });

  // Reactive ride stats
  const [creditCount, setCreditCount] = React.useState(getCreditCount());
  useEffect(() => {
    const unsub = subscribeRideLog(() => {
      setCreditCount(getCreditCount());
    });
    return unsub;
  }, []);

  // Stagger animations for sections
  const headerAnim = useStaggerEntrance(0);
  const milestonesAnim = useStaggerEntrance(1);

  const handleBack = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Scroll content — fills entire screen, scrolls behind header */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Credit milestone banner — white card with shadow */}
        <Animated.View style={headerAnim}>
          <View style={styles.creditBanner}>
            <Text style={styles.creditCount}>{creditCount}</Text>
            <Text style={styles.creditLabel}>Total Credits</Text>
            <Text style={styles.creditNextMilestone}>
              {getNextMilestone(creditCount)} credits to next milestone
            </Text>
          </View>
        </Animated.View>

        {/* Milestones strip */}
        <Animated.View style={milestonesAnim}>
          <Text style={styles.sectionTitle}>Credit Milestones</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.milestoneScroll}
            contentContainerStyle={styles.milestoneList}
          >
            {MILESTONES.map((milestone) => (
              <View
                key={milestone.id}
                style={[
                  styles.milestoneChip,
                  milestone.reached ? styles.milestoneChipReached : styles.milestoneChipLocked,
                ]}
              >
                <Ionicons
                  name={milestone.reached ? 'checkmark-circle' : milestone.icon}
                  size={14}
                  color={milestone.reached ? '#7FB893' : colors.text.meta}
                />
                <Text
                  style={[
                    styles.milestoneCount,
                    milestone.reached && styles.milestoneCountReached,
                  ]}
                >
                  {milestone.count}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          {ACHIEVEMENTS.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </View>

        {/* Pro tier preview */}
        <Text style={styles.sectionTitle}>Upgrade to Pro</Text>
        <View style={styles.proCard}>
          <View style={styles.proCardInner}>
            <View style={styles.proHeader}>
              <Ionicons name="rocket" size={24} color={colors.accent.primary} />
              <TrackRLogo style={styles.proTitle} suffix=" Pro" />
            </View>
            <Text style={styles.proDescription}>
              Unlock the full experience with advanced stats, AI insights, and more.
            </Text>
            {PERK_TIERS[1].features.map((feature) => (
              <View key={feature} style={styles.proFeatureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.accent.primary}
                />
                <Text style={styles.proFeatureText}>{feature}</Text>
              </View>
            ))}
            <Pressable
              {...proCTAPressHandlers}
              onPress={() => {
                haptics.tap();
                showToast({ type: 'info', message: 'TrackR Pro is coming soon!' });
              }}
            >
              <Animated.View style={[styles.proCTAButton, proCTAAnimatedStyle]}>
                <Text style={styles.proCTAButtonText}>Upgrade to Pro</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.text.inverse} />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <View style={[styles.headerBar, { top: insets.top }]}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <View style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>Perks</Text>
        <View style={styles.backButton} />
      </View>
    </View>
  );
};

// ============================================
// Helper
// ============================================
function getNextMilestone(current: number): number {
  const milestoneValues = [10, 25, 50, 100, 250, 500, 1000];
  for (const m of milestoneValues) {
    if (current < m) return m - current;
  }
  return 0;
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },

  // Header bar
  headerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: HEADER_HEIGHT,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // Credit banner — white card with shadow
  creditBanner: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    backgroundColor: colors.background.card,
    ...shadows.card,
  },
  creditCount: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
  },
  creditLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  creditNextMilestone: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },

  // Section titles
  sectionTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },

  // Milestones — badge-like chips (not tappable)
  milestoneScroll: {
    overflow: 'visible',
    marginBottom: spacing.xxl,
  },
  milestoneList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  milestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  milestoneChipReached: {
    backgroundColor: 'rgba(127,184,147,0.12)',
  },
  milestoneChipLocked: {
    backgroundColor: colors.background.input,
  },
  milestoneCount: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
  milestoneCountReached: {
    color: colors.text.secondary,
  },

  // Achievements
  achievementsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
    marginBottom: spacing.xxl,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.small,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  achievementTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  achievementDescription: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.input,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    minWidth: 32,
    textAlign: 'right',
  },

  // Pro card
  proCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.lg,
    backgroundColor: colors.background.card,
    ...shadows.small,
  },
  proCardInner: {
    padding: spacing.xl,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  proTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  proDescription: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  proFeatureText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  proCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    ...shadows.card,
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  proCTAButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});

export default PerksScreen;
