/**
 * DidYouKnowCard - Fun coaster fact cards with a lightbulb accent.
 * Rotates through facts, showing one at a time.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../../hooks/useSpringPress';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { radius } from '../../theme/radius';
import { haptics } from '../../services/haptics';
import { SPRINGS } from '../../constants/animations';
import { CoasterFactData, MOCK_COASTER_FACTS } from '../../data/mockFeed';

// ── Main Component ──

interface DidYouKnowCardProps {
  onPress?: (fact: CoasterFactData) => void;
}

export const DidYouKnowCard = React.memo<DidYouKnowCardProps>(({ onPress }) => {
  const [factIndex] = useState(() => Math.floor(Math.random() * MOCK_COASTER_FACTS.length));
  const fact = MOCK_COASTER_FACTS[factIndex];

  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97 });
  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withSpring(1, SPRINGS.bouncy);
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [
      { scale: 0.9 + entryProgress.value * 0.1 },
      { translateY: (1 - entryProgress.value) * 20 },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[entryStyle, animatedStyle]}>
        <Pressable
          onPress={() => { haptics.tap(); onPress?.(fact); }}
          onPressIn={pressHandlers.onPressIn}
          onPressOut={pressHandlers.onPressOut}
          style={styles.card}
        >
          <View style={styles.topRow}>
            <View style={styles.labelRow}>
              <View style={styles.bulbIcon}>
                <Ionicons name="bulb" size={16} color="#F9A825" />
              </View>
              <Text style={styles.label}>Did You Know?</Text>
            </View>
            <View style={styles.iconBadge}>
              <Ionicons name={fact.icon as any} size={16} color={colors.accent.primary} />
            </View>
          </View>
          <Text style={styles.factText}>{fact.fact}</Text>
          <View style={styles.bottomRow}>
            <Text style={styles.source}>Source: {fact.source}</Text>
            {fact.relatedRide && (
              <View style={styles.relatedTag}>
                <Ionicons name="train-outline" size={11} color={colors.accent.primary} />
                <Text style={styles.relatedText}>{fact.relatedRide}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulbIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(249,168,37,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  source: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.meta,
  },
  relatedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  relatedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});
