/**
 * Animation Constants
 *
 * Centralized animation values for consistent motion throughout TrackR.
 * All springs use React Native Animated API (not Reanimated).
 *
 * Usage:
 *   import { SPRINGS, TIMING, PRESS_SCALES } from '@/constants/animations';
 *   Animated.spring(value, { toValue: 1, ...SPRINGS.responsive }).start();
 */

// ===========================================
// Spring Configurations
// ===========================================

/**
 * Spring physics presets for different interaction types.
 * All springs are tuned for 60fps performance.
 */
export const SPRINGS = {
  /**
   * Responsive spring - snappy, controlled feedback
   * Use for: button presses, small UI movements, quick transitions
   */
  responsive: {
    damping: 16,
    stiffness: 180,
    mass: 0.8,
    useNativeDriver: true,
  },

  /**
   * Responsive spring without native driver
   * Use for: layout animations (position, size, border radius)
   */
  responsiveLayout: {
    damping: 16,
    stiffness: 180,
    mass: 0.8,
    useNativeDriver: false,
  },

  /**
   * Bouncy spring - playful with overshoot
   * Use for: success states, celebrations, attention-grabbing elements
   */
  bouncy: {
    damping: 14,
    stiffness: 120,
    mass: 1,
    useNativeDriver: true,
  },

  /**
   * Bouncy spring without native driver
   * Use for: layout animations with bounce
   */
  bouncyLayout: {
    damping: 14,
    stiffness: 120,
    mass: 1,
    useNativeDriver: false,
  },

  /**
   * Morph spring - smooth, graceful expansion
   * Use for: hero morphs, modal expansions, large-scale transitions
   */
  morph: {
    damping: 14,
    stiffness: 42,
    mass: 1.2,
    useNativeDriver: false,
  },

  /**
   * Gentle spring - slow, subtle movement
   * Use for: background animations, ambient motion
   */
  gentle: {
    damping: 20,
    stiffness: 80,
    mass: 1.5,
    useNativeDriver: true,
  },

  /**
   * Stiff spring - minimal bounce, direct movement
   * Use for: toggles, switches, definitive state changes
   */
  stiff: {
    damping: 20,
    stiffness: 200,
    mass: 0.9,
    useNativeDriver: true,
  },
} as const;

// ===========================================
// Timing Durations
// ===========================================

/**
 * Standard timing durations in milliseconds.
 * Use these for Animated.timing() animations.
 */
export const TIMING = {
  /** Instant feedback - 100ms */
  instant: 100,

  /** Fast transition - 150ms */
  fast: 150,

  /** Normal transition - 250ms */
  normal: 250,

  /** Slow transition - 400ms */
  slow: 400,

  /** Content fade in during morph - 250ms with delay */
  contentFade: 250,

  /** Backdrop fade - 300ms */
  backdrop: 300,

  /** Morph expansion - 500ms */
  morphExpand: 500,

  /** Stagger delay between items - 50ms */
  stagger: 50,
} as const;

// ===========================================
// Press Feedback Scales
// ===========================================

/**
 * Scale values for press-in/press-out feedback.
 */
export const PRESS_SCALES = {
  /** Subtle press - barely noticeable */
  subtle: 0.98,

  /** Normal press - standard button feedback */
  normal: 0.97,

  /** Strong press - more pronounced feedback */
  strong: 0.95,

  /** Card press - for larger tappable areas */
  card: 0.98,
} as const;

// ===========================================
// Easing Functions (for reference)
// ===========================================

/**
 * Common easing patterns used with Animated.timing().
 * Import Easing from 'react-native' to use these.
 *
 * Examples:
 *   Easing.out(Easing.cubic)  - Fast start, slow end (most common)
 *   Easing.inOut(Easing.ease) - Smooth acceleration and deceleration
 *   Easing.bezier(0.25, 0.1, 0.25, 1) - Custom curve
 */

// ===========================================
// Animation Delays
// ===========================================

/**
 * Standard delay values for sequenced animations.
 */
export const DELAYS = {
  /** Content appears after morph starts - 400ms */
  morphContent: 400,

  /** Staggered cascade between items - 50ms */
  cascade: 50,

  /** Button morph-back during close - 150ms */
  buttonMorphBack: 150,
} as const;

// ===========================================
// Shadow Animation Values
// ===========================================

/**
 * Shadow opacity values for different states.
 * Used for smooth shadow transitions during morphs.
 */
export const SHADOWS = {
  /** Default card shadow opacity */
  card: 0.16,

  /** Elevated/modal shadow opacity */
  modal: 0.35,

  /** Pressed state shadow opacity */
  pressed: 0.12,
} as const;

// ===========================================
// Type Exports
// ===========================================

export type SpringConfig = typeof SPRINGS[keyof typeof SPRINGS];
export type TimingDuration = typeof TIMING[keyof typeof TIMING];
export type PressScale = typeof PRESS_SCALES[keyof typeof PRESS_SCALES];
