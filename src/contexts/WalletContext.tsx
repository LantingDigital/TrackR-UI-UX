/**
 * Wallet Context
 *
 * Provides wallet state and actions to all components.
 * Handles loading, caching, and CRUD operations for tickets.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { ImageSourcePropType } from 'react-native';
import {
  Ticket,
  WalletState,
  FilterPreferences,
  DEFAULT_WALLET_STATE,
  DEFAULT_FILTER_PREFERENCES,
} from '../types/wallet';
import { WalletStorage } from '../services/walletStorage';

/**
 * Local pass images - bundled with the app
 * Card art and logos stored in assets/wallet/parks/
 */
const CARD_ART = {
  carowinds: require('../../assets/wallet/parks/card-art/carowinds.jpg'),
  cedarPoint: require('../../assets/wallet/parks/card-art/cedar-point.jpg'),
  kingsIsland: require('../../assets/wallet/parks/card-art/kings-island.jpg'),
};

const LOGOS = {
  carowinds: require('../../assets/wallet/parks/logos/carowinds.png'),
  cedarPoint: require('../../assets/wallet/parks/logos/cedar-point.png'),
  kingsIsland: require('../../assets/wallet/parks/logos/kings-island.png'),
};

/**
 * Mock tickets for development/testing
 * Uses Cedar Point, Kings Island, Carowinds with real assets
 * Other parks use gradient fallback
 */
const MOCK_TICKETS: Ticket[] = [
  // ===== PARKS WITH ASSETS (Cedar Point, Kings Island, Carowinds) =====
  {
    id: 'mock-carowinds',
    parkName: 'Carowinds',
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'John Smith',
    validFrom: '2025-01-01',
    validUntil: '2025-12-31',
    qrData: 'CAROWINDS-SEASON-2025-001234',
    qrFormat: 'QR_CODE',
    heroImageSource: CARD_ART.carowinds,
    logoImageSource: LOGOS.carowinds,
    status: 'active',
    isDefault: true,
    isFavorite: true,
    addedAt: '2025-01-15T10:30:00Z',
    autoDetected: true,
    lastUsedAt: '2025-12-15T14:00:00Z',
  },
  {
    id: 'mock-cedar-point',
    parkName: 'Cedar Point',
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'John Smith',
    validFrom: '2025-01-01',
    validUntil: '2025-12-31',
    qrData: 'CEDARPOINT-SEASON-2025-005678',
    qrFormat: 'QR_CODE',
    heroImageSource: CARD_ART.cedarPoint,
    logoImageSource: LOGOS.cedarPoint,
    status: 'active',
    isDefault: false,
    isFavorite: true,
    addedAt: '2025-01-15T10:35:00Z',
    autoDetected: true,
  },
  {
    id: 'mock-kings-island',
    parkName: 'Kings Island',
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'John Smith',
    validFrom: '2025-01-01',
    validUntil: '2025-12-31',
    qrData: 'KINGSISLAND-SEASON-2025-009012',
    qrFormat: 'QR_CODE',
    heroImageSource: CARD_ART.kingsIsland,
    logoImageSource: LOGOS.kingsIsland,
    status: 'active',
    isDefault: false,
    isFavorite: true,
    addedAt: '2025-01-20T10:00:00Z',
    autoDetected: true,
  },
  // ===== PARKS WITHOUT ASSETS (gradient fallback) =====
  {
    id: 'mock-sfmm',
    parkName: 'Six Flags Magic Mountain',
    parkChain: 'six_flags',
    passType: 'annual_pass',
    passholder: 'John Smith',
    validFrom: '2025-03-01',
    validUntil: '2026-02-28',
    qrData: 'SFMM-ANNUAL-2025-003456',
    qrFormat: 'QR_CODE',
    // No heroImageSource - will use gradient fallback
    status: 'active',
    isDefault: false,
    isFavorite: false,
    addedAt: '2025-03-01T14:00:00Z',
    autoDetected: true,
  },
  {
    id: 'mock-disney',
    parkName: 'Walt Disney World',
    parkChain: 'disney',
    passType: 'annual_pass',
    passholder: 'John Smith',
    validFrom: '2024-12-01',
    validUntil: '2025-11-30',
    qrData: 'WDW-ANNUAL-PLATINUM-2024-007890',
    qrFormat: 'QR_CODE',
    // No heroImageSource - will use gradient fallback
    status: 'active',
    isDefault: false,
    isFavorite: false,
    addedAt: '2024-12-01T09:00:00Z',
    autoDetected: true,
  },
  // ===== EXPIRED PASSES (for testing expired carousel) =====
  {
    id: 'mock-expired-1',
    parkName: 'Busch Gardens Tampa',
    parkChain: 'seaworld',
    passType: 'annual_pass',
    passholder: 'John Smith',
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    qrData: 'BGT-ANNUAL-2024-003456',
    qrFormat: 'QR_CODE',
    status: 'expired',
    isDefault: false,
    isFavorite: false,
    addedAt: '2024-01-10T09:00:00Z',
    autoDetected: true,
  },
];

