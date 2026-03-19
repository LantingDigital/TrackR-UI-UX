import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Warm fog base — matches HomeScreen & CommunityScreen exactly
const FOG_BASE = 'rgba(240, 238, 235,';

// How far above the screen top to extend (eliminates status bar hard line)
const TOP_OVERSHOOT = 50;

// Default extension below header for gradual fade tail
const DEFAULT_FOG_EXTENSION = 200;

interface FogHeaderProps {
  /**
   * Total header height in pixels (including safe area insets).
   * The fog will be most opaque through this region and gradually
   * fade below it. Content is ALWAYS slightly visible (max 0.97 opacity).
   */
  headerHeight: number;

  /**
   * Optional extension below the header for the fade tail.
   * Larger = longer, more gradual fade. Default: 200px.
   */
  fogExtension?: number;

  /**
   * For animated/collapsing headers: pass a shared value (0-1) representing
   * the collapse progress (0 = fully collapsed, 1 = fully expanded).
   * When provided, the fog height will animate between collapsed and expanded sizes.
   */
  collapseProgress?: SharedValue<number>;

  /**
   * When using collapseProgress, the header height at fully collapsed state.
   * Required when collapseProgress is provided.
   */
  collapsedHeaderHeight?: number;

  /**
   * zIndex for the fog container. Default: 5 (matches existing convention).
   */
  zIndex?: number;
}

/**
 * Reusable fog gradient overlay for screen headers.
 *
 * Matches the HomeScreen fog exactly:
 * - Max opacity 0.97 (never fully opaque — content always slightly visible)
 * - Extends 50px above screen top (no hard line at status bar)
 * - 12-stop gradient with gradual fade curve
 * - Fog height = overshoot + headerHeight + extension
 *
 * Usage (static header):
 *   <FogHeader headerHeight={insets.top + 52} />
 *
 * Usage (collapsing header):
 *   <FogHeader
 *     headerHeight={insets.top + EXPANDED_HEIGHT}
 *     collapseProgress={scrollProgress}
 *     collapsedHeaderHeight={insets.top + COLLAPSED_HEIGHT}
 *   />
 */
export function FogHeader({
  headerHeight,
  fogExtension = DEFAULT_FOG_EXTENSION,
  collapseProgress,
  collapsedHeaderHeight,
  zIndex = 5,
}: FogHeaderProps) {
  // Total fog height: overshoot above + header + fade extension below
  const fogTotalHeight = TOP_OVERSHOOT + headerHeight + fogExtension;

  // Compute gradient locations based on where the header ends within the fog
  const fogGradient = useMemo(() => {
    // The header area occupies [0, headerEnd] of the fog (including overshoot)
    const headerEnd = (TOP_OVERSHOOT + headerHeight) / fogTotalHeight;
    // The fade zone is everything below the header
    const fadeZone = 1 - headerEnd;

    // Dense fog through header for text readability, same smooth fade shape.
    // Solid 0.97 holds through header text, then gentle curve down.
    return {
      colors: [
        `${FOG_BASE} 0.97)`,   // Above screen (overshoot)
        `${FOG_BASE} 0.97)`,   // Through header — dense, text is crisp
        `${FOG_BASE} 0.88)`,   // Just below header — starts easing
        `${FOG_BASE} 0.60)`,   // Fade zone — opening up
        `${FOG_BASE} 0.28)`,   // Mostly clear
        `${FOG_BASE} 0.10)`,   // Very light
        `${FOG_BASE} 0.03)`,   // Barely there
        'transparent',           // Fully clear
      ] as [string, string, ...string[]],
      locations: [
        0,                                       // Top of container
        headerEnd,                               // Header bottom — solid all the way
        headerEnd + fadeZone * 0.08,             // Ease begins right below header
        headerEnd + fadeZone * 0.25,             // 25% into fade zone
        headerEnd + fadeZone * 0.45,             // 45% into fade zone
        headerEnd + fadeZone * 0.65,             // 65% into fade zone
        headerEnd + fadeZone * 0.82,             // 82% into fade zone
        1,                                       // Bottom
      ] as [number, number, ...number[]],
    };
  }, [headerHeight, fogTotalHeight]);

  // Animated mode: scale fog height between collapsed and expanded
  if (collapseProgress && collapsedHeaderHeight != null) {
    const collapsedFogHeight = TOP_OVERSHOOT + collapsedHeaderHeight + fogExtension;
    const expandedFogHeight = fogTotalHeight;
    const scaleCollapsed = collapsedFogHeight / expandedFogHeight;

    return (
      <AnimatedFog
        expandedHeight={expandedFogHeight}
        scaleCollapsed={scaleCollapsed}
        collapseProgress={collapseProgress}
        fogGradient={fogGradient}
        zIndex={zIndex}
      />
    );
  }

  // Static mode
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

// Separate component for animated fog to isolate the useAnimatedStyle hook
function AnimatedFog({
  expandedHeight,
  scaleCollapsed,
  collapseProgress,
  fogGradient,
  zIndex,
}: {
  expandedHeight: number;
  scaleCollapsed: number;
  collapseProgress: SharedValue<number>;
  fogGradient: { colors: [string, string, ...string[]]; locations: [number, number, ...number[]] };
  zIndex: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      collapseProgress.value,
      [0, 1],
      [scaleCollapsed, 1]
    );
    // Pin top edge: compensate for center-origin scaling
    const translateY = -expandedHeight * (1 - scaleY) / 2;

    return {
      transform: [{ translateY }, { scaleY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.fogContainer,
        { height: expandedHeight, zIndex },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={fogGradient.colors}
        locations={fogGradient.locations}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fogContainer: {
    position: 'absolute',
    top: -TOP_OVERSHOOT,
    left: 0,
    right: 0,
  },
});
