// ============================================
// Guided Tour v2 — Target Highlight
//
// 4-panel blur layout with animated panel dimensions
// driven by SharedValues (runs on UI thread, no blink).
// Soft shadow glow replaces the harsh v1 border.
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { colors } from '../../theme/colors';
import { SPRINGS } from '../../constants/animations';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BLUR_INTENSITY = 25;
const GLOW_EXTRA = 6;

const OVERLAY_BG = Platform.OS === 'android'
  ? 'rgba(255,255,255,0.92)'
  : undefined;

interface TargetHighlightProps {
  windowX: SharedValue<number>;
  windowY: SharedValue<number>;
  windowW: SharedValue<number>;
  windowH: SharedValue<number>;
  windowRadius: SharedValue<number>;
  windowOpacity: SharedValue<number>;
  allowTouchThrough?: boolean;
}

export function TargetHighlight({
  windowX,
  windowY,
  windowW,
  windowH,
  windowRadius,
  windowOpacity,
  allowTouchThrough = false,
}: TargetHighlightProps) {
  // Soft breathing glow
  const glowScale = useSharedValue(1);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withSpring(1.015, SPRINGS.gentle),
        withSpring(1.0, SPRINGS.gentle),
      ),
      -1,
      true,
    );
  }, []);

  // ---- Animated panel styles ----

  const topPanelStyle = useAnimatedStyle(() => ({
    height: interpolate(windowOpacity.value, [0, 1], [SCREEN_H, Math.max(0, windowY.value)]),
  }));

  const bottomPanelStyle = useAnimatedStyle(() => {
    const top = interpolate(
      windowOpacity.value,
      [0, 1],
      [SCREEN_H, windowY.value + windowH.value],
    );
    return { top, height: Math.max(0, SCREEN_H - top) };
  });

  const leftPanelStyle = useAnimatedStyle(() => {
    const top = interpolate(windowOpacity.value, [0, 1], [0, windowY.value]);
    const height = interpolate(windowOpacity.value, [0, 1], [0, windowH.value]);
    const width = interpolate(windowOpacity.value, [0, 1], [0, Math.max(0, windowX.value)]);
    return { top, height, width };
  });

  const rightPanelStyle = useAnimatedStyle(() => {
    const top = interpolate(windowOpacity.value, [0, 1], [0, windowY.value]);
    const height = interpolate(windowOpacity.value, [0, 1], [0, windowH.value]);
    const left = interpolate(
      windowOpacity.value,
      [0, 1],
      [SCREEN_W, windowX.value + windowW.value],
    );
    return { top, height, left, width: Math.max(0, SCREEN_W - left) };
  });

  // Soft glow ring
  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(windowOpacity.value, [0, 0.5, 1], [0, 0, 0.8]);
    return {
      position: 'absolute' as const,
      top: windowY.value - GLOW_EXTRA,
      left: windowX.value - GLOW_EXTRA,
      width: windowW.value + GLOW_EXTRA * 2,
      height: windowH.value + GLOW_EXTRA * 2,
      borderRadius: windowRadius.value + GLOW_EXTRA,
      opacity,
      transform: [{ scale: glowScale.value }],
      // Soft shadow glow (iOS)
      shadowColor: colors.accent.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      // Barely-there accent fill
      backgroundColor: 'rgba(207, 103, 105, 0.05)',
    };
  });

  // Touch-through window (for interact steps)
  const touchWindowStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: windowY.value,
    left: windowX.value,
    width: windowW.value,
    height: windowH.value,
    borderRadius: windowRadius.value,
  }));

  const BlurPanel = OVERLAY_BG
    ? ({ style }: { style: any }) => <Animated.View style={[style, { backgroundColor: OVERLAY_BG }]} />
    : ({ style }: { style: any }) => (
        <Animated.View style={[style, { overflow: 'hidden' }]}>
          <BlurView intensity={BLUR_INTENSITY} tint="light" style={StyleSheet.absoluteFill} />
        </Animated.View>
      );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={allowTouchThrough ? 'box-none' : 'none'}>
      {/* Top strip */}
      <BlurPanel style={[styles.panel, styles.topPanel, topPanelStyle]} />

      {/* Bottom strip */}
      <BlurPanel style={[styles.panel, styles.bottomPanel, bottomPanelStyle]} />

      {/* Left strip */}
      <BlurPanel style={[styles.panel, leftPanelStyle]} />

      {/* Right strip */}
      <BlurPanel style={[styles.panel, rightPanelStyle]} />

      {/* Soft glow around cutout */}
      <Animated.View style={glowStyle} pointerEvents="none" />

      {/* Touch-through window for interact steps */}
      {allowTouchThrough && (
        <Animated.View style={touchWindowStyle} pointerEvents="box-none" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
  },
  topPanel: {
    top: 0,
    left: 0,
    right: 0,
  },
  bottomPanel: {
    left: 0,
    right: 0,
  },
});
