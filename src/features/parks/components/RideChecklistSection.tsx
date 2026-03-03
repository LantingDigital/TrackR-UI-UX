import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCardPress } from '../../../hooks/useSpringPress';
import { ProgressRing } from './ProgressRing';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

interface RideChecklistSectionProps {
  totalRides: number;
  completedToday: number;
  allTimeCredits: number;
  onPress: () => void;
}

export function RideChecklistSection({
  totalRides,
  completedToday,
  allTimeCredits,
  onPress,
}: RideChecklistSectionProps) {
  const { pressHandlers, animatedStyle } = useCardPress();
  const progress = totalRides > 0 ? completedToday / totalRides : 0;

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.ringContainer}>
          <ProgressRing progress={progress} size={64} />
          <Text style={styles.ringLabel}>
            {completedToday}/{totalRides}
          </Text>
        </View>
        <View style={styles.textColumn}>
          <Text style={styles.sectionLabel}>RIDE CHECKLIST</Text>
          <Text style={styles.title}>
            {completedToday === 0
              ? 'Ready to ride?'
              : `${completedToday} ride${completedToday !== 1 ? 's' : ''} today`}
          </Text>
          <Text style={styles.subtitle}>
            {allTimeCredits > 0
              ? `${allTimeCredits} all-time credits`
              : 'Track your coaster credits'}
          </Text>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.accent.primary}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  textColumn: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
