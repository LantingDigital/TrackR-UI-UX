import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';

const CONTENT_PADDING = spacing.xxl;
const AVATAR_SIZE = 96;

interface ProfileSetupStepProps {
  displayName: string;
  bio: string;
  onDisplayNameChange: (name: string) => void;
  onBioChange: (bio: string) => void;
  onContinue: () => void;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  displayName,
  bio,
  onDisplayNameChange,
  onBioChange,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const isValid = displayName.trim().length > 0;
  const continuePress = useStrongPress({ disabled: !isValid });

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);
  const avatarOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(16);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
    headerTranslateY.value = withSpring(0, SPRINGS.responsive);

    avatarOpacity.value = withDelay(100, withTiming(1, { duration: TIMING.normal }));
    avatarScale.value = withDelay(100, withSpring(1, SPRINGS.bouncy));

    formOpacity.value = withDelay(200, withTiming(1, { duration: TIMING.normal }));
    formTranslateY.value = withDelay(200, withSpring(0, SPRINGS.responsive));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // Continue button fade
  const continueOpacity = useSharedValue(0);
  useEffect(() => {
    continueOpacity.value = withTiming(isValid ? 1 : 0, { duration: TIMING.fast });
  }, [isValid]);
  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
  }));

  const handleContinue = () => {
    if (!isValid) return;
    Keyboard.dismiss();
    haptics.tap();
    onContinue();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + spacing.xxxl }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={Keyboard.dismiss} style={styles.dismissArea}>
          {/* Header */}
          <Animated.View style={[styles.headerContainer, headerStyle]}>
            <Text style={styles.heading}>Set up your profile</Text>
            <Text style={styles.subtitle}>Let the community know who you are</Text>
          </Animated.View>

          {/* Avatar placeholder */}
          <Animated.View style={[styles.avatarContainer, avatarStyle]}>
            <View style={styles.avatarCircle}>
              <Ionicons name="camera-outline" size={32} color={colors.text.meta} />
            </View>
            <Text style={styles.avatarHint}>Add photo</Text>
          </Animated.View>

          {/* Form fields */}
          <Animated.View style={[styles.formContainer, formStyle]}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Display name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What should we call you?"
                placeholderTextColor={colors.text.meta}
                value={displayName}
                onChangeText={onDisplayNameChange}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bio (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                placeholder="Coaster enthusiast, park hopper..."
                placeholderTextColor={colors.text.meta}
                value={bio}
                onChangeText={onBioChange}
                maxLength={120}
                multiline
                textAlignVertical="top"
                blurOnSubmit
              />
            </View>
          </Animated.View>
        </Pressable>
      </ScrollView>

      {/* Continue button */}
      <View style={[styles.continueContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View style={continueStyle}>
          <Pressable
            {...continuePress.pressHandlers}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Animated.View style={[styles.continueButton, continuePress.animatedStyle]}>
              <Text style={styles.continueText}>Continue</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollContent: {
    flexGrow: 1,
  },
  dismissArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: CONTENT_PADDING,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.background.input,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarHint: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
  },
  formContainer: {
    paddingHorizontal: CONTENT_PADDING,
    gap: spacing.xl,
  },
  fieldContainer: {
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  textInput: {
    height: 48,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  bioInput: {
    height: 80,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  },
  continueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: CONTENT_PADDING,
  },
  continueButton: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
