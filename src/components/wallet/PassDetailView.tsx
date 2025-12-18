/**
 * PassDetailView Component
 *
 * Bottom sheet for viewing passes with card flip animation:
 * - Simple blur backdrop
 * - Perfectly centered cards (no peeking)
 * - Horizontal swipe with rubber band and bounce
 * - Card flip animation to show QR code (TAP to trigger)
 * - Goopy animated dot indicators
 * - Swipe down from header to close
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  PanResponder,
  Modal,
  Image,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { PassHeroCard } from './PassHeroCard';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { getParkGradientColors } from '../../utils/parkAssets';
import { LinearGradient } from 'expo-linear-gradient';
import * as Brightness from 'expo-brightness';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card dimensions - perfectly centered
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_HORIZONTAL_MARGIN * 2);
const TOTAL_CARD_WIDTH = SCREEN_WIDTH;

// Swipe thresholds
const SWIPE_CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.5;
const HORIZONTAL_SWIPE_THRESHOLD = SCREEN_WIDTH / 4;
const RUBBER_BAND_RESISTANCE = 0.25;

// Tap detection - if movement is less than this, it's a tap not a drag
const TAP_THRESHOLD = 10;

// QR code size
const SCAN_QR_SIZE = 200;

interface PassDetailViewProps {
  tickets: Ticket[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  onSetDefault?: (ticketId: string) => void;
  onUsePass?: (ticket: Ticket) => void;
}

export const PassDetailView: React.FC<PassDetailViewProps> = ({
  tickets,
  initialIndex = 0,
  visible,
  onClose,
  onUsePass,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [internalVisible, setInternalVisible] = useState(false);

  // Refs for PanResponder (to avoid stale closures)
  const currentIndexRef = useRef(currentIndex);
  const isFlippedRef = useRef(isFlipped);
  const ticketsLengthRef = useRef(tickets.length);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);
  useEffect(() => {
    ticketsLengthRef.current = tickets.length;
  }, [tickets.length]);

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipBackgroundOpacity = useRef(new Animated.Value(0)).current;

  // Card press scale animation
  const cardPressScale = useRef(new Animated.Value(1)).current;

  // Bottom section opacity for flip transitions
  const bottomSectionOpacity = useRef(new Animated.Value(1)).current;

  // Last used text opacity for cross-fade
  const lastUsedOpacity = useRef(new Animated.Value(1)).current;
  const [displayedIndex, setDisplayedIndex] = useState(initialIndex);

  // Brightness
  const originalBrightness = useRef<number | null>(null);

  // Dot animations - initialize with correct values
  const dotAnimations = useRef<Animated.Value[]>(
    Array.from({ length: Math.max(tickets.length, 10) }, (_, i) =>
      new Animated.Value(i === initialIndex ? 1 : 0)
    )
  ).current;

  // Ensure dots array matches ticket count
  useEffect(() => {
    while (dotAnimations.length < tickets.length) {
      dotAnimations.push(new Animated.Value(0));
    }
  }, [tickets.length]);

  // Track gesture state
  const isDraggingVertical = useRef(false);
  const gestureStarted = useRef(false);
  const gestureStartX = useRef(0);
  const gestureStartY = useRef(0);

  // Animate dots
  const animateDots = useCallback((toIndex: number) => {
    const animations = dotAnimations.map((anim, i) => {
      return Animated.spring(anim, {
        toValue: i === toIndex ? 1 : 0,
        tension: 40,
        friction: 7,
        useNativeDriver: false,
      });
    });
    Animated.parallel(animations).start();
  }, [dotAnimations]);

  // Open animation
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      setCurrentIndex(initialIndex);
      setDisplayedIndex(initialIndex);
      setIsFlipped(false);
      currentIndexRef.current = initialIndex;
      isFlippedRef.current = false;
      translateX.setValue(-initialIndex * TOTAL_CARD_WIDTH);
      flipAnim.setValue(0);
      flipBackgroundOpacity.setValue(0);
      cardPressScale.setValue(1);
      bottomSectionOpacity.setValue(1);
      lastUsedOpacity.setValue(1);

      // Set dot positions immediately (no animation delay)
      dotAnimations.forEach((anim, i) => {
        anim.setValue(i === initialIndex ? 1 : 0);
      });

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialIndex]);

  // Cross-fade last used text when index changes
  useEffect(() => {
    if (currentIndex !== displayedIndex) {
      // Fade out
      Animated.timing(lastUsedOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setDisplayedIndex(currentIndex);
        // Fade in
        Animated.timing(lastUsedOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [currentIndex, displayedIndex]);

  // Close animation
  const animateClose = useCallback(() => {
    if (isFlippedRef.current) {
      setIsFlipped(false);
      isFlippedRef.current = false;
      flipAnim.setValue(0);
      flipBackgroundOpacity.setValue(0);
      if (originalBrightness.current !== null) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
        originalBrightness.current = null;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      onClose();
    });
  }, [onClose, translateY, backdropOpacity, flipAnim, flipBackgroundOpacity]);

  // Card tap handler - triggers flip (press animation handled by PanResponder)
  const handleCardTap = useCallback(() => {
    if (isFlippedRef.current) return;

    const ticket = tickets[currentIndexRef.current];
    if (!ticket) return;

    console.log('🔄 Card tap - starting flip animation');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Start the flip
    setIsFlipped(true);
    isFlippedRef.current = true;

    // Boost brightness (don't await, let it run in background)
    Brightness.getBrightnessAsync()
      .then(current => {
        originalBrightness.current = current;
        return Brightness.setBrightnessAsync(Math.min(current + 0.3, 1.0));
      })
      .catch(() => {});

    // Flip animation + scale bounce back + fade out bottom section
    Animated.parallel([
      // Scale bounces back with satisfying spring
      Animated.spring(cardPressScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      // Card rotates in 3D with easing for smooth motion
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Background fades in
      Animated.timing(flipBackgroundOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // Fade out bottom section
      Animated.timing(bottomSectionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('🔄 Flip animation complete');
    });

    onUsePass?.(ticket);
  }, [tickets, flipAnim, flipBackgroundOpacity, cardPressScale, bottomSectionOpacity, onUsePass]);

  // Flip back handler
  const handleFlipBack = useCallback(async () => {
    if (!isFlippedRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (originalBrightness.current !== null) {
      try {
        await Brightness.setBrightnessAsync(originalBrightness.current);
      } catch (e) {}
      originalBrightness.current = null;
    }

    // Animate flip back + fade in bottom section
    Animated.parallel([
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(flipBackgroundOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Fade in bottom section (delayed to sync with flip completion)
      Animated.sequence([
        Animated.delay(200), // Wait for flip to be halfway
        Animated.timing(bottomSectionOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsFlipped(false);
      isFlippedRef.current = false;
    });
  }, [flipAnim, flipBackgroundOpacity, bottomSectionOpacity]);

  // Track if this is a tap (ref for PanResponder callback access)
  const handleCardTapRef = useRef(handleCardTap);
  useEffect(() => {
    handleCardTapRef.current = handleCardTap;
  }, [handleCardTap]);

  // PanResponder - captures ALL touches, distinguishes tap vs drag on release
  const panResponder = useRef(
    PanResponder.create({
      // Capture touch on start to track taps
      onStartShouldSetPanResponder: () => {
        console.log('🟢 onStartShouldSetPanResponder called');
        return true;
      },
      onPanResponderGrant: (evt, _gs) => {
        console.log('🟢 onPanResponderGrant - touch started');
        // Record where gesture started
        gestureStartX.current = evt.nativeEvent.pageX;
        gestureStartY.current = evt.nativeEvent.pageY;
        gestureStarted.current = true;
        isDraggingVertical.current = false;

        // Animate press-down on ANY touch (not just tap)
        if (!isFlippedRef.current) {
          Animated.timing(cardPressScale, {
            toValue: 0.95, // Subtle press
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
      onMoveShouldSetPanResponder: (_, gs) => {
        if (isFlippedRef.current) return false;

        const isHorizontal = Math.abs(gs.dx) > Math.abs(gs.dy);
        const isSignificant = Math.abs(gs.dx) > TAP_THRESHOLD || Math.abs(gs.dy) > TAP_THRESHOLD;

        if (!isSignificant) return false;

        if (!isHorizontal && gs.dy > 0) {
          isDraggingVertical.current = true;
          return true;
        }

        if (isHorizontal) {
          isDraggingVertical.current = false;
          return true;
        }

        return false;
      },
      onPanResponderMove: (_, gs) => {
        const totalMovement = Math.abs(gs.dx) + Math.abs(gs.dy);

        // If minimal movement, don't update translations (it's likely a tap)
        if (totalMovement < TAP_THRESHOLD) return;

        if (isDraggingVertical.current) {
          const clampedY = Math.max(0, gs.dy);
          translateY.setValue(clampedY);
          const opacity = 1 - (clampedY / SCREEN_HEIGHT) * 0.5;
          backdropOpacity.setValue(Math.max(0, opacity));
        } else {
          const current = currentIndexRef.current;
          const maxIndex = ticketsLengthRef.current - 1;
          const baseOffset = -current * TOTAL_CARD_WIDTH;
          let dx = gs.dx;

          // Rubber band at edges
          const isAtStart = current === 0 && dx > 0;
          const isAtEnd = current === maxIndex && dx < 0;

          if (isAtStart || isAtEnd) {
            dx = dx * RUBBER_BAND_RESISTANCE;
          }

          translateX.setValue(baseOffset + dx);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const totalMovement = Math.abs(gs.dx) + Math.abs(gs.dy);
        const wasTap = totalMovement < TAP_THRESHOLD;

        console.log('🎯 PanResponder release - movement:', totalMovement, 'wasTap:', wasTap, 'isFlipped:', isFlippedRef.current);
        gestureStarted.current = false;

        // TAP DETECTED - trigger flip! (handleCardTap will bounce back the scale)
        if (wasTap && !isFlippedRef.current) {
          console.log('🎯 Calling handleCardTap');
          handleCardTapRef.current();
          return;
        }

        // For drags, bounce the card scale back
        if (!isFlippedRef.current) {
          Animated.spring(cardPressScale, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }

        // Handle drag release
        if (isDraggingVertical.current) {
          const shouldClose = gs.dy > SWIPE_CLOSE_THRESHOLD || gs.vy > VELOCITY_THRESHOLD;

          if (shouldClose) {
            animateClose();
          } else {
            Animated.parallel([
              Animated.spring(translateY, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start();
          }
          isDraggingVertical.current = false;
        } else {
          const current = currentIndexRef.current;
          const maxIndex = ticketsLengthRef.current - 1;
          let newIndex = current;

          // Determine direction
          if (gs.vx < -0.5 || (gs.vx >= -0.5 && gs.dx < -HORIZONTAL_SWIPE_THRESHOLD)) {
            newIndex = current + 1;
          } else if (gs.vx > 0.5 || (gs.vx <= 0.5 && gs.dx > HORIZONTAL_SWIPE_THRESHOLD)) {
            newIndex = current - 1;
          }

          // Clamp to valid range
          newIndex = Math.max(0, Math.min(newIndex, maxIndex));

          if (newIndex !== current) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);
          animateDots(newIndex);

          // Animate with bounce
          Animated.spring(translateX, {
            toValue: -newIndex * TOTAL_CARD_WIDTH,
            tension: 40,
            friction: 7, // Lower friction = more bounce
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Header swipe responder - only handles swipe down to close
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => {
        // Only respond to downward swipes
        return gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx);
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
          const opacity = 1 - (gs.dy / SCREEN_HEIGHT) * 0.5;
          backdropOpacity.setValue(Math.max(0, opacity));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SWIPE_CLOSE_THRESHOLD || gs.vy > VELOCITY_THRESHOLD) {
          animateClose();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Navigate via dot tap
  const navigateToIndex = useCallback((index: number) => {
    if (index === currentIndexRef.current || isFlippedRef.current) return;
    if (index < 0 || index >= ticketsLengthRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    currentIndexRef.current = index;
    setCurrentIndex(index);
    animateDots(index);

    Animated.spring(translateX, {
      toValue: -index * TOTAL_CARD_WIDTH,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [translateX, animateDots]);

  // Backdrop tap
  const handleBackdropPress = useCallback(() => {
    if (isFlippedRef.current) {
      handleFlipBack();
    } else {
      animateClose();
    }
  }, [animateClose, handleFlipBack]);

  if (!internalVisible || tickets.length === 0) return null;

  const currentTicket = tickets[currentIndex];
  const gradientColors: [string, string] = currentTicket ? getParkGradientColors(currentTicket.parkName) : ['#333', '#666'];

  // Format date or N/A
  const formatLastUsed = (date?: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Flip interpolations
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-90deg', '-90deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0.5, 0.51, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const passNumber = currentTicket?.qrData.split('-').pop() || currentTicket?.qrData || '';

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={animateClose}
    >
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Pressable>

      {/* Flip background - blurred hero image or gradient fallback */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: flipBackgroundOpacity }
        ]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        {/* Hero image background with blur, or gradient fallback */}
        {currentTicket?.heroImageSource || currentTicket?.heroImageUri ? (
          <Image
            source={currentTicket.heroImageSource || { uri: currentTicket.heroImageUri }}
            style={styles.flipBackgroundImage}
            resizeMode="cover"
            blurRadius={25}
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.flipOverlay} />
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        {isFlipped && (
          <Pressable style={StyleSheet.absoluteFill} onPress={handleFlipBack} />
        )}
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[styles.contentContainer, { transform: [{ translateY }] }]}
        pointerEvents="box-none"
      >
        {/* Header - swipe down to close */}
        <View
          style={[styles.header, { paddingTop: insets.top + 16 }]}
          {...headerPanResponder.panHandlers}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={isFlipped ? handleFlipBack : animateClose}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              hitSlop={12}
            >
              <Ionicons name={isFlipped ? "arrow-back" : "close"} size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>
              {isFlipped ? 'Ready to Scan' : 'Passes'}
            </Text>
            <View style={styles.closeButton} />
          </View>
        </View>

        {/* Cards - tap handled by PanResponder */}
        <View style={styles.cardContainer} {...panResponder.panHandlers}>
          <Animated.View style={[styles.cardStack, { transform: [{ translateX }] }]}>
            {tickets.map((ticket, index) => (
              <View key={ticket.id} style={styles.cardSlot}>
                {/* Front - with press scale animation */}
                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      opacity: index === currentIndex ? frontOpacity : 1,
                      transform: [
                        { perspective: 1000 },
                        { rotateY: index === currentIndex ? frontRotateY : '0deg' },
                        { scale: index === currentIndex ? cardPressScale : 1 },
                      ],
                    },
                  ]}
                >
                  <View style={styles.cardPressable}>
                    <PassHeroCard ticket={ticket} disableTouch />
                  </View>
                </Animated.View>

                {/* Back (QR) - tap to flip back */}
                {index === currentIndex && (
                  <Animated.View
                    style={[
                      styles.cardFace,
                      styles.cardBack,
                      {
                        opacity: backOpacity,
                        transform: [
                          { perspective: 1000 },
                          { rotateY: backRotateY },
                        ],
                      },
                    ]}
                  >
                    <Pressable onPress={handleFlipBack} style={styles.scanCard}>
                      {/* Logo or Park Name - match GateModeOverlay style */}
                      {ticket.logoImageSource || ticket.logoImageUri ? (
                        <View style={styles.logoContainer}>
                          <Image
                            source={ticket.logoImageSource || { uri: ticket.logoImageUri }}
                            style={styles.logoImage}
                            resizeMode="contain"
                          />
                        </View>
                      ) : (
                        <Text style={styles.scanParkName}>{ticket.parkName}</Text>
                      )}

                      <View style={styles.passTypeBadge}>
                        <Text style={styles.passTypeText}>
                          {PASS_TYPE_LABELS[ticket.passType] || 'Pass'}
                        </Text>
                      </View>

                      <View style={styles.qrContainer}>
                        <QRCodeDisplay data={ticket.qrData} size={SCAN_QR_SIZE} />
                      </View>

                      <Text style={styles.passNumber}>PASS #: {passNumber}</Text>

                      {ticket.passholder && (
                        <Text style={styles.passholder}>{ticket.passholder}</Text>
                      )}

                      <Text style={styles.flipHint}>Tap to flip back</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Bottom section - animated opacity for smooth transitions */}
        <Animated.View
          style={[styles.bottomSection, { opacity: bottomSectionOpacity }]}
          pointerEvents={isFlipped ? 'none' : 'auto'}
        >
          {/* Instruction */}
          <View style={styles.instructionBadge}>
            <Ionicons name="scan-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.instructionText}>Tap card to scan</Text>
          </View>

          {/* Last Used - with cross-fade animation */}
          <Animated.View style={[styles.lastUsedContainer, { opacity: lastUsedOpacity }]}>
            <Text style={styles.lastUsedText}>
              Last used: {formatLastUsed(tickets[displayedIndex]?.lastUsedAt)}
            </Text>
          </Animated.View>

          {/* Dots */}
          {tickets.length > 1 && (
            <View style={[styles.indicatorContainer, { paddingBottom: insets.bottom + 16 }]}>
              {tickets.map((_, index) => {
                const dotAnim = dotAnimations[index] || new Animated.Value(0);

                const width = dotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 24],
                });

                const scaleY = dotAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.3, 1],
                });

                return (
                  <Pressable key={index} onPress={() => navigateToIndex(index)} hitSlop={8}>
                    <Animated.View
                      style={[
                        styles.indicator,
                        {
                          width,
                          transform: [{ scaleY }],
                          backgroundColor: dotAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['rgba(255, 255, 255, 0.3)', '#FFFFFF'],
                          }),
                        },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          {tickets.length === 1 && <View style={{ height: insets.bottom + 32 }} />}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  flipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  flipBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  contentContainer: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSlot: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    // Ensure proper stacking context for flip
    position: 'relative',
  },
  cardFace: {
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    // Center the back card exactly over the front
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPressable: {
    width: CARD_WIDTH,
  },

  scanCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
  // Logo (like GateModeOverlay)
  logoContainer: {
    height: 50,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 50,
  },
  scanParkName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  passTypeBadge: {
    backgroundColor: `${colors.accent.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  passTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  passNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  passholder: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
    marginTop: 8,
  },
  flipHint: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 16,
  },

  bottomSection: {
    alignItems: 'center',
    paddingTop: 12,
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  lastUsedContainer: {
    marginBottom: 12,
    height: 20,
  },
  lastUsedText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});

export default PassDetailView;
