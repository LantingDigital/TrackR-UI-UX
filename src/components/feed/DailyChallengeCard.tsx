/**
 * DailyChallengeCard - Teaser card linking to Coastle / daily game.
 * Compact card with game icon, timer, and participant count.
 */

import React, { useEffect } from 'react';
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
import { DailyChallengeData, MOCK_DAILY_CHALLENGE } from '../../data/mockFeed';

// ── Main Component ──

interface DailyChallengeCardProps {
  data?: DailyChallengeData;
  onPress?: () => void;
}

export const DailyChallengeCard = React.memo<DailyChallengeCardProps>(({
  data = MOCK_DAILY_CHALLENGE,
  onPress,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.97, opacity: 0.9 });
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
          onPress={() => { haptics.select(); onPress?.(); }}
          onPressIn={pressHandlers.onPressIn}
          onPressOut={pressHandlers.onPressOut}
          style={styles.card}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={data.icon as any} size={28} color={colors.accent.primary} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.description}>{data.description}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={colors.text.meta} />
                <Text style={styles.metaText}>{data.timeRemaining}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color={colors.text.meta} />
                <Text style={styles.metaText}>{data.participantCount.toLocaleString()} playing</Text>
              </View>
            </View>
          </View>
          <View style={styles.playBadge}>
            <Ionicons name="play" size={16} color={colors.text.inverse} />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.base,
    ...shadows.card,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.meta,
  },
  playBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
