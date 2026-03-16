import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Animated bottom offset — drives zoom button positioning above tab bar or info card */
  bottomOffset: SharedValue<number>;
}

export function MapControls({ onZoomIn, onZoomOut, bottomOffset }: MapControlsProps) {
  const zoomAnimatedStyle = useAnimatedStyle(() => ({
    bottom: bottomOffset.value,
    right: spacing.lg,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Zoom controls — bottom right, animated to sit above tab bar or info card */}
      <Animated.View style={[styles.zoomStack, zoomAnimatedStyle]}>
        <Pressable onPress={onZoomIn} style={styles.button}>
          <Ionicons name="add" size={20} color={colors.text.primary} />
        </Pressable>
        <Pressable onPress={onZoomOut} style={[styles.button, { marginTop: spacing.md }]}>
          <Ionicons name="remove" size={20} color={colors.text.primary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  zoomStack: {
    position: 'absolute',
    alignItems: 'center',
  },
});
