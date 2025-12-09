/**
 * useMorphAnimation Hook
 *
 * Provides the hero morph animation system used throughout TrackR.
 * Elements morph from their origin position into full-screen modals
 * with spring physics, bounce arcs, and orchestrated content reveals.
 *
 * Usage:
 *   const morph = useMorphAnimation({
 *     originPosition: { top: 100, left: 20, width: 200, height: 50, borderRadius: 25 },
 *     finalPosition: { top: 60, left: 16, width: screenWidth - 32, height: 56, borderRadius: 16 },
 *   });
 *
 *   // Open the morph
 *   morph.open();
 *
 *   // Close the morph
 *   morph.close(() => setVisible(false));
 *
 *   // Use interpolated values
 *   <Animated.View style={{ top: morph.position.top, ... }} />
 */

import { useRef, useCallback, useMemo } from 'react';
import { Animated, Keyboard, Easing } from 'react-native';
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
  /**
   * Starting position (where the morph originates from).
   */
  originPosition: MorphPosition;

  /**
   * Ending position (where the morph expands to).
   */
  finalPosition: MorphPosition;

  /**
   * Whether to use bounce animation on open.
   * @default true
   */
  useBounce?: boolean;

  /**
   * Peak position for bounce arc (how high above final position).
   * @default 60
   */
  bounceArcHeight?: number;

  /**
   * Callback when morph completes opening.
   */
  onOpenComplete?: () => void;

  /**
   * Callback when morph completes closing.
   */
  onCloseComplete?: () => void;
}

export interface UseMorphAnimationReturn {
  /**
   * Whether the morph is currently visible/animating.
   */
  isVisible: boolean;

  /**
   * Core animated values for custom interpolations.
   */
  values: {
    morphProgress: Animated.Value;
    bounceProgress: Animated.Value;
    backdropOpacity: Animated.Value;
    contentFade: Animated.Value;
    closePhase: Animated.Value;
  };

  /**
   * Pre-computed position interpolations.
   */
  position: {
    top: Animated.AnimatedInterpolation<number>;
    left: Animated.AnimatedInterpolation<number>;
    width: Animated.AnimatedInterpolation<number>;
    height: Animated.AnimatedInterpolation<number>;
    borderRadius: Animated.AnimatedInterpolation<number>;
  };

  /**
   * Pre-computed opacity interpolations.
   */
  opacity: {
    backdrop: Animated.Value;
    content: Animated.Value;
    pill: Animated.AnimatedInterpolation<number>;
    placeholder: Animated.AnimatedInterpolation<number>;
  };

  /**
   * Open the morph animation.
   */
  open: () => void;

  /**
   * Close the morph animation.
   */
  close: (onComplete?: () => void) => void;

  /**
   * Reset all values to initial state (useful for tab reset).
   */
  reset: () => void;

  /**
   * Update origin position (for dynamic origins).
   */
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

  // Store origin in ref so it can be updated dynamically
  const originRef = useRef(originPosition);
  const isVisibleRef = useRef(false);

  // ===========================================
  // Animated Values
  // ===========================================

  // Core morph progress (0 = origin, 1 = final)
  const morphProgress = useRef(new Animated.Value(0)).current;

  // Bounce progress for arc animation (0 = start, 1 = settled)
  const bounceProgress = useRef(new Animated.Value(0)).current;

  // Backdrop blur opacity
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Content fade (separate from morph for timing control)
  const contentFade = useRef(new Animated.Value(0)).current;

  // Close phase toggle (0 = use bounce curve, 1 = use linear curve)
  const closePhase = useRef(new Animated.Value(0)).current;

  // ===========================================
  // Position Interpolations
  // ===========================================

  // Create bounce curve interpolation for TOP position
  const topBounce = useMemo(() => {
    const origin = originRef.current;
    const peakTop = finalPosition.top - bounceArcHeight;

    return bounceProgress.interpolate({
      inputRange: [0, 0.35, 0.7, 0.85, 1],
      outputRange: [
        origin.top,
        peakTop,           // Peak: arc height above final
        finalPosition.top,
        finalPosition.top + 8,  // Overshoot
        finalPosition.top,
      ],
      extrapolate: 'clamp',
    });
  }, [bounceProgress, finalPosition.top, bounceArcHeight]);

