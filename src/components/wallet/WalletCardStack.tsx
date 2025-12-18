/**
 * WalletCardStack Component
 *
 * Apple Pay style card stack with "Projector Screen" morph animation.
 *
 * Animation Pattern (Two-Phase):
 * 1. PHASE 1: Pill arcs UP + LEFT while stretching horizontally (becomes wide thin strip)
 * 2. OVERSHOOT: Strip overshoots DOWN (like pulling a projector screen)
 * 3. PHASE 2: On bounce-back, height expands downward (unfurl effect)
 *
 * The spring's natural overshoot creates organic physics - the "pull" triggers the unfurl.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
  StatusBar,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Ticket } from '../../types/wallet';
import { WalletCard, CARD_WIDTH, CARD_HEIGHT } from './WalletCard';
import { EmptyWalletPrompt } from './EmptyWalletPrompt';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GAP = 12;

// Scan button dimensions (same as HomeScreen)
const CONTAINER_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const PILL_WIDTH = (CONTAINER_WIDTH - GAP * 2) / 3;
const PILL_HEIGHT = 36;

// Card stack offsets
const CARD_OFFSET_Y = -20;
const CARD_SCALE_DIFF = 0.04;
const CARD_OPACITY_DIFF = 0.12;
const CASCADE_STAGGER_DELAY = 50;

// Projector screen animation - thin strip height during Phase 1
const STRIP_HEIGHT = 24; // Thin strip after taper

interface WalletCardStackProps {
  visible: boolean;
  tickets: Ticket[];
  onClose: () => void;
  onAddTicket?: () => void;
  onSetDefault?: (ticketId: string) => void;
  onTicketUsed?: (ticketId: string) => void;
}

export const WalletCardStack: React.FC<WalletCardStackProps> = ({
  visible,
  tickets,
  onClose,
  onAddTicket,
  onSetDefault,
  onTicketUsed,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gateMode, setGateMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // =========================================
  // Animation Values - Projector Screen
  // =========================================
  // Arc progress (spring with overshoot) - drives trajectory + height unfurl
  const arcProgress = useRef(new Animated.Value(0)).current;
  // Stretch progress (timing) - drives width expansion
  const stretchProgress = useRef(new Animated.Value(0)).current;
  // Backdrop opacity
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Content fade
  const contentFade = useRef(new Animated.Value(0)).current;
  // Close mode flag (for reverse animation)
  const isClosing = useRef(false);
  // Card animations
  const cardSwipePositions = useRef<Animated.Value[]>([]).current;
  const cardCascadeAnimations = useRef<{ translateY: Animated.Value; opacity: Animated.Value }[]>([]).current;

  // =========================================
  // Position Calculations
  // =========================================
  // Scan button position (expanded state, rightmost pill)
  const expandedY = 12 + 56 + 12 + 18;
  const scanButtonLeft = HORIZONTAL_PADDING + PILL_WIDTH * 2 + GAP * 2;
  const scanButtonTop = insets.top + expandedY - PILL_HEIGHT / 2;

  const originPosition = useMemo(() => ({
    top: scanButtonTop,
    left: scanButtonLeft,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
  }), [scanButtonTop, scanButtonLeft]);

  // Final position: nearly full-screen modal
  const MODAL_MARGIN = 12;
  const finalPosition = useMemo(() => ({
    top: insets.top + 16,
    left: MODAL_MARGIN,
    width: SCREEN_WIDTH - MODAL_MARGIN * 2,
    height: SCREEN_HEIGHT - insets.top - 16 - insets.bottom - 16,
    borderRadius: 28,
  }), [insets.top, insets.bottom]);

  // =========================================
  // Sync Animation Arrays
  // =========================================
  useEffect(() => {
    while (cardSwipePositions.length < tickets.length) {
      cardSwipePositions.push(new Animated.Value(0));
    }
    while (cardCascadeAnimations.length < tickets.length) {
      cardCascadeAnimations.push({
        translateY: new Animated.Value(30 + cardCascadeAnimations.length * 10),
        opacity: new Animated.Value(0),
      });
    }
  }, [tickets.length]);

  useEffect(() => {
    if (visible && !isOpen) {
      setCurrentIndex(0);
      setGateMode(false);
      cardSwipePositions.forEach((pos) => pos.setValue(0));
    }
  }, [visible, isOpen]);

  // =========================================
  // Open/Close Animation - Projector Screen
  // =========================================
  useEffect(() => {
    if (visible && !isOpen) {
      // OPENING
      setIsOpen(true);
      isClosing.current = false;

      // Reset values
      arcProgress.setValue(0);
      stretchProgress.setValue(0);
      backdropOpacity.setValue(0);
      contentFade.setValue(0);

      cardCascadeAnimations.forEach((anim) => {
        anim.translateY.setValue(30);
        anim.opacity.setValue(0);
      });

      requestAnimationFrame(() => {
        Animated.parallel([
          // Arc trajectory with overshoot (spring)
          // Low damping = more overshoot for the "pull" effect
          Animated.spring(arcProgress, {
            toValue: 1,
            damping: 10,        // Low damping for visible overshoot
            stiffness: 35,      // Lower stiffness for slower, more dramatic motion
            mass: 1.3,          // Higher mass for momentum
            useNativeDriver: false,
          }),
          // Horizontal stretch (timing) - faster than arc
          Animated.timing(stretchProgress, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Backdrop fades in
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Content fades in after morph settles
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            animateCardsIn();
          });
        });
      });
    } else if (!visible && isOpen) {
      // CLOSING
      isClosing.current = true;

      Animated.sequence([
        // Content fades out first
        Animated.timing(contentFade, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        // Then morph back + backdrop fade (parallel)
        Animated.parallel([
          Animated.timing(stretchProgress, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(arcProgress, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setIsOpen(false);
        isClosing.current = false;
      });
    }
  }, [visible]);

  const animateCardsIn = useCallback(() => {
    const animations = cardCascadeAnimations.slice(0, Math.min(tickets.length, 3)).map((anim, index) => {
      return Animated.sequence([
        Animated.delay(index * CASCADE_STAGGER_DELAY),
        Animated.parallel([
          Animated.spring(anim.translateY, {
            toValue: 0,
            damping: 16,
            stiffness: 180,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [tickets.length, cardCascadeAnimations]);

  // =========================================
  // Projector Screen Interpolations
  // =========================================

  // TOP POSITION
  // Phase 1 (0 → 0.5): Arc UPWARD (above final position)
  // Phase 1.5 (0.5 → 0.7): Move to final top position
  // Overshoot (0.7 → 1.0+): Spring overshoots DOWN past final, then settles
  // The spring naturally goes past 1.0, creating the "pull down" effect
  const morphTop = arcProgress.interpolate({
    inputRange: [0, 0.3, 0.6, 0.85, 1],
    outputRange: [
      originPosition.top,           // Start: Scan button position
      finalPosition.top - 40,       // Arc UP: 40px above final
      finalPosition.top,            // Arrive at final top
      finalPosition.top + 60,       // Overshoot DOWN (the "pull")
      finalPosition.top,            // Settle at final
    ],
    extrapolate: 'clamp',
  });

  // LEFT POSITION
  // Arc from right (scan button) toward center-left during Phase 1
  const morphLeft = stretchProgress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [
      originPosition.left,
      finalPosition.left + (finalPosition.width - originPosition.width) * 0.3, // Move left as it stretches
      finalPosition.left,
    ],
    extrapolate: 'clamp',
  });

  // WIDTH - Stretch to full modal width during Phase 1
  // Slight "bow" at middle (taffy/elastic feel)
  const morphWidth = stretchProgress.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [
      originPosition.width,           // Original pill width
      originPosition.width * 1.1,     // Slight bulge during stretch
      finalPosition.width * 0.9,      // Almost full width
      finalPosition.width,            // Full modal width
    ],
    extrapolate: 'clamp',
  });

  // HEIGHT - The key "projector screen" effect
  // Phase 1: Taper thinner while stretching horizontally
  // Phase 2 (overshoot → settle): Expand to full height during bounce-back
  const morphHeight = arcProgress.interpolate({
    inputRange: [0, 0.3, 0.6, 0.85, 1],
    outputRange: [
      originPosition.height,          // Original pill height
      STRIP_HEIGHT,                   // Taper to thin strip
      STRIP_HEIGHT,                   // Stay thin through arc
      STRIP_HEIGHT * 1.5,             // Start expanding during overshoot
      finalPosition.height,           // Full height on settle (unfurl!)
    ],
    extrapolate: 'clamp',
  });

  // BORDER RADIUS - Pill to rectangle
  const morphBorderRadius = stretchProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      originPosition.borderRadius,    // Pill radius
      12,                             // Smaller radius as strip
      finalPosition.borderRadius,     // Final card radius
    ],
    extrapolate: 'clamp',
  });

  // Pill content (Scan label) fades out quickly
  const pillContentOpacity = stretchProgress.interpolate({
    inputRange: [0, 0.15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // =========================================
  // Swipe Handlers
  // =========================================
  const goToNextCard = useCallback(() => {
    if (currentIndex < tickets.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(cardSwipePositions[currentIndex], {
        toValue: -1,
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, tickets.length, cardSwipePositions]);

  const goToPrevCard = useCallback(() => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(cardSwipePositions[currentIndex - 1], {
        toValue: 0,
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, cardSwipePositions]);

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGateMode((prev) => {
      const newGateMode = !prev;
      if (newGateMode && onTicketUsed && tickets[currentIndex]) {
        onTicketUsed(tickets[currentIndex].id);
      }
      return newGateMode;
    });
  }, [currentIndex, tickets, onTicketUsed]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -50) {
          goToNextCard();
        } else if (gesture.dy > 50) {
          if (currentIndex === 0) {
            handleClose();
          } else {
            goToPrevCard();
          }
        }
      },
    })
  ).current;

  // =========================================
  // Card Styles
  // =========================================
  const getCardStyle = (index: number) => {
    const stackPosition = index - currentIndex;

    if (stackPosition < 0) {
      return {
        opacity: 0,
        transform: [{ translateY: CARD_OFFSET_Y * 3 }, { scale: 0.85 }],
        zIndex: 0,
      };
    }

    const baseScale = 1 - stackPosition * CARD_SCALE_DIFF;
    const baseTranslateY = stackPosition * CARD_OFFSET_Y;
    const baseOpacity = 1 - stackPosition * CARD_OPACITY_DIFF;
    const swipePos = cardSwipePositions[index] || new Animated.Value(0);
    const cascadeAnim = cardCascadeAnimations[index];

    return {
      opacity: Animated.multiply(
        baseOpacity,
        cascadeAnim ? cascadeAnim.opacity : 1
      ),
      transform: [
        {
          translateY: Animated.add(
            swipePos.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-CARD_HEIGHT, baseTranslateY, CARD_HEIGHT],
            }),
            cascadeAnim ? cascadeAnim.translateY : 0
          ),
        },
        { scale: baseScale },
      ],
      zIndex: 10 - stackPosition,
    };
  };

  if (!visible && !isOpen) return null;

  const hasTickets = tickets.length > 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      <StatusBar barStyle={gateMode ? 'dark-content' : 'light-content'} />

      {/* Full-screen blur backdrop - covers EVERYTHING */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: backdropOpacity },
        ]}
      >
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </BlurView>
      </Animated.View>

      {/* Morphing container - the "projector screen" */}
      <Animated.View
        style={[
          styles.morphingContainer,
          {
            top: morphTop,
            left: morphLeft,
            width: morphWidth,
            height: morphHeight,
            borderRadius: morphBorderRadius,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Pill content (Scan label) - fades out quickly */}
        <Animated.View
          style={[
            styles.pillContent,
            { opacity: pillContentOpacity },
          ]}
        >
          <Ionicons name="barcode-outline" size={16} color="#000000" />
          <Animated.Text style={styles.pillLabel}>Scan</Animated.Text>
        </Animated.View>

        {/* Modal content - fades in after unfurl */}
        <Animated.View
          style={[
            styles.modalContent,
            { opacity: contentFade },
          ]}
        >
          {/* Header */}
          {!gateMode && (
            <View style={[styles.header, { paddingTop: spacing.base }]}>
              <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
                <View style={styles.closeButtonInner}>
                  <Ionicons name="close" size={22} color={colors.text.primary} />
                </View>
              </Pressable>

              {hasTickets && tickets.length > 1 && (
                <View style={styles.counter}>
                  <Ionicons name="card-outline" size={14} color="#FFFFFF" />
                  <View style={styles.counterDots}>
                    {tickets.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.counterDot,
                          i === currentIndex && styles.counterDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Cards container */}
          <View style={styles.cardsContainer}>
            {hasTickets ? (
              <View style={gateMode ? styles.gateModeContainer : undefined}>
                {tickets.map((ticket, index) => {
                  if (index < currentIndex || index > currentIndex + 2) {
                    return null;
                  }

                  const cardStyle = getCardStyle(index);

                  return (
                    <Animated.View
                      key={ticket.id}
                      style={[
                        styles.cardWrapper,
                        {
                          opacity: cardStyle.opacity,
                          transform: cardStyle.transform,
                          zIndex: cardStyle.zIndex,
                        },
                      ]}
                    >
                      <WalletCard
                        ticket={ticket}
                        isFront={index === currentIndex}
                        gateMode={gateMode && index === currentIndex}
                        onPress={index === currentIndex ? handleCardPress : undefined}
                        onSetDefault={
                          !gateMode && onSetDefault
                            ? () => onSetDefault(ticket.id)
                            : undefined
                        }
                      />
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <EmptyWalletPrompt onAddTicket={onAddTicket} onClose={handleClose} />
            )}
          </View>

          {/* Swipe hint */}
          {hasTickets && !gateMode && tickets.length > 1 && (
            <View style={styles.swipeHint}>
              <Ionicons
                name={currentIndex < tickets.length - 1 ? 'chevron-up' : 'chevron-down'}
                size={28}
                color="rgba(0, 0, 0, 0.3)"
              />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  morphingContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 24,
  },
  pillContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  counterDots: {
    flexDirection: 'row',
    gap: 4,
  },
  counterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  counterDotActive: {
    backgroundColor: '#FFFFFF',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateModeContainer: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    alignSelf: 'center',
  },
  swipeHint: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
});
