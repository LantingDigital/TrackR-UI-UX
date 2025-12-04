/**
 * Wallet Storage Service
 *
 * Handles local storage of tickets using:
 * - expo-file-system (new class-based API in SDK 54) for images
 * - expo-secure-store for encrypted ticket metadata
 */

import { File, Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import {
  Ticket,
  WalletState,
  FilterPreferences,
  DEFAULT_WALLET_STATE,
  DEFAULT_FILTER_PREFERENCES,
} from '../types/wallet';

// Storage keys
const WALLET_DATA_KEY = 'wallet_data';
const WALLET_VERSION_KEY = 'wallet_version';
const CURRENT_VERSION = '1.0';

// Directory references using new API
const getWalletDir = () => new Directory(Paths.document, 'wallet');
const getOriginalsDir = () => new Directory(Paths.document, 'wallet', 'originals');
const getThumbnailsDir = () => new Directory(Paths.document, 'wallet', 'thumbnails');

/**
 * Generate a UUID for new tickets
 */
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Wallet Storage Service
 */
export const WalletStorage = {
  /**
   * Initialize storage directories
   * Call this on app startup
   */
  async initialize(): Promise<void> {
    try {
      // Create directories if they don't exist
      const walletDir = getWalletDir();
      const originalsDir = getOriginalsDir();
      const thumbnailsDir = getThumbnailsDir();

      if (!walletDir.exists) {
        walletDir.create();
      }

      if (!originalsDir.exists) {
        originalsDir.create();
      }

      if (!thumbnailsDir.exists) {
        thumbnailsDir.create();
      }

      // Check/set version
      const version = await SecureStore.getItemAsync(WALLET_VERSION_KEY);
      if (!version) {
        await SecureStore.setItemAsync(WALLET_VERSION_KEY, CURRENT_VERSION);
      }

      // Initialize wallet data if doesn't exist
      const walletData = await SecureStore.getItemAsync(WALLET_DATA_KEY);
      if (!walletData) {
        await SecureStore.setItemAsync(
          WALLET_DATA_KEY,
          JSON.stringify(DEFAULT_WALLET_STATE)
        );
      }
    } catch (error) {
      console.error('Failed to initialize wallet storage:', error);
      throw error;
    }
  },

  /**
   * Get the full wallet state
   */
  async getWalletState(): Promise<WalletState> {
    try {
      const data = await SecureStore.getItemAsync(WALLET_DATA_KEY);
      if (data) {
        return JSON.parse(data) as WalletState;
      }
      return DEFAULT_WALLET_STATE;
    } catch (error) {
      console.error('Failed to get wallet state:', error);
      return DEFAULT_WALLET_STATE;
    }
  },

  /**
   * Update wallet state
   */
  async updateWalletState(updates: Partial<WalletState>): Promise<void> {
    try {
      const currentState = await this.getWalletState();
      const newState: WalletState = {
        ...currentState,
        ...updates,
        lastModifiedAt: new Date().toISOString(),
      };
      await SecureStore.setItemAsync(WALLET_DATA_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to update wallet state:', error);
      throw error;
    }
  },

  /**
   * Get all tickets
   */
  async getAllTickets(): Promise<Ticket[]> {
    const state = await this.getWalletState();
    return state.tickets;
  },

  /**
   * Get a single ticket by ID
   */
  async getTicket(id: string): Promise<Ticket | null> {
    const tickets = await this.getAllTickets();
    return tickets.find((t) => t.id === id) || null;
  },

  /**
   * Get the default ticket (shown first in stack)
   */
  async getDefaultTicket(): Promise<Ticket | null> {
    const state = await this.getWalletState();
    if (!state.defaultTicketId) {
      // Return first active ticket if no default set
      const activeTicket = state.tickets.find((t) => t.status === 'active');
      return activeTicket || state.tickets[0] || null;
    }
    return state.tickets.find((t) => t.id === state.defaultTicketId) || null;
  },

  /**
   * Save a new ticket
   */
  async saveTicket(
    ticketData: Omit<Ticket, 'id' | 'addedAt' | 'isDefault'>
  ): Promise<Ticket> {
    const state = await this.getWalletState();

    const newTicket: Ticket = {
      ...ticketData,
      id: generateId(),
      addedAt: new Date().toISOString(),
      isDefault: state.tickets.length === 0, // First ticket is default
    };

    const updatedTickets = [...state.tickets, newTicket];

    await this.updateWalletState({
      tickets: updatedTickets,
      defaultTicketId:
        state.tickets.length === 0 ? newTicket.id : state.defaultTicketId,
    });

    return newTicket;
  },

  /**
   * Update an existing ticket
   */
  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    const state = await this.getWalletState();
    const ticketIndex = state.tickets.findIndex((t) => t.id === id);

    if (ticketIndex === -1) {
      throw new Error(`Ticket not found: ${id}`);
    }

    const updatedTickets = [...state.tickets];
    updatedTickets[ticketIndex] = {
      ...updatedTickets[ticketIndex],
      ...updates,
    };

    await this.updateWalletState({ tickets: updatedTickets });
  },

  /**
   * Delete a ticket and its associated images
   */
  async deleteTicket(id: string): Promise<void> {
    const state = await this.getWalletState();
    const ticket = state.tickets.find((t) => t.id === id);

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`);
    }

    // Delete associated images
    await this.deleteTicketImages(id);

    // Remove from tickets array
    const updatedTickets = state.tickets.filter((t) => t.id !== id);

    // Update default if needed
    let newDefaultId = state.defaultTicketId;
    if (state.defaultTicketId === id) {
      newDefaultId = updatedTickets[0]?.id || null;
    }

    await this.updateWalletState({
      tickets: updatedTickets,
      defaultTicketId: newDefaultId,
    });
  },

  /**
   * Set a ticket as the default
   */
  async setDefaultTicket(ticketId: string): Promise<void> {
    const state = await this.getWalletState();

    // Update isDefault flag on all tickets
    const updatedTickets = state.tickets.map((t) => ({
      ...t,
      isDefault: t.id === ticketId,
    }));

    await this.updateWalletState({
      tickets: updatedTickets,
      defaultTicketId: ticketId,
    });
  },

  /**
   * Save original photo for a ticket
   * Returns the local file URI
   */
  async saveOriginalPhoto(ticketId: string, sourceUri: string): Promise<string> {
    try {
      const sourceFile = new File(sourceUri);
      const destFile = new File(getOriginalsDir(), `${ticketId}.png`);

      // Copy file using new API
      sourceFile.copy(destFile);

      return destFile.uri;
    } catch (error) {
      console.error('Failed to save original photo:', error);
      throw error;
    }
  },

  /**
   * Save thumbnail for a ticket
   * Returns the local file URI
   */
  async saveThumbnail(ticketId: string, sourceUri: string): Promise<string> {
    try {
      const sourceFile = new File(sourceUri);
      const destFile = new File(getThumbnailsDir(), `${ticketId}_thumb.png`);

      // Copy file using new API
      sourceFile.copy(destFile);

      return destFile.uri;
    } catch (error) {
      console.error('Failed to save thumbnail:', error);
      throw error;
    }
  },

  /**
   * Delete images associated with a ticket
   */
  async deleteTicketImages(ticketId: string): Promise<void> {
    try {
      const originalFile = new File(getOriginalsDir(), `${ticketId}.png`);
      const thumbnailFile = new File(getThumbnailsDir(), `${ticketId}_thumb.png`);

      if (originalFile.exists) {
        originalFile.delete();
      }

      if (thumbnailFile.exists) {
        thumbnailFile.delete();
      }
    } catch (error) {
      console.error('Failed to delete ticket images:', error);
      // Don't throw - best effort deletion
    }
  },

  /**
   * Get filter preferences
   */
  async getFilterPreferences(): Promise<FilterPreferences> {
    const state = await this.getWalletState();
    return state.filterPreferences || DEFAULT_FILTER_PREFERENCES;
  },

  /**
   * Update filter preferences
   */
  async updateFilterPreferences(
    prefs: Partial<FilterPreferences>
  ): Promise<void> {
    const state = await this.getWalletState();
    await this.updateWalletState({
      filterPreferences: {
        ...state.filterPreferences,
        ...prefs,
      },
    });
  },

  /**
   * Get tickets filtered by current preferences
   */
  async getFilteredTickets(): Promise<Ticket[]> {
    const state = await this.getWalletState();
    const { tickets, filterPreferences } = state;

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
  },

  /**
   * Get tickets sorted for display in card stack
   * Default ticket first, then by most recently added
   */
  async getTicketsForStack(): Promise<Ticket[]> {
    const state = await this.getWalletState();
    const activeTickets = state.tickets.filter((t) => t.status === 'active');

    // Sort: default first, then by addedAt descending
    return activeTickets.sort((a, b) => {
      if (a.id === state.defaultTicketId) return -1;
      if (b.id === state.defaultTicketId) return 1;
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  },

  /**
   * Mark a ticket as used (update lastUsedAt)
   */
  async markTicketUsed(ticketId: string): Promise<void> {
    await this.updateTicket(ticketId, {
      lastUsedAt: new Date().toISOString(),
    });
  },

  /**
   * Update ticket status based on dates
   * Call periodically to mark expired tickets
   */
  async refreshTicketStatuses(): Promise<void> {
    const state = await this.getWalletState();
    const now = new Date();
    let hasChanges = false;

    const updatedTickets = state.tickets.map((ticket) => {
      if (ticket.status === 'active') {
        const validUntil = new Date(ticket.validUntil);
        if (validUntil < now) {
          hasChanges = true;
          return { ...ticket, status: 'expired' as const };
        }
      }
      return ticket;
    });

    if (hasChanges) {
      await this.updateWalletState({ tickets: updatedTickets });
    }
  },

  /**
   * Clear all wallet data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    try {
      // Delete wallet directory
      const walletDir = getWalletDir();
      if (walletDir.exists) {
        walletDir.delete();
      }

      // Reset secure store
      await SecureStore.setItemAsync(
        WALLET_DATA_KEY,
        JSON.stringify(DEFAULT_WALLET_STATE)
      );

      // Re-initialize directories
      await this.initialize();
    } catch (error) {
      console.error('Failed to clear wallet:', error);
      throw error;
    }
  },
};
