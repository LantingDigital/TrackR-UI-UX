/**
 * Cart Store — Zustand store for merch cart state
 *
 * Manages cart items, quantities, gold foil selection, and pack building.
 * Pro discount applied at checkout, not stored per-item.
 */

import { create } from 'zustand';
import { MERCH_PRICING, PACK_OPTIONS, calculateCardPrice } from '../../../data/mockMerchData';

// ─── Types ──────────────────────────────────────────────

export interface CartItem {
  productId: string;
  coasterId: string;
  name: string;
  parkName: string;
  artSource: any;
  quantity: number;
  goldFoil: boolean;
  hasGoldVerified: boolean;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface CartState {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  isPro: boolean; // mock: user Pro status

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleGoldFoil: (productId: string) => void;
  clearCart: () => void;
  setShippingAddress: (address: ShippingAddress) => void;
  setIsPro: (isPro: boolean) => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getProDiscount: () => number;
  getShipping: () => number;
  getTotal: () => number;
}

// ─── Store ──────────────────────────────────────────────

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  shippingAddress: null,
  isPro: false,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(i => i.productId === item.productId && i.goldFoil === item.goldFoil);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.productId === item.productId && i.goldFoil === item.goldFoil
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter(i => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map(i =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }));
  },

  toggleGoldFoil: (productId) => {
    set((state) => ({
      items: state.items.map(i =>
        i.productId === productId ? { ...i, goldFoil: !i.goldFoil } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  setShippingAddress: (address) => set({ shippingAddress: address }),

  setIsPro: (isPro) => set({ isPro }),

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const unitPrice = calculateCardPrice(item.goldFoil, item.hasGoldVerified);
      return sum + unitPrice * item.quantity;
    }, 0);
  },

  getProDiscount: () => {
    if (!get().isPro) return 0;
    return get().getSubtotal() * MERCH_PRICING.proDiscountPercent;
  },

  getShipping: () => {
    if (get().items.length === 0) return 0;
    return MERCH_PRICING.shippingUS;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getProDiscount();
    const shipping = get().getShipping();
    return subtotal - discount + shipping;
  },
}));

// ─── Selectors ──────────────────────────────────────────

export const selectCartItems = (state: CartState) => state.items;
export const selectCartItemCount = (state: CartState) => state.getItemCount();
export const selectIsPro = (state: CartState) => state.isPro;
