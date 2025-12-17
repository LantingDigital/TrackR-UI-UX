/**
 * MorphingPill.tsx
 *
 * TRUE single-element morph - NO Modal, NO swap.
 * The pill itself expands. Same React element the entire time.
 *
 * Features:
 * - Parabolic arc trajectory on open
 * - Two-phase animation: pill → large pill → expanded size
 * - Direct collapse with bounce on close
 * - Optional backdrop (can be disabled for external management)
 * - External progress coordination via SharedValue
 * - Ref methods for imperative control
 */

import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ViewStyle,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spring configs (kept for future use)
export const SPRING_CONFIG = {
  fluid: { damping: 20, stiffness: 120, mass: 1 },
  playful: { damping: 18, stiffness: 140, mass: 0.9 },
  apple: { damping: 22, stiffness: 100, mass: 1.2 },
  snappy: { damping: 28, stiffness: 200, mass: 0.9 },
  liquid: { damping: 38, stiffness: 5, mass: 4.5 },
};

// Animation phase breakpoints
const PHASE = {
  peak: 0.32,        // End of arc up, start of descent
  morphStart: 0.35,  // When size expansion begins accelerating
  contentFade: 0.55, // When expanded content starts appearing
  landing: 0.88,     // Overshoot point before settling
};

export type SpringType = keyof typeof SPRING_CONFIG;
export type BackdropType = 'blur' | 'dark' | 'none';

// Default dimensions
const DEFAULT_PILL_WIDTH = 120;
const DEFAULT_PILL_HEIGHT = 44;
const DEFAULT_PILL_RADIUS = DEFAULT_PILL_HEIGHT / 2;
const MODAL_PADDING = 16;

// Animation durations
const MORPH_DURATION = 1000; // ms for open (10% snappier)
const CLOSE_DURATION = 450; // ms for close - snappy return

export interface MorphingPillRef {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  isAnimating: boolean;
}

// Position for close target (screen coordinates)
interface CloseTargetPosition {
  x: number;      // Screen X coordinate
  y: number;      // Screen Y coordinate
  width: number;
  height: number;
  borderRadius: number;
}

interface MorphingPillProps {
  // Pill (collapsed) state
  pillContent: React.ReactNode;
  pillWidth?: number;
  pillHeight?: number;
  pillBorderRadius?: number;
  pillStyle?: ViewStyle;

  // Expanded state (renamed from modalContent for clarity)
  expandedContent: React.ReactNode | ((close: () => void) => React.ReactNode);
  expandedWidth?: number;   // Final width (default: SCREEN_WIDTH - 32)
  expandedHeight?: number;  // Final height (default: full modal)
  expandedBorderRadius?: number;
  expandedStyle?: ViewStyle;

  // Close target position (optional)
  // If provided, close animation goes to this position instead of back to pill origin
  // Used when modal should collapse to search bar position, not button position
  closeTargetPosition?: CloseTargetPosition;

  // Backdrop options
  showBackdrop?: boolean;   // Default: true. Set false when parent manages backdrop
  backdropType?: BackdropType;
  blurIntensity?: number;

  // Animation options
  springType?: SpringType;
  duration?: number;        // Override default duration

  // External progress coordination
  externalProgress?: SharedValue<number>; // If provided, drives this instead of internal

  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onAnimationStart?: (isOpening: boolean) => void;
  onAnimationComplete?: (isOpen: boolean) => void;
}

