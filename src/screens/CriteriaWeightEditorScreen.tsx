/**
 * CriteriaWeightEditorScreen — Customize rating criteria weights
 *
 * All animations use Reanimated (no LayoutAnimation — it conflicts with
 * Reanimated's UI-thread management). Slider height, weight/OFF crossfade,
 * switch fade, and row opacity all run on the UI thread via shared values.
 *
 * Performance: During drag, NO React re-renders occur. Weight redistribution
 * runs on JS, results push to a shared value array. AnimatedTextInput +
 * useAnimatedProps updates all 7 weight% labels via setNativeProps on the UI
 * thread. useAnimatedReaction drives non-active slider thumb positions.
 * Single setCriteria on drag-end syncs React state.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import { FogHeader } from '../components/FogHeader';
import { RatingCriteria } from '../types/rideLog';
import { getCriteriaConfig, updateCriteriaConfig } from '../stores/rideLogStore';

// ============================================
// Constants
// ============================================

const CRITERION_COLORS: Record<string, string> = {
  airtime:    '#CF6769',
  intensity:  '#D4A98A',
  smoothness: '#8FBFB8',
  theming:    '#B8A3C4',
  pacing:     '#92ACC0',
  inversions: '#D6C48A',
  launch:     '#9DC0A0',
};

const TEMPLATES = [
  {
    id: 'thrill-seeker',
    label: 'Thrill Seeker',
    icon: 'flash-outline' as const,
    weights: { airtime: 25, intensity: 30, smoothness: 10, theming: 0, pacing: 15, inversions: 15, launch: 5 },
  },
  {
    id: 'theme-fan',
    label: 'Theme Fan',
    icon: 'color-palette-outline' as const,
    weights: { airtime: 20, intensity: 10, smoothness: 20, theming: 30, pacing: 20, inversions: 0, launch: 0 },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: 'scale-outline' as const,
    weights: { airtime: 25, intensity: 25, smoothness: 20, theming: 15, pacing: 15, inversions: 0, launch: 0 },
  },
];

const SLIDER_ACTIVATE_X = 12;  // Horizontal distance to activate slider drag
const SLIDER_FAIL_Y = 5;       // Vertical distance to pass touch to scroll
const SLIDER_THUMB = 24;
const SLIDER_TRACK = 4;
const SLIDER_HEIGHT = 36;
const SLIDER_EXPANDED = SLIDER_HEIGHT + spacing.xs; // total height incl. margin
const MIN_WEIGHT = 1;
const VISUAL_MAX = 99;
const VISUAL_RANGE = VISUAL_MAX - MIN_WEIGHT;
const RUBBER_BAND = 0.25;
const ANIM_DUR = 200;

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// ============================================
// Pure Algorithms
// ============================================

function getMaxWeight(criteria: RatingCriteria[], changedId: string): number {
  const lockedOthers = criteria.filter(c => c.isLocked && c.id !== changedId && c.weight > 0);
  const lockedWeight = lockedOthers.reduce((s, c) => s + c.weight, 0);
  const unlockedOthers = criteria.filter(c => !c.isLocked && c.id !== changedId && c.weight > 0);
  return Math.max(MIN_WEIGHT, 100 - lockedWeight - unlockedOthers.length * MIN_WEIGHT);
}

function redistributeWeights(
  criteria: RatingCriteria[],
  changedId: string,
  newWeight: number,
): { criteria: RatingCriteria[]; clamped: boolean } {
  const index = criteria.findIndex(c => c.id === changedId);
  if (index === -1) return { criteria, clamped: false };

  const current = criteria[index];
  const lockedOthers = criteria.filter(c => c.isLocked && c.id !== changedId && c.weight > 0);
  const lockedWeight = lockedOthers.reduce((s, c) => s + c.weight, 0);
  const unlockedOthers = criteria.filter(c => !c.isLocked && c.id !== changedId && c.weight > 0);
  const unlockedCount = unlockedOthers.length;

  const maxWeight = Math.max(MIN_WEIGHT, 100 - lockedWeight - unlockedCount * MIN_WEIGHT);
  const clampedWeight = Math.max(MIN_WEIGHT, Math.min(newWeight, maxWeight));
  const clamped = newWeight !== clampedWeight;
  if (clampedWeight === current.weight) return { criteria, clamped };

  const remainingForOthers = 100 - lockedWeight - clampedWeight;
  if (unlockedCount === 0) {
    return {
      criteria: criteria.map(c => c.id === changedId ? { ...c, weight: clampedWeight } : c),
      clamped,
    };
  }

  const totalUnlockedOthers = unlockedOthers.reduce((s, c) => s + c.weight, 0);
  const exact = unlockedOthers.map(c => {
    const proportion = totalUnlockedOthers > 0 ? c.weight / totalUnlockedOthers : 1 / unlockedCount;
    const val = Math.max(MIN_WEIGHT, remainingForOthers * proportion);
    const floor = Math.max(MIN_WEIGHT, Math.floor(val));
    return { id: c.id, floor, remainder: val - Math.floor(val) };
  });

  const floorTotal = exact.reduce((s, e) => s + e.floor, 0);
  let extra = remainingForOthers - floorTotal;
  const sorted = [...exact].sort((a, b) => b.remainder - a.remainder);
  const newWeights: Record<string, number> = {};
  sorted.forEach(e => {
    if (extra > 0 && e.floor < remainingForOthers) {
      newWeights[e.id] = e.floor + 1;
      extra--;
    } else {
      newWeights[e.id] = e.floor;
    }
  });

  return {
    criteria: criteria.map(c => {
      if (c.id === changedId) return { ...c, weight: clampedWeight };
      if (c.isLocked || c.weight === 0) return c;
      return { ...c, weight: newWeights[c.id] ?? c.weight };
    }),
    clamped,
  };
}

function distributeEvenly(criteria: RatingCriteria[]): RatingCriteria[] {
  const unlocked = criteria.filter(c => !c.isLocked && c.weight > 0);
  if (unlocked.length === 0) return criteria;

  const lockedWeight = criteria.filter(c => c.isLocked).reduce((s, c) => s + c.weight, 0);
  const disabledIds = new Set(criteria.filter(c => c.weight === 0).map(c => c.id));
  const available = 100 - lockedWeight;
  const even = Math.floor(available / unlocked.length);
  const remainder = available - even * unlocked.length;

  let assigned = 0;
  return criteria.map(c => {
    if (c.isLocked || disabledIds.has(c.id)) return c;
    const ex = assigned < remainder ? 1 : 0;
    assigned++;
    return { ...c, weight: even + ex };
  });
}

function canDisable(criteria: RatingCriteria[], id: string): boolean {
  const enabledOthers = criteria.filter(c => c.id !== id && c.weight > 0);
  if (enabledOthers.length === 0) return false;
  return enabledOthers.some(c => !c.isLocked);
}

function canEnable(criteria: RatingCriteria[]): boolean {
  return criteria.filter(c => !c.isLocked && c.weight > 0).some(c => c.weight > MIN_WEIGHT);
}

function toggleCriterion(criteria: RatingCriteria[], toggleId: string): RatingCriteria[] {
  const target = criteria.find(c => c.id === toggleId);
  if (!target) return criteria;

  if (target.weight > 0) {
    if (!canDisable(criteria, toggleId)) return criteria;
    const freed = target.weight;
    const others = criteria.filter(c => c.id !== toggleId && !c.isLocked && c.weight > 0);
    const totalOthers = others.reduce((s, c) => s + c.weight, 0);

    const exact = others.map(c => {
      const share = totalOthers > 0 ? freed * (c.weight / totalOthers) : freed / others.length;
      return { id: c.id, base: Math.floor(share), remainder: share - Math.floor(share) };
    });
    const baseTotal = exact.reduce((s, e) => s + e.base, 0);
    let extra = freed - baseTotal;
    const sorted = [...exact].sort((a, b) => b.remainder - a.remainder);
    const shareMap: Record<string, number> = {};
    sorted.forEach(e => {
      shareMap[e.id] = extra > 0 ? e.base + 1 : e.base;
      if (extra > 0) extra--;
    });

    return criteria.map(c => {
      if (c.id === toggleId) return { ...c, weight: 0, isLocked: false };
      if (shareMap[c.id] !== undefined) return { ...c, weight: c.weight + shareMap[c.id] };
      return c;
    });
  } else {
    if (!canEnable(criteria)) return criteria;
    const unlocked = criteria.filter(c => !c.isLocked && c.weight > 0);
    const totalUnlocked = unlocked.reduce((s, c) => s + c.weight, 0);
    const idealWeight = Math.max(MIN_WEIGHT, Math.floor(totalUnlocked / (unlocked.length + 1)));

    const stealMap: Record<string, number> = {};
    let actualStolen = 0;
    unlocked.forEach(c => {
      const idealSteal = Math.round(idealWeight * (c.weight / totalUnlocked));
      const maxSteal = c.weight - MIN_WEIGHT;
      const steal = Math.min(idealSteal, maxSteal);
      stealMap[c.id] = c.weight - steal;
      actualStolen += steal;
    });

    const newWeight = Math.max(MIN_WEIGHT, actualStolen);
    return criteria.map(c => {
      if (c.id === toggleId) return { ...c, weight: newWeight };
      if (stealMap[c.id] !== undefined) return { ...c, weight: stealMap[c.id] };
      return c;
    });
  }
}

// ============================================
// Staggered Entrance
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
// WeightSlider — Smooth tracking + rubber band
// ============================================

interface WeightSliderProps {
  value: number;
  clampMax: number;
  onChange: (v: number) => void;
  onDragEnd?: () => void;
  color: string;
  weightsSV?: SharedValue<number[]>;
  criteriaIndex?: number;
}

function WeightSlider({ value, clampMax, onChange, onDragEnd, color, weightsSV, criteriaIndex }: WeightSliderProps) {
  const thumbPos = useSharedValue(0);
  const trackWidthSV = useSharedValue(0);
  const startValSV = useSharedValue(value);
  const currentValSV = useSharedValue(value);
  const lastSnapped = useSharedValue(value);
  const isDragging = useSharedValue(false);
  const clampMaxSV = useSharedValue(clampMax);

  const emitChange = useCallback((v: number) => onChange(v), [onChange]);
  const emitDragEnd = useCallback(() => onDragEnd?.(), [onDragEnd]);
  const emitHeavy = useCallback(() => haptics.heavy(), []);

  useEffect(() => { clampMaxSV.value = clampMax; }, [clampMax]);

  // Animate thumb/fill to new position for external value changes (redistribution,
  // toggle, template). Since the fill now uses scaleX/translateX transforms
  // (not width), this animation is completely Yoga-free.
  useEffect(() => {
    currentValSV.value = value;
    if (!isDragging.value) {
      const tw = trackWidthSV.value;
      if (tw > 0) {
        const pos = ((value - MIN_WEIGHT) / VISUAL_RANGE) * tw;
        thumbPos.value = withTiming(pos, { duration: 200 });
      }
    }
  }, [value, clampMax]);

  // Respond to shared-value weight changes during drag (bypasses React).
  // Other sliders' weights change via weightsSV without setCriteria,
  // so the useEffect above won't fire — this reaction drives the thumb instead.
  useAnimatedReaction(
    () => (weightsSV && criteriaIndex !== undefined) ? weightsSV.value[criteriaIndex] : -1,
    (current, previous) => {
      if (current < 0 || previous === undefined || current === previous) return;
      if (!isDragging.value) {
        const tw = trackWidthSV.value;
        if (tw > 0) {
          const pos = ((current - MIN_WEIGHT) / VISUAL_RANGE) * tw;
          thumbPos.value = withTiming(pos, { duration: 200 });
        }
      }
    },
  );

  const handleLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const tw = Math.max(0, e.nativeEvent.layout.width - SLIDER_THUMB);
    trackWidthSV.value = tw;
    if (!isDragging.value) {
      thumbPos.value = ((value - MIN_WEIGHT) / VISUAL_RANGE) * tw;
    }
  }, [value]);

  const pan = Gesture.Pan()
    .activeOffsetX([-SLIDER_ACTIVATE_X, SLIDER_ACTIVATE_X])
    .failOffsetY([-SLIDER_FAIL_Y, SLIDER_FAIL_Y])
    .onStart(() => {
      'worklet';
      startValSV.value = currentValSV.value;
      lastSnapped.value = currentValSV.value;
      isDragging.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      const tw = trackWidthSV.value;
      if (tw <= 0) return;
      const hi = clampMaxSV.value;

      const startPos = ((startValSV.value - MIN_WEIGHT) / VISUAL_RANGE) * tw;
      const rawPos = startPos + e.translationX;
      const maxPos = ((hi - MIN_WEIGHT) / VISUAL_RANGE) * tw;
      const minPos = 0;

      // Rubber-band overshoot beyond constraints
      let displayPos: number;
      if (rawPos > maxPos) {
        displayPos = Math.min(maxPos + (rawPos - maxPos) * RUBBER_BAND, tw);
      } else if (rawPos < minPos) {
        displayPos = Math.max(minPos - (minPos - rawPos) * RUBBER_BAND, 0);
      } else {
        displayPos = rawPos;
      }
      thumbPos.value = displayPos;

      // Clamped integer value
      const clampedRaw = Math.min(Math.max(0, rawPos), tw);
      const rawVal = (clampedRaw / tw) * VISUAL_RANGE + MIN_WEIGHT;
      const val = Math.min(Math.max(MIN_WEIGHT, Math.round(rawVal)), hi);

      if (val !== lastSnapped.value) {
        if ((val === MIN_WEIGHT || val === hi) &&
            lastSnapped.value !== MIN_WEIGHT && lastSnapped.value !== hi) {
          runOnJS(emitHeavy)();
        }
        lastSnapped.value = val;
        currentValSV.value = val;
        runOnJS(emitChange)(val);
      }
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      const tw = trackWidthSV.value;
      if (tw > 0) {
        const pos = ((lastSnapped.value - MIN_WEIGHT) / VISUAL_RANGE) * tw;
        thumbPos.value = withSpring(pos, SPRINGS.stiff);
      }
      runOnJS(emitDragEnd)();
    })
    .onFinalize(() => {
      'worklet';
      isDragging.value = false;
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPos.value }],
  }));

  // Transform-based fill: scaleX + translateX instead of width.
  // Transforms don't trigger Yoga layout recalculation on the UI thread,
  // so the fill animates at 60fps with zero layout cost during drag.
  const fillStyle = useAnimatedStyle(() => {
    'worklet';
    const tw = trackWidthSV.value;
    if (tw <= 0) return { transform: [{ translateX: 0 }, { scaleX: 0 }] };
    const progress = interpolate(thumbPos.value, [0, tw], [0, 1], Extrapolation.CLAMP);
    // scaleX scales from center — translateX compensates to keep left edge at x=0
    return {
      transform: [
        { translateX: (progress - 1) * tw / 2 },
        { scaleX: progress },
      ],
    };
  });

  return (
    <View onLayout={handleLayout} style={sliderStyles.outer}>
      <GestureDetector gesture={pan}>
        <Animated.View style={sliderStyles.container}>
          <View style={[sliderStyles.track, { marginHorizontal: SLIDER_THUMB / 2 }]}>
            <Animated.View style={[sliderStyles.fill, { backgroundColor: color }, fillStyle]} />
          </View>
          <Animated.View style={[sliderStyles.thumb, { borderColor: color }, thumbStyle]} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  outer: { overflow: 'visible' },
  container: {
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  track: {
    height: SLIDER_TRACK,
    backgroundColor: colors.border.subtle,
    borderRadius: SLIDER_TRACK / 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: '100%',
    borderRadius: SLIDER_TRACK / 2,
  },
  thumb: {
    position: 'absolute',
    width: SLIDER_THUMB,
    height: SLIDER_THUMB,
    borderRadius: SLIDER_THUMB / 2,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    top: (SLIDER_HEIGHT - SLIDER_THUMB) / 2,
  },
});

// ============================================
// Distribution Bar — spring-animated segments
// ============================================

// Each segment animates its flex via Reanimated (UI thread).
// All 7 criteria always render — disabled ones get flex → 0 and shrink away.
// withTiming (not withSpring) — flex triggers Yoga layout recalculation every
// frame. Springs can oscillate for 1-2s, causing sustained layout work that
// blocks touch/scroll on the UI thread. Timing settles in exactly 300ms.
const DistBarSegment = React.memo(function DistBarSegment({
  weight,
  color,
}: {
  weight: number;
  color: string;
}) {
  const flex = useSharedValue(weight);
  useEffect(() => {
    flex.value = withTiming(Math.max(weight, 0), { duration: 300 });
  }, [weight]);
  const animStyle = useAnimatedStyle(() => ({ flex: flex.value }));

  return (
    <Animated.View style={[styles.distBarSegment, { backgroundColor: color }, animStyle]} />
  );
});

const DistributionBar = React.memo(
  function DistributionBar({ criteria }: { criteria: RatingCriteria[] }) {
    const enabled = criteria.filter(c => c.weight > 0);

    return (
      <View style={styles.sectionCard}>
        <View style={styles.distBarRow}>
          {criteria.map(c => (
            <DistBarSegment
              key={c.id}
              weight={c.weight}
              color={CRITERION_COLORS[c.id] ?? colors.accent.primary}
            />
          ))}
        </View>
        <View style={styles.distLegend}>
          {enabled.map(c => (
            <View key={c.id} style={styles.distPill}>
              <View
                style={[styles.distDot, { backgroundColor: CRITERION_COLORS[c.id] ?? colors.accent.primary }]}
              />
              <Text style={styles.distPillText}>
                {c.name} {c.weight}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  },
  (prev, next) => prev.criteria.every((c, i) => c.weight === next.criteria[i].weight),
);

// ============================================
// Unified Criterion Row (memoized, all Reanimated)
// ============================================

const CriterionRow = React.memo(function CriterionRow({
  id,
  criterion,
  isFirst,
  maxWeight,
  canDisableThis,
  canEnableMore,
  weightsSV,
  criteriaIndex,
  onWeightChange,
  onDragEnd,
  onToggleLock,
  onToggleEnabled,
}: {
  id: string;
  criterion: RatingCriteria;
  isFirst: boolean;
  maxWeight: number;
  canDisableThis: boolean;
  canEnableMore: boolean;
  weightsSV: SharedValue<number[]>;
  criteriaIndex: number;
  onWeightChange: (id: string, w: number) => void;
  onDragEnd: () => void;
  onToggleLock: (id: string) => void;
  onToggleEnabled: (id: string) => void;
}) {
  const isEnabled = criterion.weight > 0;
  const isLocked = criterion.isLocked;
  const showSlider = isEnabled && !isLocked;
  const switchDisabled = isEnabled ? !canDisableThis : !canEnableMore;
  const color = CRITERION_COLORS[criterion.id] ?? colors.accent.primary;

  // ── Switch animation ──
  // Local state ensures the Switch's value prop never bounces during re-renders.
  // Without this, setCriteria can cause the Switch to receive a stale value for
  // one frame, interrupting the native UISwitch animation (snap instead of slide).
  const [localSwitchVal, setLocalSwitchVal] = useState(isEnabled);
  useEffect(() => { setLocalSwitchVal(isEnabled); }, [isEnabled]);

  // ── Row opacity (dim when disabled) ──
  const rowOpacity = useSharedValue(isEnabled ? 1 : 0.5);
  useEffect(() => {
    rowOpacity.value = withTiming(isEnabled ? 1 : 0.5, { duration: ANIM_DUR });
  }, [isEnabled]);
  const opacityStyle = useAnimatedStyle(() => ({ opacity: rowOpacity.value }));

  // ── Slider collapse/expand ──
  // withTiming (not spring) to limit Yoga layout duration to ~250ms.
  // Springs oscillate 500-1000ms → prolonged Yoga recalculation blocking scroll.
  const sliderProgress = useSharedValue(showSlider ? 1 : 0);
  useEffect(() => {
    sliderProgress.value = withTiming(showSlider ? 1 : 0, { duration: 250 });
  }, [showSlider]);
  const sliderClipStyle = useAnimatedStyle(() => ({
    height: sliderProgress.value * SLIDER_EXPANDED,
    opacity: sliderProgress.value,
    overflow: 'hidden' as const,
  }));

  // ── Weight%+Lock / OFF crossfade ──
  const enabledFade = useSharedValue(isEnabled ? 1 : 0);
  useEffect(() => {
    enabledFade.value = withTiming(isEnabled ? 1 : 0, { duration: ANIM_DUR });
  }, [isEnabled]);
  const weightGroupAnim = useAnimatedStyle(() => ({ opacity: enabledFade.value }));
  const offLabelAnim = useAnimatedStyle(() => ({ opacity: 1 - enabledFade.value }));

  // ── Switch fade (hidden when locked) ──
  const switchFade = useSharedValue(isLocked ? 0 : 1);
  useEffect(() => {
    switchFade.value = withTiming(isLocked ? 0 : 1, { duration: ANIM_DUR });
  }, [isLocked]);
  const switchAnim = useAnimatedStyle(() => ({ opacity: switchFade.value }));

  // Weight% text driven by shared value — updates via setNativeProps on UI thread,
  // bypassing React reconciliation entirely. Zero re-renders during drag.
  const animatedWeightProps = useAnimatedProps(() => ({
    text: `${Math.max(1, Math.round(weightsSV.value[criteriaIndex]))}%`,
  } as any));

  return (
    <View>
      {!isFirst && <View style={styles.rowBorder} />}

      <Animated.View style={[styles.criterionRow, opacityStyle]}>
        <View style={styles.criterionHeaderRow}>
          {/* Icon */}
          <View style={[styles.criterionIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={(criterion.icon as any) ?? 'star-outline'} size={16} color={color} />
          </View>

          {/* Name */}
          <Text style={styles.criterionName}>{criterion.name}</Text>

          {/* Weight%+Lock / OFF crossfade — both always rendered */}
          <View style={styles.statusArea}>
            <Animated.View
              style={[styles.weightLockGroup, weightGroupAnim]}
              pointerEvents={isEnabled ? 'auto' : 'none'}
            >
              <AnimatedTextInput
                editable={false}
                style={[styles.criterionWeight, styles.criterionWeightInput, { color }]}
                animatedProps={animatedWeightProps}
                defaultValue={`${Math.max(1, criterion.weight)}%`}
              />
              <Pressable onPress={() => onToggleLock(id)} hitSlop={8} style={styles.lockButton}>
                <Ionicons
                  name={isLocked ? 'lock-closed' : 'lock-open-outline'}
                  size={16}
                  color={isLocked ? colors.text.primary : colors.text.meta}
                />
              </Pressable>
            </Animated.View>
            <Animated.View
              style={[styles.offLabelOverlay, offLabelAnim]}
              pointerEvents="none"
            >
              <Text style={styles.criterionOff}>OFF</Text>
            </Animated.View>
          </View>

          {/* Switch — always rendered, fades out when locked */}
          <Animated.View style={switchAnim} pointerEvents={isLocked ? 'none' : 'auto'}>
            <Switch
              value={localSwitchVal}
              onValueChange={() => {
                haptics.select();
                setLocalSwitchVal(!isEnabled);
                onToggleEnabled(id);
              }}
              disabled={isLocked || switchDisabled}
              trackColor={{ false: colors.border.subtle, true: color }}
              thumbColor={colors.background.card}
              style={[styles.toggleSwitch, switchDisabled && !isLocked && { opacity: 0.3 }]}
            />
          </Animated.View>
        </View>

        {/* Slider — always rendered, clip-animated to hide/show */}
        <Animated.View style={sliderClipStyle}>
          <View style={styles.sliderWrap}>
            <WeightSlider
              value={Math.max(MIN_WEIGHT, criterion.weight)}
              clampMax={maxWeight}
              onChange={(w) => onWeightChange(id, w)}
              onDragEnd={onDragEnd}
              color={color}
              weightsSV={weightsSV}
              criteriaIndex={criteriaIndex}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}, (prev, next) =>
  prev.criterion.weight === next.criterion.weight &&
  prev.criterion.isLocked === next.criterion.isLocked &&
  prev.maxWeight === next.maxWeight &&
  prev.canDisableThis === next.canDisableThis &&
  prev.canEnableMore === next.canEnableMore &&
  prev.isFirst === next.isFirst &&
  prev.criteriaIndex === next.criteriaIndex
);

