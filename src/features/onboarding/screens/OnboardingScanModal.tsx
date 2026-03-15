/**
 * OnboardingScanModal
 *
 * A stripped copy of ScanModal (src/components/wallet/ScanModal.tsx)
 * for use in the onboarding demo (Screen 4). Matches the real wallet layout exactly.
 *
 * Layout (matches real ScanModal):
 *  - "W A L L E T" header with letter-spacing
 *  - "Search passes..." search bar
 *  - Favorites section (empty state: star icon + "No favorites yet")
 *  - Tickets section (empty state: ticket icon + "No tickets yet" + "+ Add")
 *  - Passes section (pass cards + "Import Pass" dashed card + "+ Add")
 *
 * Stripped:
 *  - useWallet hook -- uses static mock ticket data instead
 *  - Search functionality (filtering, keyboard handling)
 *  - Quick actions (long press, set default)
 *  - Expired section (demo only shows active passes)
 *  - PassDetailView (parent handles it)
 *
 * Kept:
 *  - Carousel layout (horizontal ScrollViews with pass cards)
 *  - Section card styling (white cards with shadows)
 *  - Section headers with "+ Add" buttons
 *  - Empty states with icons and descriptive text
 *  - Import Pass card with dashed border
 *
 * Added:
 *  - Static DEMO_TICKETS data (2 passes with real NanoBanana card art)
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
  Image,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, PASS_TYPE_LABELS } from '../../../types/wallet';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { CARD_ART } from '../../../data/cardArt';

// Card dimensions — scaled down for onboarding phone frame
// Real app uses 120px, onboarding frame is scaled ~0.85x so 100px looks right
const CARD_WIDTH = 100;
const CARD_HEIGHT = 100;
const CARD_GAP = 10;

// ============================================
// Card Art Mapping (ticket id -> card art asset)
// ============================================

const TICKET_CARD_ART: Record<string, ImageSourcePropType> = {
  'cp-season': CARD_ART['steel-vengeance'],
  'kbf-season': CARD_ART['ghostrider'],
};

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
    isFavorite: false,
    status: 'active',
    isDefault: true,
    addedAt: '2026-01-15T10:00:00Z',
    lastUsedAt: '2026-03-08T14:30:00Z',
    autoDetected: true,
  },
  {
    id: 'kbf-season',
    parkName: "Knott's Berry Farm",
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    qrData: 'KNTBF-SEASON-2026-08834',
    qrFormat: 'QR_CODE',
    isFavorite: false,
    status: 'active',
    isDefault: false,
    addedAt: '2026-02-20T09:00:00Z',
    lastUsedAt: '2026-03-01T11:00:00Z',
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

/** Mini preview card for the demo carousel -- uses real card art */
const DemoPassCard: React.FC<{
  ticket: Ticket;
  onPress?: () => void;
}> = ({ ticket, onPress }) => {
  const cardArtSource = TICKET_CARD_ART[ticket.id];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <View style={demoCardStyles.container}>
        {/* Card art image background */}
        {cardArtSource ? (
          <Image
            source={cardArtSource}
            style={demoCardStyles.cardArt}
            resizeMode="cover"
          />
        ) : (
          <View style={demoCardStyles.fallbackGradient} />
        )}

        {/* Star badge for favorites */}
        {ticket.isFavorite && (
          <View style={demoCardStyles.favoriteBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
          </View>
        )}

        {/* Gradient banner at bottom with park name */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.45, 1]}
          style={demoCardStyles.banner}
        >
          <Text style={demoCardStyles.parkName} numberOfLines={2}>
            {ticket.parkName}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const demoCardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardArt: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallbackGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CCCCCC',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  parkName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

/** Import Pass card with dashed border */
const ImportPassCard: React.FC = () => (
  <View style={importCardStyles.container}>
    <View style={importCardStyles.iconContainer}>
      <Ionicons name="add" size={22} color={colors.accent.primary} />
    </View>
    <Text style={importCardStyles.text}>Import Pass</Text>
  </View>
);

const importCardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});

