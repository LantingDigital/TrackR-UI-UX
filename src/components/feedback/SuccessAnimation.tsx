import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { haptics } from '../../services/haptics';

interface SuccessAnimationProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
  onComplete?: () => void;
}

const SIZES = {
  small: { circle: 48, icon: 28 },
  large: { circle: 72, icon: 40 },
};

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  message,
  size = 'large',
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      haptics.success();
      opacity.value = withTiming(1, { duration: 100 });
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });

      // Hold for 600ms, then fade out 200ms
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, 800); // 200ms spring settle + 600ms hold

      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  const dimensions = SIZES[size];
  const isLarge = size === 'large';

  return (
    <Animated.View
      style={[
        styles.overlay,
        isLarge && styles.overlayHeavy,
        containerStyle,
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.circle,
          {
            width: dimensions.circle,
            height: dimensions.circle,
            borderRadius: dimensions.circle / 2,
          },
          circleStyle,
        ]}
      >
        <Ionicons
          name="checkmark"
          size={dimensions.icon}
          color={colors.text.inverse}
        />
      </Animated.View>
      {message && (
        <Text style={[styles.message, isLarge && styles.messageLarge]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayHeavy: {
    backgroundColor: colors.background.overlayHeavy,
  },
  circle: {
    backgroundColor: colors.status.successSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  messageLarge: {
    fontSize: typography.sizes.large,
  },
});
