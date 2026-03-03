import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withDelay,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { SPRINGS, PRESS_SCALES } from '../../../constants/animations';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import type { BattlePreference } from '../types/battle';

interface BattleScaleSelectorProps {
  onSelect: (preference: BattlePreference) => void;
  coasterAName: string;
  coasterBName: string;
}

type ScaleOption = {
  preference: BattlePreference;
  size: number;
  label: string;
};

const SCALE_OPTIONS: ScaleOption[] = [
  { preference: 'strong_a', size: 44, label: 'Strongly\nprefer A' },
  { preference: 'slight_a', size: 34, label: 'Slightly\nprefer A' },
  { preference: 'tie', size: 28, label: "It's\na tie" },
  { preference: 'slight_b', size: 34, label: 'Slightly\nprefer B' },
  { preference: 'strong_b', size: 44, label: 'Strongly\nprefer B' },
];

const ScaleButton: React.FC<{
  option: ScaleOption;
  selected: boolean;
  onPress: () => void;
}> = React.memo(({ option, selected, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: PRESS_SCALES.strong,
  });

  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (selected) {
      pulseScale.value = withSpring(1.15, SPRINGS.responsive);
      pulseScale.value = withDelay(150, withSpring(1, SPRINGS.responsive));
    }
  }, [selected]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.optionContainer}>
      <Pressable
        {...pressHandlers}
        onPress={onPress}
        hitSlop={8}
      >
        <Animated.View style={animatedStyle}>
          <Animated.View
            style={[
              styles.circle,
              {
                width: option.size,
                height: option.size,
                borderRadius: option.size / 2,
                borderColor: selected ? colors.accent.primary : colors.border.subtle,
                backgroundColor: selected ? colors.accent.primary : 'transparent',
              },
              pulseStyle,
            ]}
          >
            {selected && (
              <View style={[styles.innerDot, { width: option.size * 0.35, height: option.size * 0.35, borderRadius: option.size * 0.175 }]} />
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {option.label}
      </Text>
    </View>
  );
});

export const BattleScaleSelector: React.FC<BattleScaleSelectorProps> = ({
  onSelect,
  coasterAName,
  coasterBName,
}) => {
  const [selected, setSelected] = useState<BattlePreference | null>(null);
  const skipPress = useSpringPress({ scale: PRESS_SCALES.normal });

  const handleSelect = (preference: BattlePreference) => {
    haptics.select();
    setSelected(preference);

    // Brief delay to show selection before advancing
    setTimeout(() => {
      onSelect(preference);
      setSelected(null);
    }, 400);
  };

  const handleSkip = () => {
    haptics.tap();
    onSelect('skip');
    setSelected(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Which do you prefer?</Text>

      <View style={styles.scaleRow}>
        {SCALE_OPTIONS.map((option) => (
          <ScaleButton
            key={option.preference}
            option={option}
            selected={selected === option.preference}
            onPress={() => handleSelect(option.preference)}
          />
        ))}
      </View>

      <Pressable
        {...skipPress.pressHandlers}
        onPress={handleSkip}
        style={styles.skipButton}
      >
        <Animated.View style={skipPress.animatedStyle}>
          <Text style={styles.skipText}>Haven't ridden one</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  prompt: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xxl,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  optionContainer: {
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 52,
  },
  circle: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    backgroundColor: colors.background.card,
  },
  optionLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    textAlign: 'center',
    lineHeight: typography.sizes.small * typography.lineHeights.tight,
  },
  optionLabelSelected: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },
  skipButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  skipText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
