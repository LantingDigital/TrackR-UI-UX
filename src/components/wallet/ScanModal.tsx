/**
 * ScanModal Component
 *
 * Modal content for the Scan/Wallet feature - displays user's passes in a searchable,
 * section-based interface matching Log/Search patterns.
 *
 * Sections:
 * - Most Popular Passes: Default/frequently used passes in carousel
 * - Park Passes & Tickets: All passes alphabetically in carousel
 * - Expired Passes: Inactive passes (dimmed)
 *
 * Modes:
 * - inputOnly: Just the TextInput for inside the MorphingPill
 * - sectionsOnly: Floating section cards with pass carousels
 * - default: Both combined (legacy, not used)
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Ticket, PASS_TYPE_LABELS } from '../../types/wallet';
import { PassPreviewCard } from './PassPreviewCard';
import { PassDetailView } from './PassDetailView';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card dimensions for carousel (1:1 aspect ratio)
const CARD_SIZE = 140;

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
  const defaultTicket = tickets.find(t => t.isDefault);

  // Split tickets into categories
  const { popularPasses, allPasses, expiredPasses } = useMemo(() => {
    const active = tickets.filter(t => t.status === 'active');
    const expired = tickets.filter(t => t.status === 'expired');

    // Popular = default + recently used (up to 5)
    const popular = active
      .filter(t => t.isDefault || t.lastUsedAt)
      .sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    // If no popular, use default or first active
    const finalPopular = popular.length > 0 ? popular : active.slice(0, 1);

    // All passes alphabetically
    const alphabetical = [...active].sort((a, b) =>
      a.parkName.localeCompare(b.parkName)
    );

    return {
      popularPasses: finalPopular,
      allPasses: alphabetical,
      expiredPasses: expired,
    };
  }, [tickets]);

  // Handle text input change
  const handleTextChange = useCallback((text: string) => {
    setLocalQuery(text);
    onQueryChange?.(text);
  }, [onQueryChange]);

  // Handle ticket press - show detail view
  const handleTicketPress = useCallback((ticket: Ticket, ticketList: Ticket[] = allPasses) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const index = ticketList.findIndex(t => t.id === ticket.id);
    setSelectedTicketIndex(index >= 0 ? index : 0);
    setDetailViewVisible(true);
    onTicketPress?.(ticket);
  }, [allPasses, onTicketPress]);

  // Close detail view
  const handleCloseDetailView = useCallback(() => {
    setDetailViewVisible(false);
  }, []);

  // Handle set default
  const handleSetDefault = useCallback((ticketId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSetDefault?.(ticketId);
  }, [onSetDefault]);

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
                    snapToInterval={CARD_SIZE + spacing.md}
                  >
                    {filteredTickets.map((ticket) => (
                      <PassPreviewCard
                        key={ticket.id}
                        ticket={ticket}
                        onPress={() => handleTicketPress(ticket)}
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
          ) : hasTickets ? (
            // ===== DISCOVERY MODE (has passes) =====
            <>
              {/* Most Popular Passes Section */}
              {popularPasses.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Most Popular</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    decelerationRate="fast"
                    snapToInterval={CARD_SIZE + spacing.md}
                  >
                    {popularPasses.map((ticket) => (
                      <PassPreviewCard
                        key={ticket.id}
                        ticket={ticket}
                        onPress={() => handleTicketPress(ticket)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.frostedGap} />

              {/* All Passes Section (Alphabetical) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Park Passes & Tickets</Text>
                  <Pressable onPress={handleAddTicket}>
                    <Text style={styles.addButton}>+ Add</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContent}
                  decelerationRate="fast"
                  snapToInterval={CARD_SIZE + spacing.md}
                >
                  {allPasses.map((ticket) => (
                    <PassPreviewCard
                      key={ticket.id}
                      ticket={ticket}
                      onPress={() => handleTicketPress(ticket)}
                    />
                  ))}

                  {/* Add Pass Card */}
                  <Pressable
                    onPress={handleAddTicket}
                    style={({ pressed }) => [
                      styles.addPassCard,
                      pressed && { transform: [{ scale: 0.97 }], opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.addPassIconContainer}>
                      <Ionicons name="add" size={32} color={colors.accent.primary} />
                    </View>
                    <Text style={styles.addPassText}>Add Pass</Text>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Expired Passes Section */}
              {expiredPasses.length > 0 && (
                <>
                  <View style={styles.frostedGap} />
                  <View style={[styles.section, styles.expiredSection]}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Expired Passes</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.carouselContent}
                      decelerationRate="fast"
                      snapToInterval={CARD_SIZE + spacing.md}
                    >
                      {expiredPasses.map((ticket) => (
                        <View key={ticket.id} style={styles.expiredCardWrapper}>
                          <PassPreviewCard
                            ticket={ticket}
                            onPress={() => handleTicketPress(ticket)}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </>
          ) : (
            // ===== EMPTY STATE (no passes) =====
            <View style={styles.section}>
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="ticket-outline" size={32} color={colors.accent.primary} />
                </View>
                <Text style={styles.emptyStateTitle}>No passes yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Add theme park passes from your Profile to quickly access them here
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.emptyStateCTA,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleAddTicket}
                >
                  <Text style={styles.emptyStateCTAText}>Add Your First Pass</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Bottom padding for safe area */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Pass Detail View Modal */}
        <PassDetailView
          tickets={allPasses}
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

  // Add Pass Card
  addPassCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPassIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addPassText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },


  // No Results
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

  // Empty State (matches LogModal pattern)
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.accent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  emptyStateCTAText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ScanModal;
