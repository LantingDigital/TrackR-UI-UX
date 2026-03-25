/**
 * ProfileSetupScreen — Post-auth profile completion.
 *
 * Collects: real name (auto-filled from OAuth), username (real-time CF validation),
 * avatar (camera, photo library, or default icons).
 *
 * Light theme, matches the onboarding aesthetic.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { useAuthStore } from '../../../stores/authStore';
import { updateUserDoc } from '../../../services/firebase/firestore';
import {
  callValidateUsername,
  type ValidateUsernameResult,
} from '../../../services/firebase/functions';

const ACCENT = colors.accent.primary;

// Default avatar icons for users who don't want to upload a photo
const DEFAULT_AVATARS = [
  { id: 'coaster', icon: 'rocket' as const, color: '#CF6769' },
  { id: 'star', icon: 'star' as const, color: '#E8A838' },
  { id: 'flash', icon: 'flash' as const, color: '#5A8AD2' },
  { id: 'heart', icon: 'heart' as const, color: '#D46B8C' },
  { id: 'planet', icon: 'planet' as const, color: '#5AAF82' },
  { id: 'diamond', icon: 'diamond' as const, color: '#9664C8' },
];

interface ProfileSetupScreenProps {
  onComplete: (displayName: string) => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Form state
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('coaster');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameRef = useRef<TextInput>(null);
  const continuePress = useStrongPress({ disabled: isSubmitting });

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);
  const avatarOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 350 }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    formOpacity.value = withDelay(250, withTiming(1, { duration: 350 }));
    formTranslateY.value = withDelay(250, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    avatarOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    buttonOpacity.value = withDelay(550, withTiming(1, { duration: 300 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));
  const avatarStyle = useAnimatedStyle(() => ({ opacity: avatarOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  // ── Username validation (debounced) ──
  const validateUsername = useCallback((text: string) => {
    const normalized = text.toLowerCase().trim();
    setUsername(text);

    // Clear any pending timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Reset if too short
    if (normalized.length < 3) {
      setUsernameStatus(normalized.length > 0 ? 'invalid' : 'idle');
      setUsernameError(normalized.length > 0 ? 'Username must be at least 3 characters' : null);
      return;
    }

    // Basic format check
    if (!/^[a-z0-9_]+$/.test(normalized)) {
      setUsernameStatus('invalid');
      setUsernameError('Only letters, numbers, and underscores');
      return;
    }

    if (normalized.startsWith('_') || normalized.endsWith('_')) {
      setUsernameStatus('invalid');
      setUsernameError('Cannot start or end with underscore');
      return;
    }

    if (normalized.length > 20) {
      setUsernameStatus('invalid');
      setUsernameError('Maximum 20 characters');
      return;
    }

    // Debounce the CF call
    setUsernameStatus('checking');
    setUsernameError(null);

    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const result: ValidateUsernameResult = await callValidateUsername(normalized);
        if (result.available) {
          setUsernameStatus('available');
          setUsernameError(null);
        } else {
          setUsernameStatus('taken');
          setUsernameError(result.error ?? `@${normalized} has already been taken`);
        }
      } catch {
        setUsernameStatus('idle');
        setUsernameError('Could not check username. Try again.');
      }
    }, 500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
    };
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();

    if (!displayName.trim()) {
      return;
    }
    if (usernameStatus !== 'available') {
      return;
    }
    if (!user) return;

    haptics.tap();
    setIsSubmitting(true);

    try {
      // Update the Firestore user doc with display name and profile image
      await updateUserDoc(user.uid, {
        displayName: displayName.trim(),
        profileImageUrl: null, // Avatar icons are stored as selectedAvatar ID, not a URL
      });

      onComplete(displayName.trim());
    } catch (error) {
      console.error('[ProfileSetup] Failed to update user doc:', error);
      setIsSubmitting(false);
    }
  }, [displayName, usernameStatus, user, selectedAvatar, onComplete]);

  // ── Derived state ──
  const isFormValid = displayName.trim().length > 0 && usernameStatus === 'available';

  const usernameStatusColor =
    usernameStatus === 'available'
      ? colors.status.success
      : usernameStatus === 'taken' || usernameStatus === 'invalid'
        ? colors.status.error
        : colors.text.meta;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[styles.headerSection, headerStyle]}>
            <Text style={styles.heading}>Set up your profile</Text>
            <Text style={styles.subtitle}>
              This is how other riders will see you.
            </Text>
          </Animated.View>

          {/* Form fields */}
          <Animated.View style={[styles.formSection, formStyle]}>
            {/* Display name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your name"
                placeholderTextColor={colors.text.meta}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                editable={!isSubmitting}
              />
            </View>

            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <View style={styles.usernameInputContainer}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  ref={usernameRef}
                  style={styles.usernameInput}
                  placeholder="choose a username"
                  placeholderTextColor={colors.text.meta}
                  value={username}
                  onChangeText={validateUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isSubmitting}
                />
                {/* Status indicator */}
                <View style={styles.usernameStatusIcon}>
                  {usernameStatus === 'checking' && (
                    <ActivityIndicator size="small" color={colors.text.meta} />
                  )}
                  {usernameStatus === 'available' && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
                  )}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <Ionicons name="close-circle" size={20} color={colors.status.error} />
                  )}
                </View>
              </View>
              {/* Username feedback */}
              {usernameStatus === 'available' && (
                <Text style={[styles.usernameHint, { color: colors.status.success }]}>
                  @{username.toLowerCase().trim()} is available!
                </Text>
              )}
              {usernameError && (
                <Text style={[styles.usernameHint, { color: usernameStatusColor }]}>
                  {usernameError}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Avatar picker */}
          <Animated.View style={[styles.avatarSection, avatarStyle]}>
            <Text style={styles.fieldLabel}>AVATAR</Text>
            <View style={styles.avatarGrid}>
              {DEFAULT_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <Pressable
                    key={avatar.id}
                    onPress={() => {
                      haptics.tap();
                      setSelectedAvatar(avatar.id);
                    }}
                    disabled={isSubmitting}
                  >
                    <View
                      style={[
                        styles.avatarOption,
                        { backgroundColor: avatar.color + '15' },
                        isSelected && { borderColor: avatar.color, borderWidth: 2.5 },
                      ]}
                    >
                      <Ionicons
                        name={avatar.icon}
                        size={28}
                        color={isSelected ? avatar.color : avatar.color + '80'}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Continue button */}
          <Animated.View style={[styles.buttonSection, buttonStyle]}>
            <Pressable
              {...continuePress.pressHandlers}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              <Animated.View
                style={[
                  styles.continueButton,
                  !isFormValid && styles.continueButtonDisabled,
                  continuePress.animatedStyle,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </Animated.View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },

  // Header
  headerSection: {
    marginBottom: spacing.xxxl,
  },
  heading: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },

  // Form
  formSection: {
    gap: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  fieldContainer: {
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1,
  },
  textInput: {
    height: 52,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  // Username
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
  },
  atSymbol: {
    fontSize: typography.sizes.input,
    color: colors.text.meta,
    marginRight: spacing.xs,
  },
  usernameInput: {
    flex: 1,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    height: '100%',
  },
  usernameStatusIcon: {
    width: 24,
    alignItems: 'center',
  },
  usernameHint: {
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
  },

  // Avatar
  avatarSection: {
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  // Button
  buttonSection: {
    marginTop: spacing.lg,
  },
  continueButton: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
});
