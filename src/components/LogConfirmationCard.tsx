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
import * as Haptics from 'expo-haptics';

import { SearchableItem } from '../data/mockSearchData';
import { addQuickLog, RideLog } from '../stores/rideLogStore';
import { useTabBar } from '../contexts/TabBarContext';

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
  const tabBar = useTabBar();

  // Animation shared values
  const cardScale = useSharedValue(0.3);
  const cardOpacity = useSharedValue(0);
  const cardTranslateX = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Success state animations
  const successScale = useSharedValue(1);
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0.5);
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
      checkmarkOpacity.value = 0;
      checkmarkScale.value = 0.5;
      cardScale.value = 0.3;
      cardOpacity.value = 0;
      cardTranslateX.value = offsetX;
      cardTranslateY.value = offsetY;
      backdropOpacity.value = 0;
      successScale.value = 1;
      buttonOpacity.value = 1;

      setIsLogged(false);

      // Fly-in animation
      backdropOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 120, mass: 1 });
      cardOpacity.value = withTiming(1, { duration: 200 });
      cardTranslateX.value = withSpring(0, { damping: 20, stiffness: 150, mass: 1 });
      cardTranslateY.value = withSpring(0, { damping: 20, stiffness: 150, mass: 1 });
    }
  }, [visible, item, offsetX, offsetY]);

  // Callbacks wrapped for runOnJS
  const triggerLogComplete = useCallback(() => {
    onLogComplete();
  }, [onLogComplete]);

  const showTabBar = useCallback(() => {
    tabBar?.showTabBar(250);
  }, [tabBar]);

  // Handle Quick Log press
  const handleQuickLog = useCallback(() => {
    if (!item || isLogged) return;

    // Add to store
    addQuickLog(
      { id: item.id, name: item.name, parkName: item.subtitle || '' },
      undefined
    );

    setIsLogged(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Success animation
    setTimeout(() => {
      // Hide buttons
      buttonOpacity.value = withTiming(0, { duration: 100 });

      // Subtle bounce
      successScale.value = withSequence(
        withTiming(1.03, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      // Checkmark fade in and scale up
      checkmarkOpacity.value = withTiming(1, { duration: 250 });
      checkmarkScale.value = withSpring(1, { damping: 15, stiffness: 200 });

      // Hold for 1.5 seconds, then fade out
      setTimeout(() => {
        tabBar?.showTabBar(250);

        backdropOpacity.value = withTiming(0, { duration: 300 });
        cardScale.value = withTiming(0.85, { duration: 300 });
        cardOpacity.value = withTiming(0, { duration: 300 });
        checkmarkOpacity.value = withTiming(0, { duration: 300 });

        setTimeout(() => {
          onLogComplete();
        }, 350);
      }, 1500);
    }, 16);
  }, [item, isLogged, onLogComplete, buttonOpacity, successScale, checkmarkOpacity, checkmarkScale, cardScale, cardOpacity, backdropOpacity, tabBar]);

  // Handle Rate Now press
  const handleRateNow = useCallback(() => {
    if (!item || isLogged) return;

    // Add to store (creates a pending log)
    const newLog = addQuickLog(
      { id: item.id, name: item.name, parkName: item.subtitle || '' },
      undefined
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Slide card out (no checkmark) - animate card away
    buttonOpacity.value = withTiming(0, { duration: 150 });
    cardTranslateY.value = withTiming(-50, { duration: 250, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withTiming(0, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 300 });

    // After animation, notify parent to open RatingModal
    setTimeout(() => {
      tabBar?.showTabBar(250);
      if (onRateNow) {
        onRateNow(item, newLog);
      }
      onLogComplete();
    }, 300);
  }, [item, isLogged, onLogComplete, onRateNow, buttonOpacity, cardTranslateY, cardOpacity, backdropOpacity, tabBar]);

  // Handle cancel/back
  const handleCancel = useCallback(() => {
    tabBar?.showTabBar(250);

    // Fly-out animation
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withSpring(0.3, { damping: 20, stiffness: 150 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    cardTranslateX.value = withSpring(offsetX, { damping: 20, stiffness: 150 });
    cardTranslateY.value = withSpring(offsetY, { damping: 20, stiffness: 150 });

    setTimeout(() => {
      onClose();
    }, 300);
  }, [offsetX, offsetY, onClose, cardScale, cardOpacity, cardTranslateX, cardTranslateY, backdropOpacity, tabBar]);

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

  const checkmarkContainerStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
  }));

  const checkmarkIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
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
                <Ionicons name="close" size={20} color="#333333" />
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
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={{ marginRight: 8 }} />
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
                  <Ionicons name="flash-outline" size={18} color="#CF6769" style={{ marginRight: 6 }} />
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
                  <Ionicons name="star-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.rateNowButtonText}>Rate Now</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Success Checkmark Overlay - Centered on screen */}
      {isLogged && (
        <Animated.View
          style={[
            styles.fullScreenCheckmark,
            checkmarkContainerStyle,
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.checkmarkCircle,
              checkmarkIconStyle,
            ]}
          >
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 180,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
    zIndex: 200,
  },
  imageContainer: {
    height: '50%',
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  coasterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coasterName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 6,
  },
  parkName: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  // Button row with two buttons side by side
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  // Quick Log - outlined style (secondary)
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CF6769',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    minWidth: 140,
  },
  quickLogButtonPressed: {
    backgroundColor: '#FFF0F0',
    transform: [{ scale: 0.98 }],
  },
  quickLogButtonText: {
    color: '#CF6769',
    fontSize: 16,
    fontWeight: '600',
  },
  // Rate Now - filled style (primary)
  rateNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CF6769',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    minWidth: 140,
    shadowColor: '#CF6769',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rateNowButtonPressed: {
    backgroundColor: '#B85557',
    transform: [{ scale: 0.98 }],
  },
  rateNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600',
  },
  fullScreenCheckmark: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