// Set to true to use mock data for design testing
const USE_MOCK_DATA = true;

/**
 * Context value interface
 */
interface WalletContextValue {
  // State
  tickets: Ticket[];
  defaultTicket: Ticket | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Filtered tickets for Profile list
  filteredTickets: Ticket[];
  filterPreferences: FilterPreferences;

  // Tickets ordered for card stack (default first)
  stackTickets: Ticket[];

  // Favorite tickets (user-pinned, up to 3)
  favoriteTickets: Ticket[];

  // Actions
  addTicket: (ticket: Omit<Ticket, 'id' | 'addedAt' | 'isDefault' | 'isFavorite'>) => Promise<Ticket>;
  toggleFavorite: (id: string) => Promise<boolean>; // Returns true if now favorite, false if unfavorited
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  setDefaultTicket: (id: string) => Promise<void>;
  markTicketUsed: (id: string) => Promise<void>;

  // Filters
  setFilterPreferences: (prefs: Partial<FilterPreferences>) => void;
  clearFilters: () => void;

  // Refresh
  refreshTickets: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [defaultTicketId, setDefaultTicketId] = useState<string | null>(null);
  const [filterPreferences, setFilterPreferencesState] = useState<FilterPreferences>(
    DEFAULT_FILTER_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize wallet on mount
   */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use mock data for design testing
        if (USE_MOCK_DATA) {
          setTickets(MOCK_TICKETS);
          setDefaultTicketId('mock-1');
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Initialize storage directories
        await WalletStorage.initialize();

        // Load wallet state
        const state = await WalletStorage.getWalletState();
        setTickets(state.tickets);
        setDefaultTicketId(state.defaultTicketId);
        setFilterPreferencesState(state.filterPreferences || DEFAULT_FILTER_PREFERENCES);

        // Refresh ticket statuses (mark expired)
        await WalletStorage.refreshTicketStatuses();
        const refreshedState = await WalletStorage.getWalletState();
        setTickets(refreshedState.tickets);

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError('Failed to load wallet');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  /**
   * Refresh tickets from storage
   */
  const refreshTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      await WalletStorage.refreshTicketStatuses();
      const state = await WalletStorage.getWalletState();
      setTickets(state.tickets);
      setDefaultTicketId(state.defaultTicketId);
      setFilterPreferencesState(state.filterPreferences || DEFAULT_FILTER_PREFERENCES);
    } catch (err) {
      console.error('Failed to refresh tickets:', err);
      setError('Failed to refresh tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a new ticket
   */
  const addTicket = useCallback(
    async (ticketData: Omit<Ticket, 'id' | 'addedAt' | 'isDefault' | 'isFavorite'>): Promise<Ticket> => {
      try {
        const newTicket = await WalletStorage.saveTicket(ticketData);
        setTickets((prev) => [...prev, newTicket]);
        if (tickets.length === 0) {
          setDefaultTicketId(newTicket.id);
        }
        return newTicket;
      } catch (err) {
        console.error('Failed to add ticket:', err);
        throw err;
      }
    },
    [tickets.length]
  );

  /**
   * Update an existing ticket
   */
  const updateTicket = useCallback(async (id: string, updates: Partial<Ticket>) => {
    try {
      await WalletStorage.updateTicket(id, updates);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    } catch (err) {
      console.error('Failed to update ticket:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a ticket
   */
  const deleteTicket = useCallback(
    async (id: string) => {
      try {
        await WalletStorage.deleteTicket(id);
        setTickets((prev) => prev.filter((t) => t.id !== id));

        // Update default if needed
        if (defaultTicketId === id) {
          const remaining = tickets.filter((t) => t.id !== id);
          setDefaultTicketId(remaining[0]?.id || null);
        }
      } catch (err) {
        console.error('Failed to delete ticket:', err);
        throw err;
      }
    },
    [defaultTicketId, tickets]
  );

  /**
   * Set a ticket as default
   */
  const setDefaultTicket = useCallback(async (id: string) => {
    try {
      await WalletStorage.setDefaultTicket(id);
      setDefaultTicketId(id);
      setTickets((prev) =>
        prev.map((t) => ({ ...t, isDefault: t.id === id }))
      );
    } catch (err) {
      console.error('Failed to set default ticket:', err);
      throw err;
    }
  }, []);

  /**
   * Mark a ticket as used (update lastUsedAt)
   */
  const markTicketUsed = useCallback(async (id: string) => {
    try {
      // Only update storage if not using mock data
      if (!USE_MOCK_DATA) {
        await WalletStorage.markTicketUsed(id);
      }
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, lastUsedAt: now } : t))
      );
    } catch (err) {
      console.error('Failed to mark ticket used:', err);
      // Don't throw - this is a non-critical operation
    }
  }, []);

  /**
   * Toggle favorite status for a ticket (max 3 favorites allowed)
   * Returns true if ticket is now favorited, false if unfavorited
   */
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const currentFavoriteCount = tickets.filter((t) => t.isFavorite).length;
    const isCurrentlyFavorite = ticket.isFavorite;

    // If trying to add a new favorite and already at max (3)
    if (!isCurrentlyFavorite && currentFavoriteCount >= 3) {
      throw new Error('Maximum of 3 favorites allowed');
    }

    const newIsFavorite = !isCurrentlyFavorite;

    try {
      // Update in storage (if not using mock data)
      if (!USE_MOCK_DATA) {
        await WalletStorage.updateTicket(id, { isFavorite: newIsFavorite });
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isFavorite: newIsFavorite } : t))
      );

      return newIsFavorite;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      throw err;
    }
  }, [tickets]);

  /**
   * Update filter preferences
   */
  const setFilterPreferences = useCallback(
    (prefs: Partial<FilterPreferences>) => {
      setFilterPreferencesState((prev) => {
        const updated = { ...prev, ...prefs };
        // Persist to storage
        WalletStorage.updateFilterPreferences(updated).catch(console.error);
        return updated;
      });
    },
    []
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilterPreferencesState(DEFAULT_FILTER_PREFERENCES);
    WalletStorage.updateFilterPreferences(DEFAULT_FILTER_PREFERENCES).catch(
      console.error
    );
  }, []);

  /**
   * Get the default ticket object
   */
  const defaultTicket = useMemo(() => {
    if (!defaultTicketId) {
      // Return first active ticket if no default
      return tickets.find((t) => t.status === 'active') || tickets[0] || null;
    }
    return tickets.find((t) => t.id === defaultTicketId) || null;
  }, [tickets, defaultTicketId]);

  /**
   * Get filtered tickets for Profile list
   */
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Filter by park chain
      if (
        filterPreferences.parkChains.length > 0 &&
        !filterPreferences.parkChains.includes(ticket.parkChain)
      ) {
        return false;
      }

      // Filter by pass type
      if (
        filterPreferences.passTypes.length > 0 &&
        !filterPreferences.passTypes.includes(ticket.passType)
      ) {
        return false;
      }

      // Filter by expired status
      if (!filterPreferences.showExpired && ticket.status === 'expired') {
        return false;
      }

      // Filter by date range
      if (filterPreferences.dateRange) {
        const ticketDate = new Date(ticket.validFrom);
        if (filterPreferences.dateRange.from) {
          const fromDate = new Date(filterPreferences.dateRange.from);
          if (ticketDate < fromDate) return false;
        }
        if (filterPreferences.dateRange.to) {
          const toDate = new Date(filterPreferences.dateRange.to);
          if (ticketDate > toDate) return false;
        }
      }

      return true;
    });
  }, [tickets, filterPreferences]);

  /**
   * Get tickets sorted for card stack display
   * Default ticket first, then most recently added
   */
  const stackTickets = useMemo(() => {
    const activeTickets = tickets.filter((t) => t.status === 'active');

    return activeTickets.sort((a, b) => {
      // Default ticket always first
      if (a.id === defaultTicketId) return -1;
      if (b.id === defaultTicketId) return 1;
      // Then by addedAt descending
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }, [tickets, defaultTicketId]);

  /**
   * Get favorite tickets (user-pinned, up to 3)
   * Only includes active tickets
   */
  const favoriteTickets = useMemo(() => {
    return tickets
      .filter((t) => t.isFavorite && t.status === 'active')
      .sort((a, b) => {
        // Sort by addedAt descending (most recently added first)
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
  }, [tickets]);

  const value: WalletContextValue = {
    tickets,
    defaultTicket,
    isLoading,
    isInitialized,
    error,
    filteredTickets,
    filterPreferences,
    stackTickets,
    favoriteTickets,
    addTicket,
    toggleFavorite,
    updateTicket,
    deleteTicket,
    setDefaultTicket,
    markTicketUsed,
    setFilterPreferences,
    clearFilters,
    refreshTickets,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

/**
 * Hook to access wallet context
 * Throws if used outside WalletProvider
 */
export const useWalletContext = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
