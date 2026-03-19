/**
 * ExportRideLogScreen
 *
 * Export ride log data with format selection (CSV, JSON),
 * date range picker, and export button.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { SPRINGS, TIMING } from '../../constants/animations';
import { useSpringPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { FogHeader } from '../../components/FogHeader';

const HEADER_HEIGHT = 52;

// ============================================
// Types
// ============================================

type ExportFormat = 'csv' | 'json';
type DateRange = 'all' | 'this-year' | 'last-30' | 'last-7';

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'csv', label: 'CSV', icon: 'grid-outline' },
  { key: 'json', label: 'JSON', icon: 'code-slash-outline' },
];

const DATE_RANGE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'this-year', label: 'This Year' },
  { key: 'last-30', label: 'Last 30 Days' },
  { key: 'last-7', label: 'Last 7 Days' },
];

// ============================================
// Stagger animation hook
// ============================================

function useStagger(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ============================================
// ExportRideLogScreen
// ============================================

export function ExportRideLogScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();
  const exportPress = useSpringPress();

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const headerAnim = useStagger(0);
  const formatAnim = useStagger(1);
  const dateAnim = useStagger(2);
  const buttonAnim = useStagger(3);

  const handleExport = useCallback(() => {
    haptics.success();
    Alert.alert(
      'Export Started',
      `Your ride log will be exported as ${format.toUpperCase()} for ${
        DATE_RANGE_OPTIONS.find((d) => d.key === dateRange)?.label ?? 'All Time'
      }. This feature will be fully functional when connected to your account.`,
      [{ text: 'OK' }],
    );
  }, [format, dateRange]);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }]}>
        {/* Format Selection */}
        <Animated.View style={formatAnim}>
          <Text style={styles.sectionHeader}>FORMAT</Text>
          <View style={styles.formatRow}>
            {FORMAT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[
                  styles.formatCard,
                  format === opt.key && styles.formatCardActive,
                ]}
                onPress={() => {
                  haptics.tap();
                  setFormat(opt.key);
                }}
              >
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={format === opt.key ? colors.accent.primary : colors.text.meta}
                />
                <Text
                  style={[
                    styles.formatLabel,
                    format === opt.key && styles.formatLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {format === opt.key && (
                  <View style={styles.formatCheck}>
                    <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Date Range */}
        <Animated.View style={dateAnim}>
          <Text style={styles.sectionHeader}>DATE RANGE</Text>
          <View style={styles.sectionCard}>
            {DATE_RANGE_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.key}
                style={[
                  styles.dateRow,
                  i < DATE_RANGE_OPTIONS.length - 1 && styles.dateRowBorder,
                ]}
                onPress={() => {
                  haptics.tap();
                  setDateRange(opt.key);
                }}
              >
                <Text
                  style={[
                    styles.dateLabel,
                    dateRange === opt.key && styles.dateLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {dateRange === opt.key && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.accent.primary}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Export Preview */}
        <Animated.View style={dateAnim}>
          <View style={styles.previewCard}>
            <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.previewText}>
              Export will include ride names, parks, dates, ratings, and notes.
            </Text>
          </View>
        </Animated.View>

        {/* Export Button */}
        <Animated.View style={[styles.exportContainer, buttonAnim]}>
          <Pressable
            {...exportPress.pressHandlers}
            onPress={handleExport}
          >
            <Animated.View style={[styles.exportButton, exportPress.animatedStyle]}>
              <Ionicons name="download-outline" size={20} color={colors.text.inverse} />
              <Text style={styles.exportButtonText}>Export Ride Log</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <Animated.View style={[styles.header, { top: insets.top }, headerAnim]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Export Ride Log</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: HEADER_HEIGHT,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },

  // Format selection
  formatRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  formatCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.small,
  },
  formatCardActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryLight,
  },
  formatLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  formatLabelActive: {
    color: colors.accent.primary,
  },
  formatCheck: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date range
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.section,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base + 2,
  },
  dateRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dateLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  dateLabelActive: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },

  // Preview
  previewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.base,
  },
  previewText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },

  // Export button
  exportContainer: {
    marginTop: spacing.xxl,
  },
  exportButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.small,
  },
  exportButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
