import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SearchableItem } from '../data/mockSearchData';
import { addQuickLog } from '../stores/rideLogStore';
import { useTabBar } from '../contexts/TabBarContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LogConfirmationCardProps {
  visible: boolean;
  item: SearchableItem | null;
  initialPosition: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onLogComplete: () => void;
}

export const LogConfirmationCard: React.FC<LogConfirmationCardProps> = ({
  visible,
  item,
  initialPosition,
  onClose,
  onLogComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [isLogged, setIsLogged] = useState(false);
  const tabBar = useTabBar();

  // Animation values
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Success state animations
  const successScale = useRef(new Animated.Value(1)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0.5)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;

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
  // (showing is handled explicitly in handleCancel and handleLogRide for better timing)
  useEffect(() => {
    if (visible) {
      tabBar?.hideTabBar(250);
    }
  }, [visible, tabBar]);

  // Fly-in animation when visible
  useEffect(() => {
    if (visible && item) {
      // IMPORTANT: Reset checkmark FIRST to prevent flicker
      checkmarkOpacity.setValue(0);
      checkmarkScale.setValue(0.5);

      // Then reset other values
      cardScale.setValue(0.3);
      cardOpacity.setValue(0);
      cardTranslateX.setValue(offsetX);
      cardTranslateY.setValue(offsetY);
      backdropOpacity.setValue(0);
      successScale.setValue(1);
      buttonOpacity.setValue(1);

      // Reset state last
      setIsLogged(false);

      // Fly-in animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          damping: 18,
          stiffness: 120,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateX, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          mass: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, item, offsetX, offsetY]);

  // Handle log ride press
  const handleLogRide = useCallback(() => {
    if (!item || isLogged) return;

    // Add to store
    addQuickLog(
      { id: item.id, name: item.name, parkName: item.subtitle || '' },
      undefined
    );

    // Set checkmark starting values BEFORE state change triggers render
    checkmarkOpacity.setValue(0);
    checkmarkScale.setValue(0.5);

    setIsLogged(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Success animation - start after tiny delay to ensure render completes
    setTimeout(() => {
      Animated.parallel([
        // Hide button instantly
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Single subtle bounce (1 -> 1.03 -> 1)
        Animated.sequence([
          Animated.timing(successScale, {
            toValue: 1.03,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(successScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Checkmark fade in and scale up
        Animated.parallel([
          Animated.timing(checkmarkOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            damping: 15,
            stiffness: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Hold for 1.5 seconds, then smooth fade out
        setTimeout(() => {
          // Show tab bar as fade-out starts
          tabBar?.showTabBar(250);

          Animated.parallel([
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(cardScale, {
              toValue: 0.85,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            // Fade out checkmark with everything else
            Animated.timing(checkmarkOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onLogComplete();
          });
        }, 1500);
      });
    }, 16);
  }, [item, isLogged, onLogComplete, buttonOpacity, successScale, checkmarkOpacity, checkmarkScale, cardScale, cardOpacity, backdropOpacity, tabBar]);

  // Handle cancel/back
  const handleCancel = useCallback(() => {
    // Show tab bar immediately when dismissing
    tabBar?.showTabBar(250);

    // Fly-out animation
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 0.3,
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateX, {
        toValue: offsetX,
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: offsetY,
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [offsetX, offsetY, onClose, cardScale, cardOpacity, cardTranslateX, cardTranslateY, backdropOpacity, tabBar]);

  if (!visible || !item) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Blurred backdrop - zIndex: 180 */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          { opacity: backdropOpacity },
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

      {/* Apple Wallet Style Card - zIndex: 200 */}
      <Animated.View
        style={[
          styles.card,
          {
            position: 'absolute',
            top: finalY,
            left: finalX,
            width: finalWidth,
            height: finalHeight,
            opacity: cardOpacity,
            transform: [
              { translateX: cardTranslateX },
              { translateY: cardTranslateY },
              { scale: Animated.multiply(cardScale, successScale) },
            ],
          },
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

            {/* Log Ride Button or Success Text */}
            {isLogged ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>Ride Logged!</Text>
              </View>
            ) : (
              <Animated.View style={{ opacity: buttonOpacity }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.logButton,
                    pressed && styles.logButtonPressed,
                  ]}
                  onPress={handleLogRide}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.logButtonText}>Log Ride</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Success Checkmark Overlay - Centered on screen, above everything */}
      {isLogged && (
        <Animated.View
          style={[
            styles.fullScreenCheckmark,
            { opacity: checkmarkOpacity },
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.checkmarkCircle,
              { transform: [{ scale: checkmarkScale }] },
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
    zIndex: 200, // Above everything else
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
  checkmarkOverlayContainer: {
    zIndex: 210, // Above the card
  },
  checkmarkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CF6769',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    minWidth: 180,
    shadowColor: '#CF6769',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logButtonPressed: {
    backgroundColor: '#B85557',
    transform: [{ scale: 0.98 }],
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
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
});
