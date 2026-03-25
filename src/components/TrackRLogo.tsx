/**
 * TrackRLogo — Branded text treatment for "TrackR" in headings/logos.
 *
 * "Track" renders in the base color (default: black), "R" renders in accent red.
 * Body text should use plain "TrackR" strings — this component is for headings only.
 */

import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';

interface TrackRLogoProps {
  /** Style for the outer Text — font size, weight, etc. */
  style?: StyleProp<TextStyle>;
  /** Color for "Track" portion. Defaults to text.primary (black). */
  baseColor?: string;
  /** Suffix text after "TrackR" (e.g., " Pro"). Renders in baseColor. */
  suffix?: string;
}

export function TrackRLogo({
  style,
  baseColor = colors.text.primary,
  suffix,
}: TrackRLogoProps) {
  return (
    <Text style={[{ color: baseColor }, style]}>
      Track<Text style={{ color: colors.accent.primary }}>R</Text>
      {suffix ?? ''}
    </Text>
  );
}
