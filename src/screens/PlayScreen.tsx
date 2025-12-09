/**
 * PlayScreen
 *
 * Mini-games hub for daily engagement.
 * Features trivia, "Guess the Coaster", and more.
 *
 * This is a placeholder - full implementation coming in Phase 5.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useTabBar } from '../contexts/TabBarContext';

export const PlayScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();

  // Register reset handler
  useEffect(() => {
    const resetHandler = () => {
      // Reset scroll position or game state
    };
    tabBar?.registerResetHandler('Play', resetHandler);
    return () => {
      tabBar?.unregisterResetHandler('Play');
    };
  }, [tabBar]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Play</Text>
          <Text style={styles.headerSubtitle}>Games & Challenges</Text>
        </View>

        {/* Placeholder Content */}
        <View style={styles.placeholderContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="game-controller" size={64} color={colors.accent.primary} />
          </View>
          <Text style={styles.placeholderTitle}>Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Mini-games are being polished for launch.{'\n'}
            Daily Trivia, Guess the Coaster, and more!
          </Text>
        </View>

        {/* Game Preview Cards - placeholders */}
        <View style={styles.gamesSection}>
          <Text style={styles.sectionTitle}>Featured Games</Text>

          <View style={styles.gameCard}>
            <View style={styles.gameIconContainer}>
              <Ionicons name="help-circle" size={28} color={colors.accent.primary} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>Daily Trivia</Text>
              <Text style={styles.gameDescription}>Test your coaster knowledge</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>

          <View style={styles.gameCard}>
            <View style={styles.gameIconContainer}>
              <Ionicons name="image" size={28} color={colors.accent.primary} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>Guess the Coaster</Text>
              <Text style={styles.gameDescription}>Identify coasters from photos</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>

          <View style={styles.gameCard}>
            <View style={styles.gameIconContainer}>
              <Ionicons name="stats-chart" size={28} color={colors.accent.primary} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>Stat Sort</Text>
              <Text style={styles.gameDescription}>Rank coasters by their stats</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 17,
    color: colors.text.secondary,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  gamesSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.sm,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  gameDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  comingSoonBadge: {
    backgroundColor: colors.background.page,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.meta,
  },
});

export default PlayScreen;
