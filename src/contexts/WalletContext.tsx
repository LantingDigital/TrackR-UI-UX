/**
 * Wallet Store — Zustand
 *
 * Manages wallet/ticket state. Backed by WalletStorage service (SecureStore + FileSystem).
 * Converted from React Context/Provider to Zustand for consistency with all other stores.
 *
 * Consumers use `useWalletContext` (same export name) — no import changes needed.
 */

import { create } from 'zustand';
import {
  Ticket,
  FilterPreferences,
  DEFAULT_FILTER_PREFERENCES,
} from '../types/wallet';
import { WalletStorage } from '../services/walletStorage';
import { getCardArtForPark, getLogoForPark, getHeroUrlForPark } from '../utils/parkAssets';

// ============================================
// Image Hydration
// ============================================

const hydrateTicketImages = (ticket: Ticket): Ticket => {
  const heroImageSource = ticket.heroImageSource || getCardArtForPark(ticket.parkName);
  const heroImageUri = ticket.heroImageUri || getHeroUrlForPark(ticket.parkName);
  const logoImageSource = ticket.logoImageSource || getLogoForPark(ticket.parkName);

  if (heroImageSource || heroImageUri || logoImageSource) {
    return {
      ...ticket,
      ...(heroImageSource && { heroImageSource }),
      ...(heroImageUri && { heroImageUri }),
      ...(logoImageSource && { logoImageSource }),
    };
  }
  return ticket;
};

// ============================================
// Store Types
// ============================================

interface WalletState {
  tickets: Ticket[];
  defaultTicketId: string | null;
  filterPreferences: FilterPreferences;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface WalletActions {
  initialize: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  addTicket: (ticket: Omit<Ticket, 'id' | 'addedAt' | 'isDefault' | 'isFavorite'>) => Promise<Ticket>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  setDefaultTicket: (id: string) => Promise<void>;
  markTicketUsed: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  setFilterPreferences: (prefs: Partial<FilterPreferences>) => void;
  clearFilters: () => void;
}

type WalletStore = WalletState & WalletActions;

// ============================================
// Store
// ============================================

const useStore = create<WalletStore>((set, get) => ({
  // Initial state
  tickets: [],
  defaultTicketId: null,
  filterPreferences: DEFAULT_FILTER_PREFERENCES,
  isLoading: true,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;
    try {
      set({ isLoading: true, error: null });
      await WalletStorage.initialize();

      const state = await WalletStorage.getWalletState();
      set({
        tickets: state.tickets.map(hydrateTicketImages),
        defaultTicketId: state.defaultTicketId,
        filterPreferences: state.filterPreferences || DEFAULT_FILTER_PREFERENCES,
      });

      await WalletStorage.refreshTicketStatuses();
      const refreshedState = await WalletStorage.getWalletState();
      set({
        tickets: refreshedState.tickets.map(hydrateTicketImages),
        isInitialized: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to initialize wallet:', err);
      set({ error: 'Failed to load wallet', isLoading: false });
    }
  },

  refreshTickets: async () => {
    try {
      set({ isLoading: true });
      await WalletStorage.refreshTicketStatuses();
      const state = await WalletStorage.getWalletState();
      set({
        tickets: state.tickets.map(hydrateTicketImages),
        defaultTicketId: state.defaultTicketId,
        filterPreferences: state.filterPreferences || DEFAULT_FILTER_PREFERENCES,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to refresh tickets:', err);
      set({ error: 'Failed to refresh tickets', isLoading: false });
    }
  },

  addTicket: async (ticketData) => {
    const newTicket = await WalletStorage.saveTicket(ticketData);
    const { tickets } = get();
    set({
      tickets: [...tickets, newTicket],
      ...(tickets.length === 0 ? { defaultTicketId: newTicket.id } : {}),
    });
    return newTicket;
  },

  updateTicket: async (id, updates) => {
    await WalletStorage.updateTicket(id, updates);
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTicket: async (id) => {
    await WalletStorage.deleteTicket(id);
    const { tickets, defaultTicketId } = get();
    const remaining = tickets.filter((t) => t.id !== id);
    set({
      tickets: remaining,
      ...(defaultTicketId === id
        ? { defaultTicketId: remaining[0]?.id || null }
        : {}),
    });
  },

  setDefaultTicket: async (id) => {
    await WalletStorage.setDefaultTicket(id);
    set((state) => ({
      defaultTicketId: id,
      tickets: state.tickets.map((t) => ({ ...t, isDefault: t.id === id })),
    }));
  },

  markTicketUsed: async (id) => {
    try {
      await WalletStorage.markTicketUsed(id);
      const now = new Date().toISOString();
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === id ? { ...t, lastUsedAt: now } : t
        ),
      }));
    } catch (err) {
      console.error('Failed to mark ticket used:', err);
    }
  },

  toggleFavorite: async (id) => {
    const { tickets } = get();
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) throw new Error('Ticket not found');

    const currentFavoriteCount = tickets.filter((t) => t.isFavorite).length;
    if (!ticket.isFavorite && currentFavoriteCount >= 3) {
      throw new Error('Maximum of 3 favorites allowed');
    }

    const newIsFavorite = !ticket.isFavorite;
    await WalletStorage.updateTicket(id, { isFavorite: newIsFavorite });
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, isFavorite: newIsFavorite } : t
      ),
    }));
    return newIsFavorite;
  },

  setFilterPreferences: (prefs) => {
    set((state) => {
      const updated = { ...state.filterPreferences, ...prefs };
      WalletStorage.updateFilterPreferences(updated).catch(console.error);
      return { filterPreferences: updated };
    });
  },

  clearFilters: () => {
    set({ filterPreferences: DEFAULT_FILTER_PREFERENCES });
    WalletStorage.updateFilterPreferences(DEFAULT_FILTER_PREFERENCES).catch(
      console.error
    );
  },
}));

