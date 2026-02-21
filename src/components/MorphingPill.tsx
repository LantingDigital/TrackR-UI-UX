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
  withSpring,
  withSequence,
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
  duration?: number;        // Override default open duration
  closeDuration?: number;   // Override close first-phase duration (default: 550ms)
  closeArcHeight?: number;  // Override close valley arc height in px (default: 35)

  // When true, size stays fixed during close — only position and border radius animate.
  // Used for expanded search bar (modal and search bar are similar width).
  closeFixedSize?: boolean;

  // When true, the close animation fades shadow to 0 early (~first 30%)
  // so it's gone before the pill enters the button area during valley arc.
  // Used for search bar only (positioned above action buttons).
  closeShadowFade?: boolean;

  // Overshoot direction (optional)
  // Degrees clockwise from north: 0=up, 45=NE, 90=right, 315=NW
  // When provided, the close overshoot follows this exact direction
  // When omitted, overshoot follows the natural position math (good for search bar morphs)
  overshootAngle?: number;
  overshootMagnitude?: number; // Pixels of overshoot (default: 6)

  // Scroll-driven hide: when the parent scrolls and expands/collapses buttons,
  // the pill must hide so the real button's animation is visible.
  // 0 = pill visible (normal), 1 = pill hidden (scroll took over)
  scrollHidden?: SharedValue<number>;

  // External progress coordination
  externalProgress?: SharedValue<number>; // If provided, drives this instead of internal

  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onAnimationStart?: (isOpening: boolean) => void;
  onAnimationComplete?: (isOpen: boolean) => void;
  // Called ~50ms after onAnimationComplete during hidden handoff
  // Use this for state cleanup (setVisible(false), etc.) to avoid layout flash
  onCloseCleanup?: () => void;
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
  closeDuration,
  closeArcHeight,
  closeFixedSize,
  closeShadowFade,
  overshootAngle,
  overshootMagnitude = 6,
  scrollHidden,
  externalProgress,
  onOpen,
  onClose,
  onAnimationStart,
  onAnimationComplete,
  onCloseCleanup,
}, ref) => {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const wrapperRef = useRef<View>(null);

  // Wrapper screen position
  const wrapperScreenX = useSharedValue(0);
  const wrapperScreenY = useSharedValue(0);

  // Overshoot direction (SharedValues for worklet access)
  const hasOvershootDir = useSharedValue(overshootAngle !== undefined);
  const overshootAngleRad = useSharedValue(
    overshootAngle !== undefined ? overshootAngle * (Math.PI / 180) : 0
  );
  const overshootMag = useSharedValue(overshootMagnitude);

  // Close animation tuning (SharedValues for worklet access)
  const closeArcHeightSV = useSharedValue(closeArcHeight ?? 35);
  const closeFixedSizeSV = useSharedValue(closeFixedSize ? 1 : 0);
  const closeShadowFadeSV = useSharedValue(closeShadowFade ? 1 : 0);
  const closeDurRef = useRef(closeDuration ?? 550);
  closeDurRef.current = closeDuration ?? 550;

  // Animation progress - use external if provided, otherwise internal
  const internalProgress = useSharedValue(0);
  const morphProgress = externalProgress ?? internalProgress;

  const backdropOpacity = useSharedValue(0);
  const isOpening = useSharedValue(true);
  // After the first close, the pill stays opaque (acts as the button visually).
  // This flag keeps it visible even during subsequent opens at t=0,
  // preventing a 1-frame flash when transitioning from close → open.
  const hasClosedBefore = useSharedValue(false);
  // Used for opacity gating during close — stays at 1 during animation,
  // pill is removed from tree via setIsExpanded(false) after hidden handoff
  const closeFadeOut = useSharedValue(1);
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

  // Update overshoot direction when prop changes
  useEffect(() => {
    hasOvershootDir.value = overshootAngle !== undefined;
    overshootAngleRad.value = overshootAngle !== undefined ? overshootAngle * (Math.PI / 180) : 0;
    overshootMag.value = overshootMagnitude;
  }, [overshootAngle, overshootMagnitude]);

  // Update close arc height when prop changes
  useEffect(() => {
    closeArcHeightSV.value = closeArcHeight ?? 35;
  }, [closeArcHeight]);

  // Update close fixed size when prop changes
  useEffect(() => {
    closeFixedSizeSV.value = closeFixedSize ? 1 : 0;
  }, [closeFixedSize]);

  // Update close shadow fade when prop changes (search bar vs button origin)
  useEffect(() => {
    closeShadowFadeSV.value = closeShadowFade ? 1 : 0;
  }, [closeShadowFade]);

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
      // Two-phase: withTiming to -0.03 (past origin), then withSpring back to 0
      // closeT goes 0 → 1 → 1.03 → 1. Overshoot is closeT > 1.0
      const closeT = 1 - t;

      // Position easing — clamped at 1.0 when directional overshoot is specified,
      // unclamped (natural math overshoot) when no angle is given
      const easeInRaw = Math.pow(closeT, 2);
      const easeInForPos = hasOvershootDir.value ? Math.min(easeInRaw, 1.0) : easeInRaw;
      // Size/radius: when directional overshoot is active, use steeper easing (x^3)
      // so size is still actively shrinking near the end, creating a continuous feel.
      // Clamped at 1.0 so base reaches button size at closeT=1.0.
      // Overshoot scaling (> button size) is applied separately below.
      const easeInForSize = hasOvershootDir.value
        ? Math.min(Math.pow(closeT, 3), 1.0)
        : Math.min(easeInRaw, 1.0);

      // VALLEY ARC — clamped when directional overshoot handles direction,
      // unclamped when using natural math overshoot
      const arcCloseT = hasOvershootDir.value
        ? Math.min(Math.max(closeT, 0), 1.0)
        : closeT;
      const arcHeight = closeArcHeightSV.value;
      // When closeFixedSize (expanded search bar): asymmetric arc timing.
      // Remap so 60% of time → descent (slower dip), 40% → recovery (faster rise).
      // Both phases meet at the parabola peak where velocity=0, so transition is seamless.
      let arcInput = arcCloseT;
      if (closeFixedSizeSV.value === 1) {
        arcInput = arcCloseT < 0.75
          ? (arcCloseT / 0.75) * 0.5         // 0→0.75 maps to 0→0.5 (descent — slow)
          : 0.5 + ((arcCloseT - 0.75) / 0.25) * 0.5; // 0.75→1 maps to 0.5→1 (recovery — fast)
      }
      const closeArcCoeff = arcHeight / (0.5 * 0.5);
      const closeArcOffset = closeArcCoeff * arcInput * (arcInput - 1.0);

      // Size suction - pill briefly shrinks then pops back at landing
      // Disabled when closeFixedSize or directional overshoot is active
      let sizeSuction = 1.0;
      if (!hasOvershootDir.value && closeFixedSizeSV.value !== 1) {
        const clampedForSize = Math.min(Math.max(closeT, 0), 1.0);
        sizeSuction = interpolate(
          clampedForSize,
          [0, 0.75, 0.88, 1.0],
          [1.0, 1.0, 0.93, 1.0],
          Extrapolation.CLAMP
        );
      }

      // Calculate base position and size (reaches origin/target exactly at closeT=1.0)
      if (hasCloseTarget.value) {
        const closeRelX = closeTargetX.value - wrapperScreenX.value;
        const closeRelY = closeTargetY.value - wrapperScreenY.value;

        currentX = targetX + easeInForPos * (closeRelX - targetX);
        currentY = targetY + easeInForPos * (closeRelY - targetY) - closeArcOffset;
        if (closeFixedSizeSV.value === 1) {
          // Fixed size: width/height stay at pill dimensions, only radius morphs
          currentWidth = pillWidth;
          currentHeight = pillHeight;
          currentRadius = expandedBorderRadius + easeInForSize * (closeTargetR.value - expandedBorderRadius);
        } else {
          currentWidth = (finalWidth + easeInForSize * (closeTargetW.value - finalWidth)) * sizeSuction;
          currentHeight = (finalHeight + easeInForSize * (closeTargetH.value - finalHeight)) * sizeSuction;
          currentRadius = expandedBorderRadius + easeInForSize * (closeTargetR.value - expandedBorderRadius);
        }
      } else {
        currentX = targetX * (1 - easeInForPos);
        currentY = targetY * (1 - easeInForPos) - closeArcOffset;
        if (closeFixedSizeSV.value === 1) {
          // Fixed size: width/height stay at pill dimensions, only radius morphs
          currentWidth = pillWidth;
          currentHeight = pillHeight;
          currentRadius = expandedBorderRadius - easeInForSize * (expandedBorderRadius - pillBorderRadius);
        } else {
          currentWidth = (finalWidth - easeInForSize * (finalWidth - pillWidth)) * sizeSuction;
          currentHeight = (finalHeight - easeInForSize * (finalHeight - pillHeight)) * sizeSuction;
          currentRadius = expandedBorderRadius - easeInForSize * (expandedBorderRadius - pillBorderRadius);
        }
      }

      // DIRECTIONAL OVERSHOOT — position only (+ size when closeFixedSize is off)
      // Kicks in when closeT > 1.0 (pill has reached origin, now overshooting)
      if (hasOvershootDir.value) {
        const overshootT = Math.max(0, closeT - 1.0); // 0 during main close, ~0.04 at peak
        const overshootNorm = Math.min(overshootT / 0.04, 1.0); // 0→1 at peak, back to 0 at settle

        // Position: move in the specified compass direction
        const overshootPx = overshootNorm * overshootMag.value;
        currentX += Math.sin(overshootAngleRad.value) * overshootPx;
        currentY -= Math.cos(overshootAngleRad.value) * overshootPx;

        // Size: slight scale at overshoot peak (skipped when closeFixedSize)
        if (closeFixedSizeSV.value !== 1) {
          const sizeScale = 1.0 + overshootNorm * 0.015;
          const prevW = currentWidth;
          const prevH = currentHeight;
          currentWidth *= sizeScale;
          currentHeight *= sizeScale;
          currentX -= (currentWidth - prevW) / 2;
          currentY -= (currentHeight - prevH) / 2;
        }
      }
    }

    // Opacity:
    // - Initial state (never closed): invisible at t=0 so real button shows
    // - During open: visible once t > 0.001
    // - During/after close: always 1 (pill IS the button, no swap needed)
    // - Subsequent opens: stays at 1 even at t=0 (hasClosedBefore prevents flash)
    // - scrollHidden: when parent scrolls and button expands/collapses, pill hides
    const baseOpacity = isOpening.value
      ? (t > 0.001 ? 1 : hasClosedBefore.value ? 1 : 0)
      : 1;
    const scrollHide = scrollHidden ? scrollHidden.value : 0;
    const pillOpacity = baseOpacity * closeFadeOut.value * (1 - scrollHide);

    // Shadow:
    // - During open: fades in from 0 as pill lifts away from button position
    // - During close: returns to button's resting shadow values
    // Shadow overcast on action buttons is prevented structurally: buttons sit at z=11,
    // pill wrappers at z=10, so the pill's shadow always renders BEHIND the buttons.
    let shadowOp: number;
    let shadowOffH: number;
    let shadowRad: number;
    let shadowElev: number;
    if (isOpening.value) {
      shadowOp = interpolate(t, [0, 0.05, 0.5, 1], [0, 0.12, 0.16, 0.20], Extrapolation.CLAMP);
      shadowOffH = interpolate(t, [0, 0.5, 1], [4, 8, 12], Extrapolation.CLAMP);
      shadowRad = interpolate(t, [0, 0.5, 1], [6, 12, 20], Extrapolation.CLAMP);
      shadowElev = interpolate(t, [0, 1], [4, 12], Extrapolation.CLAMP);
    } else {
      const absT = Math.abs(t);
      if (closeShadowFadeSV.value === 1) {
        // Search bar: shadow dips to 0 mid-close (when pill passes through button area)
        // then returns to resting value by end — no overcast AND no pop at swap/settle
        // absT=1 (start) → 0.85: fade from 0.20 → 0.10
        // absT=0.85 → 0.7: fade from 0.10 → 0 (gone before valley arc dip)
        // absT=0.7 → 0.3: stays at 0 (pill traversing button area)
        // absT=0.3 → 0: returns 0 → 0.30 (resting — matches normal path)
        shadowOp = interpolate(absT, [0, 0.3, 0.7, 0.85, 1], [0.30, 0, 0, 0.10, 0.20], Extrapolation.CLAMP);
      } else {
        // Normal: shadow transitions to resting values
        shadowOp = interpolate(absT, [0, 0.15, 0.5, 1], [0.30, 0.22, 0.16, 0.20], Extrapolation.CLAMP);
      }
      shadowOffH = interpolate(absT, [0, 0.15, 0.5, 1], [8, 8, 8, 12], Extrapolation.CLAMP);
      shadowRad = interpolate(absT, [0, 0.15, 0.5, 1], [20, 16, 12, 20], Extrapolation.CLAMP);
      shadowElev = interpolate(absT, [0, 0.15, 1], [8, 6, 12], Extrapolation.CLAMP);
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
      shadowOffset: { width: 0, height: shadowOffH },
      shadowOpacity: shadowOp,
      shadowRadius: shadowRad,
      elevation: shadowElev,
      zIndex: Math.abs(t) > 0.01 ? 9999 : 1,
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
      // CLOSING (1→0): pill content appears only at the very last frame
      // Matches the pillOpacity threshold (t <= 0.0005 = invisible)
      // so content appears simultaneously with the pill becoming visible
      return {
        opacity: t <= 0.008 ? 1 : 0,
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

  // Wrap onCloseCleanup in a ref-stable function for worklet access
  const onCloseCleanupRef = useRef(onCloseCleanup);
  onCloseCleanupRef.current = onCloseCleanup;
  const fireCloseCleanup = useCallback(() => {
    onCloseCleanupRef.current?.();
  }, []);

  // Stable callback refs for animation completion
  const handleAnimationComplete = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      // Close complete — pill is at exact button position with matching shadow.
      // The pill stays fully opaque (isOpening stays false → baseOpacity = 1).
      // No button is shown behind it → no double shadow → no blink.
      // The pill IS the button visually until the next open.
      hasClosedBefore.value = true; // Keep pill visible during subsequent opens
      onAnimationComplete?.(isOpen);
      setIsAnimating(false);
      setIsExpanded(false); // pointerEvents → 'none', touches pass to real button
      fireCloseCleanup();
      return;
    }
    setIsAnimating(false);
    onAnimationComplete?.(isOpen);
  }, [onAnimationComplete, fireCloseCleanup]);

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
      closeFadeOut.value = 1; // Ensure pill is fully opaque for open
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

  // Close handler — two-phase close with directional overshoot
  // Phase 1: Original-speed close to slightly past origin (withTiming, same 450ms feel)
  // Phase 2: Quick spring back to origin (withSpring, ~100ms settle)
  // The valley arc + position math naturally extend past origin, giving correct directional overshoot
  const handleClose = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    isOpening.value = false;
    onClose?.();
    onAnimationStart?.(false);

    if (showBackdrop) {
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION });
    }

    // Phase 1: Close from 1 to -0.04 (past origin) at original speed
    // The ease-out decelerates naturally, crossing t=0 at ~460ms
    // Then continues to -0.04 (the overshoot peak) over the remaining ~90ms
    // Phase 2: Spring snaps from -0.04 back to 0 (~100-150ms)
    morphProgress.value = withSequence(
      withTiming(-0.04, {
        duration: closeDurRef.current,
        easing: Easing.out(Easing.cubic),
      }),
      withSpring(0, {
        damping: 24,
        stiffness: 320,
        mass: 0.5,
      }, (finished) => {
        if (finished) {
          runOnJS(handleAnimationComplete)(false);
        }
      })
    );
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
