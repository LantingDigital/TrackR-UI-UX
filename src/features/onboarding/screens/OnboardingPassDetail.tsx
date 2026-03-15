/**
 * OnboardingPassDetail
 *
 * A stripped copy of PassDetailView (src/components/wallet/PassDetailView.tsx)
 * for use in the onboarding demo (Screen 4). Keeps the key 3D flip animation.
 *
 * Stripped:
 *  - Brightness adjustment (requires Brightness API, unnecessary in demo)
 *  - Multi-pass horizontal swiping (demo shows a single pass)
 *  - Dot indicators (single pass, not needed)
 *  - Original image modal (no real images in demo)
 *  - PanResponder-based gesture handling (replaced with Reanimated)
 *  - react-native Animated (replaced with react-native-reanimated per project rules)
 *  - PassHeroCard + QRCodeDisplay (replaced with inline gradient card + QR placeholder)
 *  - <Modal> (replaced with absolute-positioned View to stay inside scaled phone frame)
 *
 * Kept:
 *  - 3D flip animation (rotateY, 600ms) -- THE key visual
 *  - Front face (pass hero card with park gradient, park name, pass type)
 *  - Back face (QR code placeholder with realistic grid pattern)
 *  - Blurred card art as FULL BACKGROUND (not solid color)
 *  - Close button (X when front, arrow-back when flipped)
 *  - "Tap card to scan" instruction badge
 *  - "Tap to flip back" hint on back face
 *  - Slide-up entrance animation
 *
 * Added:
 *  - forwardRef with flip() and dismiss() methods for programmatic control
 *  - Uses react-native-reanimated (project standard) instead of react-native Animated
 *  - Renders as absolute overlay (no Modal) so it stays inside phone frame
 *  - Blurred card art background covering the ENTIRE screen
 *  - Proper bottom sheet entrance (translateY spring from bottom)
 */

import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  ImageSourcePropType,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Ticket, PASS_TYPE_LABELS } from '../../../types/wallet';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { SPRINGS } from '../../../constants/animations';
import { getParkGradientColors, getParkInitials } from '../../../utils/parkAssets';
import { CARD_ART } from '../../../data/cardArt';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card art mapping (ticket id -> card art asset) -- must match OnboardingScanModal
const TICKET_CARD_ART: Record<string, ImageSourcePropType> = {
  'cp-season': CARD_ART['steel-vengeance'],
  'kbf-season': CARD_ART['ghostrider'],
};

// Card dimensions - nearly full width
const CARD_HORIZONTAL_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_HORIZONTAL_MARGIN * 2);
const CARD_ASPECT_RATIO = 1.35;
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT_RATIO;
const HERO_HEIGHT_RATIO = 0.58;
const FOOTER_HEIGHT_RATIO = 0.42;

// QR placeholder size
const QR_PLACEHOLDER_SIZE = 140;

// ============================================
// QR Placeholder -- realistic grid pattern
// ============================================

