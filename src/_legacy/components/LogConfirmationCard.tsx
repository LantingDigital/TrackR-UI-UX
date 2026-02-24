import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';

import { SearchableItem } from '../data/mockSearchData';
import { addQuickLog, RideLog } from '../stores/rideLogStore';
import { useTabBar } from '../contexts/TabBarContext';
import { SuccessAnimation } from './feedback/SuccessAnimation';
import { useToast } from './feedback/useToast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LogConfirmationCardProps {
  visible: boolean;
  item: SearchableItem | null;
  initialPosition: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onLogComplete: () => void;
  onRateNow?: (item: SearchableItem, newLog: RideLog) => void;
}

export const LogConfirmationCard: React.FC<LogConfirmationCardProps> = ({
  visible,
  item,
  initialPosition,
  onClose,
  onLogComplete,
  onRateNow,
}) => {
  const insets = useSafeAreaInsets();
  const [isLogged, setIsLogged] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const tabBar = useTabBar();
  const { showToast } = useToast();

  // Animation shared values
  const cardScale = useSharedValue(0.3);
  const cardOpacity = useSharedValue(0);
  const cardTranslateX = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Success state animations
  const successScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);

  // Final card dimensions (centered, Apple Wallet style)
  const finalWidth = SCREEN_WIDTH - 48;
  const finalHeight = 380;
  const finalX = (SCREEN_WIDTH - finalWidth) / 2;
  const finalY = (SCREEN_HEIGHT - finalHeight) / 2 - 20;

  // Calculate initial offset from final position
  const initialCenterX = initialPosition.x + initialPosition.width / 2;
  const initialCenterY = initialPosition.y + initialPosition.height / 2;
  const finalCenterX = finalX + finalWidth / 2;
  const finalCenterY = finalY + finalHeight / 2;
  const offsetX = initialCenterX - finalCenterX;
  const offsetY = initialCenterY - finalCenterY;

  // Hide tab bar when modal becomes visible
  useEffect(() => {
    if (visible) {
      tabBar?.hideTabBar(250);
    }
  }, [visible, tabBar]);

  // Fly-in animation when visible
  useEffect(() => {
    if (visible && item) {
      // Reset all values
      cardScale.value = 0.3;
      cardOpacity.value = 0;
      cardTranslateX.value = offsetX;
      cardTranslateY.value = offsetY;
      backdropOpacity.value = 0;
      successScale.value = 1;
      buttonOpacity.value = 1;

      setIsLogged(false);
      setShowSuccessOverlay(false);

      haptics.select();

      // Fly-in animation
      backdropOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 120, mass: 1 });
      cardOpacity.value = withTiming(1, { duration: 200 });
      cardTranslateX.value = withSpring(0, { damping: 20, stiffness: 150, mass: 1 });
      cardTranslateY.value = withSpring(0, { damping: 20, stiffness: 150, mass: 1 });
    }
  }, [visible, item, offsetX, offsetY]);

  // Handle Quick Log press
  const handleQuickLog = useCallback(() => {
    if (!item || isLogged) return;

    try {
      addQuickLog(
        { id: item.id, name: item.name, parkName: item.subtitle || '' },
        undefined
      );
    } catch (e) {
      haptics.error();
      showToast({ type: 'error', message: 'Failed to log ride' });
      return;
    }

    setIsLogged(true);
    haptics.success();

    // Hide buttons
    buttonOpacity.value = withTiming(0, { duration: 100 });

    // Subtle bounce
    successScale.value = withSequence(
      withTiming(1.03, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    // Show success overlay
    setShowSuccessOverlay(true);

    // Hold for 1.5s then fade out — using withDelay for sequencing
    backdropOpacity.value = withDelay(1500, withTiming(0, { duration: 300 }));
    cardScale.value = withDelay(1500, withTiming(0.85, { duration: 300 }));
    cardOpacity.value = withDelay(1500, withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onLogComplete)();
      }
    }));
  }, [item, isLogged, onLogComplete, buttonOpacity, successScale, cardScale, cardOpacity, backdropOpacity, showToast]);

  // Handle Rate Now press
  const handleRateNow = useCallback(() => {
    if (!item || isLogged) return;

    let newLog: RideLog;
    try {
      newLog = addQuickLog(
        { id: item.id, name: item.name, parkName: item.subtitle || '' },
        undefined
      );
    } catch (e) {
      haptics.error();
      showToast({ type: 'error', message: 'Failed to log ride' });
      return;
    }

    haptics.select();

    // Slide card out — using withTiming + runOnJS completion callback
    buttonOpacity.value = withTiming(0, { duration: 150 });
    cardTranslateY.value = withTiming(-50, { duration: 250, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withTiming(0, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(showTabBarAndNotify)(newLog);
      }
    });
  }, [item, isLogged, onLogComplete, onRateNow, buttonOpacity, cardTranslateY, cardOpacity, backdropOpacity, showToast]);

  const showTabBarAndNotify = useCallback((newLog: RideLog) => {
    tabBar?.showTabBar(250);
    if (onRateNow && item) {
      onRateNow(item, newLog);
    }
    onLogComplete();
  }, [tabBar, onRateNow, item, onLogComplete]);

  // Handle cancel/back
  const handleCancel = useCallback(() => {
    haptics.tap();
    tabBar?.showTabBar(250);

    // Fly-out animation
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withSpring(0.3, { damping: 20, stiffness: 150 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardTranslateX.value = withSpring(offsetX, { damping: 20, stiffness: 150 });
    cardTranslateY.value = withSpring(offsetY, { damping: 20, stiffness: 150 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [offsetX, offsetY, onClose, cardScale, cardOpacity, cardTranslateX, cardTranslateY, backdropOpacity, tabBar]);

  // SuccessAnimation completion
  const handleSuccessComplete = useCallback(() => {
    tabBar?.showTabBar(250);
  }, [tabBar]);

  // Animated styles
  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateX: cardTranslateX.value },
      { translateY: cardTranslateY.value },
      { scale: cardScale.value * successScale.value },
    ],
  }));

  const buttonContainerStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  if (!visible || !item) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Blurred backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          backdropAnimStyle,
        ]}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleCancel}
            disabled={isLogged}
          />
        </BlurView>
      </Animated.View>

      {/* Apple Wallet Style Card */}
      <Animated.View
        style={[
          styles.card,
          {
            position: 'absolute',
            top: finalY,
            left: finalX,
            width: finalWidth,
            height: finalHeight,
          },
          cardAnimStyle,
        ]}
      >
        {/* Hero Image - top 50% */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.coasterImage} />

          {/* Close Button - top right of image */}
          {!isLogged && (
            <Pressable style={styles.closeButton} onPress={handleCancel}>
              <BlurView intensity={60} tint="light" style={styles.closeButtonBlur}>
                <Ionicons name="close" size={20} color={colors.banner.warningText} />
              </BlurView>
            </Pressable>
          )}
        </View>

        {/* Frosted Glass Info Section - bottom 50% */}
        <View style={styles.infoSection}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.infoContent}>
            <Text style={styles.coasterName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.parkName} numberOfLines={1}>
              {item.subtitle}
            </Text>

            {/* Action Buttons or Success State */}
            {isLogged ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={24} color={colors.status.successSoft} style={{ marginRight: spacing.md }} />
                <Text style={styles.successText}>Ride Logged!</Text>
              </View>
            ) : (
              <Animated.View style={[styles.buttonRow, buttonContainerStyle]}>
                {/* Quick Log - outlined/secondary */}
                <Pressable
                  style={({ pressed }) => [
                    styles.quickLogButton,
                    pressed && styles.quickLogButtonPressed,
                  ]}
                  onPress={handleQuickLog}
                >
                  <Ionicons name="flash-outline" size={18} color={colors.accent.primary} style={{ marginRight: spacing.sm }} />
                  <Text style={styles.quickLogButtonText}>Quick Log</Text>
                </Pressable>

                {/* Rate Now - filled/primary */}
                <Pressable
                  style={({ pressed }) => [
                    styles.rateNowButton,
                    pressed && styles.rateNowButtonPressed,
                  ]}
                  onPress={handleRateNow}
                >
                  <Ionicons name="star-outline" size={18} color={colors.text.inverse} style={{ marginRight: spacing.sm }} />
                  <Text style={styles.rateNowButtonText}>Rate Now</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Success Checkmark Overlay */}
      <SuccessAnimation
        visible={showSuccessOverlay}
        size="large"
        onComplete={handleSuccessComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  backdrop: {
    backgroundColor: colors.background.overlay,
    zIndex: 180,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.modal,
    overflow: 'hidden',
    ...shadows.modal,
    zIndex: 200,
  },
  imageContainer: {
    height: '50%',
    backgroundColor: colors.background.imagePlaceholder,
    position: 'relative',
  },
  coasterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    width: 32,
    height: 32,
    borderRadius: radius.closeButton,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    height: '50%',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  infoContent: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coasterName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  parkName: {
    fontSize: typography.sizes.input,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  // Button row with two buttons side by side
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  // Quick Log - outlined style (secondary)
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    minWidth: 140,
  },
  quickLogButtonPressed: {
    backgroundColor: colors.interactive.pressedAccent,
    transform: [{ scale: 0.98 }],
  },
  quickLogButtonText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
  },
  // Rate Now - filled style (primary)
  rateNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    minWidth: 140,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rateNowButtonPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
    transform: [{ scale: 0.98 }],
  },
  rateNowButtonText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successText: {
    color: colors.status.successSoft,
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
  },
});
