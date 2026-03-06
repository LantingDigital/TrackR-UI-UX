// ============================================
// Guided Tour v2 — Animated Highlight Controller
//
// Drives the cutout window position with SharedValues
// so panel dimensions animate on the UI thread (no blink).
// ============================================

import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { SPRINGS, TIMING } from '../../constants/animations';
import { radius } from '../../theme/radius';
import type { TargetMeasurement } from './types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TARGET_PADDING = 10;

export function useAnimatedHighlight() {
  const windowX = useSharedValue(0);
  const windowY = useSharedValue(0);
  const windowW = useSharedValue(SCREEN_W);
  const windowH = useSharedValue(SCREEN_H);
  const windowRadius = useSharedValue(0);
  const windowOpacity = useSharedValue(0); // 0 = no cutout (full blur), 1 = cutout visible

  const animateTo = useCallback(
    (rect: TargetMeasurement) => {
      'worklet';
      const spring = SPRINGS.responsive;
      windowX.value = withSpring(rect.x - TARGET_PADDING, spring);
      windowY.value = withSpring(rect.y - TARGET_PADDING, spring);
      windowW.value = withSpring(rect.width + TARGET_PADDING * 2, spring);
      windowH.value = withSpring(rect.height + TARGET_PADDING * 2, spring);
      windowRadius.value = withSpring(radius.card, spring);
      windowOpacity.value = withSpring(1, spring);
    },
    [windowX, windowY, windowW, windowH, windowRadius, windowOpacity],
  );

  const fadeOut = useCallback(() => {
    'worklet';
    windowOpacity.value = withTiming(0, { duration: TIMING.normal });
  }, [windowOpacity]);

  const fadeIn = useCallback(() => {
    'worklet';
    windowOpacity.value = withTiming(1, { duration: TIMING.normal });
  }, [windowOpacity]);

  const setInstant = useCallback(
    (rect: TargetMeasurement) => {
      windowX.value = rect.x - TARGET_PADDING;
      windowY.value = rect.y - TARGET_PADDING;
      windowW.value = rect.width + TARGET_PADDING * 2;
      windowH.value = rect.height + TARGET_PADDING * 2;
      windowRadius.value = radius.card;
    },
    [windowX, windowY, windowW, windowH, windowRadius],
  );

  const clearCutout = useCallback(() => {
    'worklet';
    windowOpacity.value = withTiming(0, { duration: TIMING.normal });
  }, [windowOpacity]);

  return {
    windowX,
    windowY,
    windowW,
    windowH,
    windowRadius,
    windowOpacity,
    animateTo,
    fadeOut,
    fadeIn,
    setInstant,
    clearCutout,
  };
}
