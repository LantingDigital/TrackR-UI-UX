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
  withDelay,
  withSpring,
  withSequence,
  cancelAnimation,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

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
const MORPH_DURATION = 850; // ms for open (0.85x speed-up, proportional)
const CLOSE_DURATION = 385; // ms for close backdrop (0.85x speed-up)

export interface MorphingPillRef {
  /** Open the pill. Optionally pass screen coordinates to skip measureInWindow entirely. */
  open: (overrideX?: number, overrideY?: number) => void;
  close: () => void;
  /** Instantly reset to collapsed state (no animation). Use when covering with another modal. */
  reset: () => void;
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
  /** Container background transitions to this color near pill size — hides white edges during close overshoot */
  pillBackgroundColor?: string;

  // Expanded state (renamed from modalContent for clarity)
  expandedContent: React.ReactNode | ((close: () => void) => React.ReactNode);
  expandedWidth?: number;   // Final width (default: SCREEN_WIDTH - 32)
  expandedHeight?: number;  // Final height (default: full modal)
  expandedY?: number;       // Final Y position (default: insets.top + 60)
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

  // Hint button overrides (default path only — does not affect holdPillDuringArc)
  smoothClose?: boolean;   // Single eased timing to 0 — no overshoot, no spring bounce
  openBounce?: number;     // Landing bounce pixels on open (default: 14, set 0 to disable)
  openArcHeight?: number;  // Parabolic arc peak in px on open (default: 70, set 0 to disable)

  // Override pill screen position — bypasses measureInWindow entirely.
  originScreenX?: number;
  originScreenY?: number;

  // Scroll-driven hide: when the parent scrolls and expands/collapses buttons,
  // the pill must hide so the real button's animation is visible.
  // 0 = pill visible (normal), 1 = pill hidden (scroll took over)
  scrollHidden?: SharedValue<number>;

  // Content that stays visible during both open and close transitions (never fades).
  // Used for elements like icons that appear identically in both pill and expanded states.
  // Rendered as an absolutely-positioned layer between pill content and expanded content.
  persistentContent?: React.ReactNode;

  // Standalone mode: pill IS the button (visible + tappable from first render).
  // When false (default), pill starts invisible and relies on external button → ref.open().
  standalone?: boolean;

  // When true, the pill holds its collapsed circle shape during the upward arc phase (t=0→0.32).
  // Position and size travel begin only AFTER the arc peaks, creating a clear "jump up then morph down" feel.
  // Without this, long-distance morphs (e.g. top-right to center) show a diagonal drift instead of a visible arc.
  holdPillDuringArc?: boolean;

  // Debug tuning — overrides hardcoded animation constants when provided.
  // Used with CoastleDebugPanel for real-time slider adjustment.
  tuning?: {
    arcHeight?: number;
    arcBias?: number;
    sizeStart?: number;
    bounceAmount?: number;
    overshootAmount?: number;
    easingP1X?: number;
    easingP1Y?: number;
    easingP2X?: number;
    easingP2Y?: number;
    expandDuration?: number;
    springDamping?: number;
    springStiffness?: number;
    springMass?: number;
    closeSpringDamping?: number;
    closeSpringStiffness?: number;
    closeSpringMass?: number;
    duration?: number;
  };

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
  pillBackgroundColor,
  expandedContent,
  expandedWidth,
  expandedHeight,
  expandedY,
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
  smoothClose = false,
  openBounce = 14,
  openArcHeight = 70,
  originScreenX,
  originScreenY,
  standalone = false,
  holdPillDuringArc = false,
  persistentContent,
  tuning,
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
  const wrapperScreenX = useSharedValue(originScreenX ?? 0);
  const wrapperScreenY = useSharedValue(originScreenY ?? 0);

  // Origin screen position override — set from props so it's on the UI thread
  // BEFORE any tap handler fires. Eliminates JS→UI race condition on first open.
  const originXOverride = useSharedValue(originScreenX ?? -1);
  const originYOverride = useSharedValue(originScreenY ?? -1);

  // Open animation overrides (default path only)
  const openBounceSV = useSharedValue(openBounce);
  const openArcHeightSV = useSharedValue(openArcHeight);

