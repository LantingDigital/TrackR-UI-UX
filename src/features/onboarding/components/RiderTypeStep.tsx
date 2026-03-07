import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
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
import type { RiderType } from '../../../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.base;
const GRID_PADDING = spacing.xxl;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - CARD_GAP) / 2;

const RIDER_TYPES: { key: NonNullable<RiderType>; emoji: string; label: string }[] = [
  { key: 'thrills', emoji: '🎢', label: "I'm here for the thrills" },
  { key: 'data', emoji: '📊', label: "I've got a spreadsheet for this" },
  { key: 'planner', emoji: '🗺️', label: "Always planning the next trip" },
  { key: 'newbie', emoji: '🆕', label: "Just getting started" },
];

interface RiderTypeStepProps {
  selectedType: RiderType;
  onSelect: (type: RiderType) => void;
  onContinue: () => void;
}

// ── Individual Card ──────────────────────────────────
interface RiderCardProps {
  item: (typeof RIDER_TYPES)[number];
  index: number;
  isSelected: boolean;
  onPress: () => void;
}

const RiderCard: React.FC<RiderCardProps> = ({ item, index, isSelected, onPress }) => {
  // Stagger entrance
  const entranceScale = useSharedValue(0.9);
  const entranceOpacity = useSharedValue(0);

  // Selection bounce
  const selectionScale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    const delay = TIMING.stagger * index + 100;
    entranceOpacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    entranceScale.value = withDelay(delay, withSpring(1, SPRINGS.responsive));
  }, []);

  useEffect(() => {
    if (isSelected) {
      selectionScale.value = withSequence(
        withSpring(1.03, SPRINGS.responsive),
        withSpring(1, SPRINGS.responsive),
      );
      borderOpacity.value = withTiming(1, { duration: TIMING.fast });
    } else {
      selectionScale.value = withSpring(1, SPRINGS.responsive);
      borderOpacity.value = withTiming(0, { duration: TIMING.fast });
    }
  }, [isSelected]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [
      { scale: entranceScale.value * selectionScale.value },
    ],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(207,103,105,${borderOpacity.value})`,
    backgroundColor: `rgba(207,103,105,${borderOpacity.value * 0.08})`,
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.card, cardStyle, borderStyle]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.cardLabel}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ── Main Component ───────────────────────────────────
export const RiderTypeStep: React.FC<RiderTypeStepProps> = ({
  selectedType,
  onSelect,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const continuePress = useStrongPress({ disabled: !selectedType });

  // Header entrance
  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Continue button fade
  const continueOpacity = useSharedValue(0);
  useEffect(() => {
    continueOpacity.value = withTiming(selectedType ? 1 : 0, { duration: TIMING.fast });
  }, [selectedType]);
  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
  }));

  const handleSelect = (type: NonNullable<RiderType>) => {
    haptics.select();
    onSelect(type);
  };

  const handleContinue = () => {
    if (!selectedType) return;
    haptics.tap();
    onContinue();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxxl }]}>
      {/* Header */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>What kind of rider are you?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience</Text>
      </Animated.View>

      {/* 2×2 grid */}
      <View style={styles.grid}>
        {RIDER_TYPES.map((item, index) => (
          <RiderCard
            key={item.key}
            item={item}
            index={index}
            isSelected={selectedType === item.key}
            onPress={() => handleSelect(item.key)}
          />
        ))}
      </View>

      {/* Continue button */}
      <View style={[styles.continueContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View style={continueStyle}>
          <Pressable
            {...continuePress.pressHandlers}
            onPress={handleContinue}
            disabled={!selectedType}
          >
            <Animated.View style={[styles.continueButton, continuePress.animatedStyle]}>
              <Text style={styles.continueText}>Continue</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
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
    paddingHorizontal: GRID_PADDING,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: CARD_GAP,
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 0.9,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.base,
  },
  cardLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.sizes.label * typography.lineHeights.relaxed,
  },
  continueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: GRID_PADDING,
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
