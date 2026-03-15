/**
 * OnboardingScanModal
 *
 * A stripped copy of ScanModal (src/components/wallet/ScanModal.tsx)
 * for use in the onboarding demo (Screen 4). Identical layout and styles.
 *
 * Stripped:
 *  - useWallet hook — uses static mock ticket data instead
 *  - Search functionality (inputOnly mode, filtering, keyboard handling)
 *  - Quick actions (long press, set default, onTicketLongPress)
 *  - Expired section (demo only shows active passes)
 *  - PassDetailView (replaced by OnboardingPassDetail, parent handles it)
 *
 * Kept:
 *  - Carousel layout (horizontal ScrollViews with pass cards)
 *  - Section titles and staggered entrance animation
 *  - Section card styling (white cards with shadows)
 *  - Snap-with-peek carousel scrolling
 *
 * Added:
 *  - Static DEMO_TICKETS data (3 passes with gradient backgrounds)
 *  - forwardRef with scrollToPass(index) method
 *  - onPassSelect callback (fires when user taps a pass)
 */

import React, { forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, PASS_TYPE_LABELS } from '../../../types/wallet';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { getParkGradientColors, getParkInitials } from '../../../utils/parkAssets';

// Card dimensions for carousel
const CARD_SIZE = 120;

// ============================================
// Static Mock Ticket Data
// ============================================

export const DEMO_TICKETS: Ticket[] = [
  {
    id: 'cp-season',
    parkName: 'Cedar Point',
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    qrData: 'CDRPT-SEASON-2026-00142',
    qrFormat: 'QR_CODE',
    isFavorite: true,
    status: 'active',
    isDefault: true,
    addedAt: '2026-01-15T10:00:00Z',
    lastUsedAt: '2026-03-08T14:30:00Z',
    autoDetected: true,
  },
  {
    id: 'ki-day',
    parkName: 'Kings Island',
    parkChain: 'cedar_fair',
    passType: 'day_pass',
    validFrom: '2026-04-15',
    validUntil: '2026-04-15',
    qrData: 'KNGSI-DAY-2026-07891',
    qrFormat: 'QR_CODE',
    isFavorite: false,
    status: 'active',
    isDefault: false,
    addedAt: '2026-04-10T09:00:00Z',
    autoDetected: true,
  },
  {
    id: 'cw-fast',
    parkName: 'Carowinds',
    parkChain: 'cedar_fair',
    passType: 'express',
    validFrom: '2026-05-01',
    validUntil: '2026-05-01',
    qrData: 'CARWN-FAST-2026-33210',
    qrFormat: 'QR_CODE',
    isFavorite: false,
    status: 'active',
    isDefault: false,
    addedAt: '2026-04-28T12:00:00Z',
    autoDetected: true,
  },
];

// ============================================
// Component
// ============================================

export interface OnboardingScanModalRef {
  /** Scroll to a specific pass card by index */
  scrollToPass: (index: number) => void;
}

interface OnboardingScanModalProps {
  /** Whether the modal content is visible */
  visible: boolean;
  /** Called when modal should close */
  onClose?: () => void;
  /** Called when user taps a pass card */
  onPassSelect?: (ticket: Ticket, index: number) => void;
}