  // Overshoot direction (SharedValues for worklet access)
  const hasOvershootDir = useSharedValue(overshootAngle !== undefined);
  const overshootAngleRad = useSharedValue(
    overshootAngle !== undefined ? overshootAngle * (Math.PI / 180) : 0
  );
  const overshootMag = useSharedValue(overshootMagnitude);

  // Open animation tuning
  const holdPillDuringArcSV = useSharedValue(holdPillDuringArc ? 1 : 0);

  // Debug tuning SharedValues (worklet-accessible) + ref (JS-accessible)
  const tunArcHeight = useSharedValue(tuning?.arcHeight ?? 120);
  const tunArcBias = useSharedValue(tuning?.arcBias ?? 0.5);
  const tunSizeStart = useSharedValue(tuning?.sizeStart ?? 0.60);
  const tunExpandDur = useSharedValue(tuning?.expandDuration ?? 300);
  const tunBounceAmt = useSharedValue(tuning?.bounceAmount ?? 10);
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;

  // Independent size animation — decoupled from arc travel
  const sizeProgress = useSharedValue(0);

  // PRE-WARM: Force Reanimated to JIT-compile all worklets used in animated styles
  // (outerStyle, innerStyle, backdropStyle, etc.) BEFORE the first user tap.
  // Strategy: nudge shared values to a tiny non-zero epsilon via withSequence,
  // then immediately snap back to the resting value. This guarantees the worklet
  // closures evaluate (Reanimated skips no-op animations where start === end).
  // The epsilon is imperceptible (0.001 opacity / 0.001 progress) and lasts 0ms.
  const hasPreWarmed = useRef(false);
  useEffect(() => {
    if (hasPreWarmed.current) return;
    hasPreWarmed.current = true;
    const eps = 0.001;
    morphProgress.value = withSequence(
      withTiming(eps, { duration: 0 }),
      withTiming(0, { duration: 0 })
    );
    backdropOpacity.value = withSequence(
      withTiming(eps, { duration: 0 }),
      withTiming(0, { duration: 0 })
    );
    closeFadeOut.value = withSequence(
      withTiming(1 - eps, { duration: 0 }),
      withTiming(1, { duration: 0 })
    );
    sizeProgress.value = withSequence(
      withTiming(eps, { duration: 0 }),
      withTiming(0, { duration: 0 })
    );
  }, []);

  useEffect(() => {
    tunArcHeight.value = tuning?.arcHeight ?? 120;
    tunArcBias.value = tuning?.arcBias ?? 0.5;
    tunSizeStart.value = tuning?.sizeStart ?? 0.60;
    tunExpandDur.value = tuning?.expandDuration ?? 300;
    tunBounceAmt.value = tuning?.bounceAmount ?? 10;
  }, [tuning?.arcHeight, tuning?.arcBias, tuning?.sizeStart, tuning?.expandDuration, tuning?.bounceAmount]);


  // Close animation tuning (SharedValues for worklet access)
  const closeArcHeightSV = useSharedValue(closeArcHeight ?? 35);
  const closeFixedSizeSV = useSharedValue(closeFixedSize ? 1 : 0);
  const closeShadowFadeSV = useSharedValue(closeShadowFade ? 1 : 0);
  const closeDurRef = useRef(closeDuration ?? 470);
  closeDurRef.current = closeDuration ?? 470;

  // Animation progress - use external if provided, otherwise internal
  const internalProgress = useSharedValue(0);
  const morphProgress = externalProgress ?? internalProgress;

  const backdropOpacity = useSharedValue(0);
  // Standalone: pill starts in "post-close" state → visible with resting shadow.
  // Non-standalone: pill starts invisible, relies on external button → ref.open().
  const isOpening = useSharedValue(!standalone);
  // After the first close, the pill stays opaque (acts as the button visually).
  // This flag keeps it visible even during subsequent opens at t=0,
  // preventing a 1-frame flash when transitioning from close → open.
  // Standalone: starts true so pill is visible from first render.
  const hasClosedBefore = useSharedValue(standalone);
  // Used for opacity gating during close — stays at 1 during animation,
  // pill is removed from tree via setIsExpanded(false) after hidden handoff
  const closeFadeOut = useSharedValue(1);
  // Note: bounceProgress removed - spring curve is now calculated directly in outerStyle
  // This eliminates timing mismatch issues that caused the "double jump" effect