// Auto-initialize on first import
useStore.getState().initialize();

// Internal store access (for screenshot seed / sync layer only)
export const _walletStoreInternal = useStore;

// ============================================
// React Hook (same API as original Context)
// ============================================

export function useWalletContext() {
  const state = useStore();

  // Derived: default ticket
  const defaultTicket = state.defaultTicketId
    ? state.tickets.find((t) => t.id === state.defaultTicketId) || null
    : state.tickets.find((t) => t.status === 'active') || state.tickets[0] || null;

  // Derived: filtered tickets
  const filteredTickets = state.tickets.filter((ticket) => {
    const fp = state.filterPreferences;
    if (fp.parkChains.length > 0 && !fp.parkChains.includes(ticket.parkChain)) return false;
    if (fp.passTypes.length > 0 && !fp.passTypes.includes(ticket.passType)) return false;
    if (!fp.showExpired && ticket.status === 'expired') return false;
    if (fp.dateRange) {
      const ticketDate = new Date(ticket.validFrom);
      if (fp.dateRange.from && ticketDate < new Date(fp.dateRange.from)) return false;
      if (fp.dateRange.to && ticketDate > new Date(fp.dateRange.to)) return false;
    }
    return true;
  });

  // Derived: stack tickets (default first, then by addedAt)
  const activeTickets = state.tickets.filter((t) => t.status === 'active');
  const stackTickets = [...activeTickets].sort((a, b) => {
    if (a.id === state.defaultTicketId) return -1;
    if (b.id === state.defaultTicketId) return 1;
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  // Derived: favorite tickets
  const favoriteTickets = state.tickets
    .filter((t) => t.isFavorite && t.status === 'active')
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  return {
    tickets: state.tickets,
    defaultTicket,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    filteredTickets,
    filterPreferences: state.filterPreferences,
    stackTickets,
    favoriteTickets,
    addTicket: state.addTicket,
    toggleFavorite: state.toggleFavorite,
    updateTicket: state.updateTicket,
    deleteTicket: state.deleteTicket,
    setDefaultTicket: state.setDefaultTicket,
    markTicketUsed: state.markTicketUsed,
    setFilterPreferences: state.setFilterPreferences,
    clearFilters: state.clearFilters,
    refreshTickets: state.refreshTickets,
  };
}

// Keep WalletProvider as a no-op pass-through for backwards compatibility
// so RootNavigator doesn't need changes until next refactor
import React, { ReactNode } from 'react';

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