export const MorphingPill = forwardRef<MorphingPillRef, MorphingPillProps>(({
  pillContent,
  pillWidth = DEFAULT_PILL_WIDTH,
  pillHeight = DEFAULT_PILL_HEIGHT,
  pillBorderRadius = DEFAULT_PILL_RADIUS,
  pillStyle,
  expandedContent,
  expandedWidth,
  expandedHeight,
  expandedBorderRadius = 24,
  expandedStyle,
  closeTargetPosition,
  showBackdrop = true,
  backdropType = 'blur',
  blurIntensity = 50,
  springType = 'liquid',
  duration = MORPH_DURATION,
  externalProgress,
  onOpen,
  onClose,
  onAnimationStart,
  onAnimationComplete,
}, ref) => {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const wrapperRef = useRef<View>(null);

  // Wrapper screen position
  const wrapperScreenX = useSharedValue(0);
  const wrapperScreenY = useSharedValue(0);

  // Animation progress - use external if provided, otherwise internal
  const internalProgress = useSharedValue(0);
  const morphProgress = externalProgress ?? internalProgress;

  const backdropOpacity = useSharedValue(0);
  const isOpening = useSharedValue(true);
  // Note: bounceProgress removed - spring curve is now calculated directly in outerStyle
  // This eliminates timing mismatch issues that caused the "double jump" effect

  // Calculate final dimensions
  const finalWidth = expandedWidth ?? (SCREEN_WIDTH - MODAL_PADDING * 2);
  const finalHeight = expandedHeight ?? (SCREEN_HEIGHT - insets.top - insets.bottom - MODAL_PADDING * 2 - 100);

  // Modal position (shared values for worklet access)
  // NOTE: modalYValue MUST match HomeScreen's pillFinalTop = insets.top + 60
  // This ensures blur zone and MorphingPill final position align perfectly
  const modalXValue = useSharedValue(MODAL_PADDING);
  const modalYValue = useSharedValue(insets.top + 60);

  // Close target position (shared values for worklet access)
  // If closeTargetPosition is provided, close animation goes there instead of back to pill
  const closeTargetX = useSharedValue(closeTargetPosition?.x ?? 0);
  const closeTargetY = useSharedValue(closeTargetPosition?.y ?? 0);
  const closeTargetW = useSharedValue(closeTargetPosition?.width ?? pillWidth);
  const closeTargetH = useSharedValue(closeTargetPosition?.height ?? pillHeight);
  const closeTargetR = useSharedValue(closeTargetPosition?.borderRadius ?? pillBorderRadius);
  const hasCloseTarget = useSharedValue(!!closeTargetPosition);

  // Update modal Y when insets change
  // Keep in sync with initial value: insets.top + 60 (matches HomeScreen's pillFinalTop)
  useEffect(() => {
    modalYValue.value = insets.top + 60;
  }, [insets.top, modalYValue]);

  // Update close target when prop changes
  useEffect(() => {
    if (closeTargetPosition) {
      closeTargetX.value = closeTargetPosition.x;
      closeTargetY.value = closeTargetPosition.y;
      closeTargetW.value = closeTargetPosition.width;
      closeTargetH.value = closeTargetPosition.height;
      closeTargetR.value = closeTargetPosition.borderRadius;
      hasCloseTarget.value = true;
    } else {
      hasCloseTarget.value = false;
    }
  }, [closeTargetPosition]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isExpanded && !isAnimating) {
        handleClose();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isExpanded, isAnimating]);

  // Expose ref methods
  useImperativeHandle(ref, () => ({
    open: handleOpen,
    close: handleClose,
    isOpen: isExpanded,
    isAnimating,
  }), [isExpanded, isAnimating]);

  // Outer container style - SINGLE CONTINUOUS MOTION
  const outerStyle = useAnimatedStyle(() => {
    const t = morphProgress.value;

    // Target position (relative to wrapper)
    const targetX = modalXValue.value - wrapperScreenX.value;
    const targetY = modalYValue.value - wrapperScreenY.value;

    let currentX, currentY, currentWidth, currentHeight, currentRadius;

    if (isOpening.value) {
      // ========== OPENING ANIMATION ==========
      // Parabolic ARC motion: element arcs UPWARD first, then descends to final position
      // This creates the iOS "liquid glass" feel with spring bounce at landing

      // Smooth ease-out for the main travel (decelerates as it approaches target)
      const easeOut = 1 - Math.pow(1 - t, 2.5);

      // ARC OFFSET - TRUE PARABOLIC curve for smooth arc motion
      // Parabola equation: arcOffset = a * t * (t - endT)
      // where endT = 0.7 (when arc ends), and we solve for 'a' to get desired peak height
      // Peak occurs at t = endT/2 = 0.35
      // For 70px peak: a = peakHeight / (peakT * (peakT - endT)) = 70 / (0.35 * -0.35) ≈ 571.4
      const ARC_END_T = 0.7;      // Arc completes at 70% of animation
      const ARC_PEAK_HEIGHT = 70; // Peak height in pixels (upward)
      const arcT = Math.min(t, ARC_END_T); // Clamp to arc duration
      const arcCoefficient = ARC_PEAK_HEIGHT / (0.35 * 0.35); // ≈ 571.4
      const arcOffset = arcCoefficient * arcT * (arcT - ARC_END_T); // Results in negative value = upward arc (mountain shape)

      // Spring bounce - FIXED PIXELS so all origins bounce identically
      // Only activates in the last 30% of animation
      // Pattern: overshoot down 14px, then return directly to final (no extra bounce)
      const bounceOffset = interpolate(
        t,
        [0, 0.7, 0.85, 1.0],
        [0, 0,   14,   0],
        Extrapolation.CLAMP
      );

      // Position: smooth travel + arc offset + bounce
      // The arc makes it jump up first, then descend to target with bounce
      currentX = easeOut * targetX;
      currentY = easeOut * targetY + arcOffset + bounceOffset;

      // Size: smooth expansion from pill to final
      currentWidth = pillWidth + easeOut * (finalWidth - pillWidth);
      currentHeight = pillHeight + easeOut * (finalHeight - pillHeight);
      currentRadius = pillBorderRadius + easeOut * (expandedBorderRadius - pillBorderRadius);

    } else {
      // ========== CLOSING ANIMATION ==========
      // Direct shrink back to origin - TRUE morph, no crossfade
      const closeT = 1 - t; // 0 at start of close, 1 at end

      // Smooth ease-in for natural acceleration into final position
      const easeIn = Math.pow(closeT, 2);

      if (hasCloseTarget.value) {
        // Close to specified target position
        const closeRelX = closeTargetX.value - wrapperScreenX.value;
        const closeRelY = closeTargetY.value - wrapperScreenY.value;

        currentX = targetX + easeIn * (closeRelX - targetX);
        currentY = targetY + easeIn * (closeRelY - targetY);
        currentWidth = finalWidth + easeIn * (closeTargetW.value - finalWidth);
        currentHeight = finalHeight + easeIn * (closeTargetH.value - finalHeight);
        currentRadius = expandedBorderRadius + easeIn * (closeTargetR.value - expandedBorderRadius);
      } else {
        // Close back to pill origin (default behavior)
        currentX = targetX * (1 - easeIn);
        currentY = targetY * (1 - easeIn);
        currentWidth = finalWidth - easeIn * (finalWidth - pillWidth);
        currentHeight = finalHeight - easeIn * (finalHeight - pillHeight);
        currentRadius = expandedBorderRadius - easeIn * (expandedBorderRadius - pillBorderRadius);
      }
    }

    // Opacity: Stay visible until EXACTLY at final position
    // Use tiny threshold to eliminate any visible position difference when pill disappears
    // At t=0.0005, we're 99.95% of the way to target - imperceptible difference
    const pillOpacity = t <= 0.0005 ? 0 : 1;

    // Shadow: Fade to 0 as we approach origin during CLOSE
    // This prevents "double shadow" effect with destination element
    // During open (isOpening=true), use normal shadow
    // During close, fade shadow out in last 10% of animation
    let shadowOp: number;
    if (isOpening.value) {
      shadowOp = interpolate(t, [0, 0.5, 1], [0.12, 0.16, 0.20], Extrapolation.CLAMP);
    } else {
      // During close: fade shadow to 0 as t approaches 0
      shadowOp = interpolate(t, [0, 0.1, 0.5, 1], [0, 0.08, 0.16, 0.20], Extrapolation.CLAMP);
    }

    return {
      position: 'absolute',
      left: currentX,
      top: currentY,
      width: currentWidth,
      height: currentHeight,
      borderRadius: currentRadius,
      backgroundColor: '#FFFFFF',
      opacity: pillOpacity,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: interpolate(t, [0, 0.5, 1], [4, 8, 12], Extrapolation.CLAMP) },
      shadowOpacity: shadowOp,
      shadowRadius: interpolate(t, [0, 0.5, 1], [6, 12, 20], Extrapolation.CLAMP),
      elevation: interpolate(t, [0, 1], [4, 12], Extrapolation.CLAMP),
      zIndex: t > 0.0005 ? 9999 : 1,
    };
  });

  // Inner container style
  const innerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: interpolate(morphProgress.value, [0, 1], [pillBorderRadius, expandedBorderRadius], Extrapolation.CLAMP),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  }));

  // Pill content style - different timing for open vs close
  const pillContentStyle = useAnimatedStyle(() => {
    const t = morphProgress.value;

    if (isOpening.value) {
      // OPENING (0→1): pill content fades out quickly
      return {
        opacity: interpolate(t, [0, PHASE.peak * 0.8, PHASE.morphStart], [1, 0.8, 0], Extrapolation.CLAMP),
        transform: [
          { scale: interpolate(t, [0, PHASE.peak * 0.4, PHASE.peak, PHASE.morphStart], [1, 1.05, 1.02, 0.9], Extrapolation.CLAMP) },
        ],
      };
    } else {
      // CLOSING (1→0): pill content appears only at the very END
      // This prevents the "shrinking/shifting" effect during animation
      // Content only becomes visible when pill is at final destination size (last 5%)
      // At that point, the layout matches the destination element exactly
      return {
        opacity: interpolate(t, [0, 0.05, 0.1], [1, 0.5, 0], Extrapolation.CLAMP),
        transform: [{ scale: 1 }],
      };
    }
  });

  // Expanded content style - different timing for open vs close
  const expandedContentStyle = useAnimatedStyle(() => {
    const t = morphProgress.value;

    if (isOpening.value) {
      // OPENING (0→1): content fades in during last half
      return {
        opacity: interpolate(t, [PHASE.contentFade, PHASE.landing], [0, 1], Extrapolation.CLAMP),
      };
    } else {
      // CLOSING (1→0): content fades out with extended overlap for smooth crossfade
      // Visible at t=1, starts fading at t=0.85, invisible by t=0.45
      // This creates 30% overlap with pillContent (visible from t=0.75)
      // Result: gradual crossfade from t=0.75 to t=0.45
      return {
        opacity: interpolate(t, [0.45, 0.85], [0, 1], Extrapolation.CLAMP),
      };
    }
  });

  // Backdrop style
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    zIndex: backdropOpacity.value > 0.01 ? 9998 : -1,
  }));

  // Stable callback refs for animation completion
  const handleAnimationComplete = useCallback((isOpen: boolean) => {
    setIsAnimating(false);
    if (!isOpen) {
      setIsExpanded(false);
      // Reset isOpening to true so pill renders at origin position with full opacity
      // This snaps the pill back to button position, ready for next tap
      isOpening.value = true;
    }
    onAnimationComplete?.(isOpen);
  }, [onAnimationComplete, isOpening]);

  // Open handler
  const handleOpen = useCallback(() => {
    if (isAnimating) return;

    // Defensive: ensure ref exists
    if (!wrapperRef.current) {
      console.warn('MorphingPill: wrapperRef not ready');
      return;
    }

    wrapperRef.current.measureInWindow((x, y) => {
      // Defensive: handle null measurements
      if (x === undefined || y === undefined) {
        console.warn('MorphingPill: measureInWindow returned undefined');
        return;
      }

      wrapperScreenX.value = x;
      wrapperScreenY.value = y;

      setIsExpanded(true);
      setIsAnimating(true);
      isOpening.value = true;
      onOpen?.();
      onAnimationStart?.(true);

      // Single timed animation - spring curve is calculated in outerStyle
      // No separate bounceProgress needed - eliminates timing mismatch issues
      morphProgress.value = withTiming(1, {
        duration,
        // Use bezier for controlled feel: quick start, consistent middle, snappy end
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }, (finished) => {
        if (finished) {
          runOnJS(handleAnimationComplete)(true);
        }
      });

      if (showBackdrop) {
        backdropOpacity.value = withTiming(1, { duration });
      }
    });
  }, [morphProgress, backdropOpacity, isOpening, isAnimating, showBackdrop, duration, onOpen, onAnimationStart, handleAnimationComplete]);

  // Close handler
  const handleClose = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    isOpening.value = false;
    onClose?.();
    onAnimationStart?.(false);

    if (showBackdrop) {
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION });
    }

    morphProgress.value = withTiming(0, {
      duration: CLOSE_DURATION,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(handleAnimationComplete)(false);
      }
    });
  }, [morphProgress, backdropOpacity, isOpening, isAnimating, showBackdrop, onClose, onAnimationStart, handleAnimationComplete]);

  return (
    <View
      ref={wrapperRef}
      style={[styles.wrapper, { width: pillWidth, height: pillHeight }]}
      collapsable={false}
    >
      {/* Backdrop - only render if showBackdrop is true */}
      {showBackdrop && (
        <Animated.View
          style={[
            styles.backdrop,
            backdropType === 'dark' && styles.backdropDark,
            backdropStyle,
          ]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          {backdropType === 'blur' ? (
            <BlurView
              intensity={blurIntensity}
              tint="light"
              style={StyleSheet.absoluteFill}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleClose}
                disabled={isAnimating}
              />
            </BlurView>
          ) : backdropType === 'dark' ? (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleClose}
              disabled={isAnimating}
            />
          ) : null}
        </Animated.View>
      )}

      {/* THE PILL */}
      {/* pointerEvents='none' when invisible to allow touches to pass through to actual UI elements */}
      <Animated.View
        style={[outerStyle, pillStyle]}
        pointerEvents={isExpanded || isAnimating ? 'auto' : 'none'}
      >
        <Animated.View style={innerStyle}>
          <Pressable
            style={styles.pressable}
            onPress={isExpanded ? undefined : handleOpen}
            disabled={isAnimating}
          >
            {/* Pill content - NO wrapper flex properties, just absolute fill + opacity */}
            {/* pillContent must handle its own layout to match destination elements exactly */}
            <Animated.View style={[StyleSheet.absoluteFillObject, pillContentStyle]}>
              {pillContent}
            </Animated.View>

            {/* Expanded content */}
            <Animated.View style={[styles.contentWrapper, styles.expandedContentWrapper, expandedContentStyle, expandedStyle]}>
              {typeof expandedContent === 'function'
                ? expandedContent(handleClose)
                : expandedContent}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

MorphingPill.displayName = 'MorphingPill';

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'visible',
  },
  backdrop: {
    position: 'absolute',
    top: -500,
    left: -500,
    width: SCREEN_WIDTH + 1000,
    height: SCREEN_HEIGHT + 1000,
  },
  backdropDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pressable: {
    flex: 1,
    overflow: 'hidden',
  },
  contentWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillContentWrapper: {
    // Override centering to allow pillContent to stretch and fill
    // This ensures search bar content aligns with real search bar
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  expandedContentWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
});

export default MorphingPill;
