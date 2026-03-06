/**
 * SpinnerPreviewScreen — Dev-only full-screen preview of TrackSpinner.
 * Shows the spinner at multiple sizes against a clean background
 * for easy visual tuning.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TrackSpinner } from '../components/feedback/TrackSpinner';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function SpinnerPreviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.closeBtn}
        hitSlop={12}
      >
        <Ionicons name="close" size={28} color={colors.text.primary} />
      </Pressable>

      <Text style={styles.title}>TrackSpinner</Text>

      {/* Size variants */}
      <View style={styles.row}>
        <View style={styles.sizeBox}>
          <TrackSpinner size={32} />
          <Text style={styles.label}>32</Text>
        </View>
        <View style={styles.sizeBox}>
          <TrackSpinner size={48} />
          <Text style={styles.label}>48</Text>
        </View>
        <View style={styles.sizeBox}>
          <TrackSpinner size={64} />
          <Text style={styles.label}>64</Text>
        </View>
      </View>

      {/* Large hero spinner */}
      <View style={styles.hero}>
        <TrackSpinner size={120} />
      </View>
      <Text style={styles.heroLabel}>120</Text>

      {/* Dark background variant */}
      <View style={styles.darkBox}>
        <TrackSpinner
          size={64}
          color="#FFFFFF"
          trackColor="rgba(255,255,255,0.2)"
        />
        <Text style={styles.darkLabel}>On dark</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: spacing.xl,
    zIndex: 10,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxxl,
    marginBottom: spacing.xxxl,
  },
  sizeBox: {
    alignItems: 'center',
    gap: spacing.base,
  },
  label: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
  },
  hero: {
    marginVertical: spacing.xl,
  },
  heroLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xxxl,
  },
  darkBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.base,
  },
  darkLabel: {
    fontSize: typography.sizes.meta,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: typography.weights.medium,
  },
});
