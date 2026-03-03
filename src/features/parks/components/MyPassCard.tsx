import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCardPress } from '../../../hooks/useSpringPress';
import { useWallet } from '../../../hooks/useWallet';
import { PassPreviewCard } from '../../../components/wallet/PassPreviewCard';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

interface MyPassCardProps {
  parkName: string;
  onPress: () => void;
}

export function MyPassCard({ parkName, onPress }: MyPassCardProps) {
  const { pressHandlers, animatedStyle } = useCardPress();
  const { tickets } = useWallet();

  const ticket = tickets.find(
    (t) => t.parkName === parkName && t.status === 'active'
  );

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View
        style={[ticket ? styles.card : styles.emptyCard, animatedStyle]}
      >
        {ticket ? (
          <>
            {/* Subtle accent gradient at top */}
            <LinearGradient
              colors={[`${colors.accent.primary}08`, 'transparent']}
              style={styles.accentGradient}
            />
            <View style={styles.row}>
              <PassPreviewCard ticket={ticket} size={84} />
              <View style={styles.textColumn}>
                <Text style={styles.label}>MY PASS</Text>
                <Text style={styles.parkName} numberOfLines={1}>
                  {ticket.parkName}
                </Text>
                <Text style={styles.passType} numberOfLines={1}>
                  {ticket.passType.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={styles.arrowCircle}>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.accent.primary}
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContent}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="ticket-outline" size={24} color={colors.text.meta} />
            </View>
            <View style={styles.emptyTextGroup}>
              <Text style={styles.emptyTitle}>Add your pass</Text>
              <Text style={styles.emptySubtitle}>
                Scan or import your park pass
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 116,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  accentGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  emptyCard: {
    height: 116,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    borderStyle: 'dashed' as const,
    borderColor: colors.border.subtle,
    borderWidth: 1.5,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  parkName: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  passType: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextGroup: {
    marginLeft: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
});
