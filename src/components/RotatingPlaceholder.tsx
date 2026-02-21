import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, InteractionManager } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

// Curated placeholder suggestions
const PLACEHOLDER_SUGGESTIONS = [
  'Steel Vengeance...',
  'Millennium Force...',
  'Fury 325...',
  'Velocicoaster...',
  'Iron Gwazi...',
  'El Toro...',
  'Maverick...',
  'Lightning Rod...',
  'Cedar Point...',
  'Kings Island...',
  'Busch Gardens...',
  'Universal Orlando...',
  'Six Flags Magic Mountain...',
  'Dollywood...',
  'Europa-Park...',
  'Alton Towers...',
  'Top 10 woodies...',
  'New for 2025...',
  'RMC conversions...',
  'B&M gigas...',
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const VISIBILITY_DELAY_MS = 1100;
const FIRST_TRANSITION_DELAY_MS = 300;

interface RotatingPlaceholderProps {
  interval?: number;
  isActive?: boolean;
  color?: string;
  fontSize?: number;
}

export const RotatingPlaceholder: React.FC<RotatingPlaceholderProps> = ({
  interval = 2500,
  isActive = true,
  color = '#999999',
  fontSize = 16,
}) => {
  const shuffledSuggestions = useMemo(() => shuffleArray(PLACEHOLDER_SUGGESTIONS), []);

  const [currentText, setCurrentText] = useState(() => shuffledSuggestions[0]);
  const [nextText, setNextText] = useState(() => shuffledSuggestions[1]);

  const transitionProgress = useSharedValue(0);
  const componentOpacity = useSharedValue(0);

  const indexRef = useRef(0);
  const isTransitioning = useRef(false);
  const isReadyRef = useRef(false);

  const TRAVEL_DISTANCE = 16;

  const completeTransition = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % shuffledSuggestions.length;
    const newNextIndex = (indexRef.current + 1) % shuffledSuggestions.length;
    transitionProgress.value = 0;
    setCurrentText(shuffledSuggestions[indexRef.current]);
    setNextText(shuffledSuggestions[newNextIndex]);
  }, [shuffledSuggestions, transitionProgress]);

  useEffect(() => {
    if (!isActive) {
      componentOpacity.value = 0;
      isReadyRef.current = false;
      isTransitioning.current = false;
      return;
    }

    let visibilityTimer: NodeJS.Timeout | null = null;
    let transitionTimer: NodeJS.Timeout | null = null;
    let intervalTimer: NodeJS.Timeout | null = null;

    visibilityTimer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (!isActive) return;

        componentOpacity.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });

        // Delay to let fade complete
        setTimeout(() => {
          isReadyRef.current = true;

          transitionTimer = setTimeout(() => {
            const performTransition = () => {
              if (!isReadyRef.current || isTransitioning.current) return;
              isTransitioning.current = true;

              transitionProgress.value = withTiming(1, {
                duration: 400,
                easing: Easing.inOut(Easing.cubic),
              });

              // Complete after animation duration
              setTimeout(() => {
                isTransitioning.current = false;
                if (isReadyRef.current) {
                  completeTransition();
                }
              }, 420);
            };

            intervalTimer = setInterval(performTransition, interval);
          }, FIRST_TRANSITION_DELAY_MS);
        }, 220);
      });
    }, VISIBILITY_DELAY_MS);

    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
      if (intervalTimer) clearInterval(intervalTimer);
      componentOpacity.value = 0;
      isReadyRef.current = false;
      isTransitioning.current = false;
    };
  }, [isActive, interval, transitionProgress, componentOpacity, completeTransition]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: componentOpacity.value,
  }));

  const currentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      transitionProgress.value,
      [0, 0.3, 0.7, 1],
      [1, 0.7, 0.2, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          transitionProgress.value,
          [0, 1],
          [0, -TRAVEL_DISTANCE],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const nextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      transitionProgress.value,
      [0, 0.3, 0.7, 1],
      [0, 0.2, 0.7, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          transitionProgress.value,
          [0, 1],
          [TRAVEL_DISTANCE, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const textStyle = { color, fontSize };

  return (
    <Animated.View style={[styles.container, containerAnimStyle]}>
      <Animated.Text
        style={[styles.placeholder, textStyle, currentStyle]}
        numberOfLines={1}
      >
        {currentText}
      </Animated.Text>
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
