/**
 * DailyActivityCard — Shows today's HealthKit stats in a compact card.
 *
 * Displays steps, distance (miles), and flights climbed.
 * Handles all states: loading, no data, permission needed, unavailable.
 * Hidden entirely when HealthKit is unavailable or user denied access.
 *
 * Design: light card on page background, three stat columns, subtle accent bar.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useStrongPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { useHealthStore } from '../../stores/healthStore';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

// ── Stat formatter ──────────────────────────────────────────

function formatSteps(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatDistance(miles: number): string {
  if (miles < 0.01) return '0';
  if (miles < 10) return miles.toFixed(1);
  return Math.round(miles).toString();
}

// ── Component ───────────────────────────────────────────────

interface DailyActivityCardProps {
  /** Optional park name to personalize ("You walked X at Cedar Point") */
  parkName?: string;
}

export const DailyActivityCard: React.FC<DailyActivityCardProps> = ({ parkName }) => {
  const {
    available,
    permissionRequested,
    enabled,
    today,
    initialize,
    requestPermissions,
    refresh,
  } = useHealthStore();

  const connectPress = useStrongPress();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && enabled) {
        refresh();
      }
    });
    return () => sub.remove();
  }, [enabled, refresh]);

  // Entrance animation
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(8);

  useEffect(() => {
    if (enabled && today) {
      cardOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      cardTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [enabled, today]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  // Not available on this device (Android, or simulator without HealthKit)
  if (!available) return null;

  // Permission not yet requested — show connect prompt
  if (!permissionRequested) {
    return (
      <Pressable
        {...connectPress.pressHandlers}
        onPress={() => {
          haptics.tap();
          requestPermissions();
        }}
      >
        <Animated.View style={[styles.card, styles.connectCard, connectPress.animatedStyle]}>
          <View style={styles.connectRow}>
            <Ionicons name="heart-outline" size={18} color={colors.accent.primary} />
            <Text style={styles.connectText}>Connect Apple Health</Text>
          </View>
          <Text style={styles.connectSubtext}>
            See how far you walk at the park
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  // Permission requested but no data (user denied, or genuinely 0 steps)
  if (!enabled || !today) return null;

  // Show the stats card
  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* Accent bar */}
      <View style={styles.accentBar} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="footsteps-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.headerText}>
          {parkName ? `Today at ${parkName}` : 'Today\'s Activity'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatColumn
          value={formatSteps(today.steps)}
          label="steps"
          icon="walk-outline"
        />
        <View style={styles.statDivider} />
        <StatColumn
          value={formatDistance(today.distanceMiles)}
          label="miles"
          icon="navigate-outline"
        />
        <View style={styles.statDivider} />
        <StatColumn
          value={today.flightsClimbed.toString()}
          label="flights"
          icon="trending-up-outline"
        />
      </View>
    </Animated.View>
  );
};

// ── Sub-component ───────────────────────────────────────────

function StatColumn({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <View style={styles.statColumn}>
      <Ionicons name={icon as any} size={14} color={colors.text.meta} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },

  // Accent bar (left edge)
  accentBar: {
    position: 'absolute',
    left: 0,
    top: spacing.base,
    bottom: spacing.base,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent.primary,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
    paddingLeft: spacing.xs,
  },
  headerText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
  },

  // Connect prompt
  connectCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  connectText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  connectSubtext: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
});
