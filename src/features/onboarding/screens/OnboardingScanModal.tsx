/**
 * OnboardingScanModal
 *
 * A stripped copy of ScanModal for onboarding demo (Screen 4).
 * Shows populated wallet with favorites, tickets, and passes.
 */

import React, { forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { FadeInImage } from '../../../components/FadeInImage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
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
import { CARD_ART } from '../../../data/cardArt';

// Card dimensions — SQUARE, scaled down for onboarding frame
const CARD_SIZE = 100;
const CARD_GAP = 8;

// ============================================
// Card Art Mapping (ticket id -> card art asset)
// ============================================

const TICKET_CARD_ART: Record<string, ImageSourcePropType> = {
  'cp-season': CARD_ART['steel-vengeance'],
  'kbf-season': CARD_ART['ghostrider'],
  'bgt-fav': CARD_ART['iron-gwazi'],
  'ioa-ticket': CARD_ART['jurassic-world-velocicoaster'],
  'sfmm-ticket': CARD_ART['twisted-colossus'],
};

// ============================================
// Static Mock Ticket Data
// ============================================

// Favorite pass
const DEMO_FAVORITE: Ticket = {
  id: 'bgt-fav',
  parkName: 'Busch Gardens Tampa',
  parkChain: 'seaworld',
  passType: 'annual_pass',
  passholder: 'Caleb Lanting',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  qrData: 'BGT-ANNUAL-2026-07721',
  qrFormat: 'QR_CODE',
  isFavorite: true,
  status: 'active',
  isDefault: false,
  addedAt: '2026-01-10T08:00:00Z',
  lastUsedAt: '2026-02-14T10:00:00Z',
  autoDetected: false,
};

// Day tickets
const DEMO_TICKET_1: Ticket = {
  id: 'ioa-ticket',
  parkName: 'Islands of Adventure',
  parkChain: 'universal',
  passType: 'day_pass',
  passholder: 'Caleb Lanting',
  validFrom: '2026-04-15',
  validUntil: '2026-04-15',
  qrData: 'IOA-DAY-2026-33190',
  qrFormat: 'QR_CODE',
  isFavorite: false,
  status: 'active',
  isDefault: false,
  addedAt: '2026-03-01T12:00:00Z',
  autoDetected: false,
};

const DEMO_TICKET_2: Ticket = {
  id: 'sfmm-ticket',
  parkName: 'Six Flags Magic Mountain',
  parkChain: 'six_flags',
  passType: 'day_pass',
  passholder: 'Caleb Lanting',
  validFrom: '2026-05-10',
  validUntil: '2026-05-10',
  qrData: 'SFMM-DAY-2026-55042',
  qrFormat: 'QR_CODE',
  isFavorite: false,
  status: 'active',
  isDefault: false,
  addedAt: '2026-03-05T09:00:00Z',
  autoDetected: false,
};

// Season passes
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
    heroImageSource: CARD_ART['steel-vengeance'],
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
    heroImageSource: CARD_ART['ghostrider'],
  },
];

// ============================================
// Component
// ============================================

export interface OnboardingScanModalRef {
  scrollToPass: (index: number) => void;
}

interface OnboardingScanModalProps {
  visible: boolean;
  onClose?: () => void;
  onPassSelect?: (ticket: Ticket, index: number) => void;
}

