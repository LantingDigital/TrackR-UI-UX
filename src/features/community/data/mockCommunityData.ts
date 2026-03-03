// ─── Community Mock Data ────────────────────────────────────

// ─── Games Strip ────────────────────────────────────────────

export interface GameItem {
  id: string;
  label: string;
  icon: string; // Ionicons name
  active: boolean;
}

export const MOCK_GAMES: GameItem[] = [
  { id: 'coastle', label: 'Coastle', icon: 'game-controller-outline', active: true },
  { id: 'game2', label: 'Soon', icon: 'lock-closed', active: false },
  { id: 'game3', label: 'Soon', icon: 'lock-closed', active: false },
];

export interface CoastleStats {
  streak: number;
  gamesPlayed: number;
  winRate: number;
  dailyNumber: number;
}

export const MOCK_COASTLE_STATS: CoastleStats = {
  streak: 12,
  gamesPlayed: 142,
  winRate: 89,
  dailyNumber: 42,
};

// ─── Unified Feed ───────────────────────────────────────────

interface FeedItemBase {
  id: string;
  type: 'review' | 'trip_report' | 'top_list';
  authorName: string;
  authorInitials: string;
  daysAgo: number;
  likeCount: number;
  commentCount: number;
}

export interface ReviewFeedItem extends FeedItemBase {
  type: 'review';
  coasterName: string;
  parkName: string;
  rating: number;
  reviewText: string;
}

export interface TripReportFeedItem extends FeedItemBase {
  type: 'trip_report';
  title: string;
  parkName: string;
  rideCount: number;
  excerpt: string;
}

export interface TopListFeedItem extends FeedItemBase {
  type: 'top_list';
  title: string;
  emoji: string;
  items: string[];
  category: string;
}

export type FeedItem = ReviewFeedItem | TripReportFeedItem | TopListFeedItem;

// ─── Top Lists (for Rankings tab) ───────────────────────────

export interface TopListItem {
  id: string;
  title: string;
  emoji: string;
  items: string[];
  author: string;
  category: string;
}

export const MOCK_TOP_LISTS: TopListItem[] = [
  {
    id: 'l1',
    title: 'Best RMC Coasters',
    emoji: '🏗️',
    items: ['Steel Vengeance', 'Iron Gwazi', 'Zadra', 'Lightning Rod', 'Twisted Colossus'],
    author: 'TrackR',
    category: 'Steel',
  },
  {
    id: 'l2',
    title: 'Top B&M Inverts',
    emoji: '🔄',
    items: ['Montu', 'Nemesis', 'Afterburn', 'Banshee', 'Raptor'],
    author: 'TrackR',
    category: 'Inverts',
  },
  {
    id: 'l3',
    title: 'Most Underrated Coasters',
    emoji: '💎',
    items: ['Voyage', 'Mystic Timbers', 'Mako', 'Storm Chaser', 'Prowler'],
    author: 'TrackR',
    category: 'Hidden Gems',
  },
  {
    id: 'l4',
    title: 'Best Night Rides',
    emoji: '🌙',
    items: ['Beast', 'Millennium Force', 'Fury 325', 'Magnum XL-200', 'Mystic Timbers'],
    author: 'TrackR',
    category: 'Experience',
  },
];

// ─── Feed ───────────────────────────────────────────────────

export const MOCK_FEED: FeedItem[] = [
  {
    id: 'f1',
    type: 'review',
    authorName: 'John D.',
    authorInitials: 'JD',
    daysAgo: 2,
    likeCount: 34,
    commentCount: 8,
    coasterName: 'Steel Vengeance',
    parkName: 'Cedar Point',
    rating: 5,
    reviewText: 'Absolutely insane airtime. The first drop in the back row is unlike anything I\'ve ever experienced. Best coaster on the planet.',
  },
  {
    id: 'f2',
    type: 'trip_report',
    authorName: 'Alex M.',
    authorInitials: 'AM',
    daysAgo: 3,
    likeCount: 47,
    commentCount: 12,
    title: 'Epic Day at Cedar Point',
    parkName: 'Cedar Point',
    rideCount: 12,
    excerpt: 'Arrived at rope drop and headed straight for Steel Vengeance. 45-minute wait but so worth it. Managed to marathon Maverick three times before lunch. The park was surprisingly manageable for a Saturday.',
  },
  {
    id: 'f3',
    type: 'top_list',
    authorName: 'TrackR',
    authorInitials: 'TR',
    daysAgo: 4,
    likeCount: 89,
    commentCount: 31,
    title: 'Best RMC Coasters',
    emoji: '🏗️',
    items: ['Steel Vengeance', 'Iron Gwazi', 'Zadra'],
    category: 'Steel',
  },
  {
    id: 'f4',
    type: 'review',
    authorName: 'Maria S.',
    authorInitials: 'MS',
    daysAgo: 5,
    likeCount: 52,
    commentCount: 14,
    coasterName: 'Velocicoaster',
    parkName: 'Islands of Adventure',
    rating: 5,
    reviewText: 'The theming is incredible and the inversions are so smooth. That top hat over the lagoon is a moment you\'ll never forget.',
  },
  {
    id: 'f5',
    type: 'trip_report',
    authorName: 'Sarah K.',
    authorInitials: 'SK',
    daysAgo: 7,
    likeCount: 32,
    commentCount: 9,
    title: 'First Visit to Dollywood',
    parkName: 'Dollywood',
    rideCount: 8,
    excerpt: 'What a gem of a park. Lightning Rod blew my mind — the launches, the quad-down, everything. Wild Eagle was a pleasant surprise too. The food here is genuinely some of the best I\'ve had at any park.',
  },
  {
    id: 'f6',
    type: 'top_list',
    authorName: 'TrackR',
    authorInitials: 'TR',
    daysAgo: 8,
    likeCount: 67,
    commentCount: 22,
    title: 'Top B&M Inverts',
    emoji: '🔄',
    items: ['Montu', 'Nemesis', 'Afterburn'],
    category: 'Inverts',
  },
  {
    id: 'f7',
    type: 'review',
    authorName: 'Tyler K.',
    authorInitials: 'TK',
    daysAgo: 9,
    likeCount: 28,
    commentCount: 6,
    coasterName: 'Iron Gwazi',
    parkName: 'Busch Gardens Tampa',
    rating: 4,
    reviewText: 'RMC magic at its finest. The wave turn delivers the most sustained lateral airtime I\'ve ever felt. Front row is a must.',
  },
  {
    id: 'f8',
    type: 'trip_report',
    authorName: 'Chris R.',
    authorInitials: 'CR',
    daysAgo: 14,
    likeCount: 61,
    commentCount: 18,
    title: 'Magic Mountain Marathon',
    parkName: 'Six Flags Magic Mountain',
    rideCount: 15,
    excerpt: 'Fifteen credits in one day! Started with X2 at rope drop, hit Twisted Colossus twice, and ended the night on Tatsu. Legs were jelly by sunset.',
  },
];