export const OnboardingScanModal = forwardRef<OnboardingScanModalRef, OnboardingScanModalProps>(
  function OnboardingScanModal({ visible, onClose, onPassSelect }, ref) {
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

    // All demo tickets go in Passes section (season_pass, annual_pass, etc.)
    // Favorites and Tickets are intentionally empty to match the screenshot
    const passItems = DEMO_TICKETS;

    // Handle pass tap
    const handlePassPress = useCallback((ticket: Ticket) => {
      const index = DEMO_TICKETS.findIndex(t => t.id === ticket.id);
      onPassSelect?.(ticket, index >= 0 ? index : 0);
    }, [onPassSelect]);

    // Expose scrollToPass via ref
    useImperativeHandle(ref, () => ({
      scrollToPass: (index: number) => {
        const ticket = DEMO_TICKETS[index];
        if (!ticket) return;

        // Scroll in Passes section
        const passIndex = passItems.findIndex(t => t.id === ticket.id);
        if (passIndex >= 0) {
          passesScrollRef.current?.scrollTo({
            x: passIndex * (CARD_WIDTH + CARD_GAP),
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
        {/* ========== SEARCH BAR (visual only) ========== */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#999999" />
            <Text style={styles.searchBarText}>Search passes...</Text>
            <View style={styles.searchBarCloseButton}>
              <Ionicons name="close" size={14} color="#666666" />
            </View>
          </View>
        </View>

        {/* ========== FAVORITES SECTION (empty state) ========== */}
        <Animated.View style={[styles.section, favoritesStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorites</Text>
          </View>
          <View style={styles.sectionEmptyState}>
            <Ionicons name="star-outline" size={20} color="#CCCCCC" />
            <Text style={styles.sectionEmptyText}>No favorites yet</Text>
            <Text style={styles.sectionEmptySubtext}>
              Long press any pass to add to favorites
            </Text>
          </View>
        </Animated.View>

        <View style={styles.frostedGap} />

        {/* ========== TICKETS SECTION (empty state) ========== */}
        <Animated.View style={[styles.section, ticketsStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            <Text style={styles.addButton}>+ Add</Text>
          </View>
          <View style={styles.sectionEmptyState}>
            <Ionicons name="diamond-outline" size={20} color="#CCCCCC" />
            <Text style={styles.sectionEmptyText}>No tickets yet</Text>
            <Text style={styles.sectionEmptySubtext}>
              Day passes and multi-day tickets appear here
            </Text>
          </View>
        </Animated.View>

        <View style={styles.frostedGap} />

        {/* ========== PASSES SECTION (with cards + Import Pass) ========== */}
        <Animated.View style={[styles.section, passesStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passes</Text>
            <Text style={styles.addButton}>+ Add</Text>
          </View>
          <ScrollView
            ref={passesScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + CARD_GAP}
          >
            {passItems.map((ticket) => (
              <DemoPassCard
                key={ticket.id}
                ticket={ticket}
                onPress={() => handlePassPress(ticket)}
              />
            ))}
            {/* Import Pass card at end of carousel */}
            <ImportPassCard />
          </ScrollView>
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

  // Search Bar (visual only)
  searchBarContainer: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 36,
    gap: 6,
  },
  searchBarText: {
    flex: 1,
    fontSize: 13,
    color: '#999999',
  },
  searchBarCloseButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Card (matches ScanModal exactly)
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 8,
    paddingVertical: 14,
    ...shadows.section,
  },
  frostedGap: {
    height: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
  },

  // Carousel
  carouselContent: {
    paddingHorizontal: 14,
    gap: CARD_GAP,
  },

  // Section Empty States
  sectionEmptyState: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sectionEmptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    marginTop: 6,
  },
  sectionEmptySubtext: {
    fontSize: 10,
    color: '#BBBBBB',
    marginTop: 3,
    textAlign: 'center',
  },
});

export default OnboardingScanModal;
