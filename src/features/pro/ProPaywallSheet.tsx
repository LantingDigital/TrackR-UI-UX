/**
 * ProPaywallSheet — PWYW bottom sheet paywall
 *
 * Inviting, not aggressive. "We'd love your support" energy.
 * Three price cards ($2/$3/$4) with highlighted default ($3).
 * Custom slider for $0.99-$11.99 range (snaps to IAP tiers).
 * Monthly/Annual toggle. Feature list. Subscribe CTA.
 *
 * Presented as a dismissible bottom sheet — NOT blocking.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { typography } from '../../theme/typography';
import { SPRINGS, TIMING } from '../../constants/animations';
import { haptics } from '../../services/haptics';
import { useSpringPress } from '../../hooks/useSpringPress';
import {
  useProStore,
  PRO_PRICE_OPTIONS,
  PRO_SLIDER_PRICES,
  PRO_FEATURES,
  getTierForPrice,
  getTierDisplayName,
  type BillingPeriod,
  type ProPriceOption,
} from '../../stores/proStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────

interface ProPaywallSheetProps {
  visible: boolean;
  onDismiss: () => void;
  /** The feature that triggered the paywall (for context messaging) */
  triggerFeature?: string;
}

// ─── Billing Toggle ─────────────────────────────────────

const BillingToggle: React.FC<{
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}> = ({ period, onChange }) => {
  const indicatorX = useSharedValue(period === 'monthly' ? 0 : 1);

  useEffect(() => {
    indicatorX.value = withSpring(period === 'monthly' ? 0 : 1, SPRINGS.stiff);
  }, [period, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(indicatorX.value, [0, 1], [0, (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / 2]) }],
  }));

  return (
    <View style={toggleStyles.container}>
      <Animated.View style={[toggleStyles.indicator, indicatorStyle]} />
      <Pressable
        style={toggleStyles.option}
        onPress={() => { haptics.tap(); onChange('monthly'); }}
      >
        <Text style={[toggleStyles.label, period === 'monthly' && toggleStyles.labelActive]}>
          Monthly
        </Text>
      </Pressable>
      <Pressable
        style={toggleStyles.option}
        onPress={() => { haptics.tap(); onChange('annual'); }}
      >
        <Text style={[toggleStyles.label, period === 'annual' && toggleStyles.labelActive]}>
          Annual
        </Text>
        <Text style={toggleStyles.savingsBadge}>Save 17%</Text>
      </Pressable>
    </View>
  );
};

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: '50%',
    height: '100%',
    backgroundColor: colors.background.card,
    borderRadius: radius.pill,
    ...shadows.small,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    zIndex: 1,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  labelActive: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  savingsBadge: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
    marginTop: 1,
  },
});

// ─── Price Card ─────────────────────────────────────────

const PriceCard: React.FC<{
  option: ProPriceOption;
  isSelected: boolean;
  period: BillingPeriod;
  onSelect: () => void;
}> = ({ option, isSelected, period, onSelect }) => {
  const borderWidth = useSharedValue(isSelected ? 2 : 1);
  const scale = useSharedValue(isSelected ? 1 : 0.96);

  useEffect(() => {
    borderWidth.value = withTiming(isSelected ? 2 : 1, { duration: 150 });
    scale.value = withSpring(isSelected ? 1 : 0.96, SPRINGS.stiff);
  }, [isSelected, borderWidth, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: isSelected ? colors.accent.primary : colors.border.subtle,
    transform: [{ scale: scale.value }],
  }));

  const price = period === 'monthly' ? option.priceMonthly : option.priceAnnual;
  const tierName = getTierDisplayName(option.tier);

  return (
    <Pressable onPress={() => { haptics.select(); onSelect(); }}>
      <Animated.View style={[priceStyles.card, cardStyle]}>
        {option.isDefault && (
          <View style={priceStyles.popularBadge}>
            <Text style={priceStyles.popularText}>POPULAR</Text>
          </View>
        )}
        <Text style={priceStyles.tierName}>{tierName}</Text>
        <Text style={priceStyles.price}>
          ${price.toFixed(2)}
        </Text>
        <Text style={priceStyles.period}>
          /{period === 'monthly' ? 'mo' : 'yr'}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const priceStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  popularText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  tierName: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  period: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
});

