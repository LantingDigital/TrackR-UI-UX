/**
 * ScanModal Component
 *
 * Modal content for the Scan/Wallet feature - displays user's passes in a searchable,
 * section-based interface matching Log/Search patterns.
 *
 * Sections:
 * - Favorites: User-pinned passes (up to 3) - 120px cards
 * - Tickets: Day passes and multi-day tickets - 100px cards
 * - Passes: Season passes, annual passes, VIP, memberships - 100px cards
 * - Expired: Inactive passes (dimmed) - 100px cards, no Add button
 *
 * Features:
 * - Snap-with-peek carousel scrolling
 * - Star badge on favorited passes
 * - Long press for quick actions menu
 * - Empty state placeholders for all sections
 * - Search filtering across all passes
 *
 * Modes:
 * - inputOnly: Just the TextInput for inside the MorphingPill
 * - sectionsOnly: Floating section cards with pass carousels
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { PassPreviewCard, PREVIEW_CARD_SIZES } from './PassPreviewCard';
import { PassDetailView } from './PassDetailView';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

// Card dimensions for each section (1:1 aspect ratio)
const CARD_SIZES = {
  favorites: PREVIEW_CARD_SIZES.favorites, // 120px
  tickets: PREVIEW_CARD_SIZES.all,         // 100px
  passes: PREVIEW_CARD_SIZES.all,          // 100px
  expired: PREVIEW_CARD_SIZES.expired,     // 100px
};

// Pass types that are considered "tickets" (single-use/limited)
const TICKET_PASS_TYPES = ['day_pass', 'multi_day'];
// Pass types that are considered "passes" (recurring/membership)
const PASS_PASS_TYPES = ['season_pass', 'annual_pass', 'vip', 'membership'];

interface ScanModalProps {
  /** Array of tickets to display */
  tickets: Ticket[];
  /** Called when modal should close */
  onClose?: () => void;
  /** Called when user wants to add a ticket (navigates to Profile) */
  onAddTicket?: () => void;
  /** Called when user taps a ticket */
  onTicketPress?: (ticket: Ticket) => void;
  /** Called when user sets a ticket as default */
  onSetDefault?: (ticketId: string) => void;
  /** Called when user long presses a ticket (for quick actions) */
  onTicketLongPress?: (ticket: Ticket) => void;
  /** Whether modal is embedded in MorphingPill */
  isEmbedded?: boolean;
  /** Only render the search input (for inside the MorphingPill) */
  inputOnly?: boolean;
  /** Only render section cards (for floating on blur backdrop) */
  sectionsOnly?: boolean;
  /** Called when search input is focused */
  onInputFocus?: () => void;
  /** Called when search query changes */
  onQueryChange?: (query: string) => void;
  /** Current search query (from parent for filtering) */
  searchQuery?: string;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  tickets,
  onClose,
  onAddTicket,
  onTicketPress,
  onSetDefault,
  onTicketLongPress,
  isEmbedded = false,
  inputOnly = false,
  sectionsOnly = false,
  onInputFocus,
  onQueryChange,
  searchQuery = '',
}) => {
  // Local search state for immediate UI feedback
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Detail view state
  const [detailViewVisible, setDetailViewVisible] = useState(false);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [detailTicketList, setDetailTicketList] = useState<Ticket[]>([]);

  // Use local query for display, parent's searchQuery for filtering
  const displayQuery = localQuery;
  const filterQuery = searchQuery;

  // Filter passes based on search query
  const filteredTickets = useMemo(() => {
    if (!filterQuery.trim()) return tickets;

    const lowerQuery = filterQuery.toLowerCase();
    return tickets.filter(ticket =>
      ticket.parkName.toLowerCase().includes(lowerQuery) ||
      ticket.passholder?.toLowerCase().includes(lowerQuery) ||
      PASS_TYPE_LABELS[ticket.passType]?.toLowerCase().includes(lowerQuery)
    );
  }, [tickets, filterQuery]);

  // Determine what to show
  const showFilterResults = filterQuery.trim().length > 0;
  const hasTickets = tickets.length > 0;

  // Split tickets into categories: Favorites, Tickets, Passes, Expired
  const { favoritePasses, ticketItems, passItems, expiredPasses } = useMemo(() => {
    const active = tickets.filter(t => t.status === 'active');
    const expired = tickets.filter(t => t.status === 'expired');

    // Favorites = user-pinned passes (up to 3)
    const favorites = active.filter(t => t.isFavorite);

    // Tickets = day_pass, multi_day (single-use/limited duration)
    const ticketsFiltered = active
      .filter(t => TICKET_PASS_TYPES.includes(t.passType))
      .sort((a, b) => a.parkName.localeCompare(b.parkName));

    // Passes = season_pass, annual_pass, vip, membership (recurring)
    const passesFiltered = active
      .filter(t => PASS_PASS_TYPES.includes(t.passType))
      .sort((a, b) => a.parkName.localeCompare(b.parkName));

    // Expired passes alphabetically
    const expiredAlphabetical = [...expired].sort((a, b) =>
      a.parkName.localeCompare(b.parkName)
    );

    return {
      favoritePasses: favorites,
      ticketItems: ticketsFiltered,
      passItems: passesFiltered,
      expiredPasses: expiredAlphabetical,
    };
  }, [tickets]);

  // Handle text input change
  const handleTextChange = useCallback((text: string) => {
    setLocalQuery(text);
    onQueryChange?.(text);
  }, [onQueryChange]);

  // Handle ticket press - show detail view
  const handleTicketPress = useCallback((ticket: Ticket, ticketList: Ticket[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const index = ticketList.findIndex(t => t.id === ticket.id);
    setSelectedTicketIndex(index >= 0 ? index : 0);
    setDetailTicketList(ticketList);
    setDetailViewVisible(true);
    onTicketPress?.(ticket);
  }, [onTicketPress]);

  // Handle long press - trigger quick actions
  const handleLongPress = useCallback((ticket: Ticket) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTicketLongPress?.(ticket);
  }, [onTicketLongPress]);

  // Close detail view
  const handleCloseDetailView = useCallback(() => {
    setDetailViewVisible(false);
  }, []);

  // Handle add ticket
  const handleAddTicket = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddTicket?.();
  }, [onAddTicket]);

  // =============================================
  // INPUT ONLY MODE: Just the TextInput
  // =============================================
  if (inputOnly) {
    return (
      <View style={styles.inputOnlyContainer}>
        <TextInput
          ref={inputRef}
          style={styles.inputOnlyStyle}
          placeholder="Search passes..."
          placeholderTextColor="#999999"
          value={displayQuery}
          onChangeText={handleTextChange}
          onFocus={onInputFocus}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    );
  }

  // =============================================
  // SECTIONS ONLY MODE: Floating section cards
  // =============================================
  if (sectionsOnly) {
    const searchBarPadding = 60 + 56 + 16; // Same as Log/Search

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sectionsOnlyContainer}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { paddingTop: searchBarPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showFilterResults ? (
            // ===== FILTER RESULTS MODE =====
            <View style={styles.section}>
              {filteredTickets.length > 0 ? (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {filteredTickets.length} {filteredTickets.length === 1 ? 'pass' : 'passes'} found
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    decelerationRate="fast"
                    snapToInterval={CARD_SIZES.all + spacing.md}
                  >
                    {filteredTickets.map((ticket) => (
                      <PassPreviewCard
                        key={ticket.id}
                        ticket={ticket}
                        size={CARD_SIZES.all}
                        onPress={() => handleTicketPress(ticket, filteredTickets)}
                        onLongPress={() => handleLongPress(ticket)}
                        showFavoriteBadge={true}
                      />
                    ))}
                  </ScrollView>
                </>
              ) : (
                // No results
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={40} color="#CCCCCC" />
                  <Text style={styles.noResultsText}>No matching passes</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try searching by park name or pass type
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // ===== DISCOVERY MODE (show all 3 sections always) =====
            <>
              {/* ========== FAVORITES SECTION (120px cards) ========== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Favorites</Text>
                  {favoritePasses.length > 0 && (
                    <Pressable onPress={handleAddTicket} hitSlop={8}>
                      <Text style={styles.addButton}>+ Add</Text>
                    </Pressable>
                  )}
                </View>
                {favoritePasses.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    decelerationRate="fast"
                    snapToInterval={CARD_SIZES.favorites + spacing.md}
                  >
                    {favoritePasses.map((ticket) => (
                      <PassPreviewCard
                        key={ticket.id}
                        ticket={ticket}
                        size={CARD_SIZES.favorites}
                        onPress={() => handleTicketPress(ticket, favoritePasses)}
                        onLongPress={() => handleLongPress(ticket)}
                        showFavoriteBadge={true}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  // Empty state for Favorites
                  <View style={styles.sectionEmptyState}>
                    <Ionicons name="star-outline" size={24} color="#CCCCCC" />
                    <Text style={styles.sectionEmptyText}>No favorites yet</Text>
                    <Text style={styles.sectionEmptySubtext}>
                      Long press any pass to add to favorites
                    </Text>
                    {hasTickets ? null : (
                      <Pressable
                        onPress={handleAddTicket}
                        style={({ pressed }) => [
                          styles.sectionEmptyAddButton,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Ionicons name="add" size={16} color={colors.accent.primary} />
                        <Text style={styles.sectionEmptyAddText}>Add Pass</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.frostedGap} />

              {/* ========== TICKETS SECTION (100px cards) ========== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tickets</Text>
                  <Pressable onPress={handleAddTicket} hitSlop={8}>
                    <Text style={styles.addButton}>+ Add</Text>
                  </Pressable>
                </View>
                {ticketItems.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    decelerationRate="fast"
                    snapToInterval={CARD_SIZES.tickets + spacing.md}
                  >
                    {ticketItems.map((ticket) => (
                      <PassPreviewCard
                        key={ticket.id}
                        ticket={ticket}
                        size={CARD_SIZES.tickets}
                        onPress={() => handleTicketPress(ticket, ticketItems)}
                        onLongPress={() => handleLongPress(ticket)}
                        showFavoriteBadge={true}
                      />
                    ))}
                    {/* Add Ticket Card at end of carousel */}
                    <Pressable
                      onPress={handleAddTicket}
                      style={({ pressed }) => [
                        styles.addPassCard,
                        { width: CARD_SIZES.tickets, height: CARD_SIZES.tickets },
                        pressed && { transform: [{ scale: 0.97 }], opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.addPassIconContainer}>
                        <Ionicons name="add" size={28} color={colors.accent.primary} />
                      </View>
                      <Text style={styles.addPassText}>Add Ticket</Text>
                    </Pressable>
                  </ScrollView>
                ) : (
                  // Empty state for Tickets
                  <View style={styles.sectionEmptyState}>
                    <Ionicons name="ticket-outline" size={24} color="#CCCCCC" />
                    <Text style={styles.sectionEmptyText}>No tickets yet</Text>
                    <Text style={styles.sectionEmptySubtext}>
                      Day passes and multi-day tickets appear here
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.frostedGap} />

              {/* ========== PASSES SECTION (100px cards) ========== */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Passes</Text>
                  <Pressable onPress={handleAddTicket} hitSlop={8}>
                    <Text style={styles.addButton}>+ Add</Text>
                  </Pressable>
                </View>
                {passItems.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    decelerationRate="fast"
                    snapToInterval={CARD_SIZES.passes + spacing.md}
                  >
                    {passItems.map((ticket) => (
                      <PassPreviewCard
                        key={ticket.id}
                        ticket={ticket}
                        size={CARD_SIZES.passes}
                        onPress={() => handleTicketPress(ticket, passItems)}
                        onLongPress={() => handleLongPress(ticket)}
                        showFavoriteBadge={true}
                      />
                    ))}
                    {/* Add Pass Card at end of carousel */}
                    <Pressable
                      onPress={handleAddTicket}
                      style={({ pressed }) => [
                        styles.addPassCard,
                        { width: CARD_SIZES.passes, height: CARD_SIZES.passes },
                        pressed && { transform: [{ scale: 0.97 }], opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.addPassIconContainer}>
                        <Ionicons name="add" size={28} color={colors.accent.primary} />
                      </View>
                      <Text style={styles.addPassText}>Add Pass</Text>
                    </Pressable>
                  </ScrollView>
                ) : (
                  // Empty state for Passes
                  <View style={styles.sectionEmptyState}>
                    <Ionicons name="card-outline" size={24} color="#CCCCCC" />
                    <Text style={styles.sectionEmptyText}>No passes yet</Text>
                    <Text style={styles.sectionEmptySubtext}>
                      Season passes and memberships appear here
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.frostedGap} />

              {/* ========== EXPIRED SECTION (100px cards, reduced opacity, no Add button) ========== */}
              <View style={[styles.section, styles.expiredSection]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Expired</Text>
                </View>
                {expiredPasses.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    decelerationRate="fast"
                    snapToInterval={CARD_SIZES.expired + spacing.md}
                  >
                    {expiredPasses.map((ticket) => (
                      <View key={ticket.id} style={styles.expiredCardWrapper}>
                        <PassPreviewCard
                          ticket={ticket}
                          size={CARD_SIZES.expired}
                          onPress={() => handleTicketPress(ticket, expiredPasses)}
                          onLongPress={() => handleLongPress(ticket)}
                          showFavoriteBadge={false}
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  // Empty state for Expired (no Add button)
                  <View style={styles.sectionEmptyState}>
                    <Ionicons name="time-outline" size={24} color="#CCCCCC" />
                    <Text style={styles.sectionEmptyText}>No expired passes</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Bottom padding for safe area */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Pass Detail View Modal */}
        <PassDetailView
          tickets={detailTicketList.length > 0 ? detailTicketList : [...ticketItems, ...passItems]}
          initialIndex={selectedTicketIndex}
          visible={detailViewVisible}
          onClose={handleCloseDetailView}
          onSetDefault={onSetDefault}
        />
      </KeyboardAvoidingView>
    );
  }

  // =============================================
  // DEFAULT MODE: Not used (legacy)
  // =============================================
  return null;
};

const styles = StyleSheet.create({
  // Input Only Mode
  inputOnlyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputOnlyStyle: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },

  // Sections Only Mode
  sectionsOnlyContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },

  // Section Card (matches Log/Search exactly)
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 8,
    paddingVertical: 16,
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

  // Carousel
  carouselContent: {
    paddingHorizontal: 16,
    gap: spacing.md,
  },

  // Expired Section
  expiredSection: {
    opacity: 0.7,
  },
  expiredCardWrapper: {
    opacity: 0.6,
  },

  // Add Pass Card (dynamically sized)
  addPassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPassIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addPassText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
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
  sectionEmptySubtext: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionEmptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: `${colors.accent.primary}10`,
    borderRadius: 20,
    gap: 4,
  },
  sectionEmptyAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },

  // No Results (search mode)
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  noResultsText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default ScanModal;