// ============================================
// Template Chip
// ============================================

function TemplateChip({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const { pressHandlers, animatedStyle } = useSpringPress();

  return (
    <Pressable {...pressHandlers} onPress={onPress}>
      <Animated.View style={[styles.templateChip, animatedStyle]}>
        <Ionicons name={icon as any} size={16} color={colors.accent.primary} />
        <Text style={styles.templateChipText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ============================================
// Main Screen
// ============================================

export function CriteriaWeightEditorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();

  const [criteria, setCriteria] = useState<RatingCriteria[]>(() =>
    getCriteriaConfig().criteria.map(c => ({ ...c, isLocked: c.isLocked ?? false }))
  );
  const [originalCriteria] = useState<RatingCriteria[]>(() =>
    getCriteriaConfig().criteria.map(c => ({ ...c, isLocked: c.isLocked ?? false }))
  );

  // ── #2: Pre-compute ALL derived values in O(n) ──
  // Single pass to compute totals, then derive per-criterion values via subtraction.
  const derived = useMemo(() => {
    let enabledCount = 0;
    let totalLockedWeight = 0;
    let lockedCount = 0;
    let unlockedCount = 0;
    let hasUnlockedAboveMin = false;
    let changed = false;

    // Pass 1: aggregate totals
    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];
      if (c.weight !== originalCriteria[i]?.weight) changed = true;
      if (c.weight > 0) {
        enabledCount++;
        if (c.isLocked) {
          lockedCount++;
          totalLockedWeight += c.weight;
        } else {
          unlockedCount++;
          if (c.weight > MIN_WEIGHT) hasUnlockedAboveMin = true;
        }
      }
    }

    const allLocked = enabledCount > 0 && lockedCount === enabledCount;

    // Pass 2: derive per-criterion values via subtraction (no nested filters)
    const maxWeights: Record<string, number> = {};
    const canDisableMap: Record<string, boolean> = {};

    for (const c of criteria) {
      if (c.weight > 0) {
        // lockedOthersWeight = totalLockedWeight minus this criterion's contribution (if locked)
        const lockedOthersW = c.isLocked ? totalLockedWeight - c.weight : totalLockedWeight;
        // unlockedOthersCount = total unlocked minus this criterion (if unlocked)
        const unlockedOthersN = c.isLocked ? unlockedCount : unlockedCount - 1;
        maxWeights[c.id] = Math.max(MIN_WEIGHT, 100 - lockedOthersW - unlockedOthersN * MIN_WEIGHT);

        // canDisable: other enabled criteria exist AND at least one unlocked other exists
        const othersExist = enabledCount > 1;
        const unlockedOthersExist = c.isLocked ? unlockedCount > 0 : unlockedCount > 1;
        canDisableMap[c.id] = othersExist && unlockedOthersExist;
      } else {
        maxWeights[c.id] = VISUAL_MAX;
        canDisableMap[c.id] = false;
      }
    }

    return { maxWeights, canDisableMap, allLocked, hasUnlockedAboveMin, changed };
  }, [criteria, originalCriteria]);

  const hasChanges = derived.changed;
  const allEnabledLocked = derived.allLocked;
  const canEnableMore = derived.hasUnlockedAboveMin;

  const headerAnim = useStaggerEntrance(0);
  const distAnim = useStaggerEntrance(1);
  const templateAnim = useStaggerEntrance(2);
  const criteriaAnim = useStaggerEntrance(3);
  const footerAnim = useStaggerEntrance(4);

  // ── Shared-value weight pipeline ──
  // During drag: redistribute on JS, push to shared values (NO setCriteria).
  // All text + slider updates happen via Reanimated on the UI thread — zero
  // React re-renders, zero native text measurement overhead.
  // On drag end: single setCriteria syncs React state.
  const weightsSV = useSharedValue(criteria.map(c => c.weight));
  const criteriaRef = useRef(criteria);
  const isDraggingRef = useRef(false);

  // Sync shared values from React state (template, toggle, evenly, revert)
  useEffect(() => {
    if (!isDraggingRef.current) {
      weightsSV.value = criteria.map(c => c.weight);
      criteriaRef.current = criteria;
    }
  }, [criteria]);

  const handleWeightChange = useCallback((id: string, newWeight: number) => {
    isDraggingRef.current = true;
    const result = redistributeWeights(criteriaRef.current, id, newWeight);
    criteriaRef.current = result.criteria;
    weightsSV.value = result.criteria.map(c => c.weight);
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setCriteria(criteriaRef.current);
  }, []);

  const handleToggleLock = useCallback((id: string) => {
    haptics.tap();
    setCriteria(prev => prev.map(c =>
      c.id === id ? { ...c, isLocked: !c.isLocked } : c
    ));
  }, []);

  const handleToggleEnabled = useCallback((id: string) => {
    // CriterionRow handles haptics + 300ms delay for Switch animation.
    // toggleCriterion validates internally (canDisable/canEnable).
    setCriteria(prev => toggleCriterion(prev, id));
  }, []);

  const handleDistributeEvenly = useCallback(() => {
    setCriteria(prev => {
      if (prev.filter(c => !c.isLocked && c.weight > 0).length === 0) {
        haptics.heavy();
        return prev;
      }
      haptics.select();
      return distributeEvenly(prev);
    });
  }, []);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    haptics.select();
    setCriteria(prev =>
      prev.map(c => ({
        ...c,
        weight: template.weights[c.id as keyof typeof template.weights] ?? 0,
        isLocked: false,
      }))
    );
  }, []);

  const handleSave = useCallback(() => {
    haptics.success();
    updateCriteriaConfig({
      criteria: criteria.map(({ isLocked, ...rest }) => rest),
      hasCompletedSetup: true,
      lastModifiedAt: new Date().toISOString(),
    });
    navigation.goBack();
  }, [criteria, navigation]);

  const handleRevert = useCallback(() => {
    haptics.tap();
    setCriteria(originalCriteria.map(c => ({ ...c })));
  }, [originalCriteria]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ],
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const headerTotalHeight = insets.top + 52;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Distribution Bar */}
        <Animated.View style={distAnim}>
          <Text style={styles.sectionHeader}>DISTRIBUTION</Text>
          <DistributionBar criteria={criteria} />
        </Animated.View>

        {/* Templates */}
        <Animated.View style={templateAnim}>
          <Text style={styles.sectionHeader}>TEMPLATES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateRow}
            style={styles.templateScroll}
          >
            {TEMPLATES.map(t => (
              <TemplateChip
                key={t.id}
                label={t.label}
                icon={t.icon}
                onPress={() => handleApplyTemplate(t.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Criteria — stable order */}
        <Animated.View style={criteriaAnim}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>CRITERIA</Text>
            <Pressable onPress={handleDistributeEvenly} disabled={allEnabledLocked}>
              <Text style={[styles.evenlyButton, allEnabledLocked && { opacity: 0.3 }]}>
                Distribute Evenly
              </Text>
            </Pressable>
          </View>
          <View style={styles.sectionCard}>
            {criteria.map((c, i) => (
              <CriterionRow
                key={c.id}
                id={c.id}
                criterion={c}
                isFirst={i === 0}
                maxWeight={derived.maxWeights[c.id]}
                canDisableThis={derived.canDisableMap[c.id]}
                canEnableMore={canEnableMore}
                weightsSV={weightsSV}
                criteriaIndex={i}
                onWeightChange={handleWeightChange}
                onDragEnd={handleDragEnd}
                onToggleLock={handleToggleLock}
                onToggleEnabled={handleToggleEnabled}
              />
            ))}
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={footerAnim}>
          <Pressable
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
          {hasChanges && (
            <Pressable style={styles.revertButton} onPress={handleRevert}>
              <Text style={styles.revertButtonText}>Revert</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <Animated.View style={[styles.header, { top: insets.top }, headerAnim]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => { haptics.tap(); handleBack(); }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Rating Criteria</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: { width: 36 },

  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxl,
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

  // Templates
  templateScroll: {
    overflow: 'visible',
  },
  templateRow: {
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    ...shadows.small,
  },
  templateChipText: {
    fontSize: typography.sizes.label,
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
    position: 'relative',
    minWidth: 70,
  },
  weightLockGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offLabelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  criterionWeight: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    marginRight: spacing.md,
  },
  criterionWeightInput: {
    padding: 0,
    margin: 0,
    minWidth: 36,
  },
  criterionOff: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  lockButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  sliderWrap: {
    marginLeft: 32 + spacing.md,
    marginRight: 32,
    marginTop: spacing.xs,
  },
  rowBorder: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
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
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  revertButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  revertButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});

export default CriteriaWeightEditorScreen;