  // Linear interpolation for close animation
  const topLinear = useMemo(() => {
    const origin = originRef.current;
    return morphProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.top, finalPosition.top],
      extrapolate: 'clamp',
    });
  }, [morphProgress, finalPosition.top]);

  // Blend between bounce and linear based on closePhase
  const topPosition = useMemo(() => {
    return Animated.add(
      Animated.multiply(
        topBounce,
        closePhase.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        })
      ),
      Animated.multiply(topLinear, closePhase)
    );
  }, [topBounce, topLinear, closePhase]);

  // LEFT position (follows similar pattern but simpler)
  const leftBounce = useMemo(() => {
    const origin = originRef.current;
    return bounceProgress.interpolate({
      inputRange: [0, 0.35, 0.7, 1],
      outputRange: [
        origin.left,
        finalPosition.left,
        finalPosition.left,
        finalPosition.left,
      ],
      extrapolate: 'clamp',
    });
  }, [bounceProgress, finalPosition.left]);

  const leftLinear = useMemo(() => {
    const origin = originRef.current;
    return morphProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.left, finalPosition.left],
      extrapolate: 'clamp',
    });
  }, [morphProgress, finalPosition.left]);

  const leftPosition = useMemo(() => {
    return Animated.add(
      Animated.multiply(
        leftBounce,
        closePhase.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        })
      ),
      Animated.multiply(leftLinear, closePhase)
    );
  }, [leftBounce, leftLinear, closePhase]);

  // WIDTH interpolation
  const widthBounce = useMemo(() => {
    const origin = originRef.current;
    return bounceProgress.interpolate({
      inputRange: [0, 0.35, 0.7, 1],
      outputRange: [
        origin.width,
        origin.width + (finalPosition.width - origin.width) * 0.8,
        finalPosition.width,
        finalPosition.width,
      ],
      extrapolate: 'clamp',
    });
  }, [bounceProgress, finalPosition.width]);

  const widthLinear = useMemo(() => {
    const origin = originRef.current;
    return morphProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.width, finalPosition.width],
      extrapolate: 'clamp',
    });
  }, [morphProgress, finalPosition.width]);

  const widthValue = useMemo(() => {
    return Animated.add(
      Animated.multiply(
        widthBounce,
        closePhase.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        })
      ),
      Animated.multiply(widthLinear, closePhase)
    );
  }, [widthBounce, widthLinear, closePhase]);

  // HEIGHT interpolation
  const heightBounce = useMemo(() => {
    const origin = originRef.current;
    return bounceProgress.interpolate({
      inputRange: [0, 0.35, 0.7, 1],
      outputRange: [
        origin.height,
        origin.height + (finalPosition.height - origin.height) * 0.8,
        finalPosition.height,
        finalPosition.height,
      ],
      extrapolate: 'clamp',
    });
  }, [bounceProgress, finalPosition.height]);

  const heightLinear = useMemo(() => {
    const origin = originRef.current;
    return morphProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.height, finalPosition.height],
      extrapolate: 'clamp',
    });
  }, [morphProgress, finalPosition.height]);

  const heightValue = useMemo(() => {
    return Animated.add(
      Animated.multiply(
        heightBounce,
        closePhase.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        })
      ),
      Animated.multiply(heightLinear, closePhase)
    );
  }, [heightBounce, heightLinear, closePhase]);

  // BORDER RADIUS interpolation
  const borderRadiusBounce = useMemo(() => {
    const origin = originRef.current;
    return bounceProgress.interpolate({
      inputRange: [0, 0.35, 0.7, 1],
      outputRange: [
        origin.borderRadius,
        origin.borderRadius + (finalPosition.borderRadius - origin.borderRadius) * 0.8,
        finalPosition.borderRadius,
        finalPosition.borderRadius,
      ],
      extrapolate: 'clamp',
    });
  }, [bounceProgress, finalPosition.borderRadius]);

  const borderRadiusLinear = useMemo(() => {
    const origin = originRef.current;
    return morphProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.borderRadius, finalPosition.borderRadius],
      extrapolate: 'clamp',
    });
  }, [morphProgress, finalPosition.borderRadius]);

  const borderRadiusValue = useMemo(() => {
    return Animated.add(
      Animated.multiply(
        borderRadiusBounce,
        closePhase.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        })
      ),
      Animated.multiply(borderRadiusLinear, closePhase)
    );
  }, [borderRadiusBounce, borderRadiusLinear, closePhase]);

  // ===========================================
  // Opacity Interpolations
  // ===========================================

  // Morphing pill fades in as animation begins
  const pillOpacity = useMemo(() => {
    return morphProgress.interpolate({
      inputRange: [0, 0.05, 0.15],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });
  }, [morphProgress]);

  // Placeholder text fades out as pill expands
  const placeholderOpacity = useMemo(() => {
    return morphProgress.interpolate({
      inputRange: [0, 0.3],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  }, [morphProgress]);

  // ===========================================
  // Animation Controllers
  // ===========================================

  const open = useCallback(() => {
    isVisibleRef.current = true;

    // Reset all values before animating
    contentFade.setValue(0);
    morphProgress.setValue(0);
    backdropOpacity.setValue(0);
    bounceProgress.setValue(0);
    closePhase.setValue(0); // Use bounce curve for open

    // Use requestAnimationFrame for smooth start
    requestAnimationFrame(() => {
      if (useBounce) {
        // Bounce animation with arc
        Animated.parallel([
          // Expansion timing with fast-start easing
          Animated.timing(morphProgress, {
            toValue: 1,
            duration: TIMING.morphExpand,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Bounce spring for arc + landing
          Animated.spring(bounceProgress, {
            toValue: 1,
            ...SPRINGS.morph,
          }),
          // Backdrop fade
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: TIMING.slow,
            useNativeDriver: true,
          }),
          // Content fades in during landing phase
          Animated.timing(contentFade, {
            toValue: 1,
            duration: TIMING.contentFade,
            delay: DELAYS.morphContent,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onOpenComplete?.();
        });
      } else {
        // Simple spring animation (no bounce arc)
        Animated.parallel([
          Animated.spring(morphProgress, {
            toValue: 1,
            ...SPRINGS.responsiveLayout,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: TIMING.backdrop,
            useNativeDriver: true,
          }),
          Animated.timing(contentFade, {
            toValue: 1,
            duration: TIMING.normal,
            delay: 200,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onOpenComplete?.();
        });
      }
    });
  }, [
    useBounce,
    morphProgress,
    bounceProgress,
    backdropOpacity,
    contentFade,
    closePhase,
    onOpenComplete,
  ]);

  const close = useCallback(
    (onComplete?: () => void) => {
      Keyboard.dismiss();

      // Switch to close phase (linear curve)
      closePhase.setValue(1);

      // Sequenced close animation
      Animated.sequence([
        // Step 1: Fade out content FIRST
        Animated.timing(contentFade, {
          toValue: 0,
          duration: TIMING.fast,
          useNativeDriver: false,
        }),
        // Step 2: Morph back to origin + fade backdrop
        Animated.parallel([
          Animated.timing(morphProgress, {
            toValue: 0,
            duration: TIMING.backdrop,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: TIMING.normal,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        isVisibleRef.current = false;
        onCloseComplete?.();
        onComplete?.();
      });
    },
    [morphProgress, backdropOpacity, contentFade, closePhase, onCloseComplete]
  );

  const reset = useCallback(() => {
    isVisibleRef.current = false;
    morphProgress.setValue(0);
    bounceProgress.setValue(0);
    backdropOpacity.setValue(0);
    contentFade.setValue(0);
    closePhase.setValue(0);
  }, [morphProgress, bounceProgress, backdropOpacity, contentFade, closePhase]);

  const updateOrigin = useCallback((position: MorphPosition) => {
    originRef.current = position;
  }, []);

  // ===========================================
  // Return Object
  // ===========================================

  return {
    isVisible: isVisibleRef.current,
    values: {
      morphProgress,
      bounceProgress,
      backdropOpacity,
      contentFade,
      closePhase,
    },
    position: {
      top: topPosition as Animated.AnimatedInterpolation<number>,
      left: leftPosition as Animated.AnimatedInterpolation<number>,
      width: widthValue as Animated.AnimatedInterpolation<number>,
      height: heightValue as Animated.AnimatedInterpolation<number>,
      borderRadius: borderRadiusValue as Animated.AnimatedInterpolation<number>,
    },
    opacity: {
      backdrop: backdropOpacity,
      content: contentFade,
      pill: pillOpacity,
      placeholder: placeholderOpacity,
    },
    open,
    close,
    reset,
    updateOrigin,
  };
}

// ===========================================
// Default Export
// ===========================================

export default useMorphAnimation;
