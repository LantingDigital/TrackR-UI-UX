export interface SearchableItem {
  id: string;
  name: string;
  image: string;
  type: 'ride' | 'park' | 'news';
  subtitle?: string;
}

export const NEARBY_RIDES: SearchableItem[] = [
  {
    id: 'ride-1',
    name: 'Steel Vengeance',
    image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
    type: 'ride',
    subtitle: 'Cedar Point',
  },
  {
    id: 'ride-2',
    name: 'Millennium Force',
    image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400',
    type: 'ride',
    subtitle: 'Cedar Point',
  },
  {
    id: 'ride-3',
    name: 'Top Thrill 2',
    image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400',
    type: 'ride',
    subtitle: 'Cedar Point',
  },
  {
    id: 'ride-4',
    name: 'Maverick',
    image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400',
    type: 'ride',
    subtitle: 'Cedar Point',
  },
  {
    id: 'ride-5',
    name: 'Iron Gwazi',
    image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400',
    type: 'ride',
    subtitle: 'Busch Gardens Tampa',
  },
  {
    id: 'ride-6',
    name: 'Velocicoaster',
    image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400',
    type: 'ride',
    subtitle: 'Universal Islands of Adventure',
  },
];

export const NEARBY_PARKS: SearchableItem[] = [
  {
    id: 'park-1',
    name: 'Cedar Point',
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=400',
    type: 'park',
    subtitle: 'Sandusky, OH',
  },
  {
    id: 'park-2',
    name: 'Kings Island',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    type: 'park',
    subtitle: 'Mason, OH',
  },
  {
    id: 'park-3',
    name: 'Busch Gardens Tampa',
    image: 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=400',
    type: 'park',
    subtitle: 'Tampa, FL',
  },
  {
    id: 'park-4',
    name: 'Universal Studios',
    image: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=400',
    type: 'park',
    subtitle: 'Orlando, FL',
  },
  {
    id: 'park-5',
    name: 'Six Flags Magic Mountain',
    image: 'https://images.unsplash.com/photo-1517315003714-a071486bd9ea?w=400',
    type: 'park',
    subtitle: 'Valencia, CA',
  },
];

export const RECENT_SEARCHES: string[] = [
  'Steel Vengeance',
  'Cedar Point',
  'RMC Coasters',
  'Millennium Force',
  'Six Flags Magic Mountain',
];

export const TRENDING_SEARCHES: string[] = [
  'Top Thrill 2',
  'Iron Gwazi',
  'Velocicoaster',
  'New for 2025',
  'Coaster Rankings',
];

// Combined search data for autocomplete
export const ALL_SEARCHABLE_ITEMS: SearchableItem[] = [
  ...NEARBY_RIDES,
  ...NEARBY_PARKS,
  // Additional rides for richer autocomplete testing
  {
    id: 'ride-7',
    name: 'Steel Curtain',
    image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
    type: 'ride',
    subtitle: 'Kennywood',
  },
  {
    id: 'ride-8',
    name: 'Fury 325',
    image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400',
    type: 'ride',
    subtitle: 'Carowinds',
  },
  {
    id: 'ride-9',
    name: 'X2',
    image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400',
    type: 'ride',
    subtitle: 'Six Flags Magic Mountain',
  },
  {
    id: 'ride-10',
    name: 'Twisted Colossus',
    image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400',
    type: 'ride',
    subtitle: 'Six Flags Magic Mountain',
  },
  {
    id: 'ride-11',
    name: 'Goliath',
    image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400',
    type: 'ride',
    subtitle: 'Six Flags Magic Mountain',
  },
  {
    id: 'ride-12',
    name: 'The Beast',
    image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400',
    type: 'ride',
    subtitle: 'Kings Island',
  },
  {
    id: 'ride-13',
    name: 'Diamondback',
    image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
    type: 'ride',
    subtitle: 'Kings Island',
  },
  {
    id: 'ride-14',
    name: 'Orion',
    image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400',
    type: 'ride',
    subtitle: 'Kings Island',
  },
  {
    id: 'ride-15',
    name: 'El Toro',
    image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400',
    type: 'ride',
    subtitle: 'Six Flags Great Adventure',
  },
  {
    id: 'ride-16',
    name: 'Kingda Ka',
    image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400',
    type: 'ride',
    subtitle: 'Six Flags Great Adventure',
  },
  {
    id: 'ride-17',
    name: 'Hagrid\'s Magical Creatures',
    image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400',
    type: 'ride',
    subtitle: 'Universal Islands of Adventure',
  },
  {
    id: 'ride-18',
    name: 'Lightning Rod',
    image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400',
    type: 'ride',
    subtitle: 'Dollywood',
  },
  {
    id: 'ride-19',
    name: 'Wicked Cyclone',
    image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
    type: 'ride',
    subtitle: 'Six Flags New England',
  },
  {
    id: 'ride-20',
    name: 'Phoenix',
    image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400',
    type: 'ride',
    subtitle: 'Knoebels',
  },
  {
    id: 'ride-21',
    name: 'Mako',
    image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400',
    type: 'ride',
    subtitle: 'SeaWorld Orlando',
  },
  {
    id: 'ride-22',
    name: 'Montu',
    image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400',
    type: 'ride',
    subtitle: 'Busch Gardens Tampa',
  },
  {
    id: 'ride-23',
    name: 'SheiKra',
    image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400',
    type: 'ride',
    subtitle: 'Busch Gardens Tampa',
  },
  // News items
  {
    id: 'news-1',
    name: 'Steel coaster construction updates',
    image: '',
    type: 'news',
    subtitle: 'Latest news',
  },
  {
    id: 'news-2',
    name: 'New park announcements for 2025',
    image: '',
    type: 'news',
    subtitle: 'Latest news',
  },
];

