import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Short fade tail — smoothness comes from micro-stops, not distance.
 * Sheets have less vertical space so this is even shorter than FogHeader.
 */
const DEFAULT_FOG_EXTENSION = 40;

interface SheetFogProps {
  /**
   * Total height of the fixed header area above the scrollable content.
   * The fog starts at this point and fades downward.
   */
  headerHeight: number;

  /**
   * Optional extension below the header for the fade tail.
   * Keep SHORT — smoothness comes from micro-stops. Default: 40px.
   */
  fogExtension?: number;

  /**
   * Base color for the fog gradient. Should match the sheet's background.
   * Default: 'rgba(255, 255, 255,' (white, for card-background sheets).
   * Use 'rgba(247, 247, 247,' for page-background sheets.
   */
  fogBase?: string;

  /**
   * zIndex for the fog container. Default: 5.
   */
  zIndex?: number;
}

/**
 * Fog gradient overlay for bottom sheets with scrollable content.
 *
 * Sits between the sheet's fixed header area and the scrollable body.
 * Content scrolling up fades gradually into the header area — no hard line.
 *
 * Unlike FogHeader (for full screens), SheetFog:
 * - Has no TOP_OVERSHOOT (no status bar to cover)
 * - Matches the sheet's background color (white or page gray)
 * - Uses a shorter default extension (sheets have less vertical space)
 *
 * Usage:
 *   <SheetFog headerHeight={HANDLE_AREA + HEADER_HEIGHT} />
 *   <ScrollView ...>
 */
export function SheetFog({
  headerHeight,
  fogExtension = DEFAULT_FOG_EXTENSION,
  fogBase = 'rgba(255, 255, 255,',
  zIndex = 5,
}: SheetFogProps) {
  const fogTotalHeight = headerHeight + fogExtension;

  const fogGradient = useMemo(() => {
    const headerEnd = headerHeight / fogTotalHeight;
    const fadeZone = 1 - headerEnd;

    // Dense through header, micro-stepped fade below — short but smooth.
    return {
      colors: [
        `${fogBase} 0.97)`,    // Top — dense through header
        `${fogBase} 0.97)`,    // End of header — still dense
        `${fogBase} 0.93)`,    // -4  Ramp begins
        `${fogBase} 0.86)`,    // -7
        `${fogBase} 0.74)`,    // -12
        `${fogBase} 0.58)`,    // -16 (mid-fade)
        `${fogBase} 0.40)`,    // -18
        `${fogBase} 0.24)`,    // -16
        `${fogBase} 0.12)`,    // -12
        `${fogBase} 0.04)`,    // -8
        `${fogBase} 0.01)`,    // -3 (imperceptible)
        `${fogBase} 0)`,          // Gone
      ] as [string, string, ...string[]],
      locations: [
        0,
        headerEnd,
        headerEnd + fadeZone * 0.08,
        headerEnd + fadeZone * 0.18,
        headerEnd + fadeZone * 0.32,
        headerEnd + fadeZone * 0.48,
        headerEnd + fadeZone * 0.62,
        headerEnd + fadeZone * 0.74,
        headerEnd + fadeZone * 0.84,
        headerEnd + fadeZone * 0.92,
        headerEnd + fadeZone * 0.97,
        1,
      ] as [number, number, ...number[]],
    };
  }, [headerHeight, fogTotalHeight, fogBase]);

  return (
    <View
      style={[styles.fogContainer, { height: fogTotalHeight, zIndex }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={fogGradient.colors}
        locations={fogGradient.locations}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
