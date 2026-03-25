/**
 * PasswordScreen (placeholder)
 *
 * Password change/recovery screen with current password,
 * new password, confirm password fields, and forgot password link.
 * Placeholder state since accounts aren't connected.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
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
import { SettingsBottomSheet } from '../../components/settings/SettingsBottomSheet';

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
// PasswordScreen
// ============================================

export function PasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotSheetVisible, setForgotSheetVisible] = useState(false);
  const [updatedSheetVisible, setUpdatedSheetVisible] = useState(false);

  const headerAnim = useStagger(0);
  const formAnim = useStagger(1);
  const buttonAnim = useStagger(2);

  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleUpdate = useCallback(() => {
    haptics.success();
    setUpdatedSheetVisible(true);
  }, []);

  const handleForgotPassword = useCallback(() => {
    haptics.tap();
    setForgotSheetVisible(true);
  }, []);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl }]}>
        {/* Form */}
        <Animated.View style={formAnim}>
          <View style={styles.formCard}>
            {/* Current Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.text.meta}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    setShowCurrent(!showCurrent);
                  }}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.meta}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={colors.text.meta}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    setShowNew(!showNew);
                  }}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.meta}
                  />
                </Pressable>
              </View>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <Text style={styles.fieldError}>
                  Password must be at least 8 characters
                </Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.text.meta}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    setShowConfirm(!showConfirm);
                  }}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.meta}
                  />
                </Pressable>
              </View>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={styles.fieldError}>
                  Passwords do not match
                </Text>
              )}
            </View>
          </View>

          {/* Forgot Password */}
          <Pressable
            onPress={handleForgotPassword}
            style={styles.forgotLink}
            hitSlop={8}
          >
            <Text style={styles.forgotLinkText}>Forgot Password?</Text>
          </Pressable>
        </Animated.View>

        {/* Update Button */}
        <Animated.View style={buttonAnim}>
          <Pressable
            style={[
              styles.updateButton,
              !isValid && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdate}
            disabled={!isValid}
          >
            <Text
              style={[
                styles.updateButtonText,
                !isValid && styles.updateButtonTextDisabled,
              ]}
            >
              Update Password
            </Text>
          </Pressable>
          <Text style={styles.placeholderNote}>
            Password management is not yet connected. This is a preview of the interface.
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
        <Text style={styles.headerTitle}>Password</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Forgot Password bottom sheet */}
      <SettingsBottomSheet
        visible={forgotSheetVisible}
        onClose={() => setForgotSheetVisible(false)}
        title="Forgot Password"
        warning
        warningMessage="Password recovery will be available when accounts are connected. A reset link will be sent to your email."
        warningIcon="mail-outline"
        confirmLabel="OK"
        onConfirm={() => setForgotSheetVisible(false)}
      />

      {/* Password Updated bottom sheet */}
      <SettingsBottomSheet
        visible={updatedSheetVisible}
        onClose={() => setUpdatedSheetVisible(false)}
        title="Password Updated"
        warning
        warningMessage="Password management will be fully functional when accounts are connected."
        warningIcon="checkmark-circle-outline"
        confirmLabel="OK"
        onConfirm={() => setUpdatedSheetVisible(false)}
      />
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

  // Form
  formCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.section,
  },
  fieldGroup: {
    paddingVertical: spacing.base,
  },
  fieldLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.base,
    padding: spacing.sm,
  },
  fieldError: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.status.error,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },

  // Forgot
  forgotLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  forgotLinkText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Update button
  updateButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  updateButtonDisabled: {
    backgroundColor: colors.accent.primary,
    opacity: 0.4,
  },
  updateButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  updateButtonTextDisabled: {
    color: colors.text.inverse,
  },
  placeholderNote: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: spacing.base,
    lineHeight: typography.sizes.meta * typography.lineHeights.relaxed,
  },
});
