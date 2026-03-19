import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Default extension below the header for the gradual fade tail.
 * Shorter than screen fog since bottom sheets have less vertical space.
 */
const DEFAULT_FOG_EXTENSION = 120;

interface SheetFogProps {
  /**
   * Total height of the fixed header area above the scrollable content.
   * The fog starts at this point and fades downward.
   */
  headerHeight: number;

  /**
   * Optional extension below the header for the fade tail.
   * Larger = longer, more gradual fade. Default: 120px.
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
    // The header area occupies [0, headerEnd] of the fog
    const headerEnd = headerHeight / fogTotalHeight;
    // The fade zone is everything below the header
    const fadeZone = 1 - headerEnd;

    // Dense fog through header (matches FogHeader 0.97), smooth fade below.
    return {
      colors: [
        `${fogBase} 0.97)`,   // Top — dense through header
        `${fogBase} 0.97)`,   // End of header — still dense
        `${fogBase} 0.88)`,   // Ease begins right below header
        `${fogBase} 0.60)`,   // Opening up
        `${fogBase} 0.25)`,   // Mostly clear
        `${fogBase} 0.08)`,   // Very light
        'transparent',          // Fully clear
      ] as [string, string, ...string[]],
      locations: [
        0,
        headerEnd,
        headerEnd + fadeZone * 0.08,
        headerEnd + fadeZone * 0.25,
        headerEnd + fadeZone * 0.50,
        headerEnd + fadeZone * 0.75,
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
