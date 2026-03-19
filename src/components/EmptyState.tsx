/**
 * EmptyState — Reusable empty state placeholder with optional CTA.
 *
 * Used across all data-driven screens when there's no content to show.
 * Provides a polished, encouraging placeholder with a clear call-to-action
 * so users don't have to hunt for the FAB to get started.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { haptics } from '../services/haptics';

interface EmptyStateProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon color — defaults to accent.primary */
  iconColor?: string;
  /** Primary message */
  title: string;
  /** Secondary explanatory text */
  subtitle: string;
  /** CTA button label — if omitted, no button is rendered */
  ctaLabel?: string;
  /** CTA button handler */
  onCtaPress?: () => void;
  /** CTA icon (left of label) — defaults to 'add' */
  ctaIcon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
  icon,
  iconColor = colors.accent.primary,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  ctaIcon = 'add',
}: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconCircle, { borderColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={36} color={iconColor} />
      </View>

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* CTA button */}
      {ctaLabel && onCtaPress && (
        <Pressable
          onPress={() => {
            haptics.select();
            onCtaPress();
          }}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <Ionicons name={ctaIcon} size={18} color="#FFFFFF" />
          <Text style={styles.ctaLabel}>{ctaLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
    maxWidth: 280,
    marginBottom: spacing.xxl,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  ctaLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
});