const QRPlaceholder: React.FC<{ size: number }> = ({ size }) => {
  const gridSize = 11;
  const cellSize = (size - 24) / gridSize; // Subtract padding

  // Generate a deterministic grid pattern that looks like a real QR code
  const cells: boolean[][] = [];
  for (let row = 0; row < gridSize; row++) {
    cells[row] = [];
    for (let col = 0; col < gridSize; col++) {
      // Finder patterns (three 3x3 corners with border)
      const isTopLeft = row < 3 && col < 3;
      const isTopRight = row < 3 && col >= gridSize - 3;
      const isBottomLeft = row >= gridSize - 3 && col < 3;
      const isFinderOuter = isTopLeft || isTopRight || isBottomLeft;

      // Inner filled part of finder (1x1 center)
      const isFinderInner =
        (row === 1 && col === 1) ||
        (row === 1 && col === gridSize - 2) ||
        (row === gridSize - 2 && col === 1);

      // Finder border (outer ring)
      const isFinderBorder = isFinderOuter && !isFinderInner;

      // Timing patterns (alternating row/col between finders)
      const isTimingH = row === 3 && col > 2 && col < gridSize - 3 && col % 2 === 0;
      const isTimingV = col === 3 && row > 2 && row < gridSize - 3 && row % 2 === 0;

      // Pseudo-random data cells (deterministic hash)
      const hash = (row * 17 + col * 31 + row * col * 7) % 11;
      const isDataCell = !isFinderOuter && !isTimingH && !isTimingV && hash < 5;

      cells[row][col] = isFinderBorder || isFinderInner || isTimingH || isTimingV || isDataCell;
    }
  }

  return (
    <View style={[qrStyles.container, { width: size, height: size }]}>
      {cells.map((row, rowIndex) => (
        <View key={rowIndex} style={qrStyles.row}>
          {row.map((filled, colIndex) => (
            <View
              key={colIndex}
              style={[
                qrStyles.cell,
                { width: cellSize, height: cellSize },
                filled ? qrStyles.cellFilled : qrStyles.cellEmpty,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const qrStyles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  cellFilled: {
    backgroundColor: '#1A1A1A',
  },
  cellEmpty: {
    backgroundColor: '#FFFFFF',
  },
});

// ============================================
// Component
// ============================================

export interface OnboardingPassDetailRef {
  /** Programmatically trigger the flip animation */
  flip: () => void;
  /** Programmatically dismiss the pass detail (slide down) */
  dismiss: () => void;
  /** Programmatically swipe to a specific ticket by index */
  swipeTo: (index: number) => void;
}

interface OnboardingPassDetailProps {
  /** The ticket to display (primary / initially visible) */
  ticket: Ticket | null;
  /** All tickets available for swiping (if provided, enables carousel) */
  allTickets?: Ticket[];
  /** Whether the detail view is visible */
  visible: boolean;
  /** Called when the detail view should close */
  onClose: () => void;
}

export const OnboardingPassDetail = forwardRef<OnboardingPassDetailRef, OnboardingPassDetailProps>(
  function OnboardingPassDetail({ ticket, allTickets, visible, onClose }, ref) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [internalVisible, setInternalVisible] = useState(false);
    const isFlippedRef = useRef(false);
    const [activeTicketIndex, setActiveTicketIndex] = useState(0);
    const pagerScrollRef = useRef<ScrollView>(null);

    // Reanimated shared values
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);
    const flipProgress = useSharedValue(0);
    const flipBgOpacity = useSharedValue(0);
    const cardScale = useSharedValue(1);
    const bottomSectionOpacity = useSharedValue(1);

    // Compute the tickets list for the pager
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

        // Set initial index to the primary ticket within the list
        const idx = tickets.findIndex(t => t.id === ticket.id);
        setActiveTicketIndex(idx >= 0 ? idx : 0);

        backdropOpacity.value = withTiming(1, { duration: 300 });
        translateY.value = withSpring(0, SPRINGS.stiff);

        // Scroll pager to initial ticket after mount
        if (idx > 0) {
          setTimeout(() => {
            pagerScrollRef.current?.scrollTo({ x: idx * CARD_WIDTH, animated: false });
          }, 50);
        }
      }
    }, [visible, ticket]);

    // Close animation
    const animateClose = useCallback(() => {
      // If flipped, reset first
      if (isFlippedRef.current) {
        setIsFlipped(false);
        isFlippedRef.current = false;
        flipProgress.value = 0;
        flipBgOpacity.value = 0;
      }

      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 250 });

      // Delay unmount
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

      // Card flip + scale bounce + bg fade + hide bottom
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

    // Handle pager scroll end to update active ticket
    const handlePagerScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / CARD_WIDTH);
      if (newIndex !== activeTicketIndex && newIndex >= 0 && newIndex < tickets.length) {
        setActiveTicketIndex(newIndex);
      }
    }, [activeTicketIndex, tickets.length]);

    // Expose flip(), dismiss(), and swipeTo() via ref
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
          pagerScrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
          setActiveTicketIndex(index);
        }
      },
    }));

    // Backdrop tap handler
    const handleBackdropPress = useCallback(() => {
      if (isFlippedRef.current) {
        handleFlipBack();
      } else {
        animateClose();
      }
    }, [animateClose, handleFlipBack]);

    // Card tap handler (front side only)
    const handleCardPress = useCallback(() => {
      if (!isFlippedRef.current) {
        // Press-in scale + flip
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

    // Front face rotation (0 -> 90deg at midpoint, stays hidden after)
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

    // Back face rotation (hidden until midpoint, then -90 -> 0)
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

    // Use active ticket for backdrop/back face; front face uses pager
    const displayTicket = tickets[activeTicketIndex] || ticket;
    const gradientColors = getParkGradientColors(displayTicket.parkName);
    const parkInitials = getParkInitials(displayTicket.parkName);
    const passNumber = displayTicket.qrData.split('-').pop() || displayTicket.qrData;
    const passTypeLabel = PASS_TYPE_LABELS[displayTicket.passType] || 'Pass';
    const cardArtSource = TICKET_CARD_ART[displayTicket.id];

    return (
      <View style={styles.overlayRoot}>
        {/* Backdrop with card art as FULL background — NOT blurred on front face */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
            {cardArtSource ? (
              <>
                <Image
                  source={cardArtSource}
                  style={styles.cardArtBackground}
                  resizeMode="cover"
                />
                {/* Darken overlay for readability */}
                <View style={styles.backdropDarkOverlay} />
              </>
            ) : (
              <>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.backdropDarkOverlay} />
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              </>
            )}
          </Animated.View>
        </Pressable>

        {/* Flip background (enhanced blur when QR is showing) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, flipBgAnimStyle]}
          pointerEvents={isFlipped ? 'auto' : 'none'}
        >
          {cardArtSource ? (
            <Image
              source={cardArtSource}
              style={styles.cardArtBackground}
              resizeMode="cover"
              blurRadius={30}
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
          {/* Header */}
          <View style={[styles.header, { paddingTop: 16 }]}>
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

          {/* Card area */}
          <View style={styles.cardContainer}>
            {/* Front face -- horizontal pager of hero cards */}
            <Animated.View style={[styles.cardFace, frontCardStyle]}>
              <ScrollView
                ref={pagerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handlePagerScrollEnd}
                scrollEnabled={!isFlipped && tickets.length > 1}
                style={{ width: CARD_WIDTH }}
                contentContainerStyle={tickets.length > 1 ? undefined : undefined}
              >
                {tickets.map((t) => {
                  const tGradient = getParkGradientColors(t.parkName);
                  const tInitials = getParkInitials(t.parkName);
                  const tPassNumber = t.qrData.split('-').pop() || t.qrData;
                  return (
                    <Pressable key={t.id} onPress={handleCardPress} style={styles.heroCard}>
                      {/* Hero gradient area */}
                      <View style={[styles.heroSection, { height: CARD_HEIGHT * HERO_HEIGHT_RATIO }]}>
                        <LinearGradient
                          colors={tGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.heroGradient}
                        >
                          <Text style={styles.heroInitials}>{tInitials}</Text>
                        </LinearGradient>

                        {/* Darkening overlay for text readability */}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.2)']}
                          locations={[0, 0.4, 1]}
                          style={StyleSheet.absoluteFill}
                        />

                        {/* Park name at top */}
                        <View style={styles.parkNameWrapper}>
                          <LinearGradient
                            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)', 'transparent']}
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

                      {/* White footer with QR placeholder */}
                      <View style={[styles.footerSection, { height: CARD_HEIGHT * FOOTER_HEIGHT_RATIO }]}>
                        <View style={styles.codeContainer}>
                          <QRPlaceholder size={120} />
                        </View>
                        <Text style={styles.passNumberText}>PASS #: {tPassNumber}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Dot indicators (only if multiple tickets) */}
              {tickets.length > 1 && (
                <View style={styles.dotIndicatorRow}>
                  {tickets.map((t, i) => (
                    <View
                      key={t.id}
                      style={[
                        styles.dotIndicator,
                        i === activeTicketIndex && styles.dotIndicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Back face -- scan card with QR (always shows active ticket) */}
            <Animated.View style={[styles.cardFace, styles.cardBack, backCardStyle]}>
              <Pressable onPress={handleFlipBack} style={styles.scanCard}>
                <Text style={styles.scanParkName}>{displayTicket.parkName}</Text>

                <View style={styles.passTypeBadge}>
                  <Text style={styles.passTypeText}>{passTypeLabel}</Text>
                </View>

                <View style={styles.qrContainer}>
                  <QRPlaceholder size={QR_PLACEHOLDER_SIZE} />
                </View>

                <Text style={styles.passNumberLabel}>PASS #: {passNumber}</Text>

                {displayTicket.passholder && (
                  <Text style={styles.passholderLabel}>{displayTicket.passholder}</Text>
                )}

                <Text style={styles.flipHint}>Tap to flip back</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Bottom section -- instruction + last used */}
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

            <View style={{ height: 32 }} />
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
    overflow: 'hidden',
  },
  backdropDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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

  // Card area
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFace: {
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Front: Hero card (matches PassHeroCard layout)
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
  heroGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitials: {
    fontSize: 72,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.25)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
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

  // Back: Scan card (matches PassDetailView)
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

  // Dot indicators for multi-pass pager
  dotIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dotIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default OnboardingPassDetail;
