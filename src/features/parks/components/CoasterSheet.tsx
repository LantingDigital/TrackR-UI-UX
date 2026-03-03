import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useTabBar } from '../../../contexts/TabBarContext';
import { haptics } from '../../../services/haptics';
import { EnrichedCoaster } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;
const IMAGE_ASPECT = 16 / 9;
const IMAGE_HEIGHT = (SCREEN_WIDTH - spacing.xl * 2) / IMAGE_ASPECT;

// ============================================
// Data helpers
// ============================================

interface HeroStat {
  value: string;
  unit: string;
  label: string;
}

function buildHeroStats(coaster: EnrichedCoaster): HeroStat[] {
  const hero: HeroStat[] = [];
  if (coaster.heightFt > 0) hero.push({ value: `${coaster.heightFt}`, unit: 'ft', label: 'Height' });
  if (coaster.speedMph > 0) hero.push({ value: `${coaster.speedMph}`, unit: 'mph', label: 'Top Speed' });
  if (coaster.lengthFt > 0) hero.push({ value: `${coaster.lengthFt.toLocaleString()}`, unit: 'ft', label: 'Length' });
  if (coaster.inversions > 0) hero.push({ value: `${coaster.inversions}`, unit: '', label: 'Inversions' });
  else if (coaster.dropFt) hero.push({ value: `${coaster.dropFt}`, unit: 'ft', label: 'Drop' });
  else if (coaster.gForce) hero.push({ value: `${coaster.gForce}`, unit: 'g', label: 'G-Force' });
  return hero.slice(0, 4);
}

interface StatItem {
  label: string;
  value: string;
}

function buildSecondaryStats(coaster: EnrichedCoaster, heroLabels: Set<string>): StatItem[] {
  const stats: StatItem[] = [];
  if (coaster.heightFt > 0 && !heroLabels.has('Height')) stats.push({ label: 'Height', value: `${coaster.heightFt} ft` });
  if (coaster.speedMph > 0 && !heroLabels.has('Top Speed')) stats.push({ label: 'Speed', value: `${coaster.speedMph} mph` });
  if (coaster.lengthFt > 0 && !heroLabels.has('Length')) stats.push({ label: 'Length', value: `${coaster.lengthFt.toLocaleString()} ft` });
  if (coaster.dropFt && !heroLabels.has('Drop')) stats.push({ label: 'Drop', value: `${coaster.dropFt} ft` });
  if (coaster.inversions > 0 && !heroLabels.has('Inversions')) stats.push({ label: 'Inversions', value: `${coaster.inversions}` });
  if (coaster.gForce && !heroLabels.has('G-Force')) stats.push({ label: 'G-Force', value: `${coaster.gForce}g` });
  if (coaster.duration) stats.push({ label: 'Duration', value: `${coaster.duration}s` });
  if (coaster.yearOpened) stats.push({ label: 'Opened', value: `${coaster.yearOpened}` });
  return stats;
}

interface DetailItem {
  label: string;
  value: string;
}

function buildDetails(coaster: EnrichedCoaster): DetailItem[] {
  const details: DetailItem[] = [];
  if (coaster.manufacturer) details.push({ label: 'Manufacturer', value: coaster.manufacturer });
  if (coaster.designer) details.push({ label: 'Designer', value: coaster.designer });
  if (coaster.model) details.push({ label: 'Model', value: coaster.model });
  if (coaster.propulsion) details.push({ label: 'Propulsion', value: coaster.propulsion });
  if (coaster.material) details.push({ label: 'Material', value: coaster.material });
  if (coaster.type) details.push({ label: 'Type', value: coaster.type });
  if (coaster.status) details.push({ label: 'Status', value: coaster.status });
  return details;
}

// ============================================
// CoasterSheet
// ============================================

interface CoasterSheetProps {
  coaster: EnrichedCoaster | null;
  visible: boolean;
  onClose: () => void;
}

