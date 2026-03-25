/**
 * ConfirmModalContext — Custom modal system replacing Alert.alert()
 *
 * Three-tier modal system:
 * 1. NEVER use Alert.alert() — always use this context
 * 2. Destructive/attention actions → custom blurred-bg modal (this component)
 * 3. Options/choices → bottom sheet (separate pattern)
 *
 * Usage:
 *   const { confirm, alert } = useConfirmModal();
 *   confirm({ title: 'Delete?', message: '...', destructive: true, onConfirm: () => {} });
 *   alert({ title: 'Error', message: '...' });
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - spacing.xxxl * 2, 320);

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface AlertOptions {
  title: string;
  message?: string;
  buttonText?: string;
  onDismiss?: () => void;
}

interface ConfirmModalContextValue {
  confirm: (options: ConfirmOptions) => void;
  alert: (options: AlertOptions) => void;
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | null>(null);

export function useConfirmModal() {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) throw new Error('useConfirmModal must be used within ConfirmModalProvider');
  return ctx;
}

export function ConfirmModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<(ConfirmOptions & { mode: 'confirm' }) | (AlertOptions & { mode: 'alert' }) | null>(null);

  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  const callbackRef = useRef<{ onConfirm?: () => void; onCancel?: () => void; onDismiss?: () => void }>({});

  const animateIn = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 22, stiffness: 280, mass: 0.8 });
    cardOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, []);

  const animateOut = useCallback((callback?: () => void) => {
    overlayOpacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) });
    cardScale.value = withTiming(0.95, { duration: 150, easing: Easing.in(Easing.cubic) });
    cardOpacity.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(setVisible)(false);
      if (callback) runOnJS(callback)();
    });
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    callbackRef.current = { onConfirm: opts.onConfirm, onCancel: opts.onCancel };
    setOptions({ ...opts, mode: 'confirm' });
    setVisible(true);
    // Reset animation values before animating in
    overlayOpacity.value = 0;
    cardScale.value = 0.9;
    cardOpacity.value = 0;
    requestAnimationFrame(() => animateIn());
  }, [animateIn]);

  const alert = useCallback((opts: AlertOptions) => {
    callbackRef.current = { onDismiss: opts.onDismiss };
    setOptions({ ...opts, mode: 'alert' });
    setVisible(true);
    overlayOpacity.value = 0;
    cardScale.value = 0.9;
    cardOpacity.value = 0;
    requestAnimationFrame(() => animateIn());
  }, [animateIn]);

  const handleConfirm = useCallback(() => {
    haptics.tap();
    animateOut(() => callbackRef.current.onConfirm?.());
  }, [animateOut]);

  const handleCancel = useCallback(() => {
    haptics.tap();
    animateOut(() => callbackRef.current.onCancel?.());
  }, [animateOut]);

  const handleAlertDismiss = useCallback(() => {
    haptics.tap();
    animateOut(() => callbackRef.current.onDismiss?.());
  }, [animateOut]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <ConfirmModalContext.Provider value={{ confirm, alert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={options?.mode === 'confirm' ? handleCancel : handleAlertDismiss}
      >
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.overlayDim} />
          </Animated.View>

          <Animated.View style={[styles.card, cardStyle]}>
            <Text style={styles.title}>{options?.title}</Text>
            {options?.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}

            <View style={styles.buttonRow}>
              {options?.mode === 'confirm' ? (
                <>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelText}>
                      {(options as ConfirmOptions).cancelText ?? 'Cancel'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.button,
                      (options as ConfirmOptions).destructive
                        ? styles.destructiveButton
                        : styles.confirmButton,
                    ]}
                    onPress={handleConfirm}
                  >
                    <Text
                      style={[
                        styles.confirmText,
                        (options as ConfirmOptions).destructive && styles.destructiveText,
                      ]}
                    >
                      {(options as ConfirmOptions).confirmText ?? 'Confirm'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={[styles.button, styles.confirmButton, styles.fullWidthButton]}
                  onPress={handleAlertDismiss}
                >
                  <Text style={styles.confirmText}>
                    {(options as AlertOptions).buttonText ?? 'OK'}
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ConfirmModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  card: {
    width: MODAL_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.modal,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    ...shadows.modal,
  },
  title: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.base + 2,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.background.page,
  },
  confirmButton: {
    backgroundColor: colors.accent.primary,
  },
  destructiveButton: {
    backgroundColor: colors.status.error,
  },
  cancelText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  confirmText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  destructiveText: {
    color: colors.text.inverse,
  },
});
