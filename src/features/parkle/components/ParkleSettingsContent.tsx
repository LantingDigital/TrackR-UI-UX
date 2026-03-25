import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Switch,
  Linking,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Constants from 'expo-constants';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { useSettingsStore } from '../../../stores/settingsStore';
import { ParkleStats } from '../types/parkle';
import type { ParkleDifficulty } from '../stores/parkleStore';
import { DifficultySelector } from '../../games/components/DifficultySelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <Text style={styles.sectionHeader}>{label}</Text>
);

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
}
const SettingsRow: React.FC<SettingsRowProps> = ({
  icon, label, sublabel, onPress, showChevron, trailing,
}) => (
  <Pressable
    style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={18} color={colors.text.secondary} style={styles.rowIcon} />
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
    </View>
    {trailing ?? (showChevron && (
      <Ionicons name="chevron-forward" size={16} color={colors.text.meta} />
    ))}
  </Pressable>
);

const StatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SubScreenHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <View style={styles.subHeader}>
    <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
      <Ionicons name="chevron-back" size={18} color={colors.parkle.accent} />
      <Text style={styles.backLabel}>Back</Text>
    </Pressable>
    <Text style={styles.subHeaderTitle}>{title}</Text>
    <View style={styles.subHeaderSpacer} />
  </View>
);

interface ParkleSettingsContentProps {
  stats: ParkleStats;
  close: () => void;
  difficulty?: ParkleDifficulty;
  onDifficultyChange?: (value: ParkleDifficulty) => void;
}

export const ParkleSettingsContent: React.FC<ParkleSettingsContentProps> = ({ stats, close, difficulty = 'easy', onDifficultyChange }) => {
  const { hapticsEnabled, setHapticsEnabled } = useSettingsStore();

  const screen0Offset = useSharedValue(0);
  const statsOffset = useSharedValue(CARD_WIDTH);

  const screen0Style = useAnimatedStyle(() => ({
    transform: [{ translateX: screen0Offset.value }],
  }));
  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: statsOffset.value }],
  }));

  const navigateTo = useCallback(() => {
    statsOffset.value = withTiming(0, { duration: 250 });
    screen0Offset.value = withTiming(-CARD_WIDTH * 0.28, { duration: 250 });
    haptics.tap();
  }, []);

  const navigateBack = useCallback(() => {
    statsOffset.value = withTiming(CARD_WIDTH, { duration: 220 });
    screen0Offset.value = withTiming(0, { duration: 220 });
    haptics.tap();
  }, []);

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const avgSolve = stats.gamesWon > 0
    ? (stats.guessDistribution.reduce((sum, count, i) => sum + count * (i + 1), 0) / stats.gamesWon).toFixed(1)
    : '\u2014';
  const bestSolveIndex = stats.guessDistribution.findIndex((c) => c > 0);
  const bestSolve = bestSolveIndex >= 0 ? String(bestSolveIndex + 1) : '\u2014';
  const recentForm = (stats.recentGames ?? []).slice(-7);

  return (
    <View style={styles.container}>
      <Reanimated.View style={[StyleSheet.absoluteFill, screen0Style]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SectionHeader label="GAME" />
          <SettingsRow icon="bar-chart-outline" label="Statistics" onPress={navigateTo} showChevron />
          {onDifficultyChange && (
            <DifficultySelector
              value={difficulty}
              onChange={onDifficultyChange}
              accentColor={colors.parkle.accent}
              easyDescription="Major parks (10+ coasters)"
              hardDescription="All parks with coasters"
            />
          )}

          <View style={styles.separator} />
          <SectionHeader label="PREFERENCES" />
          <SettingsRow
            icon="phone-portrait-outline"
            label="Haptics"
            trailing={
              <Switch
                value={hapticsEnabled}
                onValueChange={(v) => { setHapticsEnabled(v); if (v) haptics.tap(); }}
                trackColor={{ false: colors.border.subtle, true: colors.parkle.accent }}
                thumbColor={colors.text.inverse}
                ios_backgroundColor={colors.border.subtle}
              />
            }
          />

          <View style={styles.bottomPad} />
        </ScrollView>
      </Reanimated.View>

      <Reanimated.View style={[StyleSheet.absoluteFill, styles.subScreenOverlay, statsStyle]}>
        <SubScreenHeader title="Statistics" onBack={navigateBack} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <StatItem label="Played" value={stats.gamesPlayed} />
            <StatItem label="Win %" value={winRate} />
            <StatItem label="Streak" value={stats.currentStreak} />
            <StatItem label="Max" value={stats.maxStreak} />
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>PERFORMANCE</Text>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceBig}>{avgSolve}</Text>
              <Text style={styles.performanceSub}>Avg Solve</Text>
              <Text style={styles.performanceUnit}>guesses</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceBig}>{bestSolve}</Text>
              <Text style={styles.performanceSub}>Best Solve</Text>
              <Text style={styles.performanceUnit}>guesses</Text>
            </View>
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>RECENT FORM</Text>
          <View style={styles.recentFormRow}>
            {recentForm.length === 0 ? (
              <Text style={styles.recentFormEmpty}>Play more games to see your form</Text>
            ) : (
              recentForm.map((g, i) => (
                <View key={i} style={[styles.formDot, g.won ? styles.formDotWin : styles.formDotLoss]} />
              ))
            )}
            {recentForm.length > 0 && recentForm.length < 7 &&
              Array.from({ length: 7 - recentForm.length }).map((_, i) => (
                <View key={`e-${i}`} style={[styles.formDot, styles.formDotEmpty]} />
              ))
            }
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  scrollContent: { paddingTop: spacing.base },
  subScreenOverlay: {
    backgroundColor: colors.background.card,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 6,
  },
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    minHeight: 48,
  },
  rowPressed: { backgroundColor: colors.interactive.pressed },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.base,
  },
  rowIcon: { width: 22, textAlign: 'center' },
  rowLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
  },
  rowSublabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 60,
  },
  backLabel: {
    fontSize: typography.sizes.body,
    color: colors.parkle.accent,
    fontWeight: typography.weights.regular,
  },
  subHeaderTitle: {
    flex: 1,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subHeaderSpacer: { minWidth: 60 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  performanceRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  performanceItem: { flex: 1, alignItems: 'center', gap: 2 },
  performanceBig: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  performanceSub: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  performanceUnit: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  performanceDivider: {
    width: StyleSheet.hairlineWidth,
    height: 56,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.base,
  },
  recentFormRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  recentFormEmpty: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    textAlign: 'center',
  },
  formDot: { width: 12, height: 12, borderRadius: 6 },
  formDotWin: { backgroundColor: colors.parkle.correct },
  formDotLoss: { backgroundColor: colors.status.error },
  formDotEmpty: { backgroundColor: colors.border.subtle },
  bottomPad: { height: spacing.xl },
});