/** Mini preview card for the demo carousel — matches real PassPreviewCard */
const DemoPassCard: React.FC<{
  ticket: Ticket;
  onPress?: () => void;
}> = ({ ticket, onPress }) => {
  // Use TICKET_CARD_ART mapping first, then fall back to ticket.heroImageSource
  const cardArtSource = TICKET_CARD_ART[ticket.id] || ticket.heroImageSource;
  const pressScale = useSharedValue(1);

  const pressAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.93, { duration: 120 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 15, stiffness: 200, mass: 0.8 });
      }}
    >
      <Animated.View style={[demoCardStyles.container, pressAnimStyle]}>
        {cardArtSource ? (
          <FadeInImage
            source={cardArtSource}
            style={demoCardStyles.cardArt}
            resizeMode="cover"
          />
        ) : (
          <View style={demoCardStyles.fallbackGradient} />
        )}

        {ticket.isFavorite && (
          <View style={demoCardStyles.favoriteBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.5, 1]}
          style={demoCardStyles.banner}
        >
          <Text style={demoCardStyles.parkName} numberOfLines={1} ellipsizeMode="tail">
            {ticket.parkName}
          </Text>
        </LinearGradient>
      </Animated.View>
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
  cardArt: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fallbackGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CCCCCC',
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

/** Import card with dashed border — reusable for Tickets and Passes */
const ImportCard: React.FC<{ label: string }> = ({ label }) => (
  <View style={importCardStyles.container}>
    <View style={importCardStyles.iconContainer}>
      <Ionicons name="add" size={22} color={colors.accent.primary} />
    </View>
    <Text style={importCardStyles.text}>{label}</Text>
  </View>
);

const importCardStyles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});

export const OnboardingScanModal = forwardRef<OnboardingScanModalRef, OnboardingScanModalProps>(
  function OnboardingScanModal({ visible, onClose, onPassSelect }, ref) {
    const passesScrollRef = useRef<ScrollView>(null);

    const entrance = useSharedValue(0);

    React.useEffect(() => {
      if (visible) {
        entrance.value = 0;
        entrance.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      } else {
        entrance.value = 0;
      }
    }, [visible]);

    const handlePassPress = useCallback((ticket: Ticket) => {
      const index = DEMO_TICKETS.findIndex(t => t.id === ticket.id);
      onPassSelect?.(ticket, index >= 0 ? index : 0);
    }, [onPassSelect]);

    useImperativeHandle(ref, () => ({
      scrollToPass: (index: number) => {
        const ticket = DEMO_TICKETS[index];
        if (!ticket) return;
        const passIndex = DEMO_TICKETS.findIndex(t => t.id === ticket.id);
        if (passIndex >= 0) {
          passesScrollRef.current?.scrollTo({
            x: passIndex * (CARD_SIZE + CARD_GAP),
            animated: true,
          });
        }
      },
    }));

    // Staggered entrance styles
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

    return (
      <ScrollView
        style={[styles.scrollView, !visible && { opacity: 0 }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* ========== FAVORITES SECTION (1 favorite) ========== */}
        <Animated.View style={[styles.section, favoritesStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorites</Text>
          </View>
          <View style={styles.carouselRow}>
            <DemoPassCard ticket={DEMO_FAVORITE} />
          </View>
        </Animated.View>

        <View style={styles.frostedGap} />

        {/* ========== TICKETS SECTION (2 day tickets) ========== */}
        <Animated.View style={[styles.section, ticketsStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            <Text style={styles.addButton}>+ Add</Text>
          </View>
          <View style={styles.carouselRow}>
            <DemoPassCard ticket={DEMO_TICKET_1} />
            <ImportCard label="Import" />
          </View>
        </Animated.View>

        <View style={styles.frostedGap} />

        {/* ========== PASSES SECTION (season passes + Import — NO SCROLL) ========== */}
        <Animated.View style={[styles.section, passesStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passes</Text>
            <Text style={styles.addButton}>+ Add</Text>
          </View>
          <View style={styles.carouselRow}>
            {DEMO_TICKETS.map((ticket) => (
              <DemoPassCard
                key={ticket.id}
                ticket={ticket}
                onPress={() => handlePassPress(ticket)}
              />
            ))}
            <ImportCard label="Import" />
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  },
);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    overflow: 'visible',
  },
  contentContainer: {
    paddingTop: 0,
  },

  // Section Card — matches real ScanModal exactly (marginHorizontal: 8)
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: -8,
    paddingVertical: 12,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
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
  addButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },

  // Card row (static, no scrolling)
  carouselRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: CARD_GAP,
    flexWrap: 'wrap',
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
