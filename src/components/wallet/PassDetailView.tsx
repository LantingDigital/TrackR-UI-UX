/**
 * PassDetailView Component
 *
 * Expanded detail view for passes with:
 * - Full PassHeroCard display
 * - Card stack peek effect (shows edges of adjacent cards)
 * - Horizontal swipe navigation between passes
 * - Close button overlay
 *
 * Displayed as a modal/overlay when user taps a preview card.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket } from '../../types/wallet';
import { PassHeroCard } from './PassHeroCard';
import { GateModeOverlay } from './GateModeOverlay';
import { colors } from '../../theme/colors';
import { SPRINGS } from '../../constants/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card dimensions
const CARD_WIDTH = SCREEN_WIDTH - 32;
const PEEK_WIDTH = 24; // How much of adjacent cards to show
const CARD_GAP = 16;

interface PassDetailViewProps {
  /** Array of all tickets */
  tickets: Ticket[];
  /** Initially selected ticket index */
  initialIndex?: number;
  /** Whether the view is visible */
  visible: boolean;
  /** Called when view should close */
  onClose: () => void;
  /** Called when user wants to set a pass as default */
  onSetDefault?: (ticketId: string) => void;
  /** Called when user taps to use a pass */
  onUsePass?: (ticket: Ticket) => void;
}

export const PassDetailView: React.FC<PassDetailViewProps> = ({
  tickets,
  initialIndex = 0,
  visible,
  onClose,
  onSetDefault,
  onUsePass,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [gateModeVisible, setGateModeVisible] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Reset index when visibility changes
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      translateX.setValue(-initialIndex * (CARD_WIDTH + CARD_GAP));
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialIndex]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal gestures
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const baseOffset = -currentIndex * (CARD_WIDTH + CARD_GAP);
        translateX.setValue(baseOffset + gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vx;
        const distance = gestureState.dx;

        let newIndex = currentIndex;

        // Determine if we should navigate
        if (velocity < -0.5 || (velocity >= -0.5 && distance < -CARD_WIDTH / 3)) {
          // Swipe left - go to next
          newIndex = Math.min(currentIndex + 1, tickets.length - 1);
        } else if (velocity > 0.5 || (velocity <= 0.5 && distance > CARD_WIDTH / 3)) {
          // Swipe right - go to previous
          newIndex = Math.max(currentIndex - 1, 0);
        }

        if (newIndex !== currentIndex) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        setCurrentIndex(newIndex);

        // Animate to new position
        Animated.spring(translateX, {
          toValue: -newIndex * (CARD_WIDTH + CARD_GAP),
          ...SPRINGS.responsive,
        }).start();
      },
    })
  ).current;

  // Navigate to specific index
  const navigateToIndex = useCallback((index: number) => {
    if (index !== currentIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(index);
      Animated.spring(translateX, {
        toValue: -index * (CARD_WIDTH + CARD_GAP),
        ...SPRINGS.responsive,
      }).start();
    }
  }, [currentIndex, translateX]);

  // Handle close
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  // Handle set default
  const handleSetDefault = useCallback(() => {
    const ticket = tickets[currentIndex];
    if (ticket && onSetDefault) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSetDefault(ticket.id);
    }
  }, [currentIndex, tickets, onSetDefault]);

  // Handle use pass - opens gate mode
  const handleUsePass = useCallback(() => {
    const ticket = tickets[currentIndex];
    if (ticket) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setGateModeVisible(true);
      onUsePass?.(ticket);
    }
  }, [currentIndex, tickets, onUsePass]);

  // Close gate mode
  const handleCloseGateMode = useCallback(() => {
    setGateModeVisible(false);
  }, []);

  if (!visible || tickets.length === 0) return null;

  const currentTicket = tickets[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Header with close button */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Passes</Text>
        <View style={styles.closeButton} />
      </View>

      {/* Card Stack with Peek Effect */}
      <View style={styles.cardContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.cardStack,
            {
              transform: [{ translateX }],
              // Center the first card with peek space
              marginLeft: (SCREEN_WIDTH - CARD_WIDTH) / 2,
            },
          ]}
        >
          {tickets.map((ticket, index) => {
            // Calculate scale based on distance from current
            const distance = Math.abs(index - currentIndex);
            const scale = distance === 0 ? 1 : 0.92;
            const opacity = distance === 0 ? 1 : 0.7;

            return (
              <Animated.View
                key={ticket.id}
                style={[
                  styles.cardWrapper,
                  {
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              >
                <PassHeroCard ticket={ticket} />
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>

      {/* Page Indicators */}
      {tickets.length > 1 && (
        <View style={styles.indicatorContainer}>
          {tickets.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => navigateToIndex(index)}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + 16 }]}>
        {/* Set as Default Button */}
        {!currentTicket?.isDefault && onSetDefault && (
          <Pressable
            onPress={handleSetDefault}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons name="star-outline" size={18} color={colors.accent.primary} />
            <Text style={styles.secondaryButtonText}>Set as Default</Text>
          </Pressable>
        )}

        {/* Use Pass Button */}
        <Pressable
          onPress={handleUsePass}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons name="qr-code" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Show at Gate</Text>
        </Pressable>
      </View>

      {/* Gate Mode Overlay */}
      <GateModeOverlay
        ticket={currentTicket}
        visible={gateModeVisible}
        onClose={handleCloseGateMode}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Card Container
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
  },

  // Page Indicators
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});

export default PassDetailView;
