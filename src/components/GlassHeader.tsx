import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Pure white base — avoids gray banding that occurs when #F7F7F7
// at partial opacity sits on top of #FFFFFF cards
const FOG_BASE = 'rgba(255, 255, 255,';

// How far above the screen top to extend
const TOP_OVERSHOOT = 50;

interface GlassHeaderProps {
  /**
   * Total header height in pixels (including safe area insets).
   * Fully opaque through this region.
   */
  headerHeight: number;

  /**
   * How far below the header the fade extends. Default: 60px (design-taste.md approved).
   */
  fadeDistance?: number;

  /**
   * zIndex for the container. Default: 5.
   */
  zIndex?: number;
}

/**
 * Clean page-color gradient header.
 *
 * Fully opaque #F7F7F7 through the header zone, then a smooth
 * gradient fade to transparent. Content scrolls behind it and
 * gradually disappears — no blur, no hard line.
 */
export function GlassHeader({
  headerHeight,
  fadeDistance = 60,
  zIndex = 5,
}: GlassHeaderProps) {
  const totalHeight = TOP_OVERSHOOT + headerHeight + fadeDistance;

  const gradient = useMemo(() => {
    const solidEnd = (TOP_OVERSHOOT + headerHeight) / totalHeight;
    const fadeZone = 1 - solidEnd;

    // 10-stop S-curve matching design-taste.md approved values:
    // 0.88 header -> smooth fade -> transparent. No hard line.
    return {
      colors: [
        `${FOG_BASE} 0.88)`,   // Overshoot + header zone
        `${FOG_BASE} 0.88)`,   // Header bottom
        `${FOG_BASE} 0.82)`,   // S-curve begins
        `${FOG_BASE} 0.70)`,
        `${FOG_BASE} 0.52)`,
        `${FOG_BASE} 0.32)`,
        `${FOG_BASE} 0.15)`,
        `${FOG_BASE} 0.05)`,
        `${FOG_BASE} 0.01)`,
        `${FOG_BASE} 0)`,      // Fully transparent
      ] as [string, string, ...string[]],
      locations: [
        0,
        solidEnd,
        solidEnd + fadeZone * 0.08,
        solidEnd + fadeZone * 0.20,
        solidEnd + fadeZone * 0.38,
        solidEnd + fadeZone * 0.55,
        solidEnd + fadeZone * 0.72,
        solidEnd + fadeZone * 0.85,
        solidEnd + fadeZone * 0.95,
        1,
      ] as [number, number, ...number[]],
    };
  }, [headerHeight, totalHeight]);

  return (
    <View
      style={[styles.container, { height: totalHeight, zIndex }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -TOP_OVERSHOOT,
    left: 0,
    right: 0,
  },
});
