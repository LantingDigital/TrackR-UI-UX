import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

const CONTENT_PADDING = spacing.xxl;

export type NotificationPrefKey = 'newRides' | 'news' | 'community' | 'atPark';

export interface NotificationPrefs {
  newRides: boolean;
  news: boolean;
  community: boolean;
  atPark: boolean;
}

const PREF_ITEMS: {
  key: NotificationPrefKey;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}[] = [
  {
    key: 'newRides',
    icon: 'notifications-outline',
    label: 'New ride alerts',
    description: 'When a new coaster opens nearby',
  },
  {
    key: 'news',
    icon: 'newspaper-outline',
    label: 'News & rumors',
    description: 'Industry updates and announcements',
  },
  {
    key: 'community',
    icon: 'people-outline',
    label: 'Community highlights',
    description: 'Trending rides and top lists',
  },
  {
    key: 'atPark',
    icon: 'location-outline',
    label: 'At-the-park mode',
    description: 'Wait times and ride suggestions',
  },
];

interface NotificationPrefsStepProps {
  prefs: NotificationPrefs;
  onPrefsChange: (prefs: NotificationPrefs) => void;
  onContinue: () => void;
}

// ── Toggle Card ──────────────────────────────────
interface ToggleCardProps {
  item: (typeof PREF_ITEMS)[number];
  index: number;
  isActive: boolean;
  onToggle: () => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ item, index, isActive, onToggle }) => {
  // Staggered entrance
  const entranceOpacity = useSharedValue(0);
  const entranceTranslateY = useSharedValue(16);

  // Toggle animation
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  const toggleScale = useSharedValue(1);

  useEffect(() => {
    const delay = TIMING.stagger * index + 150;
    entranceOpacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    entranceTranslateY.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
  }, []);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, { duration: TIMING.fast });
    if (isActive) {
      toggleScale.value = withSequence(
        withSpring(1.02, SPRINGS.responsive),
        withSpring(1, SPRINGS.responsive)
      );
    }
  }, [isActive]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { translateY: entranceTranslateY.value },
      { scale: toggleScale.value },
    ],
  }));

  const cardBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(207,103,105,${activeProgress.value})`,
    backgroundColor: `rgba(207,103,105,${activeProgress.value * 0.08})`,
  }));

  const iconBgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(207,103,105,${0.08 + activeProgress.value * 0.07})`,
  }));

  return (
    <Pressable onPress={onToggle}>
      <Animated.View style={[styles.toggleCard, cardAnimatedStyle, cardBorderStyle]}>
        <Animated.View style={[styles.iconCircle, iconBgStyle]}>
          <Ionicons
            name={item.icon}
            size={22}
            color={isActive ? colors.accent.primary : colors.text.secondary}
          />
        </Animated.View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>{item.label}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
        <Ionicons
          name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isActive ? colors.accent.primary : colors.border.subtle}
        />
      </Animated.View>
    </Pressable>
  );
};

// ── Main Component ─────────────────────────────────
export const NotificationPrefsStep: React.FC<NotificationPrefsStepProps> = ({
  prefs,
  onPrefsChange,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const continuePress = useStrongPress();

  // Header entrance
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
    headerTranslateY.value = withSpring(0, SPRINGS.responsive);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const handleToggle = useCallback(
    (key: NotificationPrefKey) => {
      haptics.select();
      onPrefsChange({ ...prefs, [key]: !prefs[key] });
    },
    [prefs, onPrefsChange]
  );

  const handleContinue = () => {
    haptics.tap();
    onContinue();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxxl }]}>
      {/* Header */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>Stay in the loop</Text>
        <Text style={styles.subtitle}>Choose what you want to hear about</Text>
      </Animated.View>

      {/* Toggle cards */}
      <View style={styles.cardsContainer}>
        {PREF_ITEMS.map((item, index) => (
          <ToggleCard
            key={item.key}
            item={item}
            index={index}
            isActive={prefs[item.key]}
            onToggle={() => handleToggle(item.key)}
          />
        ))}
      </View>

      {/* Continue button */}
      <View style={[styles.continueContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Pressable
          {...continuePress.pressHandlers}
          onPress={handleContinue}
        >
          <Animated.View style={[styles.continueButton, continuePress.animatedStyle]}>
            <Text style={styles.continueText}>Continue</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  headerContainer: {
    paddingHorizontal: CONTENT_PADDING,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cardsContainer: {
    paddingHorizontal: CONTENT_PADDING,
    gap: spacing.base,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.lg,
    ...shadows.small,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  cardContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardLabel: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
  },
  continueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: CONTENT_PADDING,
  },
  continueButton: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
