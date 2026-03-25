/**
 * EmailScreen (placeholder)
 *
 * Shows what the email settings will look like when accounts are connected.
 * Current email, verification status, and change email option.
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
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

const HEADER_HEIGHT = 52;

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
// EmailScreen
// ============================================

export function EmailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();

  const headerAnim = useStagger(0);
  const emailAnim = useStagger(1);
  const statusAnim = useStagger(2);
  const changeAnim = useStagger(3);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: headerTotalHeight + spacing.xxl, paddingBottom: insets.bottom + spacing.xxxl }]}>
        {/* Current Email Card */}
        <Animated.View style={emailAnim}>
          <View style={styles.emailCard}>
            <View style={styles.emailIconCircle}>
              <Ionicons name="mail-outline" size={24} color={colors.accent.primary} />
            </View>
            <Text style={styles.emailLabel}>Current Email</Text>
            <Text style={styles.emailPlaceholder}>Not connected</Text>
          </View>
        </Animated.View>

        {/* Verification Status */}
        <Animated.View style={statusAnim}>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.meta} />
              <Text style={styles.statusLabel}>Verification Status</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Pending setup</Text>
            </View>
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View style={statusAnim}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.infoText}>
              Connect your email to enable account recovery, ride log sync across devices, and social features.
            </Text>
          </View>
        </Animated.View>

        {/* Change Email Button */}
        <Animated.View style={changeAnim}>
          <Pressable
            style={[styles.changeButton, styles.changeButtonDisabled]}
            disabled
          >
            <Ionicons name="create-outline" size={18} color={colors.text.meta} />
            <Text style={styles.changeButtonTextDisabled}>Change Email</Text>
          </Pressable>
          <Text style={styles.disabledHint}>
            Available after account setup
          </Text>
        </Animated.View>
      </View>

      {/* GlassHeader fog overlay */}
      <GlassHeader headerHeight={headerTotalHeight} fadeDistance={30} />

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
        <Text style={styles.headerTitle}>Email</Text>
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

  // Email card
  emailCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.section,
  },
  emailIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emailLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  emailPlaceholder: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },

  // Status
  statusCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  statusLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.meta,
  },
  statusText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },

  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.base,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },

  // Change button
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    marginTop: spacing.xxl,
  },
  changeButtonDisabled: {
    backgroundColor: colors.accent.primary,
    opacity: 0.4,
  },
  changeButtonTextDisabled: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  disabledHint: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