/** Mini preview card for the demo carousel */
const DemoPassCard: React.FC<{
  ticket: Ticket;
  onPress?: () => void;
}> = ({ ticket, onPress }) => {
  const gradientColors = getParkGradientColors(ticket.parkName);
  const initials = getParkInitials(ticket.parkName);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <View style={demoCardStyles.container}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={demoCardStyles.gradient}
        >
          <Text style={demoCardStyles.initials}>{initials}</Text>
        </LinearGradient>

        {/* Star badge for favorites */}
        {ticket.isFavorite && (
          <View style={demoCardStyles.favoriteBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}

        {/* Gradient banner at bottom with park name */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.5, 1]}
          style={demoCardStyles.banner}
        >
          <Text style={demoCardStyles.parkName} numberOfLines={1}>
            {ticket.parkName}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const demoCardStyles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: radius.card,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: CARD_SIZE * 0.35,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  parkName: {
    fontSize: CARD_SIZE * 0.11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export const OnboardingScanModal = forwardRef<OnboardingScanModalRef, OnboardingScanModalProps>(
  function OnboardingScanModal({ visible, onClose, onPassSelect }, ref) {
    const favoritesScrollRef = useRef<ScrollView>(null);
    const ticketsScrollRef = useRef<ScrollView>(null);
    const passesScrollRef = useRef<ScrollView>(null);

    // Entrance animation
    const entrance = useSharedValue(0);

    // Start entrance animation when visible
    React.useEffect(() => {
      if (visible) {
        entrance.value = 0;
        entrance.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      } else {
        entrance.value = 0;
      }
    }, [visible]);

    // Split tickets into categories
    const favoriteTickets = DEMO_TICKETS.filter(t => t.isFavorite);
    const ticketItems = DEMO_TICKETS.filter(t => ['day_pass', 'multi_day'].includes(t.passType));
    const passItems = DEMO_TICKETS.filter(t => ['season_pass', 'annual_pass', 'vip', 'membership', 'express'].includes(t.passType));

    // Handle pass tap
    const handlePassPress = useCallback((ticket: Ticket) => {
      const index = DEMO_TICKETS.findIndex(t => t.id === ticket.id);
      onPassSelect?.(ticket, index >= 0 ? index : 0);
    }, [onPassSelect]);

    // Expose scrollToPass via ref
    useImperativeHandle(ref, () => ({
      scrollToPass: (index: number) => {
        // Find which section the ticket is in and scroll to it
        const ticket = DEMO_TICKETS[index];
        if (!ticket) return;

        if (ticket.isFavorite) {
          const favIndex = favoriteTickets.findIndex(t => t.id === ticket.id);
          favoritesScrollRef.current?.scrollTo({
            x: favIndex * (CARD_SIZE + spacing.md),
            animated: true,
          });
        }
      },
    }));

    // Staggered entrance styles for each section
    const favoritesStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(entrance.value, [0, 0.3], [20, 0], Extrapolation.CLAMP) }],
    }));

    const ticketsStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0.15, 0.45], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(entrance.value, [0.15, 0.45], [20, 0], Extrapolation.CLAMP) }],
    }));

    const passesStyle = useAnimatedStyle(() => ({
      opacity: interpolate(entrance.value, [0.3, 0.6], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(entrance.value, [0.3, 0.6], [20, 0], Extrapolation.CLAMP) }],
    }));

    if (!visible) return null;

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== FAVORITES SECTION ========== */}
        <Animated.View style={[styles.section, favoritesStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorites</Text>
          </View>
          {favoriteTickets.length > 0 ? (
            <ScrollView
              ref={favoritesScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              decelerationRate="fast"
              snapToInterval={CARD_SIZE + spacing.md}
            >
              {favoriteTickets.map((ticket) => (
                <DemoPassCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handlePassPress(ticket)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.sectionEmptyState}>
              <Ionicons name="star-outline" size={24} color="#CCCCCC" />
              <Text style={styles.sectionEmptyText}>No favorites yet</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.frostedGap} />

        {/* ========== TICKETS SECTION ========== */}
        <Animated.View style={[styles.section, ticketsStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tickets</Text>
          </View>
          {ticketItems.length > 0 ? (
            <ScrollView
              ref={ticketsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              decelerationRate="fast"
              snapToInterval={CARD_SIZE + spacing.md}
            >
              {ticketItems.map((ticket) => (
                <DemoPassCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handlePassPress(ticket)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.sectionEmptyState}>
              <Ionicons name="ticket-outline" size={24} color="#CCCCCC" />
              <Text style={styles.sectionEmptyText}>No tickets yet</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.frostedGap} />

        {/* ========== PASSES SECTION ========== */}
        <Animated.View style={[styles.section, passesStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passes</Text>
          </View>
          {passItems.length > 0 ? (
            <ScrollView
              ref={passesScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              decelerationRate="fast"
              snapToInterval={CARD_SIZE + spacing.md}
            >
              {passItems.map((ticket) => (
                <DemoPassCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handlePassPress(ticket)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.sectionEmptyState}>
              <Ionicons name="card-outline" size={24} color="#CCCCCC" />
              <Text style={styles.sectionEmptyText}>No passes yet</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  },
);

// ============================================
// Styles (matches ScanModal sectionsOnly mode)
// ============================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },

  // Section Card (matches ScanModal exactly)
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 8,
    paddingVertical: 16,
    ...shadows.section,
  },
  frostedGap: {
    height: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },

  // Carousel
  carouselContent: {
    paddingHorizontal: 16,
    gap: spacing.md,
  },

  // Section Empty States
  sectionEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  sectionEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    marginTop: 8,
  },
});

export default OnboardingScanModal;
