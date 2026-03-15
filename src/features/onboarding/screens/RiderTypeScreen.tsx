import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  interpolateColor,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { colors } from '../../../theme/colors';
import type { RiderType } from '../../../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = spacing.xxl;
const ACCENT = colors.accent.primary;

interface RiderOption {
  key: NonNullable<RiderType>;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const RIDER_OPTIONS: RiderOption[] = [
  {
    key: 'thrills',
    icon: 'rocket',
    title: "I'm here for the thrills",
    subtitle: 'Log rides, rate coasters, build your personal rankings',
  },
  {
    key: 'planner',
    icon: 'map-outline',
    title: "I'm visiting a park",
    subtitle: 'Wait times, maps, food search, and park day essentials',
  },
];

interface RiderTypeScreenProps {
  selectedType: RiderType;
  onSelect: (type: RiderType) => void;
  onContinue: () => void;
}

interface RiderCardProps {
  option: RiderOption;
  selectedIndex: SharedValue<number>;
  index: number;
  onPress: () => void;
}

const RiderCard = React.memo<RiderCardProps>(({ option, selectedIndex, index, onPress }) => {
  // Entrance stagger
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(24);

  // Selection progress driven entirely on the UI thread via useAnimatedReaction.
  // Unlike useDerivedValue, this won't be disrupted by JS-thread re-renders.
  const selectionProgress = useSharedValue(selectedIndex.value === index ? 1 : 0);

  useAnimatedReaction(
    () => selectedIndex.value,
    (currentIndex) => {
      selectionProgress.value = withTiming(currentIndex === index ? 1 : 0, { duration: 200 });
    },
    []
  );

  useEffect(() => {
    const delay = 200 + index * 120;
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    cardTranslateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const selectionStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.12)', 'rgba(207,103,105,0.6)'],
    ),
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['#242428', 'rgba(207,103,105,0.08)'],
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.06)', 'rgba(207,103,105,0.12)'],
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selectionProgress.value,
    transform: [{ scale: interpolate(selectionProgress.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.card, cardAnimStyle, selectionStyle]}>
        <View style={styles.cardContent}>
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <Ionicons
              name={option.icon}
              size={28}
              color={ACCENT}
            />
          </Animated.View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
          </View>
          <Animated.View style={[styles.checkCircle, checkStyle]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

export const RiderTypeScreen: React.FC<RiderTypeScreenProps> = ({
  selectedType,
  onSelect,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const ctaPress = useStrongPress({ disabled: !selectedType });

  // Shared animated index for simultaneous card transitions (no flash)
  // -1 = nothing selected, 0 = thrills, 1 = planner
  const selectedIndex = useSharedValue(-1);

  // Header entrance
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);

  // CTA fade
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);

  useEffect(() => {
    ctaOpacity.value = withTiming(selectedType ? 1 : 0, { duration: 250 });
  }, [selectedType]);

  // Sync selectedIndex on mount if navigating back with a pre-selected value
  useEffect(() => {
    if (selectedType && selectedIndex.value === -1) {
      const idx = RIDER_OPTIONS.findIndex((o) => o.key === selectedType);
      selectedIndex.value = idx;
    }
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const handleSelect = (type: NonNullable<RiderType>) => {
    haptics.select();
    // Update shared value FIRST (UI thread, instant) — no render gap
    const idx = RIDER_OPTIONS.findIndex((o) => o.key === type);
    selectedIndex.value = idx;
    // Then update React state (may cause re-render but visuals are already correct)
    onSelect(type);
  };

  const handleContinue = () => {
    if (!selectedType) return;
    haptics.tap();
    onContinue();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      {/* Top spacer for vertical centering */}
      <View style={styles.topSpacer} />

      {/* Header */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>How do you ride?</Text>
        <Text style={styles.subtitle}>
          This shapes your TrackR experience. You can always change it later.
        </Text>
      </Animated.View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {RIDER_OPTIONS.map((option, index) => (
          <RiderCard
            key={option.key}
            option={option}
            index={index}
            selectedIndex={selectedIndex}
            onPress={() => handleSelect(option.key)}
          />
        ))}
      </View>

      {/* Bottom spacer for vertical centering */}
      <View style={styles.bottomSpacer} />

      {/* CTA */}
      <View style={[styles.ctaRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Animated.View style={ctaStyle}>
          <Pressable
            {...ctaPress.pressHandlers}
            onPress={handleContinue}
            disabled={!selectedType}
          >
            <Animated.View style={ctaPress.animatedStyle}>
              <LinearGradient
                colors={[ACCENT, '#B85557']}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.ctaText}>Continue</Text>
              </LinearGradient>
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
    backgroundColor: 'transparent',
  },
  topSpacer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: '#242428',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: typography.sizes.meta * 1.5,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomSpacer: {
    flex: 1,
  },
  // CTA
  ctaRegion: {
    paddingTop: spacing.xl,
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 48,
    height: 56,
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
