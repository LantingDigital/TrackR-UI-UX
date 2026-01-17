import React from 'react';
import { StyleSheet, Text, Pressable, Dimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;

// Pill dimensions (expanded state)
const PILL_HEIGHT = 36;
const CONTAINER_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const PILL_WIDTH = (CONTAINER_WIDTH - (GAP * 2)) / 3;

// Circle dimensions (collapsed state)
const CIRCLE_SIZE = 42;

// Curve intensity for each button (higher = more horizontal travel)
const CURVE_INTENSITIES = [3, 1.5, 1]; // Log, Search, Scan

interface MorphingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  buttonIndex: number; // 0, 1, or 2 (left to right)
  animProgress: SharedValue<number>; // REANIMATED: 0 = collapsed (circle), 1 = expanded (pill)
  onPress?: () => void;
  // Positions are calculated based on layout
  collapsedX: number; // X position when collapsed (circle)
  expandedX: number;  // X position when expanded (pill)
  collapsedY: number; // Y position when collapsed
  expandedY: number;  // Y position when expanded
}

export const MorphingActionButton: React.FC<MorphingActionButtonProps> = ({
  icon,
  label,
  buttonIndex,
  animProgress,
  onPress,
  collapsedX,
  expandedX,
  collapsedY,
  expandedY,
}) => {
  // Press feedback animations (local to this component)
  const scaleAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(1);

  const curveIntensity = CURVE_INTENSITIES[buttonIndex] || 1;

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.92, { damping: 15, stiffness: 200 });
    opacityAnim.value = withTiming(0.7, { duration: 100 });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacityAnim.value = withTiming(1, { duration: 100 });
  };

  // Main container animated style - all morph animations
  // Directly follows animProgress (stagger is handled by parent passing different shared values)
  const containerStyle = useAnimatedStyle(() => {
    const progress = animProgress.value;

    // Width morphs from circle to pill
    const width = interpolate(progress, [0, 1], [CIRCLE_SIZE, PILL_WIDTH]);

    // Height morphs from circle to pill
    const height = interpolate(progress, [0, 1], [CIRCLE_SIZE, PILL_HEIGHT]);

    // Border radius morphs from full circle to pill
    const borderRadius = interpolate(progress, [0, 1], [CIRCLE_SIZE / 2, PILL_HEIGHT / 2]);

    // X position with ease-out curve (swoop right during collapse)
    const translateX = interpolate(
      progress,
      [0, 0.3, 0.6, 1],
      [
        collapsedX,
        collapsedX + (expandedX - collapsedX) * 0.1 * curveIntensity,
        expandedX - (expandedX - collapsedX) * 0.1,
        expandedX,
      ]
    );

    // Y position with sqrt-like curve (fast start)
    const translateY = interpolate(
      progress,
      [0, 0.4, 0.7, 1],
      [
        collapsedY,
        collapsedY + (expandedY - collapsedY) * 0.7,
        expandedY - (expandedY - collapsedY) * 0.1,
        expandedY,
      ]
    );

    // Scale overshoot at destination (landing pop)
    const landingScale = interpolate(
      progress,
      [0, 0.1, 0.9, 1],
      [1.04, 1, 1, 1.02],
      Extrapolation.CLAMP
    );

    // Combined scale (press feedback * landing pop)
    const combinedScale = scaleAnim.value * landingScale;

    return {
      width,
      height,
      borderRadius,
      opacity: opacityAnim.value,
      transform: [
        { translateX },
        { translateY },
        { scale: combinedScale },
      ],
    };
  });

  // Label container animated style
  const labelContainerStyle = useAnimatedStyle(() => {
    const progress = animProgress.value;

    // Label fades in during last 40% of expand
    const opacity = interpolate(
      progress,
      [0, 0.6, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    // Width collapses to 0 when circle
    const maxWidth = interpolate(progress, [0, 1], [0, 100]);

    // Margin appears when expanded
    const marginLeft = interpolate(progress, [0, 1], [0, 6]);

    return {
      opacity,
      maxWidth,
      marginLeft,
      overflow: 'hidden',
    };
  });

  return (
    <Reanimated.View style={[styles.container, containerStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Ionicons
          name={icon}
          size={16}
          color="#000000"
        />
        <Reanimated.View style={labelContainerStyle}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </Reanimated.View>
      </Pressable>
    </Reanimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
  pressable: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});