// Trending coasters for the Log Modal's trending section
export interface TrendingCoaster {
  rank: number;
  name: string;
  park: string;
  logCount: string;
  image: string;
}

export const TRENDING_COASTERS: TrendingCoaster[] = [
  { rank: 1, name: 'Steel Vengeance', park: 'Cedar Point', logCount: '1.2k', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400' },
  { rank: 2, name: 'Fury 325', park: 'Carowinds', logCount: '892', image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400' },
  { rank: 3, name: 'VelociCoaster', park: 'Universal', logCount: '756', image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400' },
  { rank: 4, name: 'Iron Gwazi', park: 'Busch Gardens Tampa', logCount: '634', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400' },
  { rank: 5, name: 'El Toro', park: 'Six Flags Great Adventure', logCount: '521', image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400' },
];

// Rides grouped by park for "More from [Last Park]" feature
export const RIDES_BY_PARK: Record<string, SearchableItem[]> = {
  'Busch Gardens Tampa': [
    { id: 'bgt-1', name: 'Iron Gwazi', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Busch Gardens Tampa' },
    { id: 'bgt-2', name: 'Kumba', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', type: 'ride', subtitle: 'Busch Gardens Tampa' },
    { id: 'bgt-3', name: 'Montu', image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400', type: 'ride', subtitle: 'Busch Gardens Tampa' },
    { id: 'bgt-4', name: 'SheiKra', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Busch Gardens Tampa' },
    { id: 'bgt-5', name: 'Cheetah Hunt', image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400', type: 'ride', subtitle: 'Busch Gardens Tampa' },
  ],
  'Cedar Point': [
    { id: 'ride-1', name: 'Steel Vengeance', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', type: 'ride', subtitle: 'Cedar Point' },
    { id: 'ride-2', name: 'Millennium Force', image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400', type: 'ride', subtitle: 'Cedar Point' },
    { id: 'ride-3', name: 'Top Thrill 2', image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400', type: 'ride', subtitle: 'Cedar Point' },
    { id: 'ride-4', name: 'Maverick', image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400', type: 'ride', subtitle: 'Cedar Point' },
    { id: 'cp-5', name: 'Raptor', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Cedar Point' },
  ],
  'Kings Island': [
    { id: 'ride-12', name: 'The Beast', image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400', type: 'ride', subtitle: 'Kings Island' },
    { id: 'ride-13', name: 'Diamondback', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', type: 'ride', subtitle: 'Kings Island' },
    { id: 'ride-14', name: 'Orion', image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400', type: 'ride', subtitle: 'Kings Island' },
    { id: 'ki-4', name: 'Banshee', image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400', type: 'ride', subtitle: 'Kings Island' },
    { id: 'ki-5', name: 'Mystic Timbers', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Kings Island' },
  ],
  'Six Flags Magic Mountain': [
    { id: 'ride-9', name: 'X2', image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400', type: 'ride', subtitle: 'Six Flags Magic Mountain' },
    { id: 'ride-10', name: 'Twisted Colossus', image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400', type: 'ride', subtitle: 'Six Flags Magic Mountain' },
    { id: 'ride-11', name: 'Goliath', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Six Flags Magic Mountain' },
    { id: 'sfmm-4', name: 'Tatsu', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', type: 'ride', subtitle: 'Six Flags Magic Mountain' },
    { id: 'sfmm-5', name: 'Full Throttle', image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400', type: 'ride', subtitle: 'Six Flags Magic Mountain' },
  ],
  'Universal Islands of Adventure': [
    { id: 'ride-6', name: 'VelociCoaster', image: 'https://images.unsplash.com/photo-1604880770639-5b81f4e847c5?w=400', type: 'ride', subtitle: 'Universal Islands of Adventure' },
    { id: 'ride-17', name: "Hagrid's Magical Creatures", image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Universal Islands of Adventure' },
    { id: 'ioa-3', name: 'Incredible Hulk', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', type: 'ride', subtitle: 'Universal Islands of Adventure' },
  ],
  'Carowinds': [
    { id: 'ride-8', name: 'Fury 325', image: 'https://images.unsplash.com/photo-1567608346240-99ef7a6da1c7?w=400', type: 'ride', subtitle: 'Carowinds' },
    { id: 'car-2', name: 'Copperhead Strike', image: 'https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=400', type: 'ride', subtitle: 'Carowinds' },
    { id: 'car-3', name: 'Intimidator', image: 'https://images.unsplash.com/photo-1567459168600-af170863e682?w=400', type: 'ride', subtitle: 'Carowinds' },
  ],
};

// Get rides for a specific park (for "More from [Last Park]" feature)
export const getRidesForPark = (parkName: string): SearchableItem[] => {
  return RIDES_BY_PARK[parkName] || NEARBY_RIDES; // Fallback to nearby rides
};

// Helper function to filter items by search query
export const searchItems = (query: string): SearchableItem[] => {
  if (!query.trim()) return [];

  const lowercaseQuery = query.toLowerCase();
  return ALL_SEARCHABLE_ITEMS.filter(
    item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.subtitle?.toLowerCase().includes(lowercaseQuery)
  );
};

// Get icon name based on item type
export const getTypeIcon = (type: 'ride' | 'park' | 'news'): string => {
  switch (type) {
    case 'ride':
      return 'train-outline';
    case 'park':
      return 'map-outline';
    case 'news':
      return 'newspaper-outline';
    default:
      return 'search-outline';
  }
};
