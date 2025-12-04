/**
 * WalletCard Component
 *
 * Displays a single ticket card with park info and QR code.
 * Uses ActionPill-style press feedback (scale 0.96, opacity 0.7).
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, PARK_BRAND_COLORS, PASS_TYPE_LABELS } from '../../types/wallet';
import { QRCodeDisplay } from './QRCodeDisplay';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side
const CARD_HEIGHT = 420;

// Animation constants - match ActionPill patterns
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: true,
};

const PRESS_SCALE = 0.96;
const PRESS_OPACITY = 0.7;

interface WalletCardProps {
  /** The ticket to display */
  ticket: Ticket;
  /** Whether this is the front card (focused) */
  isFront?: boolean;
  /** Whether gate mode is active */
  gateMode?: boolean;
  /** Called when card is tapped */
  onPress?: () => void;
  /** Called when star (default) button is tapped */
  onSetDefault?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  ticket,
  isFront = false,
  gateMode = false,
  onPress,
  onSetDefault,
}) => {
  // Animation values for press feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Get brand color for this park chain
  const brandColor = PARK_BRAND_COLORS[ticket.parkChain] || colors.accent.primary;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get pass type label
  const passTypeLabel = PASS_TYPE_LABELS[ticket.passType] || 'Ticket';

  // Press handlers for ActionPill-style feedback
  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: PRESS_SCALE,
        ...RESPONSIVE_SPRING,
      }),
      Animated.timing(opacityAnim, {
        toValue: PRESS_OPACITY,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...RESPONSIVE_SPRING,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // In gate mode, show simplified card with large QR
  if (gateMode) {
    return (
      <View style={[styles.card, styles.gateModeCard]}>
        <View style={[styles.header, { backgroundColor: brandColor }]}>
          <View style={styles.headerContent}>
            <Text style={styles.gateModeTitle} numberOfLines={1}>
              {ticket.parkName}
            </Text>
            <Text style={styles.gateModeSubtitle}>{passTypeLabel}</Text>
          </View>
        </View>

        <View style={styles.gateModeQRContainer}>
          <QRCodeDisplay
            data={ticket.qrData}
            size={280}
            gateMode={true}
          />
        </View>

        <View style={styles.gateModeFooter}>
          {ticket.passholder && (
            <Text style={styles.gateModePassholder}>{ticket.passholder}</Text>
          )}
          <Text style={styles.gateModeDate}>
            Valid: {formatDate(ticket.validFrom)} - {formatDate(ticket.validUntil)}
          </Text>
        </View>
      </View>
    );
  }

  // Normal card view with press feedback
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.card,
          isFront && styles.frontCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Header with park name and brand color */}
        <View style={[styles.header, { backgroundColor: brandColor }]}>
          <View style={styles.headerContent}>
            <Text style={styles.parkName} numberOfLines={1}>
              {ticket.parkName}
            </Text>
            <View style={styles.passTypeBadge}>
              <Text style={styles.passTypeText}>{passTypeLabel}</Text>
            </View>
          </View>

          {/* Default star button */}
          {onSetDefault && (
            <Pressable
              style={styles.defaultButton}
              onPress={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              hitSlop={8}
            >
              <Ionicons
                name={ticket.isDefault ? 'star' : 'star-outline'}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          )}
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCodeDisplay data={ticket.qrData} size={180} />
        </View>

        {/* Footer with date info */}
        <View style={styles.footer}>
          {ticket.passholder && (
            <Text style={styles.passholder}>{ticket.passholder}</Text>
          )}
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.text.secondary}
            />
            <Text style={styles.dateText}>
              {formatDate(ticket.validFrom)} - {formatDate(ticket.validUntil)}
            </Text>
          </View>

          {/* Status indicator */}
          {ticket.status !== 'active' && (
            <View
              style={[
                styles.statusBadge,
                ticket.status === 'expired' && styles.expiredBadge,
                ticket.status === 'used' && styles.usedBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {ticket.status === 'expired' ? 'Expired' : 'Used'}
              </Text>
            </View>
          )}
        </View>

        {/* Tap hint for front card */}
        {isFront && onPress && (
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap for gate mode</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    // Floating card shadow on blur background
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  frontCard: {
    // Enhanced shadow for front card
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  parkName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  passTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.actionPill,
  },
  passTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  defaultButton: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },

  // QR Code
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
  },

  // Footer
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
  },
  passholder: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  expiredBadge: {
    backgroundColor: colors.status.error + '20',
  },
  usedBadge: {
    backgroundColor: colors.text.meta + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },

  // Tap hint
  tapHint: {
    position: 'absolute',
    bottom: spacing.lg + 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 12,
    color: colors.text.meta,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },

  // Gate Mode styles
  gateModeCard: {
    height: 'auto',
    minHeight: CARD_HEIGHT,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  gateModeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gateModeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  gateModeQRContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.xxl,
  },
  gateModeFooter: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background.card,
  },
  gateModePassholder: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  gateModeDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export { CARD_WIDTH, CARD_HEIGHT };
