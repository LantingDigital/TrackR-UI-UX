import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { HintReveal } from '../types/coastle';

// ============================================
// CoastleHintContent — pure hint list for MorphingPill expanded content
// ============================================

interface CoastleHintContentProps {
  hints: HintReveal[];
  close: () => void;
}

export const CoastleHintContent: React.FC<CoastleHintContentProps> = ({
  hints,
  close,
}) => {
  return (
    <View style={styles.content}>
      <Ionicons name="bulb" size={28} color={colors.accent.primary} />
      <Text style={styles.title}>
        {hints.length === 1 ? 'Hint' : 'Hints'}
      </Text>

      <View style={styles.hintList}>
        {hints.map((hint, i) => (
          <View key={hint.afterGuess} style={styles.hintRow}>
            <Text style={styles.hintNumber}>{i + 1}</Text>
            <Text style={styles.hintText}>
              The <Text style={styles.bold}>{hint.label}</Text> is{' '}
              <Text style={styles.bold}>{hint.value}</Text>
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.button}
        onPress={() => { haptics.tap(); close(); }}
      >
        <Text style={styles.buttonText}>Got it</Text>
      </Pressable>
    </View>
  );
};

// ============================================
// CoastleHintTooltip — lightweight standalone overlay
// "Hints unlock at guesses 3 & 6" with auto-dismiss
// ============================================

interface CoastleHintTooltipProps {
  visible: boolean;
  onClose: () => void;
}

export const CoastleHintTooltip: React.FC<CoastleHintTooltipProps> = ({
  visible,
  onClose,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });

      // Auto-dismiss after 2.5s
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Reanimated.View style={[styles.backdrop, styles.backdropLight, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Reanimated.View>

      <Reanimated.View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.tooltipCard}>
          <Ionicons name="bulb-outline" size={24} color={colors.text.meta} />
          <Text style={styles.tooltipText}>
            Hints unlock at guesses 3 & 6
          </Text>
        </View>
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Shared
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
    zIndex: 200,
  },
  backdropLight: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cardContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },

  // CoastleHintContent styles
  content: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  hintList: {
    alignSelf: 'stretch',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  hintNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    color: colors.text.inverse,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  hintText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  bold: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  button: {
    height: 40,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // CoastleHintTooltip styles
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    ...shadows.small,
  },
  tooltipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
