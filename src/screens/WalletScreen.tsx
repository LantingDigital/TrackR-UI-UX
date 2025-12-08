/**
 * WalletScreen
 *
 * Wallet management screen (moved from ProfileScreen).
 * - Wallet statistics
 * - List of all tickets with filters
 * - Ticket management actions
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { useWallet } from '../hooks/useWallet';
import {
  Ticket,
  PARK_BRAND_COLORS,
  PARK_CHAIN_LABELS,
  PASS_TYPE_LABELS,
  ParkChain,
} from '../types/wallet';

// Animation constants - match app patterns
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: true,
};

const PRESS_SCALE = 0.96;
const PRESS_OPACITY = 0.7;

interface WalletScreenProps {
  onBack?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const {
    tickets,
    filteredTickets,
    filterPreferences,
    isLoading,
    refreshTickets,
    deleteTicket,
    setDefaultTicket,
    setFilterPreferences,
  } = useWallet();

  const [showExpiredFilter, setShowExpiredFilter] = useState(filterPreferences.showExpired);

  // Statistics
  const stats = useMemo(() => {
    const active = tickets.filter((t) => t.status === 'active').length;
    const expired = tickets.filter((t) => t.status === 'expired').length;
    const total = tickets.length;
    const parkChains = [...new Set(tickets.map((t) => t.parkChain))].length;

    return { active, expired, total, parkChains };
  }, [tickets]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Check if ticket is expiring soon (within 7 days)
  const isExpiringSoon = useCallback((validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  }, []);

  // Toggle expired filter
  const handleToggleExpired = useCallback(() => {
    const newValue = !showExpiredFilter;
    setShowExpiredFilter(newValue);
    setFilterPreferences({ showExpired: newValue });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [showExpiredFilter, setFilterPreferences]);

  // Handle ticket press - show options
  const handleTicketPress = useCallback(
    (ticket: Ticket) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const options = [
        {
          text: ticket.isDefault ? '✓ Default Ticket' : 'Set as Default',
          onPress: ticket.isDefault ? undefined : () => setDefaultTicket(ticket.id),
        },
        {
          text: 'Delete',
          style: 'destructive' as const,
          onPress: () => {
            Alert.alert(
              'Delete Ticket',
              `Are you sure you want to delete "${ticket.parkName}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteTicket(ticket.id),
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' as const },
      ];

      Alert.alert(ticket.parkName, PASS_TYPE_LABELS[ticket.passType], options);
    },
    [setDefaultTicket, deleteTicket]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshTickets();
  }, [refreshTickets]);

  // Handle back press
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  }, [onBack]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Wallet Statistics */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatItem label="Active" value={stats.active} color={colors.status.success} />
            <StatItem label="Expired" value={stats.expired} color={colors.text.meta} />
            <StatItem label="Parks" value={stats.parkChains} color={colors.accent.primary} />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <Text style={styles.ticketListTitle}>
            Tickets {filteredTickets.length > 0 ? `(${filteredTickets.length})` : ''}
          </Text>
          <Pressable
            style={[styles.filterChip, showExpiredFilter && styles.filterChipActive]}
            onPress={handleToggleExpired}
          >
            <Text
              style={[
                styles.filterChipText,
                showExpiredFilter && styles.filterChipTextActive,
              ]}
            >
              Show Expired
            </Text>
          </Pressable>
        </View>

        {/* Ticket List */}
        {filteredTickets.length > 0 ? (
          <View style={styles.ticketList}>
            {filteredTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onPress={() => handleTicketPress(ticket)}
                formatDate={formatDate}
                isExpiringSoon={isExpiringSoon}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="card-outline"
              size={48}
              color={colors.text.meta}
            />
            <Text style={styles.emptyText}>
              {tickets.length === 0
                ? 'No tickets yet'
                : 'No tickets match filters'}
            </Text>
            <Text style={styles.emptySubtext}>
              {tickets.length === 0
                ? 'Tap Scan on the home screen to add your first ticket'
                : 'Try adjusting your filters'}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
};

// =========================================
// Stat Item Component
// =========================================
interface StatItemProps {
  label: string;
  value: number;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// =========================================
// Ticket Row Component
// =========================================
interface TicketRowProps {
  ticket: Ticket;
  onPress: () => void;
  formatDate: (date: string) => string;
  isExpiringSoon: (date: string) => boolean;
}

const TicketRow: React.FC<TicketRowProps> = ({
  ticket,
  onPress,
  formatDate,
  isExpiringSoon,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

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

  const brandColor = PARK_BRAND_COLORS[ticket.parkChain as ParkChain] || colors.accent.primary;
  const isExpired = ticket.status === 'expired';
  const expiring = !isExpired && isExpiringSoon(ticket.validUntil);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.ticketRow,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
          isExpired && styles.ticketRowExpired,
        ]}
      >
        {/* Brand Color Indicator */}
        <View style={[styles.brandIndicator, { backgroundColor: brandColor }]} />

        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <View style={styles.ticketHeader}>
            <Text
              style={[styles.ticketName, isExpired && styles.ticketNameExpired]}
              numberOfLines={1}
            >
              {ticket.parkName}
            </Text>
            {ticket.isDefault && (
              <View style={styles.defaultBadge}>
                <Ionicons name="star" size={10} color={colors.accent.primary} />
              </View>
            )}
          </View>
          <Text style={styles.ticketType}>{PASS_TYPE_LABELS[ticket.passType]}</Text>
          <View style={styles.ticketMeta}>
            <Text style={styles.ticketDate}>
              Valid until {formatDate(ticket.validUntil)}
            </Text>
            {expiring && (
              <View style={styles.expiringBadge}>
                <Text style={styles.expiringText}>Expiring soon</Text>
              </View>
            )}
            {isExpired && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredText}>Expired</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.meta}
          style={styles.ticketChevron}
        />
      </Animated.View>
    </Pressable>
  );
};

// =========================================
// Styles
// =========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Stats Card
  statsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  ticketListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primaryLight,
    borderColor: colors.accent.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.accent.primary,
  },

  // Ticket List
  ticketList: {
    gap: spacing.base,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketRowExpired: {
    opacity: 0.6,
  },
  brandIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  ticketInfo: {
    flex: 1,
    padding: spacing.base,
    paddingLeft: spacing.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  ticketNameExpired: {
    color: colors.text.secondary,
  },
  defaultBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketType: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  ticketDate: {
    fontSize: 12,
    color: colors.text.meta,
  },
  expiringBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  expiringText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  expiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  expiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.status.error,
  },
  ticketChevron: {
    marginRight: spacing.base,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