// ─── Feature Row ────────────────────────────────────────

const FeatureRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  index: number;
}> = ({ icon, label, index }) => (
  <Animated.View
    entering={FadeInDown.duration(200).delay(300 + index * 40)}
    style={featureStyles.row}
  >
    <View style={featureStyles.iconWrap}>
      <Ionicons name={icon} size={16} color={colors.accent.primary} />
    </View>
    <Text style={featureStyles.label}>{label}</Text>
  </Animated.View>
);

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  label: {
    fontSize: typography.sizes.label,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
});

// ─── Main Component ─────────────────────────────────────

export const ProPaywallSheet: React.FC<ProPaywallSheetProps> = ({
  visible,
  onDismiss,
  triggerFeature,
}) => {
  const insets = useSafeAreaInsets();
  const subscribe = useProStore(state => state.subscribe);
  const setBillingPeriod = useProStore(state => state.setBillingPeriod);
  const billingPeriod = useProStore(state => state.billingPeriod);

  const [selectedPriceIndex, setSelectedPriceIndex] = useState(1); // default to $2.99
  const subscribePress = useSpringPress({ scale: 0.97 });

  // Sheet slide animation
  const translateY = useSharedValue(800);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRINGS.stiff);
    } else {
      translateY.value = withTiming(800, { duration: 250, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [800, 0], [0, 1]),
    pointerEvents: visible ? 'auto' as const : 'none' as const,
  }));

  const selectedOption = PRO_PRICE_OPTIONS[selectedPriceIndex];
  const price = billingPeriod === 'monthly'
    ? selectedOption.priceMonthly
    : selectedOption.priceAnnual;

  const handleSubscribe = useCallback(() => {
    haptics.success();
    subscribe(selectedOption.tier, selectedOption.priceMonthly);
    onDismiss();
  }, [selectedOption, subscribe, onDismiss]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Handle */}
        <View style={styles.handleBar} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Title */}
          <Text style={styles.title}>TrackR Pro</Text>
          <Text style={styles.subtitle}>
            {triggerFeature
              ? `Unlock ${triggerFeature} and more`
              : "Support TrackR and unlock the full experience"}
          </Text>

          {/* Billing Toggle */}
          <BillingToggle period={billingPeriod} onChange={setBillingPeriod} />

          {/* Price Cards */}
          <View style={styles.priceRow}>
            {PRO_PRICE_OPTIONS.map((option, i) => (
              <PriceCard
                key={option.id}
                option={option}
                isSelected={i === selectedPriceIndex}
                period={billingPeriod}
                onSelect={() => setSelectedPriceIndex(i)}
              />
            ))}
          </View>

          {/* Features */}
          <Text style={styles.featuresTitle}>Everything included</Text>
          {PRO_FEATURES.map((feature, i) => (
            <FeatureRow
              key={feature.label}
              icon={feature.icon}
              label={feature.label}
              index={i}
            />
          ))}

          {/* Fine print */}
          <Text style={styles.finePrint}>
            Cancel anytime. All tiers unlock the same features.
          </Text>
        </ScrollView>

        {/* Subscribe Button */}
        <View style={styles.ctaSection}>
          <Pressable
            onPress={handleSubscribe}
            {...subscribePress.pressHandlers}
            style={{ flex: 1 }}
          >
            <Animated.View style={[styles.subscribeButton, subscribePress.animatedStyle]}>
              <Text style={styles.subscribeText}>
                Subscribe  ·  ${price.toFixed(2)}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
              </Text>
            </Animated.View>
          </Pressable>
        </View>

        {/* Restore */}
        <Pressable
          onPress={() => {
            haptics.tap();
            // Mock restore
          }}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    maxHeight: '92%',
    ...shadows.modal,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.heroLarge,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.subtitle,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    lineHeight: typography.sizes.subtitle * typography.lineHeights.relaxed,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  featuresTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  finePrint: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  ctaSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  subscribeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
  },
  subscribeText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  restoreText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    textAlign: 'center',
    paddingVertical: spacing.base,
  },
});
