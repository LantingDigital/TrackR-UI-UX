import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Animated, StyleSheet, View, Easing, InteractionManager } from 'react-native';

// Curated placeholder suggestions - mix of iconic coasters, parks, and topics
// Each ends with "..." following placeholder best practices
const PLACEHOLDER_SUGGESTIONS = [
  // Iconic Coasters
  'Steel Vengeance...',
  'Millennium Force...',
  'Fury 325...',
  'Velocicoaster...',
  'Iron Gwazi...',
  'El Toro...',
  'Maverick...',
  'Lightning Rod...',
  // Popular Parks
  'Cedar Point...',
  'Kings Island...',
  'Busch Gardens...',
  'Universal Orlando...',
  'Six Flags Magic Mountain...',
  'Dollywood...',
  'Europa-Park...',
  'Alton Towers...',
  // Engaging Topics
  'Top 10 woodies...',
  'New for 2025...',
  'RMC conversions...',
  'B&M gigas...',
];

// Fisher-Yates shuffle algorithm for randomizing suggestions
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Delay before carousel becomes visible and starts animating
// Must be longer than modal open animation (1000ms) to avoid conflicts
const VISIBILITY_DELAY_MS = 1100;

// Additional delay before first transition after becoming visible
const FIRST_TRANSITION_DELAY_MS = 300;

interface RotatingPlaceholderProps {
  /** Interval between rotations in ms (default: 2500) */
  interval?: number;
  /** Whether the carousel is active (pauses when false) */
  isActive?: boolean;
  /** Text color for the placeholder */
  color?: string;
  /** Font size for the placeholder */
  fontSize?: number;
}

