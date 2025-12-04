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
import {
  Ticket,
  WalletState,
  FilterPreferences,
  DEFAULT_WALLET_STATE,
  DEFAULT_FILTER_PREFERENCES,
} from '../types/wallet';
import { WalletStorage } from '../services/walletStorage';

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

  // Actions
  addTicket: (ticket: Omit<Ticket, 'id' | 'addedAt' | 'isDefault'>) => Promise<Ticket>;
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
    async (ticketData: Omit<Ticket, 'id' | 'addedAt' | 'isDefault'>): Promise<Ticket> => {
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
      await WalletStorage.markTicketUsed(id);
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

  const value: WalletContextValue = {
    tickets,
    defaultTicket,
    isLoading,
    isInitialized,
    error,
    filteredTickets,
    filterPreferences,
    stackTickets,
    addTicket,
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
