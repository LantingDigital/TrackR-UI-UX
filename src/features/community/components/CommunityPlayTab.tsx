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
import { useCardPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { MOCK_COASTLE_STATS } from '../data/mockCommunityData';

interface CommunityPlayTabProps {
  topInset?: number;
  onPlayCoastle: () => void;
  onPlaySpeedSorter?: () => void;
  onPlayBlindRanking?: () => void;
  onPlayTrivia?: () => void;
}

// ─── Game Card ──────────────────────────────────────────────

function GameCard({ icon, title, subtitle, color, onPress }: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  const press = useCardPress();
  return (
    <Pressable onPress={onPress} {...press.pressHandlers} style={styles.gameCardPressable}>
      <Animated.View style={[styles.gameCard, press.animatedStyle]}>
        <View style={[styles.gameIconCircle, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.gameTextCol}>
          <Text style={styles.gameTitle}>{title}</Text>
          <Text style={styles.gameSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.gameChevron}>
          <Ionicons name="chevron-forward" size={16} color={colors.text.meta} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Component ─────────────────────────────────────────

export const CommunityPlayTab = ({
  topInset = 0,
  onPlayCoastle,
  onPlaySpeedSorter,
  onPlayBlindRanking,
  onPlayTrivia,
}: CommunityPlayTabProps) => {
  const insets = useSafeAreaInsets();
  const heroPress = useCardPress();

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
      <Pressable onPress={() => { haptics.select(); onPlayCoastle(); }} {...heroPress.pressHandlers}>
        <Animated.View style={[styles.heroCard, heroPress.animatedStyle]}>
          <View style={styles.heroTopRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="game-controller-outline" size={24} color={colors.accent.primary} />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Coastle</Text>
              <Text style={styles.heroSubtext}>Daily Puzzle #{MOCK_COASTLE_STATS.dailyNumber}</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statGroup}>
              <Text style={styles.statValue}>{'\u{1F525}'} {MOCK_COASTLE_STATS.streak}</Text>
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

      <View style={styles.gamesCol}>
        <GameCard
          icon="swap-vertical-outline"
          title="Speed Sorter"
          subtitle="Sort coasters by stats"
          color={colors.accent.primary}
          onPress={() => { haptics.select(); onPlaySpeedSorter?.(); }}
        />
        <GameCard
          icon="eye-off-outline"
          title="Blind Ranking"
          subtitle="Place items without peeking"
          color="#B8A3C4"
          onPress={() => { haptics.select(); onPlayBlindRanking?.(); }}
        />
        <GameCard
          icon="help-circle-outline"
          title="Coaster Trivia"
          subtitle="Test your knowledge"
          color="#8FBFB8"
          onPress={() => { haptics.select(); onPlayTrivia?.(); }}
        />
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
  heroSubtext: {
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
  gamesCol: {
    gap: spacing.base,
  },
  gameCardPressable: {},
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  gameIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTextCol: {
    flex: 1,
    marginLeft: spacing.base,
  },
  gameTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  gameSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  gameChevron: {
    width: 24,
    alignItems: 'center',
  },
});
