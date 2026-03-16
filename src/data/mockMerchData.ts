/**
 * Mock Merch Data — physical card art products
 *
 * Uses real NanoBanana card art from cardArt.ts.
 * All prices in USD. Gold foil upcharge: $2.99 (free if GPS-verified).
 * Pack discounts: 5-pack 10%, 10-pack 20%, 20-pack 30%.
 * Pro users: 10% off all orders.
 */

import { CARD_ART } from './cardArt';
import { COASTER_BY_ID, type CoasterIndexEntry } from './coasterIndex';

// ─── Types ──────────────────────────────────────────────

export interface MerchProduct {
  id: string;
  coasterId: string;
  name: string;
  parkName: string;
  parkId: string;
  price: number;
  artSource: any;
  stats: {
    heightFt?: number;
    speedMph?: number;
    lengthFt?: number;
    inversions?: number;
    yearOpened?: number;
    manufacturer?: string;
  };
  isNew: boolean;
  popularity: number; // lower = more popular
  hasGoldVerified: boolean; // user has GPS-verified this ride
}

export interface PackOption {
  size: 5 | 10 | 20;
  discount: number; // 0.10, 0.20, 0.30
  label: string;
  savingsLabel: string;
}

export interface MerchOrder {
  id: string;
  items: MerchOrderItem[];
  subtotal: number;
  proDiscount: number;
  shipping: number;
  total: number;
  status: 'processing' | 'shipped' | 'delivered';
  orderDate: string;
  estimatedDelivery: string;
  trackingNumber?: string;
}

export interface MerchOrderItem {
  productId: string;
  name: string;
  parkName: string;
  quantity: number;
  goldFoil: boolean;
  unitPrice: number;
  artSource: any;
}

// ─── Constants ──────────────────────────────────────────

export const MERCH_PRICING = {
  cardPrice: 7.99,
  goldFoilUpcharge: 2.99,
  shippingUS: 3.99,
  shippingInternational: 8.99,
  proDiscountPercent: 0.10,
} as const;

export const PACK_OPTIONS: PackOption[] = [
  { size: 5, discount: 0.10, label: '5-Pack', savingsLabel: 'Save 10%' },
  { size: 10, discount: 0.20, label: '10-Pack', savingsLabel: 'Save 20%' },
  { size: 20, discount: 0.30, label: '20-Pack', savingsLabel: 'Save 30%' },
];

// ─── Park Groupings ─────────────────────────────────────

export const PARK_GROUPS = [
  'Six Flags Magic Mountain',
  "Knott's Berry Farm",
  'Cedar Point',
  'Kings Island',
  'Busch Gardens Tampa Bay',
  'Hersheypark',
  'Dollywood',
  'Busch Gardens Williamsburg',
  'Carowinds',
  'SeaWorld San Diego',
  'Europa-Park',
  'Alton Towers',
] as const;

// ─── Generate Products from Real Card Art ───────────────

function buildProducts(): MerchProduct[] {
  const products: MerchProduct[] = [];

  for (const [coasterId, artSource] of Object.entries(CARD_ART)) {
    const coaster = COASTER_BY_ID[coasterId];
    if (!coaster) continue;

    products.push({
      id: `merch-${coasterId}`,
      coasterId,
      name: coaster.name,
      parkName: coaster.park,
      parkId: coaster.parkId,
      price: MERCH_PRICING.cardPrice,
      artSource,
      stats: {
        heightFt: coaster.heightFt,
        speedMph: coaster.speedMph,
        lengthFt: coaster.lengthFt,
        inversions: coaster.inversions,
        yearOpened: coaster.yearOpened,
        manufacturer: coaster.manufacturer,
      },
      isNew: false,
      popularity: coaster.popularityRank,
      hasGoldVerified: false, // mock: no verifications yet
    });
  }

  return products;
}

// Memoize products
let _products: MerchProduct[] | null = null;
export function getMerchProducts(): MerchProduct[] {
  if (!_products) {
    _products = buildProducts();
  }
  return _products;
}

// ─── Filtered Views ─────────────────────────────────────

export function getNewArrivals(limit = 10): MerchProduct[] {
  // For now, take a curated set as "new"
  const newIds = [
    'stardust-racers', 'hiccups-wing-gliders', 'fast-furious-hollywood-drift',
    'hyperia', 'sirens-curse', 'pantherian', 'phoenix-rising',
    'alpenfury', 'arieforce-one', 'jersey-devil-coaster',
  ];
  const all = getMerchProducts();
  const newItems = newIds
    .map(id => all.find(p => p.coasterId === id))
    .filter((p): p is MerchProduct => !!p);
  return newItems.slice(0, limit);
}

