/**
 * TriviaSettingsContent — Three-screen settings card
 *
 * Screen 0: Main Settings (Statistics →, Hard Mode, About →)
 * Screen 1: Statistics (Games Played, Best Streak, Accuracy %, per-category breakdown)
 * Screen 2: About
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  Linking,
  Dimensions,
  ScrollView,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Constants from 'expo-constants';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { haptics } from '../../../../services/haptics';
import {
  SubScreenHeader,
  GameSectionHeader,
  GameSettingsRow,
  GameStatCard,
  SettingsSeparator,
} from '../../components/GameSettingsShared';
import type { TriviaStats } from '../types/trivia';
import type { TriviaSettings } from '../stores/triviaStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;

const CATEGORY_LABELS: Record<string, string> = {
  parks: 'Parks',
  coasters: 'Coasters',
  manufacturers: 'Manufacturers',
  history: 'History',
};

interface TriviaSettingsContentProps {
  stats: TriviaStats;
  settings: TriviaSettings;
  onSetHardMode: (v: boolean) => void;
  close: () => void;
}

export const TriviaSettingsContent: React.FC<TriviaSettingsContentProps> = ({
  stats, settings, onSetHardMode, close,
}) => {
  const screen0Offset = useSharedValue(0);
  const statsOffset = useSharedValue(CARD_WIDTH);
  const aboutOffset = useSharedValue(CARD_WIDTH);

  const screen0Style = useAnimatedStyle(() => ({
    transform: [{ translateX: screen0Offset.value }],
  }));
  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: statsOffset.value }],
  }));
  const aboutStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: aboutOffset.value }],
  }));

  const navigateTo = useCallback((sub: 'stats' | 'about') => {
    const target = sub === 'stats' ? statsOffset : aboutOffset;
    target.value = withTiming(0, { duration: 250 });
    screen0Offset.value = withTiming(-CARD_WIDTH * 0.28, { duration: 250 });
    haptics.tap();
  }, []);

  const navigateBack = useCallback(() => {
    statsOffset.value = withTiming(CARD_WIDTH, { duration: 220 });
    aboutOffset.value = withTiming(CARD_WIDTH, { duration: 220 });
    screen0Offset.value = withTiming(0, { duration: 220 });
    haptics.tap();
  }, []);

  const handleFeedback = useCallback(() => {
    haptics.tap();
    Linking.openURL('mailto:caleb@lantingdigital.com?subject=TrackR Feedback');
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '1.0';
  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Screen 0: Main Settings */}
      <Reanimated.View style={[StyleSheet.absoluteFill, screen0Style]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
          <GameSectionHeader label="GAME" />
          <GameSettingsRow icon="bar-chart-outline" label="Statistics" onPress={() => navigateTo('stats')} showChevron />

          <SettingsSeparator />
          <GameSectionHeader label="PREFERENCES" />
          <GameSettingsRow
            icon="flash-outline"
            label="Hard Mode"
            sublabel="3 answer choices"
            trailing={
              <Switch
                value={settings.hardMode}
                onValueChange={(v) => { onSetHardMode(v); haptics.tap(); }}
                trackColor={{ false: colors.border.subtle, true: colors.accent.primary }}
                thumbColor={colors.text.inverse}
                ios_backgroundColor={colors.border.subtle}
              />
            }
          />

          <SettingsSeparator />
          <GameSectionHeader label="APP" />
          <GameSettingsRow icon="information-circle-outline" label="About" onPress={() => navigateTo('about')} showChevron />
          <GameSettingsRow icon="chatbubble-outline" label="Send Feedback" onPress={handleFeedback} showChevron />

          <View style={styles.bottomPad} />
        </ScrollView>
      </Reanimated.View>

      {/* Screen 1: Statistics */}
      <Reanimated.View style={[StyleSheet.absoluteFill, styles.subScreenOverlay, statsStyle]}>
        <SubScreenHeader title="Statistics" onBack={navigateBack} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <GameStatCard label="Played" value={stats.gamesPlayed} />
            <GameStatCard label="Best Streak" value={stats.bestStreak} />
            <GameStatCard label="Accuracy" value={`${accuracy}%`} />
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionLabel}>PER CATEGORY</Text>
          <View style={styles.categoryStats}>
            {Object.entries(stats.categoryBreakdown).map(([key, data]) => {
              const catAccuracy = data.total > 0
                ? Math.round((data.correct / data.total) * 100)
                : 0;
              return (
                <View key={key} style={styles.catStatRow}>
                  <Text style={styles.catStatName}>{CATEGORY_LABELS[key] ?? key}</Text>
                  <Text style={styles.catStatValue}>
                    {data.correct}/{data.total} ({catAccuracy}%)
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </Reanimated.View>

      {/* Screen 2: About */}
      <Reanimated.View style={[StyleSheet.absoluteFill, styles.subScreenOverlay, aboutStyle]}>
        <SubScreenHeader title="About" onBack={navigateBack} />
        <View style={styles.aboutContent}>
          <Text style={styles.aboutAppName}>TrackR</Text>
          <Text style={styles.aboutTagline}>Your pocket companion for roller coaster enthusiasts.</Text>
          <View style={styles.aboutVersionRow}>
            <Text style={styles.aboutVersionLabel}>Version</Text>
            <Text style={styles.aboutVersionValue}>{appVersion}</Text>
          </View>
          <View style={styles.aboutVersionRow}>
            <Text style={styles.aboutVersionLabel}>Developer</Text>
            <Text style={styles.aboutVersionValue}>Lanting Digital LLC</Text>
          </View>
        </View>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  categoryStats: {
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  catStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  catStatName: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  catStatValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  aboutContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  aboutAppName: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 2,
  },
  aboutTagline: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
  },
  aboutVersionRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  aboutVersionLabel: {
    fontSize: typography.sizes.label,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
  },
  aboutVersionValue: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
  },
  bottomPad: { height: spacing.xl },
});
