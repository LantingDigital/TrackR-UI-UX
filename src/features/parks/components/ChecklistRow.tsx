import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';

interface ChecklistRowProps {
  name: string;
  heightFt: number;
  speedMph: number;
  checked: boolean;
  onToggle: () => void;
  onNamePress?: () => void;
}

export const ChecklistRow = memo(function ChecklistRow({
  name,
  heightFt,
  speedMph,
  checked,
  onToggle,
  onNamePress,
}: ChecklistRowProps) {
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.info}>
        {onNamePress ? (
          <Pressable onPress={onNamePress} hitSlop={4}>
            <Text
              style={[styles.name, styles.nameLinked, checked && styles.nameChecked]}
              numberOfLines={1}
            >
              {name}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[styles.name, checked && styles.nameChecked]}
            numberOfLines={1}
          >
            {name}
          </Text>
        )}
        <Text style={styles.stats}>
          {heightFt} ft · {speedMph} mph
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    marginTop: -1,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  nameLinked: {
    color: colors.accent.primary,
  },
  nameChecked: {
    color: colors.text.meta,
    textDecorationLine: 'line-through',
  },
  stats: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 1,
  },
});
