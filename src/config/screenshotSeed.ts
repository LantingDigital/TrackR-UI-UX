/**
 * Screenshot Mode Seed
 *
 * When SCREENSHOT_MODE is true, populates stores with beautiful mock data
 * so every screen looks perfect for screenshots, social media, and portfolio.
 *
 * Call `seedScreenshotData()` once at app startup (e.g., in App.tsx or RootNavigator).
 */

import { SCREENSHOT_MODE } from './screenshotMode';
import { _communityStoreInternal } from '../features/community/stores/communityStore';
import { _rideLogStoreInternal } from '../stores/rideLogStore';
import { _walletStoreInternal } from '../contexts/WalletContext';
import { MOCK_FEED_EXTENDED } from '../features/community/data/mockFeedData';
import type { RideLog } from '../types/rideLog';
import type { Ticket } from '../types/wallet';

// ── Mock Ride Logs (for logbook / wallet / home stats) ──────

const MOCK_RIDE_LOGS: RideLog[] = [
  {
    id: 'log-001',
    coasterId: 'steel-vengeance',
    coasterName: 'Steel Vengeance',
    parkName: 'Cedar Point',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    rideCount: 3,
  },
  {
    id: 'log-002',
    coasterId: 'iron-gwazi',
    coasterName: 'Iron Gwazi',
    parkName: 'Busch Gardens Tampa',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    rideCount: 2,
  },
  {
    id: 'log-003',
    coasterId: 'jurassic-world-velocicoaster',
    coasterName: 'VelociCoaster',
    parkName: 'Universal Islands of Adventure',
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    rideCount: 4,
  },
  {
    id: 'log-004',
    coasterId: 'fury-325',
    coasterName: 'Fury 325',
    parkName: 'Carowinds',
    timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
    rideCount: 2,
  },
  {
    id: 'log-005',
    coasterId: 'millennium-force',
    coasterName: 'Millennium Force',
    parkName: 'Cedar Point',
    timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
    rideCount: 1,
  },
  {
    id: 'log-006',
    coasterId: 'x2',
    coasterName: 'X2',
    parkName: 'Six Flags Magic Mountain',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    rideCount: 2,
  },
  {
    id: 'log-007',
    coasterId: 'twisted-colossus',
    coasterName: 'Twisted Colossus',
    parkName: 'Six Flags Magic Mountain',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    rideCount: 3,
  },
  {
    id: 'log-008',
    coasterId: 'hagrid-s-magical-creatures-motorbike-adventure',
    coasterName: "Hagrid's Magical Creatures",
    parkName: 'Universal Islands of Adventure',
    timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
    rideCount: 1,
  },
  {
    id: 'log-009',
    coasterId: 'maverick',
    coasterName: 'Maverick',
    parkName: 'Cedar Point',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    rideCount: 2,
  },
  {
    id: 'log-010',
    coasterId: 'lightning-rod',
    coasterName: 'Lightning Rod',
    parkName: 'Dollywood',
    timestamp: new Date(Date.now() - 20 * 86400000).toISOString(),
    rideCount: 1,
  },
  {
    id: 'log-011',
    coasterId: 'el-toro',
    coasterName: 'El Toro',
    parkName: 'Six Flags Great Adventure',
    timestamp: new Date(Date.now() - 25 * 86400000).toISOString(),
    rideCount: 2,
  },
  {
    id: 'log-012',
    coasterId: 'phantoms-revenge',
    coasterName: "Phantom's Revenge",
    parkName: 'Kennywood',
    timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
    rideCount: 1,
  },
];

// ── Mock Wallet Tickets ─────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'ticket-001',
    parkName: 'Cedar Point',
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    qrData: 'CP-SEASON-2026-CALEB-8472',
    qrFormat: 'QR_CODE',
    heroImageSource: require('../../assets/wallet/parks/card-art/cedar-point.jpg'),
    logoImageSource: require('../../assets/wallet/parks/logos/cedar-point.png'),
    isFavorite: true,
    status: 'active',
    isDefault: true,
    addedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    autoDetected: true,
  },
  {
    id: 'ticket-002',
    parkName: 'Six Flags Magic Mountain',
    parkChain: 'six_flags',
    passType: 'season_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    qrData: 'SFMM-SEASON-2026-CALEB-3901',
    qrFormat: 'QR_CODE',
    heroImageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Six_Flags_Magic_Mountain_%2813208988393%29.jpg/1280px-Six_Flags_Magic_Mountain_%2813208988393%29.jpg',
    isFavorite: true,
    status: 'active',
    isDefault: false,
    addedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    autoDetected: true,
  },
  {
    id: 'ticket-003',
    parkName: "Knott's Berry Farm",
    parkChain: 'cedar_fair',
    passType: 'season_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    qrData: 'KBF-SEASON-2026-CALEB-7712',
    qrFormat: 'QR_CODE',
    heroImageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Knott%27s_Berry_Farm%2C_2021.jpg/1280px-Knott%27s_Berry_Farm%2C_2021.jpg',
    isFavorite: false,
    status: 'active',
    isDefault: false,
    addedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    autoDetected: true,
  },
  {
    id: 'ticket-004',
    parkName: 'Magic Kingdom Park',
    parkChain: 'disney',
    passType: 'day_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-02-14',
    validUntil: '2026-02-14',
    qrData: 'DLR-1DAY-20260214-CALEB-5539',
    qrFormat: 'AZTEC',
    heroImageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Cinderella_Castle%2C_Magic_Kingdom_Walt_Disney_World_%282024%29.jpg/1280px-Cinderella_Castle%2C_Magic_Kingdom_Walt_Disney_World_%282024%29.jpg',
    isFavorite: true,
    status: 'used',
    isDefault: false,
    addedAt: new Date(Date.now() - 32 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 32 * 86400000).toISOString(),
    autoDetected: true,
    notes: "Valentine's Day trip",
  },
  {
    id: 'ticket-005',
    parkName: 'Kings Island',
    parkChain: 'cedar_fair',
    passType: 'day_pass',
    passholder: 'Caleb Lanting',
    validFrom: '2026-03-05',
    validUntil: '2026-03-05',
    qrData: 'KI-1DAY-20260305-CALEB-2288',
    qrFormat: 'QR_CODE',
    heroImageSource: require('../../assets/wallet/parks/card-art/kings-island.jpg'),
    logoImageSource: require('../../assets/wallet/parks/logos/kings-island.png'),
    isFavorite: false,
    status: 'active',
    isDefault: false,
    addedAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    autoDetected: true,
  },
];

// ── Seed Function ───────────────────────────────────────────

export function seedScreenshotData(): void {
  if (!SCREENSHOT_MODE) return;

  console.log('[ScreenshotMode] Seeding stores with mock data...');

  // Seed community feed
  _communityStoreInternal.getState()._setFeedItems(MOCK_FEED_EXTENDED);

  // Seed ride logs (12 unique coasters = 12 credits, 23 total rides)
  _rideLogStoreInternal.getState()._setLogs(MOCK_RIDE_LOGS);

  // Seed wallet tickets (delay to let wallet store initialize first)
  setTimeout(() => {
    _walletStoreInternal.setState({
      tickets: MOCK_TICKETS,
      defaultTicketId: 'ticket-001',
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    console.log('[ScreenshotMode] Wallet seeded with', MOCK_TICKETS.length, 'tickets.');
  }, 500);

  console.log('[ScreenshotMode] Done. Stores populated.');
}
