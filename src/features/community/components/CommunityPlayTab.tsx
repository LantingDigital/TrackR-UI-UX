import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { useCardPress, useSubtlePress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { MOCK_COASTLE_STATS } from '../data/mockCommunityData';

interface CommunityPlayTabProps {
  topInset?: number;
  onPlayCoastle: () => void;
}

export const CommunityPlayTab = ({ topInset = 0, onPlayCoastle }: CommunityPlayTabProps) => {
  const insets = useSafeAreaInsets();
  const heroPress = useCardPress();
  const futurePress1 = useSubtlePress();
  const futurePress2 = useSubtlePress();

  const handleCoastlePress = () => {
    haptics.select();
    onPlayCoastle();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Coastle Hero Card */}
      <Pressable onPress={handleCoastlePress} {...heroPress.pressHandlers}>
        <Animated.View style={[styles.heroCard, heroPress.animatedStyle]}>
          <View style={styles.heroTopRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="game-controller-outline" size={24} color={colors.accent.primary} />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Coastle</Text>
              <Text style={styles.heroSubtitle}>Daily Puzzle #{MOCK_COASTLE_STATS.dailyNumber}</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statGroup}>
              <Text style={styles.statValue}>🔥 {MOCK_COASTLE_STATS.streak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statGroup}>
              <Text style={styles.statValue}>{MOCK_COASTLE_STATS.gamesPlayed}</Text>
              <Text style={styles.statLabel}>games played</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statGroup}>
              <Text style={styles.statValue}>{MOCK_COASTLE_STATS.winRate}%</Text>
              <Text style={styles.statLabel}>win rate</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {/* More Games Section */}
      <Text style={styles.sectionTitle}>More Games</Text>

      <View style={styles.futureGamesRow}>
        <Pressable onPress={() => haptics.tap()} {...futurePress1.pressHandlers} style={styles.futureCardPressable}>
          <Animated.View style={[styles.futureCard, futurePress1.animatedStyle]}>
            <Ionicons name="lock-closed" size={24} color={colors.text.meta} />
            <Text style={styles.futureCardLabel}>Coming Soon</Text>
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => haptics.tap()} {...futurePress2.pressHandlers} style={styles.futureCardPressable}>
          <Animated.View style={[styles.futureCard, futurePress2.animatedStyle]}>
            <Ionicons name="lock-closed" size={24} color={colors.text.meta} />
            <Text style={styles.futureCardLabel}>Coming Soon</Text>
          </Animated.View>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  statGroup: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border.subtle,
  },
  sectionTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xxl,
    marginBottom: spacing.base,
  },
  futureGamesRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  futureCardPressable: {
    flex: 1,
  },
  futureCard: {
    height: 120,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  futureCardLabel: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    marginTop: spacing.md,
  },
});
