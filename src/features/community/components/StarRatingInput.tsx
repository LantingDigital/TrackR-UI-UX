/**
 * StarRatingInput — 5 tappable stars with spring scale feedback
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { haptics } from '../../../services/haptics';

interface StarRatingInputProps {
  rating: number;
  onRate: (rating: number) => void;
}

function Star({ filled, onPress }: { filled: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSpring(1.3, { damping: 8, stiffness: 300 });
        setTimeout(() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }, 100);
        onPress();
      }}
      hitSlop={6}
    >
      <Animated.View style={animStyle}>
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={32}
          color={filled ? colors.accent.primary : colors.border.subtle}
        />
      </Animated.View>
    </Pressable>
  );
}

export function StarRatingInput({ rating, onRate }: StarRatingInputProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          filled={i <= rating}
          onPress={() => {
            haptics.tap();
            onRate(i);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
