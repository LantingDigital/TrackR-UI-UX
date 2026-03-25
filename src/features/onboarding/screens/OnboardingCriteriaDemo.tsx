/**
 * OnboardingCriteriaDemo — "Slider Symphony" concept
 *
 * Full-width criteria weight demo (no phone frame).
 * 5 horizontal slider bars that redistribute in real-time.
 * Demo loop: drag airtime up → lock intensity → drag again → distribute evenly → seamless reset.
 *
 * Self-contained — no stores, contexts, or navigation.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = colors.accent.primary;
const SPRING_DECISIVE = { damping: 22, stiffness: 200, mass: 0.9 };

// ── Criteria data ──
interface Criterion {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const CRITERIA: Criterion[] = [
  { id: 'airtime', name: 'Airtime', icon: 'airplane-outline', color: '#CF6769' },
  { id: 'intensity', name: 'Intensity', icon: 'flash-outline', color: '#D4A98A' },
  { id: 'smoothness', name: 'Smoothness', icon: 'water-outline', color: '#8FBFB8' },
  { id: 'theming', name: 'Theming', icon: 'color-palette-outline', color: '#B8A3C4' },
  { id: 'pacing', name: 'Pacing', icon: 'speedometer-outline', color: '#92ACC0' },
];

const NUM_CRITERIA = CRITERIA.length;
const BAR_MAX_WIDTH = SCREEN_WIDTH - spacing.xxxl * 2 - 120; // space for label + percentage text
const ANIM_DURATION = 600;
const EASE_OUT = Easing.out(Easing.cubic);

// ── Individual Slider Row ──
const SliderRow: React.FC<{
  criterion: Criterion;
  index: number;
  weightValue: Animated.SharedValue<number>;
  entranceValue: Animated.SharedValue<number>;
  isLocked: Animated.SharedValue<number>; // 0 = unlocked, 1 = locked
  lockPulse: Animated.SharedValue<number>; // 0 = normal, 1 = pulsing
}> = ({ criterion, index, weightValue, entranceValue, isLocked, lockPulse }) => {
  const entranceStyle = useAnimatedStyle(() => {
    const delay = index * 0.12;
    const progress = interpolate(entranceValue.value, [delay, Math.min(delay + 0.4, 1)], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ translateX: (1 - progress) * -30 }],
    };
  });

  const barStyle = useAnimatedStyle(() => ({
    width: interpolate(weightValue.value, [0, 100], [0, BAR_MAX_WIDTH], 'clamp'),
  }));

  const lockStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lockPulse.value, [0, 1], [0.4, 1], 'clamp'),
    transform: [{ scale: interpolate(lockPulse.value, [0, 0.5, 1], [1, 1.15, 1], 'clamp') }],
  }));

  const lockIconStyle = useAnimatedStyle(() => ({
    opacity: isLocked.value,
  }));

  return (
    <Animated.View style={[styles.sliderRow, entranceStyle]}>
      {/* Label column */}
      <View style={styles.labelCol}>
        <View style={[styles.iconCircle, { backgroundColor: `${criterion.color}18` }]}>
          <Ionicons name={criterion.icon as any} size={16} color={criterion.color} />
        </View>
        <Text style={styles.criterionName} numberOfLines={1}>{criterion.name}</Text>
      </View>

      {/* Bar + percentage */}
      <View style={styles.barContainer}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { backgroundColor: criterion.color }, barStyle]} />
        </View>
        <PercentageDisplay value={weightValue} color={criterion.color} />
      </View>

      {/* Lock icon */}
      <Animated.View style={[styles.lockButton, lockStyle]}>
        <Animated.View style={lockIconStyle}>
          <Ionicons name="lock-closed" size={14} color={criterion.color} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute' }, useAnimatedStyle(() => ({ opacity: 1 - isLocked.value }))]}>
          <Ionicons name="lock-open-outline" size={14} color={colors.text.meta} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

// ── Animated percentage number ──
const PercentageDisplay: React.FC<{
  value: Animated.SharedValue<number>;
  color: string;
}> = ({ value, color }) => {
  const [display, setDisplay] = React.useState(20);

  useEffect(() => {
    let frame: number;
    const update = () => {
      setDisplay(Math.round(value.value));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <View style={styles.percentContainer}>
      <Text style={[styles.percentText, { color }]}>{display}%</Text>
    </View>
  );
};

// ── Ghost finger indicator ──
const GhostFinger: React.FC<{
  positionY: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
}> = ({ positionY, opacity }) => {
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: positionY.value }],
  }));

  return (
    <Animated.View style={[styles.ghostFinger, style]} pointerEvents="none">
      <View style={styles.ghostFingerDot} />
    </Animated.View>
  );
};

