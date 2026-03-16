/**
 * RankingSection — Single criterion ranking card
 *
 * Shows a header with icon + title, then 10 ranked entries
 * with criterion-colored score bars and community averages.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../../services/haptics';
import type { RankingCategory, CommunityRankingEntry } from '../types/community';

interface RankingSectionProps {
  category: RankingCategory;
  onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void;
}

const RankingEntry = React.memo(function RankingEntry({ entry, rank, color, onCoasterTap }: { entry: CommunityRankingEntry; rank: number; color: string; onCoasterTap?: (coasterId: string, coasterName: string, parkName: string) => void }) {
  // Normalize score to 0-1 for bar width (scores are 1-10)
  const barWidth = ((entry.averageScore - 5) / 5) * 100; // 5-10 → 0-100%
  const clampedWidth = Math.max(10, Math.min(100, barWidth));

  const handlePress = useCallback(() => {
    if (onCoasterTap) {
      haptics.tap();
      onCoasterTap(entry.coasterId, entry.coasterName, entry.parkName);
    }
  }, [entry.coasterId, entry.coasterName, entry.parkName, onCoasterTap]);

  return (
    <Pressable style={styles.entryRow} onPress={handlePress}>
      <Text style={[styles.rank, { color }]}>{rank}</Text>
      <View style={styles.entryInfo}>
        <Text style={[styles.coasterName, onCoasterTap && styles.tappableCoaster]} numberOfLines={1}>{entry.coasterName}</Text>
        <Text style={styles.parkName} numberOfLines={1}>{entry.parkName}</Text>
      </View>
      <View style={styles.scoreCol}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${clampedWidth}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.scoreMeta}>
          {entry.averageScore.toFixed(1)} avg · {entry.totalRatings}
        </Text>
      </View>
    </Pressable>
  );
});

export const RankingSection = React.memo(function RankingSection({ category, onCoasterTap }: RankingSectionProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon as any} size={18} color={category.color} />
        </View>
        <Text style={styles.title}>{category.title}</Text>
      </View>

      {/* Entries */}
      <View style={styles.entries}>
        {category.entries.map((entry, i) => (
          <RankingEntry
            key={entry.coasterId}
            entry={entry}
            rank={i + 1}
            color={category.color}
            onCoasterTap={onCoasterTap}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },

  // Entries
  entries: {
    gap: spacing.base,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 22,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  entryInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.base,
  },
  coasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  tappableCoaster: {
    color: colors.accent.primary,
  },
  parkName: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 1,
  },

  // Score column
  scoreCol: {
    width: 80,
    alignItems: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreMeta: {
    fontSize: 10,
    color: colors.text.meta,
    marginTop: 2,
  },
});