export function CoasterSheet({ coaster, visible, onClose }: CoasterSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageOpacity = useSharedValue(0);
  const imageFadeStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const entrance = useSharedValue(0);

  const sheetTop = insets.top + 16;
  const sheetHeight = SCREEN_HEIGHT - sheetTop;

  useEffect(() => {
    if (visible && coaster) {
      setMounted(true);
      setIsDismissing(false);
      setImageError(false);
      setImageLoaded(false);
      imageOpacity.value = 0;
      tabBar?.hideTabBar();
      haptics.select();
      entrance.value = 0;
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 300 });
      entrance.value = withTiming(1, { duration: 500 });
    } else if (!visible) {
      tabBar?.showTabBar();
      entrance.value = 0;
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible, coaster]);

  const dismiss = useCallback(() => {
    setIsDismissing(true);
    tabBar?.showTabBar();
    entrance.value = 0;
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose, sheetHeight, tabBar]);

  const showTabBarJS = useCallback(() => {
    setIsDismissing(true);
    tabBar?.showTabBar();
  }, [tabBar]);

  const panGesture = Gesture.Pan()
    .enabled(visible)
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, sheetHeight * 0.4],
        [1, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (
        translateY.value > sheetHeight * 0.25 ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        runOnJS(showTabBarJS)();
        translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withSpring(0, SPRINGS.responsive);
        backdropOpacity.value = withSpring(1);
      }
    });

  // -- Staggered entrance styles --

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.15], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.15], [12, 0], Extrapolation.CLAMP) }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.05, 0.25], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.05, 0.25], [16, 0], Extrapolation.CLAMP) }],
  }));

  const heroStatsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.15, 0.35], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.15, 0.35], [16, 0], Extrapolation.CLAMP) }],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.25, 0.45], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.25, 0.45], [16, 0], Extrapolation.CLAMP) }],
  }));

  const aboutStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.35, 0.55], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.35, 0.55], [16, 0], Extrapolation.CLAMP) }],
  }));

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.45, 0.65], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.45, 0.65], [16, 0], Extrapolation.CLAMP) }],
  }));

  const recordsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.55, 0.75], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.55, 0.75], [16, 0], Extrapolation.CLAMP) }],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted || !coaster) return null;

  const heroStats = buildHeroStats(coaster);
  const heroLabels = new Set(heroStats.map((s) => s.label));
  const secondaryStats = buildSecondaryStats(coaster, heroLabels);
  const details = buildDetails(coaster);
  const hasImage = coaster.imageUrl && !imageError;

  // Header metadata line: "Manufacturer · Est. YYYY"
  const metaParts: string[] = [];
  if (coaster.manufacturer) metaParts.push(coaster.manufacturer);
  if (coaster.yearOpened) metaParts.push(`Est. ${coaster.yearOpened}`);
  const metaLine = metaParts.join(' · ');

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.container,
          { top: sheetTop, height: sheetHeight },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.handleArea}>
            <View style={styles.handle} />
          </Animated.View>
        </GestureDetector>

        {/* Close button */}
        <Pressable
          onPress={() => { haptics.tap(); dismiss(); }}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
        >
          {/* Section 0: Header */}
          <Animated.View style={headerStyle}>
            <Text style={styles.coasterName}>{coaster.name}</Text>
            <Text style={styles.parkName}>{coaster.park}</Text>
            {metaLine.length > 0 && (
              <Text style={styles.metaLine}>{metaLine}</Text>
            )}
            {coaster.status && (
              <View style={[
                styles.statusBadge,
                coaster.status === 'Operating'
                  ? styles.statusOperating
                  : styles.statusClosed,
              ]}>
                <Text style={[
                  styles.statusText,
                  coaster.status === 'Operating'
                    ? styles.statusTextOperating
                    : styles.statusTextClosed,
                ]}>
                  {coaster.status}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Hero Image */}
          {hasImage && (
            <Animated.View style={[styles.section, imageStyle]}>
              <View style={styles.imageCard}>
                {/* Spinner — visible while image is loading */}
                {!imageLoaded && (
                  <View style={styles.imageSpinner}>
                    <ActivityIndicator size="small" color={colors.text.meta} />
                  </View>
                )}
                {/* Image — renders hidden, fades in on load */}
                <Animated.View style={imageFadeStyle}>
                  <Image
                    source={{ uri: coaster.imageUrl }}
                    style={styles.heroImage}
                    resizeMode="cover"
                    onLoad={() => {
                      setImageLoaded(true);
                      imageOpacity.value = withTiming(1, { duration: 300 });
                    }}
                    onError={() => setImageError(true)}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          )}

          {/* Section 1: Hero Stats Strip */}
          {heroStats.length > 0 && (
            <Animated.View style={[styles.section, heroStatsStyle]}>
              <View style={styles.heroStatsRow}>
                {heroStats.map((stat) => (
                  <View key={stat.label} style={styles.heroStatCard}>
                    <Text
                      style={styles.heroStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {stat.value}
                    </Text>
                    {stat.unit ? (
                      <Text style={styles.heroStatUnit}>{stat.unit}</Text>
                    ) : null}
                    <Text
                      style={styles.heroStatLabel}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Section 2: Secondary Stats */}
          {secondaryStats.length > 0 && (
            <Animated.View style={[styles.section, detailsStyle]}>
              <View style={styles.secondaryCard}>
                <View style={styles.secondaryGrid}>
                  {secondaryStats.map((stat) => (
                    <View key={stat.label} style={styles.secondaryCell}>
                      <Text style={styles.secondaryValue}>{stat.value}</Text>
                      <Text style={styles.secondaryLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Section 3: Technical Details */}
          {details.length > 0 && (
            <Animated.View style={[styles.section, detailsStyle]}>
              <Text style={styles.sectionLabel}>DETAILS</Text>
              <View style={styles.detailsCard}>
                {details.map((d, i) => (
                  <View
                    key={d.label}
                    style={[
                      styles.detailRow,
                      i < details.length - 1 && styles.detailRowBorder,
                    ]}
                  >
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text style={styles.detailValue}>{d.value}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Section 4: About */}
          {coaster.description && (
            <Animated.View style={[styles.section, aboutStyle]}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.description}>{coaster.description}</Text>
            </Animated.View>
          )}

          {/* Section 5: Notable Features */}
          {coaster.notableFeatures && coaster.notableFeatures.length > 0 && (
            <Animated.View style={[styles.section, featuresStyle]}>
              <Text style={styles.sectionLabel}>NOTABLE FEATURES</Text>
              <View style={styles.featuresCard}>
                {coaster.notableFeatures.map((f, i) => (
                  <View
                    key={i}
                    style={[
                      styles.featureRow,
                      i < coaster.notableFeatures!.length - 1 && styles.featureRowBorder,
                    ]}
                  >
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Section 6: Records */}
          {coaster.records && coaster.records.length > 0 && (
            <Animated.View style={[styles.section, recordsStyle]}>
              <Text style={styles.sectionLabel}>RECORDS</Text>
              {coaster.records.map((r, i) => (
                <View key={i} style={styles.recordCard}>
                  <Text style={styles.recordText}>{r}</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...shadows.modal,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  // -- Header --
  coasterName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  parkName: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  metaLine: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  statusOperating: {
    backgroundColor: 'rgba(40, 167, 69, 0.12)',
  },
  statusClosed: {
    backgroundColor: 'rgba(153, 153, 153, 0.12)',
  },
  statusText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
  },
  statusTextOperating: {
    color: colors.status.success,
  },
  statusTextClosed: {
    color: colors.text.meta,
  },

  // -- Sections --
  section: {
    marginTop: spacing.xxl,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.base,
  },

  // -- Hero Image --
  imageCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.background.imagePlaceholder,
    ...shadows.small,
  },
  heroImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  imageSpinner: {
    ...StyleSheet.absoluteFillObject,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- Hero Stats --
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  heroStatValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroStatUnit: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: 1,
    textAlign: 'center',
  },
  heroStatLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // -- Secondary Stats --
  secondaryCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  secondaryCell: {
    width: '50%',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.md,
  },
  secondaryValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  secondaryLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 2,
  },

  // -- Details --
  detailsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  detailLabel: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.lg,
  },

  // -- About --
  description: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * 1.6,
  },

  // -- Notable Features --
  featuresCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.base,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
    marginTop: 6,
    marginRight: spacing.base,
  },
  featureText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    color: colors.text.primary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },

  // -- Records --
  recordCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
    ...shadows.small,
  },
  recordText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
});
