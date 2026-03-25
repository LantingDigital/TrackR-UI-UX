/**
 * OnboardingPassDetail
 *
 * Stripped copy of PassDetailView for onboarding demo (Screen 4).
 * Matches the real wallet behavior:
 *  - Front face backdrop: dark blur over wallet content (no card art)
 *  - Hero section: card art image with gradient overlay
 *  - QR flip: card art becomes blurred background
 *  - Real QR code via react-native-qrcode-svg
 *  - Goopy animated dot indicators (spring width + scaleY)
 *  - Properly centered card
 */

import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import { FadeInImage } from '../../../components/FadeInImage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Ticket, PASS_TYPE_LABELS } from '../../../types/wallet';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { SPRINGS } from '../../../constants/animations';
import { getParkGradientColors } from '../../../utils/parkAssets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// No separate card art mapping needed — uses ticket.heroImageSource directly

// Card dimensions — matches real PassDetailView (16px margin, perfectly centered)
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_HORIZONTAL_MARGIN * 2);
const CARD_ASPECT_RATIO = 1.15;
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO;
const HERO_HEIGHT_RATIO = 0.52;
const FOOTER_HEIGHT_RATIO = 0.48;

// QR code size
const QR_SIZE = 120;

// ============================================
// Animated Dot Indicator
// ============================================

const AnimatedDot: React.FC<{
  isActive: boolean;
  index: number;
}> = ({ isActive }) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 12,
      stiffness: 65,
      mass: 0.8,
    });
  }, [isActive]);

  const dotStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [8, 24], Extrapolation.CLAMP),
    transform: [
      {
        scaleY: interpolate(
          progress.value,
          [0, 0.5, 1],
          [1, 1.3, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.3)', '#FFFFFF'],
    ),
  }));

  return <Animated.View style={[styles.dotIndicator, dotStyle]} />;
};

// ============================================
// Component
// ============================================

export interface OnboardingPassDetailRef {
  flip: () => void;
  dismiss: () => void;
  swipeTo: (index: number) => void;
}

interface OnboardingPassDetailProps {
  ticket: Ticket | null;
  allTickets?: Ticket[];
  visible: boolean;
  onClose: () => void;
}

