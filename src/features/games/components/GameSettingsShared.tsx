/**
 * GameSettingsShared — Reusable settings UI components
 *
 * Extracted from CoastleSettingsContent pattern.
 * Used by Speed Sorter, Blind Ranking, and Trivia settings.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

// ─── Sub Screen Header ──────────────────────────────────────

export const SubScreenHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <View style={styles.subHeader}>
    <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
      <Ionicons name="chevron-back" size={18} color={colors.accent.primary} />
      <Text style={styles.backLabel}>Back</Text>
    </Pressable>
    <Text style={styles.subHeaderTitle}>{title}</Text>
    <View style={styles.subHeaderSpacer} />
  </View>
);

// ─── Section Header ─────────────────────────────────────────

export const GameSectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <Text style={styles.sectionHeader}>{label}</Text>
);

// ─── Settings Row ───────────────────────────────────────────

interface GameSettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
}

export const GameSettingsRow: React.FC<GameSettingsRowProps> = ({
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

// ─── Stat Card ──────────────────────────────────────────────

export const GameStatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Separator ──────────────────────────────────────────────

export const SettingsSeparator: React.FC = () => <View style={styles.separator} />;

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Sub screen header
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
    color: colors.accent.primary,
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

  // Section header
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },

  // Settings row
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

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },

  // Stat card
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
});
