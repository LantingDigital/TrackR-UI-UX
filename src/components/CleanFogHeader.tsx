import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Page background — matches colors.background.page (#F7F7F7)
const PAGE_BASE = 'rgba(247, 247, 247,';

// How far above the screen top to extend (eliminates status bar hard line)
const TOP_OVERSHOOT = 50;

// Default fade extension — short and clean, like iOS Messages/Settings
const DEFAULT_FADE_EXTENSION = 40;

interface CleanFogHeaderProps {
  /**
   * Total header height in pixels (including safe area insets).
   * Fully solid through this region.
   */
  headerHeight: number;

  /**
   * How far below the header the gradient fades. Default: 40px.
   * Shorter = crisper edge. Longer = softer dissolve.
   */
  fadeExtension?: number;

  /**
   * zIndex for the container. Default: 5.
   */
  zIndex?: number;
}

/**
 * Clean white fog header — mimics iOS Messages/Settings/Notes nav bar style.
 *
 * Solid page-color background through the header zone, then a short
 * smooth gradient to transparent. No blur, no frosted glass, no warm tint.
 * Just a clean white-to-transparent fade.
 *
 * Use on secondary screens (Settings, Profile, Merch, etc.).
 * Main tab screens (Home, Parks, Community, Logbook) keep their custom fog.
 */
export function CleanFogHeader({
  headerHeight,
  fadeExtension = DEFAULT_FADE_EXTENSION,
  zIndex = 5,
}: CleanFogHeaderProps) {
  const totalHeight = TOP_OVERSHOOT + headerHeight + fadeExtension;

  const gradient = useMemo(() => {
    const solidEnd = (TOP_OVERSHOOT + headerHeight) / totalHeight;
    const fadeZone = 1 - solidEnd;

    return {
      colors: [
        `${PAGE_BASE} 1)`,          // Overshoot — fully solid
        `${PAGE_BASE} 1)`,          // Header bottom — fully solid
        `${PAGE_BASE} 0.92)`,       // Fade begins
        `${PAGE_BASE} 0.75)`,
        `${PAGE_BASE} 0.50)`,
        `${PAGE_BASE} 0.28)`,
        `${PAGE_BASE} 0.12)`,
        `${PAGE_BASE} 0.03)`,
        `${PAGE_BASE} 0)`,
      ] as [string, string, ...string[]],
      locations: [
        0,
        solidEnd,
        solidEnd + fadeZone * 0.10,
        solidEnd + fadeZone * 0.28,
        solidEnd + fadeZone * 0.48,
        solidEnd + fadeZone * 0.65,
        solidEnd + fadeZone * 0.80,
        solidEnd + fadeZone * 0.92,
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