export const RotatingPlaceholder: React.FC<RotatingPlaceholderProps> = ({
  interval = 2500,
  isActive = true,
  color = '#999999',
  fontSize = 16,
}) => {
  // Shuffle suggestions once on mount so order is randomized
  const shuffledSuggestions = useMemo(() => shuffleArray(PLACEHOLDER_SUGGESTIONS), []);

  // Store the displayed texts in state - only updated AFTER animation completes
  const [currentText, setCurrentText] = useState(() => shuffledSuggestions[0]);
  const [nextText, setNextText] = useState(() => shuffledSuggestions[1]);

  // Single animation value: 0 = show current, 1 = show next
  const transitionProgress = useRef(new Animated.Value(0)).current;

  // Fade-in opacity for the entire component
  // Starts at 0, fades to 1 after modal is fully open
  const componentOpacity = useRef(new Animated.Value(0)).current;

  // Track current index in the shuffled array
  const indexRef = useRef(0);

  // Track if a transition is in progress
  const isTransitioning = useRef(false);

  // Track running animations for cleanup
  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const fadeAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Track if we're in the "ready" state (modal fully open, component visible)
  const isReadyRef = useRef(false);

  // Cleanup function - called when component becomes inactive
  // IMPORTANT: We intentionally DON'T stop the transition animation!
  // Stopping mid-animation causes a race condition where the intermediate
  // state is briefly visible. Instead, we let it complete invisibly in the background.
  const cleanupAnimations = useCallback(() => {
    // Set flags FIRST to prevent any new animations or state updates
    isReadyRef.current = false;
    isTransitioning.current = false;

    // Stop the fade animation (safe since we control opacity separately)
    if (fadeAnimation.current) {
      fadeAnimation.current.stop();
      fadeAnimation.current = null;
    }

    // NOTE: We intentionally leave runningAnimation alone!
    // It will complete in the background. Its callback checks isReadyRef,
    // which is now false, so it won't trigger any state updates.
    // This avoids the race condition that causes jitter during the later
    // half of the carousel transition (progress 0.7-1.0).
  }, []);

  // Handle the transition completion atomically
  const completeTransition = useCallback(() => {
    // Advance index
    indexRef.current = (indexRef.current + 1) % shuffledSuggestions.length;
    const newNextIndex = (indexRef.current + 1) % shuffledSuggestions.length;

    // CRITICAL: Reset animation FIRST, then update texts
    // This ensures the visual state is consistent
    transitionProgress.setValue(0);

    // Update texts in the next frame to avoid race condition
    // The animation is already at 0, so this won't cause visible changes
    setCurrentText(shuffledSuggestions[indexRef.current]);
    setNextText(shuffledSuggestions[newNextIndex]);
  }, [shuffledSuggestions, transitionProgress]);

  // Main animation loop
  useEffect(() => {
    if (!isActive) {
      // CRITICAL ORDER: Hide FIRST, then cleanup
      // This ensures the component is invisible before any animation state changes
      componentOpacity.setValue(0);
      cleanupAnimations();
      return;
    }

    let visibilityTimer: NodeJS.Timeout | null = null;
    let transitionTimer: NodeJS.Timeout | null = null;
    let intervalTimer: NodeJS.Timeout | null = null;

    // Wait for modal animation to complete before showing
    visibilityTimer = setTimeout(() => {
      // Use InteractionManager to ensure we don't interfere with any ongoing animations
      InteractionManager.runAfterInteractions(() => {
        if (!isActive) return; // Check again in case we became inactive

        // Fade in the component
        const fade = Animated.timing(componentOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
        fadeAnimation.current = fade;
        fade.start(({ finished }) => {
          fadeAnimation.current = null;
          if (finished) {
            isReadyRef.current = true;

            // Start the carousel timer after an additional delay
            transitionTimer = setTimeout(() => {
              // Start interval timer for transitions
              const performTransition = () => {
                // Don't transition if not ready or already transitioning
                if (!isReadyRef.current || isTransitioning.current) return;

                isTransitioning.current = true;

                // Animate from 0 to 1
                const animation = Animated.timing(transitionProgress, {
                  toValue: 1,
                  duration: 400,
                  easing: Easing.inOut(Easing.cubic),
                  useNativeDriver: true,
                });

                runningAnimation.current = animation;

                animation.start(({ finished: animFinished }) => {
                  runningAnimation.current = null;
                  isTransitioning.current = false;

                  // Only complete if animation finished naturally
                  if (animFinished && isReadyRef.current) {
                    completeTransition();
                  }
                });
              };

              intervalTimer = setInterval(performTransition, interval);
            }, FIRST_TRANSITION_DELAY_MS);
          }
        });
      });
    }, VISIBILITY_DELAY_MS);

    // Cleanup - runs before next effect or on unmount
    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
      if (intervalTimer) clearInterval(intervalTimer);
      // Hide immediately in cleanup too (covers edge cases)
      componentOpacity.setValue(0);
      cleanupAnimations();
    };
  }, [isActive, interval, transitionProgress, componentOpacity, completeTransition, cleanupAnimations]);

  // Small travel distance for tight, non-jarring animation
  const TRAVEL_DISTANCE = 16;

  // Current text: visible at 0, exits upward as progress -> 1
  const currentStyle = {
    opacity: transitionProgress.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [1, 0.7, 0.2, 0],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: transitionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -TRAVEL_DISTANCE],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  // Next text: hidden below at 0, enters as progress -> 1
  const nextStyle = {
    opacity: transitionProgress.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 0.2, 0.7, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: transitionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [TRAVEL_DISTANCE, 0],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const textStyle = { color, fontSize };

  return (
    <Animated.View style={[styles.container, { opacity: componentOpacity }]}>
      {/* Current text - exits upward */}
      <Animated.Text
        style={[styles.placeholder, textStyle, currentStyle]}
        numberOfLines={1}
      >
        {currentText}
      </Animated.Text>

      {/* Next text - enters from below */}
      <Animated.Text
        style={[styles.placeholder, textStyle, nextStyle]}
        numberOfLines={1}
      >
        {nextText}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
