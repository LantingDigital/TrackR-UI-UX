/**
 * useMorphAnimation Hook (Reanimated)
 *
 * Provides the hero morph animation system used throughout TrackR.
 * Elements morph from their origin position into full-screen modals
 * with spring physics, bounce arcs, and orchestrated content reveals.
 *
 * Runs entirely on the UI thread via react-native-reanimated.
 *
 * Usage:
 *   const morph = useMorphAnimation({
 *     originPosition: { top: 100, left: 20, width: 200, height: 50, borderRadius: 25 },
 *     finalPosition: { top: 60, left: 16, width: screenWidth - 32, height: 56, borderRadius: 16 },
 *   });
 *
 *   morph.open();
 *   morph.close(() => setVisible(false));
 *
 *   // Use in animated styles:
 *   const containerStyle = useAnimatedStyle(() => ({
 *     top: morph.interpolatePosition('top'),
 *     left: morph.interpolatePosition('left'),
 *     ...
 *   }));
 */

import { useRef, useCallback } from 'react';
import { Keyboard } from 'react-native';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SPRINGS, TIMING, DELAYS } from '../constants/animations';

// ===========================================
// Types
// ===========================================

export interface MorphPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface UseMorphAnimationOptions {
  originPosition: MorphPosition;
  finalPosition: MorphPosition;
  useBounce?: boolean;
  bounceArcHeight?: number;
  onOpenComplete?: () => void;
  onCloseComplete?: () => void;
}

export interface UseMorphAnimationReturn {
  /** Core shared values */
  morphProgress: SharedValue<number>;
  bounceProgress: SharedValue<number>;
  backdropOpacity: SharedValue<number>;
  contentFade: SharedValue<number>;
  closePhase: SharedValue<number>;

  /**
   * Interpolate a position property using the current morph state.
   * Call inside useAnimatedStyle.
   */
  interpolatePosition: (property: keyof MorphPosition) => number;

  /**
   * Get pill opacity (fades in as morph begins).
   * Call inside useAnimatedStyle.
   */
  getPillOpacity: () => number;

  /**
   * Get placeholder opacity (fades out as pill expands).
   * Call inside useAnimatedStyle.
   */
  getPlaceholderOpacity: () => number;

  open: () => void;
  close: (onComplete?: () => void) => void;
  reset: () => void;
  updateOrigin: (position: MorphPosition) => void;
}

// ===========================================
// Hook Implementation
// ===========================================

export function useMorphAnimation(
  options: UseMorphAnimationOptions
): UseMorphAnimationReturn {
  const {
    originPosition,
    finalPosition,
    useBounce = true,
    bounceArcHeight = 60,
    onOpenComplete,
    onCloseComplete,
  } = options;

  const originRef = useRef(originPosition);

  // Core shared values
  const morphProgress = useSharedValue(0);
  const bounceProgress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const contentFade = useSharedValue(0);
  const closePhase = useSharedValue(0);

  // Interpolate position for a given property, blending bounce/linear based on closePhase
  const interpolatePosition = (property: keyof MorphPosition): number => {
    'worklet';
    const origin = originRef.current;
    const final_ = finalPosition;
    const originVal = origin[property];
    const finalVal = final_[property];

    if (property === 'top') {
      // Bounce curve for top (arc animation)
      const peakTop = finalVal - bounceArcHeight;
      const bounceTop = interpolate(
        bounceProgress.value,
        [0, 0.35, 0.7, 0.85, 1],
        [originVal, peakTop, finalVal, finalVal + 8, finalVal],
        Extrapolation.CLAMP
      );
      // Linear curve for close
      const linearTop = interpolate(
        morphProgress.value,
        [0, 1],
        [originVal, finalVal],
        Extrapolation.CLAMP
      );
      // Blend based on closePhase
      return bounceTop * (1 - closePhase.value) + linearTop * closePhase.value;
    }

    // Other properties: bounce with simpler curve
    const bounceVal = interpolate(
      bounceProgress.value,
      [0, 0.35, 0.7, 1],
      [originVal, originVal + (finalVal - originVal) * 0.8, finalVal, finalVal],
      Extrapolation.CLAMP
    );
    const linearVal = interpolate(
      morphProgress.value,
      [0, 1],
      [originVal, finalVal],
      Extrapolation.CLAMP
    );
    return bounceVal * (1 - closePhase.value) + linearVal * closePhase.value;
  };

  const getPillOpacity = (): number => {
    'worklet';
    return interpolate(
      morphProgress.value,
      [0, 0.05, 0.15],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
  };

  const getPlaceholderOpacity = (): number => {
    'worklet';
    return interpolate(
      morphProgress.value,
      [0, 0.3],
      [1, 0],
      Extrapolation.CLAMP
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const open = useCallback(() => {
    // Reset values
    contentFade.value = 0;
    morphProgress.value = 0;
    backdropOpacity.value = 0;
    bounceProgress.value = 0;
    closePhase.value = 0;

    if (useBounce) {
      morphProgress.value = withTiming(1, {
        duration: TIMING.morphExpand,
        easing: Easing.out(Easing.cubic),
      });
      bounceProgress.value = withSpring(1, SPRINGS.morph);
      backdropOpacity.value = withTiming(1, { duration: TIMING.slow });
      contentFade.value = withDelay(
        DELAYS.morphContent,
        withTiming(1, { duration: TIMING.contentFade })
      );
    } else {
      morphProgress.value = withSpring(1, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      contentFade.value = withDelay(200, withTiming(1, { duration: TIMING.normal }));
    }

    if (onOpenComplete) {
      // Call after morph expand duration
      setTimeout(onOpenComplete, TIMING.morphExpand + 100);
    }
  }, [useBounce, morphProgress, bounceProgress, backdropOpacity, contentFade, closePhase, onOpenComplete]);

  const close = useCallback(
    (onComplete?: () => void) => {
      runOnJS(dismissKeyboard)();
      closePhase.value = 1;

      // Fade content first
      contentFade.value = withTiming(0, { duration: TIMING.fast });

      // Then morph back + fade backdrop
      morphProgress.value = withDelay(
        TIMING.fast,
        withTiming(0, {
          duration: TIMING.backdrop,
          easing: Easing.out(Easing.cubic),
        })
      );
      backdropOpacity.value = withDelay(
        TIMING.fast,
        withTiming(0, { duration: TIMING.normal })
      );

      // Call completion after total animation
      const totalDuration = TIMING.fast + TIMING.backdrop + 50;
      if (onCloseComplete || onComplete) {
        setTimeout(() => {
          onCloseComplete?.();
          onComplete?.();
        }, totalDuration);
      }
    },
    [morphProgress, backdropOpacity, contentFade, closePhase, onCloseComplete]
  );

  const reset = useCallback(() => {
    morphProgress.value = 0;
    bounceProgress.value = 0;
    backdropOpacity.value = 0;
    contentFade.value = 0;
    closePhase.value = 0;
  }, [morphProgress, bounceProgress, backdropOpacity, contentFade, closePhase]);

  const updateOrigin = useCallback((position: MorphPosition) => {
    originRef.current = position;
  }, []);

  return {
    morphProgress,
    bounceProgress,
    backdropOpacity,
    contentFade,
    closePhase,
    interpolatePosition,
    getPillOpacity,
    getPlaceholderOpacity,
    open,
    close,
    reset,
    updateOrigin,
  };
}

export default useMorphAnimation;
