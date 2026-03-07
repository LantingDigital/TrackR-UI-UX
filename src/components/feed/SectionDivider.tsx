/**
 * SectionDivider - Subtle visual separator between feed sections.
 * Provides breathing room and visual hierarchy in the feed.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const SectionDivider = React.memo(() => (
  <View style={styles.container}>
    <View style={styles.line} />
  </View>
));

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  line: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border.subtle,
    opacity: 0.5,
  },
});
