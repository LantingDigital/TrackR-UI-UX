/**
 * NotificationPreferencesScreen
 *
 * Per-category notification toggles: Reminders, Orders, Social, Marketing.
 * Uses the same glass-effect toggle switches as the main settings screen.
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  Pressable,
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
import { GlassHeader } from '../../components/GlassHeader';
import {
  useSettingsStore,
  type NotificationPreferences,
} from '../../stores/settingsStore';

const HEADER_HEIGHT = 52;

const SWITCH_TRACK_COLOR = { false: colors.border.subtle, true: colors.accent.primary };

// ============================================
// Notification categories
// ============================================

const CATEGORIES: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'reminders',
    label: 'Reminders',
    description: 'Ride reminders and park visit notifications',
    icon: 'alarm-outline',
  },
  {
    key: 'orders',
    label: 'Order Tracking',
    description: 'Card order status and shipping updates',
    icon: 'cube-outline',
  },
  {
    key: 'social',
    label: 'Social',
    description: 'Friend requests, comments, and community activity',
    icon: 'people-outline',
  },
  {
    key: 'marketing',
    label: 'News & Updates',
    description: 'New features, events, and announcements',
    icon: 'megaphone-outline',
  },
];

// ============================================
// Stagger
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
// NotificationPreferencesScreen
// ============================================

export function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();

  const {
    notificationsEnabled,
    notificationPrefs,
    setNotificationsEnabled,
    setNotificationPref,
  } = useSettingsStore();

  const headerAnim = useStagger(0);
  const masterAnim = useStagger(1);
  const categoriesAnim = useStagger(2);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }]}>
        {/* Master toggle */}
        <Animated.View style={masterAnim}>
          <View style={styles.masterCard}>
            <View style={styles.masterRow}>
              <View style={styles.masterIconBg}>
                <Ionicons name="notifications-outline" size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.masterTextWrap}>
                <Text style={styles.masterLabel}>Notifications</Text>
                <Text style={styles.masterDescription}>
                  {notificationsEnabled ? 'Enabled' : 'All notifications are off'}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => {
                  haptics.tap();
                  setNotificationsEnabled(v);
                }}
                trackColor={SWITCH_TRACK_COLOR}
                thumbColor={colors.background.card}
              />
            </View>
          </View>
        </Animated.View>

        {/* Per-category toggles */}
        <Animated.View style={categoriesAnim}>
          <Text style={styles.sectionHeader}>CATEGORIES</Text>
          <View style={[styles.categoriesCard, !notificationsEnabled && styles.categoriesDisabled]}>
            {CATEGORIES.map((cat, i) => (
              <View
                key={cat.key}
                style={[
                  styles.categoryRow,
                  i < CATEGORIES.length - 1 && styles.categoryRowBorder,
                ]}
              >
                <View style={styles.categoryIconBg}>
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={notificationsEnabled ? colors.accent.primary : colors.text.meta}
                  />
                </View>
                <View style={styles.categoryTextWrap}>
                  <Text style={[styles.categoryLabel, !notificationsEnabled && styles.categoryLabelDisabled]}>
                    {cat.label}
                  </Text>
                  <Text style={styles.categoryDescription}>{cat.description}</Text>
                </View>
                <Switch
                  value={notificationsEnabled && notificationPrefs[cat.key]}
                  onValueChange={(v) => {
                    haptics.tap();
                    setNotificationPref(cat.key, v);
                  }}
                  trackColor={SWITCH_TRACK_COLOR}
                  thumbColor={colors.background.card}
                  disabled={!notificationsEnabled}
                />
              </View>
            ))}
          </View>
          {!notificationsEnabled && (
            <Text style={styles.disabledHint}>
              Turn on notifications above to configure individual categories.
            </Text>
          )}
        </Animated.View>
      </View>

      {/* GlassHeader fog overlay */}
      <GlassHeader headerHeight={headerTotalHeight} fadeDistance={30} />

      {/* Header */}
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
        <Text style={styles.headerTitle}>Notifications</Text>
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

  // Master toggle
  masterCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.section,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  masterIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  masterTextWrap: {
    flex: 1,
    marginRight: spacing.base,
  },
  masterLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  masterDescription: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Categories
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  categoriesCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.section,
  },
  categoriesDisabled: {
    opacity: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  categoryIconBg: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  categoryTextWrap: {
    flex: 1,
    marginRight: spacing.base,
  },
  categoryLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  categoryLabelDisabled: {
    color: colors.text.meta,
  },
  categoryDescription: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
  disabledHint: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