export function getPopularProducts(limit = 10): MerchProduct[] {
  return [...getMerchProducts()]
    .sort((a, b) => a.popularity - b.popularity)
    .slice(0, limit);
}

export function getProductsByPark(parkName: string): MerchProduct[] {
  return getMerchProducts().filter(p => p.parkName === parkName);
}

export function getAvailableParks(): string[] {
  const parks = new Set(getMerchProducts().map(p => p.parkName));
  return Array.from(parks).sort();
}

// ─── Price Calculation ──────────────────────────────────

export function calculateCardPrice(
  goldFoil: boolean,
  hasGoldVerified: boolean,
): number {
  let price = MERCH_PRICING.cardPrice;
  if (goldFoil && !hasGoldVerified) {
    price += MERCH_PRICING.goldFoilUpcharge;
  }
  return price;
}

export function calculatePackPrice(
  packSize: 5 | 10 | 20,
  items: { goldFoil: boolean; hasGoldVerified: boolean }[],
): number {
  const pack = PACK_OPTIONS.find(p => p.size === packSize);
  if (!pack) return 0;

  const baseTotal = items.reduce(
    (sum, item) => sum + calculateCardPrice(item.goldFoil, item.hasGoldVerified),
    0,
  );
  return baseTotal * (1 - pack.discount);
}

export function applyProDiscount(subtotal: number): number {
  return subtotal * (1 - MERCH_PRICING.proDiscountPercent);
}

// ─── Mock Orders ────────────────────────────────────────

export const MOCK_ORDERS: MerchOrder[] = [
  {
    id: 'ORD-2026-001',
    items: [
      {
        productId: 'merch-steel-vengeance',
        name: 'Steel Vengeance',
        parkName: 'Cedar Point',
        quantity: 1,
        goldFoil: true,
        unitPrice: 7.99,
        artSource: CARD_ART['steel-vengeance'],
      },
      {
        productId: 'merch-millennium-force',
        name: 'Millennium Force',
        parkName: 'Cedar Point',
        quantity: 1,
        goldFoil: false,
        unitPrice: 7.99,
        artSource: CARD_ART['millennium-force'],
      },
    ],
    subtotal: 15.98,
    proDiscount: 0,
    shipping: 3.99,
    total: 19.97,
    status: 'shipped',
    orderDate: '2026-03-10',
    estimatedDelivery: '2026-03-17',
    trackingNumber: '1Z999AA10123456784',
  },
  {
    id: 'ORD-2026-002',
    items: [
      {
        productId: 'merch-fury-325',
        name: 'Fury 325',
        parkName: 'Carowinds',
        quantity: 1,
        goldFoil: true,
        unitPrice: 10.98,
        artSource: CARD_ART['fury-325'],
      },
    ],
    subtotal: 10.98,
    proDiscount: 1.10,
    shipping: 3.99,
    total: 13.87,
    status: 'processing',
    orderDate: '2026-03-14',
    estimatedDelivery: '2026-03-21',
  },
  {
    id: 'ORD-2026-003',
    items: [
      {
        productId: 'merch-twisted-colossus',
        name: 'Twisted Colossus',
        parkName: 'Six Flags Magic Mountain',
        quantity: 1,
        goldFoil: false,
        unitPrice: 7.99,
        artSource: CARD_ART['twisted-colossus'],
      },
      {
        productId: 'merch-x2',
        name: 'X2',
        parkName: 'Six Flags Magic Mountain',
        quantity: 1,
        goldFoil: true,
        unitPrice: 7.99,
        artSource: CARD_ART['x2'],
      },
      {
        productId: 'merch-tatsu',
        name: 'Tatsu',
        parkName: 'Six Flags Magic Mountain',
        quantity: 1,
        goldFoil: false,
        unitPrice: 7.99,
        artSource: CARD_ART['tatsu'],
      },
    ],
    subtotal: 23.97,
    proDiscount: 0,
    shipping: 3.99,
    total: 27.96,
    status: 'delivered',
    orderDate: '2026-03-01',
    estimatedDelivery: '2026-03-08',
    trackingNumber: '1Z999AA10123456785',
  },
];
