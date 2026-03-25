import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Warm fog base — matches HomeScreen & CommunityScreen exactly
const FOG_BASE = 'rgba(240, 238, 235,';

// How far above the screen top to extend (eliminates status bar hard line)
const TOP_OVERSHOOT = 50;

// Short fade tail — fog should NOT cover visible content before scrolling.
// The smoothness comes from many micro-stops, not from distance.
const DEFAULT_FOG_EXTENSION = 60;

interface FogHeaderProps {
  /**
   * Total header height in pixels (including safe area insets).
   * The fog will be most opaque through this region and gradually
   * fade below it. Content is ALWAYS slightly visible (max 0.97 opacity).
   */
  headerHeight: number;

  /**
   * Optional extension below the header for the fade tail.
   * Larger = longer fade. Default: 60px. Keep this SHORT — smoothness
   * comes from micro-stops in the gradient, not from distance.
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
 * Dense 0.97 fog through the header for text readability, then a short
 * micro-stepped fade that dissolves imperceptibly. The fade is only ~60px
 * so it never covers content before the user scrolls.
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

  // Compute gradient — dense through header, micro-stepped fade below
  const fogGradient = useMemo(() => {
    const headerEnd = (TOP_OVERSHOOT + headerHeight) / fogTotalHeight;
    const fadeZone = 1 - headerEnd;

    // 16-stop gradient: solid through header, then micro-steps (2-5 points each)
    // with an imperceptible tail. Short but smooth.
    return {
      colors: [
        `${FOG_BASE} 0.97)`,    // Overshoot — solid
        `${FOG_BASE} 0.97)`,    // Header bottom — solid the whole way
        `${FOG_BASE} 0.94)`,    // -3  Ramp begins gently
        `${FOG_BASE} 0.90)`,    // -4
        `${FOG_BASE} 0.84)`,    // -6
        `${FOG_BASE} 0.76)`,    // -8
        `${FOG_BASE} 0.65)`,    // -11 (mid-fade, steepest part)
        `${FOG_BASE} 0.52)`,    // -13
        `${FOG_BASE} 0.38)`,    // -14
        `${FOG_BASE} 0.25)`,    // -13
        `${FOG_BASE} 0.15)`,    // -10 (decelerating)
        `${FOG_BASE} 0.08)`,    // -7
        `${FOG_BASE} 0.03)`,    // -5
        `${FOG_BASE} 0.008)`,   // -2.2 (imperceptible)
        `${FOG_BASE} 0)`,          // Gone
      ] as [string, string, ...string[]],
      locations: [
        0,                                      // Top
        headerEnd,                              // Header bottom — solid ends
        headerEnd + fadeZone * 0.06,            // Ramp starts
        headerEnd + fadeZone * 0.14,
        headerEnd + fadeZone * 0.24,
        headerEnd + fadeZone * 0.34,
        headerEnd + fadeZone * 0.46,            // Mid-fade
        headerEnd + fadeZone * 0.56,
        headerEnd + fadeZone * 0.66,
        headerEnd + fadeZone * 0.75,
        headerEnd + fadeZone * 0.83,            // Decelerating
        headerEnd + fadeZone * 0.89,
        headerEnd + fadeZone * 0.94,
        headerEnd + fadeZone * 0.98,            // Imperceptible dissolve
        1,                                      // Bottom
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