  // Calculate final dimensions
  const finalWidth = expandedWidth ?? (SCREEN_WIDTH - MODAL_PADDING * 2);
  const finalHeight = expandedHeight ?? (SCREEN_HEIGHT - insets.top - insets.bottom - MODAL_PADDING * 2 - 100);

  // Modal position (shared values for worklet access)
  // X auto-centers the expanded card on screen unless expandedX is explicitly provided
  // For HomeScreen: (SCREEN_WIDTH - (SCREEN_WIDTH - 32)) / 2 = 16 (same as old MODAL_PADDING)
  const modalXValue = useSharedValue((SCREEN_WIDTH - finalWidth) / 2);
  // NOTE: modalYValue default (insets.top + 60) matches HomeScreen's pillFinalTop
  const modalYValue = useSharedValue(expandedY ?? (insets.top + 60));

  // Close target position (shared values for worklet access)
  // If closeTargetPosition is provided, close animation goes there instead of back to pill
  const closeTargetX = useSharedValue(closeTargetPosition?.x ?? 0);
  const closeTargetY = useSharedValue(closeTargetPosition?.y ?? 0);
  const closeTargetW = useSharedValue(closeTargetPosition?.width ?? pillWidth);
  const closeTargetH = useSharedValue(closeTargetPosition?.height ?? pillHeight);
  const closeTargetR = useSharedValue(closeTargetPosition?.borderRadius ?? pillBorderRadius);
  const hasCloseTarget = useSharedValue(!!closeTargetPosition);

  // Update modal X when expanded width changes (auto-center)
  useEffect(() => {
    modalXValue.value = (SCREEN_WIDTH - finalWidth) / 2;
  }, [finalWidth, modalXValue]);

  // Update modal Y when insets change or expandedY prop changes
  // Default: insets.top + 60 (matches HomeScreen's pillFinalTop)
  useEffect(() => {
    modalYValue.value = expandedY ?? (insets.top + 60);
  }, [insets.top, expandedY, modalYValue]);

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

