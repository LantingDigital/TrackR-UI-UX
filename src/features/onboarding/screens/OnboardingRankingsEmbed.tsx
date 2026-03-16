/**
 * OnboardingRankingsEmbed — Self-contained CriteriaWeightEditor demo for onboarding.
 *
 * Stripped-down replica of CriteriaWeightEditorScreen that auto-demos:
 * 1. Staggered entrance of distribution bar, template chips, criteria rows
 * 2. Smooth slider drag on Airtime (25% -> 40%)
 * 3. Smooth slider drag on Intensity (redistributed value -> ~15%)
 * 4. Template chip tap: "Thrill Seeker" -> "Theme Fan" -> back to defaults
 * 5. Loop
 *
 * No store/context/navigation imports. Fully self-contained.
 * All animations use react-native-reanimated.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Criterion Definitions ──────────────────────────────────

interface CriterionDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultWeight: number;
}

const CRITERIA: CriterionDef[] = [
  { id: 'airtime',    name: 'Airtime',    icon: 'airplane-outline',       color: '#CF6769', defaultWeight: 25 },
  { id: 'intensity',  name: 'Intensity',  icon: 'flash-outline',          color: '#D4A98A', defaultWeight: 25 },
  { id: 'smoothness', name: 'Smoothness', icon: 'water-outline',          color: '#8FBFB8', defaultWeight: 20 },
  { id: 'theming',    name: 'Theming',    icon: 'color-palette-outline',  color: '#B8A3C4', defaultWeight: 15 },
  { id: 'pacing',     name: 'Pacing',     icon: 'speedometer-outline',    color: '#92ACC0', defaultWeight: 15 },
  { id: 'inversions', name: 'Inversions', icon: 'sync-outline',           color: '#D6C48A', defaultWeight: 0 },
  { id: 'launch',     name: 'Launch',     icon: 'rocket-outline',         color: '#9DC0A0', defaultWeight: 0 },
];

const ENABLED_CRITERIA = CRITERIA.filter(c => c.defaultWeight > 0);

// ─── Template Definitions ───────────────────────────────────

interface TemplateDef {
  id: string;
  label: string;
  icon: string;
  weights: Record<string, number>;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'thrill-seeker',
    label: 'Thrill Seeker',
    icon: 'flash-outline',
    weights: { airtime: 25, intensity: 30, smoothness: 10, theming: 0, pacing: 15, inversions: 15, launch: 5 },
  },
  {
    id: 'theme-fan',
    label: 'Theme Fan',
    icon: 'color-palette-outline',
    weights: { airtime: 20, intensity: 10, smoothness: 20, theming: 30, pacing: 20, inversions: 0, launch: 0 },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: 'scale-outline',
    weights: { airtime: 25, intensity: 25, smoothness: 20, theming: 15, pacing: 15, inversions: 0, launch: 0 },
  },
  {
    id: 'speed',
    label: 'Speed',
    icon: 'rocket-outline',
    weights: { airtime: 15, intensity: 35, smoothness: 10, theming: 0, pacing: 25, inversions: 10, launch: 5 },
  },
  {
    id: 'airtime',
    label: 'Airtime',
    icon: 'airplane-outline',
    weights: { airtime: 45, intensity: 15, smoothness: 15, theming: 5, pacing: 15, inversions: 5, launch: 0 },
  },
  {
    id: 'smooth',
    label: 'Smooth',
    icon: 'water-outline',
    weights: { airtime: 15, intensity: 10, smoothness: 40, theming: 20, pacing: 15, inversions: 0, launch: 0 },
  },
];

// ─── Weight Redistribution (simplified for demo) ────────────

function redistributeFromChange(
  weights: Record<string, number>,
  changedId: string,
  newWeight: number,
): Record<string, number> {
  const result = { ...weights };
  const oldWeight = result[changedId];
  const delta = newWeight - oldWeight;
  result[changedId] = newWeight;

  // Gather unlocked others that are enabled (weight > 0) and not the changed one
  const others = CRITERIA.filter(c => c.id !== changedId && result[c.id] > 0);
  if (others.length === 0) return result;

  const totalOthers = others.reduce((s, c) => s + result[c.id], 0);
  const remaining = 100 - newWeight;

  for (const c of others) {
    const proportion = totalOthers > 0 ? result[c.id] / totalOthers : 1 / others.length;
    result[c.id] = Math.max(1, Math.round(remaining * proportion));
  }

  // Fix rounding — adjust largest to make total exactly 100
  const total = Object.values(result).reduce((s, v) => s + v, 0);
  if (total !== 100) {
    const largest = others.reduce((a, b) => result[a.id] >= result[b.id] ? a : b);
    result[largest.id] += 100 - total;
  }

  return result;
}

// ─── Animated Distribution Bar Segment ──────────────────────

const DistBarSegment = React.memo(function DistBarSegment({
  weightSV,
  color,
}: {
  weightSV: SharedValue<number>;
  color: string;
}) {
  const animStyle = useAnimatedStyle(() => ({
    flex: Math.max(weightSV.value, 0),
  }));

  return (
    <Animated.View style={[s.distBarSegment, { backgroundColor: color }, animStyle]} />
  );
});

// ─── Animated Criterion Row ─────────────────────────────────

const SLIDER_TRACK_H = 4;
const SLIDER_THUMB_SIZE = 24;
const SLIDER_HEIGHT = 36;
const SLIDER_TRACK_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.lg * 2 - (32 + spacing.md) - 32;

interface CriterionRowProps {
  criterion: CriterionDef;
  weightSV: SharedValue<number>;
  index: number;
  entranceProgress: SharedValue<number>;
  isEnabled: boolean;
}

const CriterionRow = React.memo(function CriterionRow({
  criterion,
  weightSV,
  index,
  entranceProgress,
  isEnabled,
}: CriterionRowProps) {
  const rowEntranceStyle = useAnimatedStyle(() => ({
    opacity: entranceProgress.value,
    transform: [{ translateY: interpolate(entranceProgress.value, [0, 1], [16, 0]) }],
  }));

  // Weight % text
  const weightTextStyle = useAnimatedStyle(() => {
    const w = Math.round(weightSV.value);
    // We can't set text content in animated style, but we can control opacity
    return { opacity: isEnabled ? 1 : 0.5 };
  });

  // Slider fill (scaleX + translateX transform, same as real screen)
  const fillStyle = useAnimatedStyle(() => {
    'worklet';
    if (!isEnabled) return { transform: [{ translateX: 0 }, { scaleX: 0 }] };
    const progress = interpolate(
      weightSV.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const tw = SLIDER_TRACK_WIDTH;
    return {
      transform: [
        { translateX: (progress - 1) * tw / 2 },
        { scaleX: progress },
      ],
    };
  });

  // Slider thumb position
  const thumbStyle = useAnimatedStyle(() => {
    'worklet';
    if (!isEnabled) return { transform: [{ translateX: 0 }], opacity: 0 };
    const progress = interpolate(
      weightSV.value,
      [0, 100],
      [0, SLIDER_TRACK_WIDTH - SLIDER_THUMB_SIZE],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateX: progress }],
      opacity: 1,
    };
  });

  return (
    <Animated.View style={rowEntranceStyle}>
      {index > 0 && <View style={s.rowBorder} />}
      <View style={[s.criterionRow, !isEnabled && { opacity: 0.4 }]}>
        {/* Header row */}
        <View style={s.criterionHeaderRow}>
          {/* Icon */}
          <View style={[s.criterionIcon, { backgroundColor: criterion.color + '20' }]}>
            <Ionicons name={criterion.icon as any} size={16} color={criterion.color} />
          </View>

          {/* Name */}
          <Text style={s.criterionName}>{criterion.name}</Text>

          {/* Weight display */}
          <View style={s.statusArea}>
            {isEnabled ? (
              <AnimatedWeightText weightSV={weightSV} color={criterion.color} />
            ) : (
              <Text style={s.criterionOff}>OFF</Text>
            )}
          </View>

          {/* Switch visual (static, not interactive) */}
          <View style={[
            s.switchTrack,
            { backgroundColor: isEnabled ? criterion.color : colors.border.subtle },
          ]}>
            <View style={[
              s.switchThumb,
              { transform: [{ translateX: isEnabled ? 14 : 0 }] },
            ]} />
          </View>
        </View>

        {/* Slider (only for enabled + shown) */}
        {isEnabled && (
          <View style={s.sliderWrap}>
            <View style={s.sliderContainer}>
              <View style={[s.sliderTrack, { marginHorizontal: SLIDER_THUMB_SIZE / 2 }]}>
                <Animated.View style={[s.sliderFill, { backgroundColor: criterion.color }, fillStyle]} />
              </View>
              <Animated.View style={[s.sliderThumb, { borderColor: criterion.color }, thumbStyle]} />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ─── Animated Weight Text (UI-thread, zero JS re-renders) ────

function AnimatedWeightText({ weightSV, color }: { weightSV: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(weightSV.value)}%`,
  } as any));

  return (
    <AnimatedTextInput
      editable={false}
      style={[s.criterionWeight, { color }]}
      animatedProps={animatedProps}
      defaultValue="25%"
    />
  );
}

// ─── Template Chip ──────────────────────────────────────────

interface TemplateChipProps {
  template: TemplateDef;
  isActive: boolean;
}

const TemplateChip: React.FC<TemplateChipProps> = ({ template, isActive }) => {
  const bgProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    bgProgress.value = withTiming(isActive ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [isActive]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: bgProgress.value > 0.5 ? colors.accent.primary : colors.background.card,
  }));

  return (
    <Animated.View style={[s.templateChip, chipStyle]}>
      <Ionicons
        name={template.icon as any}
        size={14}
        color={isActive ? colors.text.inverse : colors.accent.primary}
      />
      <Text style={[
        s.templateChipText,
        { color: isActive ? colors.text.inverse : colors.text.primary },
      ]}>
        {template.label}
      </Text>
    </Animated.View>
  );
};

// ─── Distribution Legend Pill ────────────────────────────────

function LegendPill({ weightSV, name, color }: { weightSV: SharedValue<number>; name: string; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    text: `${name} ${Math.round(weightSV.value)}%`,
  } as any));

  const pillVisibility = useAnimatedStyle(() => ({
    opacity: Math.round(weightSV.value) > 0 ? 1 : 0,
  }));

  return (
    <Animated.View style={[s.distPill, pillVisibility]}>
      <View style={[s.distDot, { backgroundColor: color }]} />
      <AnimatedTextInput
        editable={false}
        style={s.distPillText}
        animatedProps={animatedProps}
        defaultValue={`${name} 25%`}
      />
    </Animated.View>
  );
}

// ─── Main Embed ─────────────────────────────────────────────

interface OnboardingRankingsEmbedProps {
  isActive: boolean;
}

export const OnboardingRankingsEmbed: React.FC<OnboardingRankingsEmbedProps> = ({ isActive }) => {
  // Timer management
  const allTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoActiveRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    allTimersRef.current.forEach(t => clearTimeout(t));
    allTimersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
    const t = setTimeout(fn, delay);
    allTimersRef.current.push(t);
    return t;
  }, []);

  // Shared values for each criterion's weight
  const weightSVs = useRef(
    CRITERIA.map(c => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const sv = useSharedValue(c.defaultWeight);
      return sv;
    })
  ).current;

  // Entrance animations (per section)
  const headerEntrance = useSharedValue(0);
  const distBarEntrance = useSharedValue(0);
  const templateEntrance = useSharedValue(0);
  const criteriaEntrances = useRef(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    CRITERIA.map(() => useSharedValue(0))
  ).current;
  const footerEntrance = useSharedValue(0);

  // Active template tracking
  const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);

  // ─── Animation Helpers ──────────────────────────────────

  const animateWeightsTo = useCallback((targetWeights: Record<string, number>, duration: number) => {
    CRITERIA.forEach((c, i) => {
      const target = targetWeights[c.id] ?? 0;
      weightSVs[i].value = withTiming(target, {
        duration,
        easing: Easing.inOut(Easing.cubic),
      });
    });
  }, [weightSVs]);

  const animateSingleSlider = useCallback((
    criterionId: string,
    targetWeight: number,
    duration: number,
  ) => {
    // Compute intermediate frames for smooth redistribution
    const criterionIndex = CRITERIA.findIndex(c => c.id === criterionId);
    if (criterionIndex === -1) return;

    const startWeights: Record<string, number> = {};
    CRITERIA.forEach((c, i) => {
      startWeights[c.id] = weightSVs[i].value;
    });

    const startVal = startWeights[criterionId];
    const steps = 30; // Animation frames
    const stepDuration = duration / steps;

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      // Ease in-out cubic
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const currentWeight = Math.round(startVal + (targetWeight - startVal) * eased);

      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        const redistributed = redistributeFromChange(
          // Get current weights from SVs
          Object.fromEntries(CRITERIA.map((c, i) => [c.id, Math.round(weightSVs[i].value)])),
          criterionId,
          currentWeight,
        );
        CRITERIA.forEach((c, i) => {
          weightSVs[i].value = withTiming(redistributed[c.id] ?? 0, {
            duration: stepDuration * 1.2,
            easing: Easing.out(Easing.ease),
          });
        });
      }, step * stepDuration);
    }
  }, [weightSVs, scheduleTimer]);

  // ─── Demo Loop ──────────────────────────────────────────

  const runDemoLoop = useCallback(() => {
    if (!demoActiveRef.current) return;

    // Reset all values
    CRITERIA.forEach((c, i) => {
      weightSVs[i].value = c.defaultWeight;
    });
    headerEntrance.value = 0;
    distBarEntrance.value = 0;
    templateEntrance.value = 0;
    criteriaEntrances.forEach(sv => { sv.value = 0; });
    footerEntrance.value = 0;
    setActiveTemplateId(null);

    let t = 0;

    // Phase 1: Staggered entrance (0-1.5s)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      headerEntrance.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
    }, t);
    t += 100;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      distBarEntrance.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
    }, t);
    t += 100;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      templateEntrance.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
    }, t);
    t += 100;

    // Stagger criteria rows
    CRITERIA.forEach((_, i) => {
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        criteriaEntrances[i].value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
      }, t + i * 60);
    });
    t += CRITERIA.length * 60 + 280;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      footerEntrance.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
    }, t);
    t += 300;

    // Phase 2: Hold at defaults (1.5s)
    t += 1500;

    // Phase 3: Slide Airtime from 25% to 40% (2s smooth drag)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      animateSingleSlider('airtime', 40, 1800);
    }, t);
    t += 2200;

    // Phase 4: Slide Intensity down to ~15% (2s smooth drag)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      animateSingleSlider('intensity', 15, 1800);
    }, t);
    t += 2200;

    // Phase 5: Hold to show custom distribution (1.5s)
    t += 1500;

    // Phase 6: Tap "Thrill Seeker" template (snap all sliders)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      setActiveTemplateId('thrill-seeker');
      const tw = TEMPLATES.find(tp => tp.id === 'thrill-seeker')!.weights;
      animateWeightsTo(tw, 500);
    }, t);
    t += 2000;

    // Phase 7: Tap "Theme Fan" template
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      setActiveTemplateId('theme-fan');
      const tw = TEMPLATES.find(tp => tp.id === 'theme-fan')!.weights;
      animateWeightsTo(tw, 500);
    }, t);
    t += 2000;

    // Phase 8: Hold
    t += 1500;

    // Phase 9: Back to Balanced (defaults)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      setActiveTemplateId('balanced');
      const tw = TEMPLATES.find(tp => tp.id === 'balanced')!.weights;
      animateWeightsTo(tw, 500);
    }, t);
    t += 1500;

    // Phase 10: Clear template highlight, brief hold, then loop
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      setActiveTemplateId(null);
    }, t);
    t += 500;

    // Loop
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      runDemoLoop();
    }, t);
  }, [
    weightSVs, headerEntrance, distBarEntrance, templateEntrance,
    criteriaEntrances, footerEntrance, scheduleTimer, animateWeightsTo,
    animateSingleSlider,
  ]);

  // ─── isActive Effect ────────────────────────────────────

  useEffect(() => {
    if (isActive) {
      demoActiveRef.current = true;
      runDemoLoop();
    } else {
      demoActiveRef.current = false;
      clearAllTimers();
      // Reset
      CRITERIA.forEach((c, i) => {
        weightSVs[i].value = c.defaultWeight;
      });
      headerEntrance.value = 0;
      distBarEntrance.value = 0;
      templateEntrance.value = 0;
      criteriaEntrances.forEach(sv => { sv.value = 0; });
      footerEntrance.value = 0;
      setActiveTemplateId(null);
    }

    return () => {
      clearAllTimers();
    };
  }, [isActive, clearAllTimers, runDemoLoop, weightSVs, headerEntrance, distBarEntrance, templateEntrance, criteriaEntrances, footerEntrance]);

  // ─── Animated Styles ────────────────────────────────────

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerEntrance.value,
    transform: [{ translateY: interpolate(headerEntrance.value, [0, 1], [12, 0]) }],
  }));

  const distBarStyle = useAnimatedStyle(() => ({
    opacity: distBarEntrance.value,
    transform: [{ translateY: interpolate(distBarEntrance.value, [0, 1], [12, 0]) }],
  }));

  const templateStyle = useAnimatedStyle(() => ({
    opacity: templateEntrance.value,
    transform: [{ translateY: interpolate(templateEntrance.value, [0, 1], [12, 0]) }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerEntrance.value,
    transform: [{ translateY: interpolate(footerEntrance.value, [0, 1], [12, 0]) }],
  }));

  // ─── Render ─────────────────────────────────────────────

  return (
    <View style={s.container}>
      {/* Header */}
      <Animated.View style={[s.header, headerStyle]}>
        <Text style={s.headerTitle}>Rating Criteria</Text>
        <Text style={s.headerSubtitle}>Customize how rides are scored</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Distribution Bar */}
        <Animated.View style={distBarStyle}>
          <Text style={s.sectionHeader}>DISTRIBUTION</Text>
          <View style={s.sectionCard}>
            <View style={s.distBarRow}>
              {CRITERIA.map((c, i) => (
                <DistBarSegment key={c.id} weightSV={weightSVs[i]} color={c.color} />
              ))}
            </View>
            <View style={s.distLegend}>
              {CRITERIA.map((c, i) => (
                <LegendPill key={c.id} weightSV={weightSVs[i]} name={c.name} color={c.color} />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Templates — two rows of pills */}
        <Animated.View style={templateStyle}>
          <Text style={s.sectionHeader}>TEMPLATES</Text>
          <View style={s.templateGrid}>
            {TEMPLATES.map(t => (
              <TemplateChip
                key={t.id}
                template={t}
                isActive={activeTemplateId === t.id}
              />
            ))}
          </View>
        </Animated.View>

        {/* Criteria List */}
        <View>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionHeader}>CRITERIA</Text>
            <Text style={s.evenlyButton}>Distribute Evenly</Text>
          </View>
          <View style={s.sectionCard}>
            {CRITERIA.map((c, i) => (
              <CriterionRow
                key={c.id}
                criterion={c}
                weightSV={weightSVs[i]}
                index={i}
                entranceProgress={criteriaEntrances[i]}
                isEnabled={c.defaultWeight > 0}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <Animated.View style={footerStyle}>
          <View style={s.saveButton}>
            <Text style={s.saveButtonText}>Save Changes</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Header
  header: {
    paddingTop: 74,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },

  // Section headers
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.section,
  },

  // Distribution bar
  distBarRow: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  distBarSegment: {
    height: '100%',
  },
  distLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distPillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },

  // Templates — two-row flexWrap grid
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    ...shadows.small,
  },
  templateChipText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  // Criterion rows
  criterionRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  criterionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criterionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  criterionName: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  statusArea: {
    minWidth: 48,
    alignItems: 'flex-end',
    marginRight: spacing.md,
  },
  criterionWeight: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
  },
  criterionOff: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  rowBorder: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },

  // Mini switch (static visual only)
  switchTrack: {
    width: 36,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.background.card,
  },

  // Slider
  sliderWrap: {
    marginLeft: 32 + spacing.md,
    marginRight: 32,
    marginTop: spacing.xs,
  },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  sliderTrack: {
    height: SLIDER_TRACK_H,
    backgroundColor: colors.border.subtle,
    borderRadius: SLIDER_TRACK_H / 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    width: '100%',
    borderRadius: SLIDER_TRACK_H / 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    top: (SLIDER_HEIGHT - SLIDER_THUMB_SIZE) / 2,
  },

  evenlyButton: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Footer
  saveButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
});