// ── Main Component ──
interface Props {
  isActive: boolean;
}

export const OnboardingCriteriaDemo: React.FC<Props> = ({ isActive }) => {
  const allTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoActiveRef = useRef(false);
  const runDemoRef = useRef<(() => void) | undefined>(undefined);

  const clearAllTimers = useCallback(() => {
    allTimersRef.current.forEach(t => clearTimeout(t));
    allTimersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    allTimersRef.current.push(t);
    return t;
  }, []);

  // Shared values for each criterion's weight
  const w0 = useSharedValue(20); // Airtime
  const w1 = useSharedValue(20); // Intensity
  const w2 = useSharedValue(20); // Smoothness
  const w3 = useSharedValue(20); // Theming
  const w4 = useSharedValue(20); // Pacing
  const weights = [w0, w1, w2, w3, w4];

  // Lock state (0=unlocked, 1=locked)
  const lock0 = useSharedValue(0);
  const lock1 = useSharedValue(0);
  const lock2 = useSharedValue(0);
  const lock3 = useSharedValue(0);
  const lock4 = useSharedValue(0);
  const locks = [lock0, lock1, lock2, lock3, lock4];

  // Lock pulse (for visual feedback)
  const pulse0 = useSharedValue(0);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const pulse4 = useSharedValue(0);
  const pulses = [pulse0, pulse1, pulse2, pulse3, pulse4];

  // Entrance
  const entrance = useSharedValue(0);

  // Ghost finger
  const fingerY = useSharedValue(0);
  const fingerOpacity = useSharedValue(0);

  // Distribute evenly button
  const distributeOpacity = useSharedValue(0);
  const distributePulse = useSharedValue(0);

  // Score display
  const scoreOpacity = useSharedValue(0);

  // ── Helper: redistribute weights ──
  const redistributeUnlocked = useCallback((
    changedIndex: number,
    newValue: number,
    lockedIndices: number[],
  ) => {
    const lockedTotal = lockedIndices.reduce((sum, i) => sum + weights[i].value, 0);
    const remaining = 100 - newValue - lockedTotal;
    const unlocked = weights
      .map((_, i) => i)
      .filter(i => i !== changedIndex && !lockedIndices.includes(i));

    if (unlocked.length === 0) return;
    const each = remaining / unlocked.length;

    weights[changedIndex].value = withTiming(newValue, { duration: ANIM_DURATION, easing: EASE_OUT });
    unlocked.forEach(i => {
      weights[i].value = withTiming(Math.max(0, each), { duration: ANIM_DURATION, easing: EASE_OUT });
    });
  }, []);

  // ── Demo loop ──
  const startDemo = useCallback(() => {
    if (!demoActiveRef.current) return;

    let t = 0;

    // Phase 0: Entrance
    entrance.value = 0;
    entrance.value = withTiming(1, { duration: 800, easing: EASE_OUT });

    // Show score
    scheduleTimer(() => {
      scoreOpacity.value = withTiming(1, { duration: 400 });
    }, 600);

    t = 1200;

    // Phase 1: Show ghost finger, drag Airtime to 40%
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      fingerOpacity.value = withTiming(0.7, { duration: 200 });
      fingerY.value = 0; // aligned with Airtime row
    }, t);
    t += 400;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      // Drag: Airtime → 40%, others redistribute evenly (15% each)
      redistributeUnlocked(0, 40, []);
    }, t);
    t += 1200;

    // Hide finger briefly
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      fingerOpacity.value = withTiming(0, { duration: 200 });
    }, t);
    t += 800;

    // Phase 2: Lock Intensity — pulse then lock
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      // Pulse the lock button
      pulses[1].value = withTiming(1, { duration: 300, easing: EASE_OUT });
    }, t);
    t += 400;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      locks[1].value = withTiming(1, { duration: 250, easing: EASE_OUT });
      pulses[1].value = withTiming(0, { duration: 400 });
    }, t);
    t += 800;

    // Phase 3: Drag Airtime to 50% — Intensity stays locked at 15%
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      fingerOpacity.value = withTiming(0.7, { duration: 200 });
      fingerY.value = 0;
    }, t);
    t += 400;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      redistributeUnlocked(0, 50, [1]);
    }, t);
    t += 1200;

    // Hide finger
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      fingerOpacity.value = withTiming(0, { duration: 200 });
    }, t);
    t += 800;

    // Phase 4: "Distribute Evenly" button pulses and taps
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      distributeOpacity.value = withTiming(1, { duration: 300 });
    }, t);
    t += 400;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      distributePulse.value = withTiming(1, { duration: 200 });
    }, t);
    t += 300;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      distributePulse.value = withTiming(0, { duration: 150 });
      // Distribute: locked stays, unlocked snap to equal
      // Intensity is locked at 15%. Remaining 85% / 4 unlocked = 21.25%
      const lockedTotal = 15;
      const perUnlocked = (100 - lockedTotal) / 4;
      [0, 2, 3, 4].forEach(i => {
        weights[i].value = withSpring(perUnlocked, SPRING_DECISIVE);
      });
    }, t);
    t += 1500;

    // Phase 5: Reset smoothly for seamless loop
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      distributeOpacity.value = withTiming(0, { duration: 300 });
      scoreOpacity.value = withTiming(0, { duration: 300 });
    }, t);
    t += 400;

    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      // Unlock intensity
      locks[1].value = withTiming(0, { duration: 200 });
      // All weights back to 20%
      weights.forEach(w => {
        w.value = withTiming(20, { duration: ANIM_DURATION, easing: EASE_OUT });
      });
      entrance.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) });
    }, t);
    t += 800;

    // Restart loop
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      runDemoRef.current?.();
    }, t);
  }, []);

  runDemoRef.current = startDemo;

  useEffect(() => {
    if (isActive) {
      demoActiveRef.current = true;
      // Reset all values
      weights.forEach(w => { w.value = 20; });
      locks.forEach(l => { l.value = 0; });
      pulses.forEach(p => { p.value = 0; });
      entrance.value = 0;
      fingerOpacity.value = 0;
      fingerY.value = 0;
      distributeOpacity.value = 0;
      distributePulse.value = 0;
      scoreOpacity.value = 0;
      scheduleTimer(() => startDemo(), 500);
    } else {
      demoActiveRef.current = false;
      clearAllTimers();
    }
    return () => {
      demoActiveRef.current = false;
      clearAllTimers();
    };
  }, [isActive]);

  // ── Distribute button styles ──
  const distributeStyle = useAnimatedStyle(() => ({
    opacity: distributeOpacity.value,
    transform: [{ scale: interpolate(distributePulse.value, [0, 1], [1, 0.95], 'clamp') }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
  }));

  // Row height for ghost finger positioning
  const ROW_HEIGHT = 52;

  return (
    <View style={styles.container}>
      {/* Score display */}
      <Animated.View style={[styles.scoreContainer, scoreStyle]}>
        <Text style={styles.scoreLabel}>WEIGHTED SCORE</Text>
        <Text style={styles.scoreValue}>9.2</Text>
      </Animated.View>

      {/* Slider rows */}
      <View style={styles.slidersContainer}>
        {CRITERIA.map((criterion, index) => (
          <SliderRow
            key={criterion.id}
            criterion={criterion}
            index={index}
            weightValue={weights[index]}
            entranceValue={entrance}
            isLocked={locks[index]}
            lockPulse={pulses[index]}
          />
        ))}

        {/* Ghost finger overlay */}
        <GhostFinger positionY={fingerY} opacity={fingerOpacity} />
      </View>

      {/* Distribute Evenly button */}
      <Animated.View style={[styles.distributeButton, distributeStyle]}>
        <Ionicons name="options-outline" size={16} color={ACCENT} style={{ marginRight: spacing.sm }} />
        <Text style={styles.distributeText}>Distribute Evenly</Text>
      </Animated.View>
    </View>
  );
};

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
    justifyContent: 'center',
  },

  // Score
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  scoreLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
  },

  // Sliders container
  slidersContainer: {
    gap: spacing.base,
  },

  // Individual row
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  criterionName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },

  // Bar
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.input,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentContainer: {
    width: 44,
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  percentText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },

  // Lock
  lockButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  // Ghost finger
  ghostFinger: {
    position: 'absolute',
    right: -8,
    top: 8,
    alignItems: 'center',
  },
  ghostFingerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(207, 103, 105, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(207, 103, 105, 0.3)',
  },

  // Distribute button
  distributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignSelf: 'center',
    marginTop: spacing.xxl,
  },
  distributeText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: ACCENT,
  },
});