export const OnboardingPassDetail = forwardRef<OnboardingPassDetailRef, OnboardingPassDetailProps>(
  function OnboardingPassDetail({ ticket, allTickets, visible, onClose }, ref) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [internalVisible, setInternalVisible] = useState(false);
    const isFlippedRef = useRef(false);
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);

    // Reanimated shared values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const flipProgress = useSharedValue(0);
    const flipBgOpacity = useSharedValue(0);
    const cardScale = useSharedValue(1);
    const bottomSectionOpacity = useSharedValue(1);
    // Spring-driven horizontal pager (matches real PassDetailView)
    const cardTranslateX = useSharedValue(0);

    const tickets = allTickets && allTickets.length > 0 ? allTickets : (ticket ? [ticket] : []);

    // Open animation
    useEffect(() => {
      if (visible && ticket) {
        setInternalVisible(true);
        setIsFlipped(false);
        isFlippedRef.current = false;
        flipProgress.value = 0;
        flipBgOpacity.value = 0;
        cardScale.value = 1;
        bottomSectionOpacity.value = 1;

        const idx = tickets.findIndex(t => t.id === ticket.id);
        setActiveTicketIndex(idx >= 0 ? idx : 0);
        // Set initial pager position instantly (no animation)
        cardTranslateX.value = -idx * SCREEN_WIDTH;

        backdropOpacity.value = withTiming(1, { duration: 300 });
        translateY.value = withSpring(0, SPRINGS.stiff);
      }
    }, [visible, ticket]);

    // Close animation
    const animateClose = useCallback(() => {
      if (isFlippedRef.current) {
        setIsFlipped(false);
        isFlippedRef.current = false;
        flipProgress.value = 0;
        flipBgOpacity.value = 0;
      }

      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 250 });

      setTimeout(() => {
        setInternalVisible(false);
        onClose();
      }, 300);
    }, [onClose]);

    // Flip to back (show QR)
    const handleFlip = useCallback(() => {
      if (isFlippedRef.current) return;

      setIsFlipped(true);
      isFlippedRef.current = true;

      cardScale.value = withSpring(1, SPRINGS.responsive);
      flipProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      flipBgOpacity.value = withTiming(1, { duration: 350 });
      bottomSectionOpacity.value = withTiming(0, { duration: 200 });
    }, []);

    // Flip back to front
    const handleFlipBack = useCallback(() => {
      if (!isFlippedRef.current) return;

      flipProgress.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
      flipBgOpacity.value = withTiming(0, { duration: 400 });
      bottomSectionOpacity.value = withTiming(1, { duration: 300 });

      setTimeout(() => {
        setIsFlipped(false);
        isFlippedRef.current = false;
      }, 500);
    }, []);

    // Spring-driven pager animated style (matches real PassDetailView physics)
    const pagerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: cardTranslateX.value }],
    }));

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      flip: () => {
        if (isFlippedRef.current) {
          handleFlipBack();
        } else {
          handleFlip();
        }
      },
      dismiss: () => {
        animateClose();
      },
      swipeTo: (index: number) => {
        if (index >= 0 && index < tickets.length) {
          // Spring animation matching real PassDetailView: tension 65, friction 12
          cardTranslateX.value = withSpring(-index * SCREEN_WIDTH, {
            damping: 14,
            stiffness: 65,
            mass: 1,
          });
          setActiveTicketIndex(index);
        }
      },
    }));

    const handleBackdropPress = useCallback(() => {
      if (isFlippedRef.current) {
        handleFlipBack();
      } else {
        animateClose();
      }
    }, [animateClose, handleFlipBack]);

    const handleCardPress = useCallback(() => {
      if (!isFlippedRef.current) {
        cardScale.value = withTiming(0.95, { duration: 100 });
        setTimeout(() => {
          handleFlip();
        }, 100);
      }
    }, [handleFlip]);

    // -- Animated styles --

    const backdropAnimStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const flipBgAnimStyle = useAnimatedStyle(() => ({
      opacity: flipBgOpacity.value,
    }));

    // Front face rotation
    const frontCardStyle = useAnimatedStyle(() => ({
      opacity: interpolate(flipProgress.value, [0, 0.49, 0.5], [1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: 1000 },
        {
          rotateY: `${interpolate(
            flipProgress.value,
            [0, 0.5, 1],
            [0, 90, 90],
            Extrapolation.CLAMP,
          )}deg`,
        },
        { scale: cardScale.value },
      ],
    }));

    // Back face rotation
    const backCardStyle = useAnimatedStyle(() => ({
      opacity: interpolate(flipProgress.value, [0.5, 0.51, 1], [0, 1, 1], Extrapolation.CLAMP),
      transform: [
        { perspective: 1000 },
        {
          rotateY: `${interpolate(
            flipProgress.value,
            [0, 0.5, 1],
            [-90, -90, 0],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    }));

    const bottomAnimStyle = useAnimatedStyle(() => ({
      opacity: bottomSectionOpacity.value,
    }));

    if (!internalVisible || !ticket) return null;

    const displayTicket = tickets[activeTicketIndex] || ticket;
    const gradientColors = getParkGradientColors(displayTicket.parkName);
    const passNumber = displayTicket.qrData.split('-').pop() || displayTicket.qrData;
    const passTypeLabel = PASS_TYPE_LABELS[displayTicket.passType] || 'Pass';
    const cardArtSource = displayTicket.heroImageSource;

    return (
      <View style={styles.overlayRoot}>
        {/* Backdrop — dark blur over wallet content (matches real PassDetailView) */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </Pressable>

        {/* Flip background — card art blurred, only visible when QR is showing */}
        <Animated.View
          style={[StyleSheet.absoluteFill, flipBgAnimStyle]}
          pointerEvents={isFlipped ? 'auto' : 'none'}
        >
          {cardArtSource ? (
            <Image
              source={cardArtSource}
              style={styles.cardArtBackground}
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
          style={[styles.contentContainer, contentStyle]}
          pointerEvents="box-none"
        >
          {/* Header — paddingTop matches real app's insets.top + 16 (~75px on dynamic island devices) */}
          <View style={[styles.header, { paddingTop: 75 }]}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={isFlipped ? handleFlipBack : animateClose}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
                hitSlop={12}
              >
                <Ionicons name={isFlipped ? 'arrow-back' : 'close'} size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.headerTitle}>
                {isFlipped ? 'Ready to Scan' : 'Passes'}
              </Text>
              <View style={styles.closeButton} />
            </View>
          </View>

          {/* Card area — centered */}
          <View style={styles.cardContainer}>
            {/* Front face — spring-driven hero card pager (matches real PassDetailView) */}
            <Animated.View style={[styles.cardFace, frontCardStyle]}>
              <View style={styles.pagerClip}>
                <Animated.View style={[styles.pagerRow, pagerAnimatedStyle]}>
                  {tickets.map((t) => {
                    const tGradient = getParkGradientColors(t.parkName);
                    const tCardArt = t.heroImageSource;
                    const tPassNumber = t.qrData.split('-').pop() || t.qrData;
                    return (
                      <View key={t.id} style={styles.pagerSlot}>
                        <Pressable onPress={handleCardPress} style={styles.heroCard}>
                          {/* Hero section — card art image or gradient fallback */}
                          <View style={[styles.heroSection, { height: CARD_HEIGHT * HERO_HEIGHT_RATIO }]}>
                            {tCardArt ? (
                              <FadeInImage
                                source={tCardArt}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                              />
                            ) : (
                              <LinearGradient
                                colors={tGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                            )}

                            {/* Darkening overlay for text readability */}
                            <LinearGradient
                              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)']}
                              locations={[0, 0.4, 1]}
                              style={StyleSheet.absoluteFill}
                            />

                            {/* Park name at top */}
                            <View style={styles.parkNameWrapper}>
                              <LinearGradient
                                colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)', 'rgba(255,255,255,0)']}
                                style={styles.parkNameGradientBg}
                              />
                              <Text style={styles.parkNameText}>{t.parkName}</Text>
                            </View>

                            {/* Passholder name at bottom */}
                            {t.passholder && (
                              <View style={styles.passholderContainer}>
                                <Text style={styles.passholderText}>{t.passholder}</Text>
                              </View>
                            )}
                          </View>

                          {/* White footer with QR code */}
                          <View style={[styles.footerSection, { height: CARD_HEIGHT * FOOTER_HEIGHT_RATIO }]}>
                            <View style={styles.codeContainer}>
                              <QRCode
                                value={t.qrData}
                                size={QR_SIZE}
                                backgroundColor="#FFFFFF"
                                color="#1A1A1A"
                              />
                            </View>
                            <Text style={styles.passNumberText}>PASS #: {tPassNumber}</Text>
                          </View>
                        </Pressable>
                      </View>
                    );
                  })}
                </Animated.View>
              </View>

              {/* Animated dot indicators (only if multiple tickets) */}
              {tickets.length > 1 && (
                <View style={styles.dotIndicatorRow}>
                  {tickets.map((t, i) => (
                    <AnimatedDot
                      key={t.id}
                      index={i}
                      isActive={i === activeTicketIndex}
                    />
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Back face — scan card with QR (always shows active ticket) */}
            <Animated.View style={[styles.cardFace, styles.cardBack, backCardStyle]}>
              <Pressable onPress={handleFlipBack} style={styles.scanCard}>
                <Text style={styles.scanParkName}>{displayTicket.parkName}</Text>

                <View style={styles.passTypeBadge}>
                  <Text style={styles.passTypeText}>{passTypeLabel}</Text>
                </View>

                <View style={styles.qrContainer}>
                  <QRCode
                    value={displayTicket.qrData}
                    size={160}
                    backgroundColor="#FFFFFF"
                    color="#1A1A1A"
                  />
                </View>

                <Text style={styles.passNumberLabel}>PASS #: {passNumber}</Text>

                {displayTicket.passholder && (
                  <Text style={styles.passholderLabel}>{displayTicket.passholder}</Text>
                )}

                <Text style={styles.flipHint}>Tap to flip back</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Bottom section — instruction + last used */}
          <Animated.View
            style={[styles.bottomSection, bottomAnimStyle]}
            pointerEvents={isFlipped ? 'none' : 'auto'}
          >
            <View style={styles.instructionBadge}>
              <Ionicons name="scan-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.instructionText}>Tap card to scan</Text>
            </View>

            <View style={styles.lastUsedContainer}>
              <Text style={styles.lastUsedText}>
                Last used: {ticket.lastUsedAt
                  ? new Date(ticket.lastUsedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A'
                }
              </Text>
            </View>

            <View style={{ height: 8 }} />
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cardArtBackground: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  flipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  contentContainer: {
    flex: 1,
  },

  // Header
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

  // Card area — lifted up for better positioning within phone frame
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  cardFace: {
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Offset upward to compensate for cardContainer's marginTop (which accounts for
    // the front face's bottom section). Back face has no bottom section, so it needs
    // to reclaim roughly half that margin to stay visually centered.
    marginTop: -60,
  },

  // Front: Hero card
  heroCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  heroSection: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  parkNameWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  parkNameGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  parkNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  passholderContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  passholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footerSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  codeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  passNumberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.5,
  },

  // Back: Scan card
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
  passNumberLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  passholderLabel: {
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

  // Bottom section
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

  // Spring-driven horizontal pager
  pagerClip: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  pagerRow: {
    flexDirection: 'row' as const,
  },
  pagerSlot: {
    width: SCREEN_WIDTH,
    alignItems: 'center' as const,
  },

  // Animated dot indicators — pushed down to restore gap from card lift
  dotIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 52,
  },
  dotIndicator: {
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingPassDetail;