  // Sync origin override when props change (e.g. pill resizes from label change)
  useEffect(() => {
    originXOverride.value = originScreenX ?? -1;
    originYOverride.value = originScreenY ?? -1;
    if (originScreenX !== undefined) wrapperScreenX.value = originScreenX;
    if (originScreenY !== undefined) wrapperScreenY.value = originScreenY;
  }, [originScreenX, originScreenY]);

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
    reset: () => {
      cancelAnimation(morphProgress);
      cancelAnimation(backdropOpacity);
      morphProgress.value = 0;
      backdropOpacity.value = 0;
      isOpening.value = false;
      closeFadeOut.value = 1;
      hasClosedBefore.value = true;
      setIsExpanded(false);
      setIsAnimating(false);
    },
    isOpen: isExpanded,
    isAnimating,
  }), [isExpanded, isAnimating]);

  // Outer container style - SINGLE CONTINUOUS MOTION
  const outerStyle = useAnimatedStyle(() => {
    const t = morphProgress.value;

    // Target position (relative to wrapper)
    // Use origin override when available (set from props, always on UI thread).
    const effectiveX = originXOverride.value >= 0 ? originXOverride.value : wrapperScreenX.value;
    const effectiveY = originYOverride.value >= 0 ? originYOverride.value : wrapperScreenY.value;
    const targetX = modalXValue.value - effectiveX;
    const targetY = modalYValue.value - effectiveY;

    let currentX, currentY, currentWidth, currentHeight, currentRadius;

    if (isOpening.value) {
      // ========== OPENING ANIMATION ==========
      // Parabolic ARC motion: element arcs UPWARD first, then descends to final position
      // This creates the iOS "liquid glass" feel with spring bounce at landing

      // ARC OFFSET - TRUE PARABOLIC curve for smooth arc motion
      const ARC_END_T = 0.7;      // Arc completes at 70% of animation
      const arcPeak = openArcHeightSV.value;
      const arcT = Math.min(t, ARC_END_T); // Clamp to arc duration
      const arcCoefficient = arcPeak / (0.35 * 0.35); // ≈ 571.4 at default 70px
      const arcOffset = arcPeak > 0 ? arcCoefficient * arcT * (arcT - ARC_END_T) : 0;

      // Bounce offset — different behavior for holdPillDuringArc vs default
      let bounceOffset: number;
      if (holdPillDuringArcSV.value === 1) {
        // Coastle: bounce responds to overshoot (t > 1.0), driven by tuning slider
        const bAmt = tunBounceAmt.value;
        bounceOffset = interpolate(
          t,
          [0, 0.97, 1.0, 1.03, 1.06],
          [0, 0,    0,   bAmt, 0],
          Extrapolation.CLAMP
        );
      } else {
        // Default: landing bounce within t=0→1.0 range
        bounceOffset = interpolate(
          t,
          [0, 0.7, 0.85, 1.0],
          [0, 0,   openBounceSV.value, 0],
          Extrapolation.CLAMP
        );
      }

      if (holdPillDuringArcSV.value === 1) {
        // TOP-CENTER-TRACKED QUADRATIC BEZIER for long-distance morphs.
        // All constants driven by tuning SharedValues for real-time slider adjustment.
        const ARC_HEIGHT = tunArcHeight.value;
        const ARC_BIAS = tunArcBias.value;
        const SIZE_START = tunSizeStart.value;

        // Top-center positions
        const topStartX = pillWidth / 2;
        const topStartY = 0;
        const topEndX = targetX + finalWidth / 2;
        const topEndY = targetY;

        // Delta the Bezier actually travels
        const topDX = topEndX - topStartX;
        const topDY = topEndY - topStartY;

        const controlDX = ARC_BIAS * topDX;

        // Clamp t to 1.0 for Bezier position and size — overshoot only affects bounceOffset.
        const tc = Math.min(t, 1.0);

        // Bezier weights (using clamped t)
        const b1 = 2 * tc * (1 - tc);
        const b2 = tc * tc;

        // Top-center position along the Bezier (clamped) + bounce from raw t
        const topCenterX = topStartX + b1 * controlDX + b2 * topDX;
        const topCenterY = topStartY + b1 * (-ARC_HEIGHT) + b2 * topDY + bounceOffset;

        // Size driven by independent sizeProgress (decoupled from arc timing).
        // sizeProgress runs its own withTiming with its own duration.
        const sp = sizeProgress.value;
        if (sp <= 0.001) {
          currentWidth = pillWidth;
          currentHeight = pillHeight;
          currentRadius = pillBorderRadius;
        } else {
          const sizeEase = 1 - Math.pow(1 - sp, 2.5);
          currentWidth = pillWidth + sizeEase * (finalWidth - pillWidth);
          currentHeight = pillHeight + sizeEase * (finalHeight - pillHeight);
          currentRadius = pillBorderRadius + sizeEase * (expandedBorderRadius - pillBorderRadius);
        }

        // Convert top-center → top-left corner for React Native positioning
        // X: centered horizontally (grows left + right)
        // Y: anchored at top (grows downward only)
        currentX = topCenterX - currentWidth / 2;
        currentY = topCenterY;
      } else {
        // DEFAULT (HomeScreen): position and size interpolate together from t=0
        const tSafe = Math.min(t, 1.0); // Safety clamp — default path never overshoots
        const easeOut = 1 - Math.pow(1 - tSafe, 2.5);
        currentX = easeOut * targetX;
        currentY = easeOut * targetY + arcOffset + bounceOffset;
        currentWidth = pillWidth + easeOut * (finalWidth - pillWidth);
        currentHeight = pillHeight + easeOut * (finalHeight - pillHeight);
        currentRadius = pillBorderRadius + easeOut * (expandedBorderRadius - pillBorderRadius);
      }

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
    // - First open (never closed): smooth fade-in over first 8% to crossfade with button
    // - Subsequent opens: stays at 1 even at t=0 (hasClosedBefore prevents flash)
    // - During/after close: always 1 (pill IS the button, no swap needed)
    // - scrollHidden: when parent scrolls and button expands/collapses, pill hides
    const baseOpacity = isOpening.value
      ? (hasClosedBefore.value ? 1 : interpolate(t, [0, 0.08], [0, 1], Extrapolation.CLAMP))
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
      backgroundColor: pillBackgroundColor
        ? interpolateColor(Math.abs(t), [0, 0.12], [pillBackgroundColor, colors.background.card])
        : colors.background.card,
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
    backgroundColor: pillBackgroundColor
      ? interpolateColor(Math.abs(morphProgress.value), [0, 0.12], [pillBackgroundColor, colors.background.card])
      : colors.background.card,
  }));

  // Pill content style - different timing for open vs close
  // Key: pill content visibility must OVERLAP with expanded content visibility
  // to create a crossfade with no blank gap
  const pillContentStyle = useAnimatedStyle(() => {
    const t = morphProgress.value;

    if (isOpening.value) {
      // OPENING (0→1): pill content fades out, ending right as expanded content appears
      // Expanded content starts at PHASE.contentFade (0.55), so we fade to 0 at 0.55
      // This eliminates the blank gap between pill content vanishing and expanded content appearing
      return {
        opacity: interpolate(t, [0, 0.2, 0.4, PHASE.contentFade], [1, 0.85, 0.3, 0], Extrapolation.CLAMP),
        transform: [
          { scale: interpolate(t, [0, 0.15, 0.4, PHASE.contentFade], [1, 1.03, 1.0, 0.95], Extrapolation.CLAMP) },
        ],
      };
    } else {
      // CLOSING (1→0): pill content crossfades in as expanded content fades out
      // Expanded content gone by t=0.45, pill content starts at t=0.45 — seamless handoff
      return {
        opacity: interpolate(t, [-0.04, 0, 0.2, 0.45], [1, 1, 0.5, 0], Extrapolation.CLAMP),
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
  // overrideX/overrideY: optional screen coordinates passed at call time.
  // When provided, these take priority over props and measureInWindow,
  // enabling callers to pass the position synchronously and avoid async delays.
  const handleOpen = useCallback((overrideX?: number, overrideY?: number) => {
    if (isAnimating) return;

    // Defensive: ensure ref exists
    if (!wrapperRef.current) {
      console.warn('MorphingPill: wrapperRef not ready');
      return;
    }

    const startOpen = (x: number, y: number) => {
      // Defensive: if morphProgress is stale (e.g. tab blur reset external values
      // but not internal MorphingPill state), ensure we start from 0 so the
      // withTiming(1) animation actually runs instead of being a no-op.
      if (morphProgress.value !== 0) {
        cancelAnimation(morphProgress);
        morphProgress.value = 0;
      }

      wrapperScreenX.value = x;
      wrapperScreenY.value = y;

      setIsExpanded(true);
      setIsAnimating(true);
      isOpening.value = true;
      closeFadeOut.value = 1; // Ensure pill is fully opaque for open
      onOpen?.();
      onAnimationStart?.(true);

      if (holdPillDuringArc) {
        // COASTLE: tuning-driven overshoot + easing + independent size animation
        const tn = tuningRef.current;
        const overshoot = tn?.overshootAmount ?? 1.03;
        const eDuration = tn?.duration ?? duration;
        const expandDur = tn?.expandDuration ?? 300;
        const sizeStart = tn?.sizeStart ?? 0.60;
        const easing = Easing.bezier(
          tn?.easingP1X ?? 0.15,
          tn?.easingP1Y ?? 0.7,
          tn?.easingP2X ?? 0.85,
          tn?.easingP2Y ?? 1,
        );

        // Independent size animation: delayed start, own duration
        cancelAnimation(sizeProgress);
        sizeProgress.value = 0;
        sizeProgress.value = withDelay(
          Math.round(sizeStart * eDuration),
          withTiming(1, { duration: expandDur, easing: Easing.out(Easing.quad) })
        );

        // Two-phase: timed travel past 1.0 (overshoot), then spring snap back
        morphProgress.value = withSequence(
          withTiming(overshoot, { duration: eDuration, easing }),
          withSpring(1, {
            damping: tn?.springDamping ?? 20,
            stiffness: tn?.springStiffness ?? 220,
            mass: tn?.springMass ?? 0.6,
          }, (finished) => {
            if (finished) {
              runOnJS(handleAnimationComplete)(true);
            }
          })
        );

        if (showBackdrop) {
          backdropOpacity.value = withTiming(1, { duration: eDuration });
        }
      } else {
        // HOMESCREEN: original single withTiming to 1.0, original easing
        morphProgress.value = withTiming(1, {
          duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
          if (finished) {
            runOnJS(handleAnimationComplete)(true);
          }
        });

        if (showBackdrop) {
          backdropOpacity.value = withTiming(1, { duration });
        }
      }

    };

    // Priority order for position resolution:
    // 1. Call-time overrides (synchronous, zero delay — passed by callers who know the position)
    // 2. Props (originScreenX/Y — set from parent, also synchronous)
    // 3. measureInWindow (async native bridge — last resort, causes first-open lag)
    if (overrideX !== undefined && overrideY !== undefined) {
      startOpen(overrideX, overrideY);
    } else if (originScreenX !== undefined && originScreenY !== undefined) {
      startOpen(originScreenX, originScreenY);
    } else if (originScreenX !== undefined || originScreenY !== undefined) {
      wrapperRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
        startOpen(originScreenX ?? pageX ?? 0, originScreenY ?? pageY ?? 0);
      });
    } else {
      // Default: measure at tap time (async — will cause first-open lag)
      wrapperRef.current.measureInWindow((x, y) => {
        if (x === undefined || y === undefined) {
          console.warn('MorphingPill: measureInWindow returned undefined');
          return;
        }
        startOpen(x, y);
      });
    }
  }, [morphProgress, backdropOpacity, isOpening, isAnimating, showBackdrop, duration, onOpen, onAnimationStart, handleAnimationComplete]);

  // Close handler — two-phase close with directional overshoot
  // Phase 1: Original-speed close to slightly past origin (withTiming, same 450ms feel)
  // Phase 2: Quick spring back to origin (withSpring, ~100ms settle)
  // The valley arc + position math naturally extend past origin, giving correct directional overshoot
  const handleClose = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    isOpening.value = false;
    if (holdPillDuringArc) {
      cancelAnimation(sizeProgress);
      sizeProgress.value = 1; // Ensure full size before close shrinks it
    }
    onClose?.();
    onAnimationStart?.(false);

    if (showBackdrop) {
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION });
    }

    if (smoothClose) {
      // Single eased timing straight to 0 — no overshoot, no spring
      morphProgress.value = withTiming(0, {
        duration: closeDurRef.current,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(handleAnimationComplete)(false);
        }
      });
    } else {
      // Phase 1: Close from 1 to -0.04 (past origin) at original speed
      // Phase 2: Spring snaps from -0.04 back to 0
      morphProgress.value = withSequence(
        withTiming(-0.04, {
          duration: closeDurRef.current,
          easing: Easing.out(Easing.cubic),
        }),
        withSpring(0, holdPillDuringArc
          ? { damping: tuningRef.current?.closeSpringDamping ?? tuningRef.current?.springDamping ?? 16, stiffness: tuningRef.current?.closeSpringStiffness ?? tuningRef.current?.springStiffness ?? 140, mass: tuningRef.current?.closeSpringMass ?? tuningRef.current?.springMass ?? 0.7 }
          : { damping: 24, stiffness: 320, mass: 0.5 }, // HomeScreen: original snappy settle
        (finished) => {
          if (finished) {
            runOnJS(handleAnimationComplete)(false);
          }
        })
      );
    }
  }, [morphProgress, backdropOpacity, isOpening, isAnimating, showBackdrop, smoothClose, onClose, onAnimationStart, handleAnimationComplete]);

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
      {/* Standalone: always tappable (pill IS the button). */}
      {/* Non-standalone: pointerEvents='none' when invisible so touches pass through to real UI elements */}
      <Animated.View
        style={[outerStyle, pillStyle]}
        pointerEvents={standalone || isExpanded || isAnimating ? 'auto' : 'none'}
      >
        <Animated.View style={innerStyle}>
          <Pressable
            style={styles.pressable}
            onPress={isExpanded ? undefined : () => handleOpen()}
            disabled={isAnimating}
          >
            {/* Pill content - NO wrapper flex properties, just absolute fill + opacity */}
            {/* pillContent must handle its own layout to match destination elements exactly */}
            <Animated.View style={[StyleSheet.absoluteFillObject, pillContentStyle]}>
              {pillContent}
            </Animated.View>

            {/* Persistent content — never fades during open/close transitions */}
            {/* Used for elements (like globe icon) that appear identically in both states */}
            {persistentContent && (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {persistentContent}
              </View>
            )}

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
