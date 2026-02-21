import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SPRINGS, TIMING } from '../constants/animations';

interface ActionPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  parkMode?: boolean;
  circleMode?: boolean;
}

const PILL_HEIGHT = 36;
const CIRCLE_SIZE = 34;

export const ActionPill: React.FC<ActionPillProps> = ({
  icon,
  label,
  onPress,
  parkMode = false,
  circleMode = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const modeProgress = useSharedValue(circleMode ? 1 : 0);

  // Animate mode transition
  React.useEffect(() => {
    modeProgress.value = withTiming(circleMode ? 1 : 0, { duration: 300 });
  }, [circleMode]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, SPRINGS.responsive);
    opacity.value = withTiming(0.7, { duration: TIMING.instant });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRINGS.responsive);
    opacity.value = withTiming(1, { duration: TIMING.instant });
  };

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    height: interpolate(modeProgress.value, [0, 1], [PILL_HEIGHT, CIRCLE_SIZE]),
    width: modeProgress.value > 0.5 ? interpolate(modeProgress.value, [0, 1], [PILL_HEIGHT, CIRCLE_SIZE]) : undefined as any,
    borderRadius: interpolate(
      modeProgress.value,
      [0, 1],
      [PILL_HEIGHT / 2, CIRCLE_SIZE / 2],
      Extrapolation.CLAMP
    ),
    paddingHorizontal: modeProgress.value > 0.5 ? 0 : 16,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={outerStyle}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.container,
            parkMode && styles.parkModeContainer,
            innerStyle,
          ]}
        >
          <Ionicons
            name={icon}
            size={16}
            color="#000000"
            style={circleMode ? undefined : styles.icon}
          />
          {!circleMode && (
            <Animated.View style={labelStyle}>
              <Text style={styles.label}>{label}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  parkModeContainer: {
    borderWidth: 2,
    borderColor: '#CF6769',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});
