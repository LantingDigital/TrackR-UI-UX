/**
 * Mock data for the home feed content sections.
 * Provides diverse content types for a rich, engaging scrollable feed.
 */

// ── Stories ──

export interface StoryItem {
  id: string;
  username: string;
  avatarUrl: string;
  hasNewStory: boolean;
  isOwn?: boolean;
}

export const MOCK_STORIES: StoryItem[] = [
  { id: 'own', username: 'You', avatarUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200', hasNewStory: false, isOwn: true },
  { id: 's1', username: 'RideOrDie', avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200', hasNewStory: true },
  { id: 's2', username: 'CoasterKing', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', hasNewStory: true },
  { id: 's3', username: 'ThemeParkJen', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', hasNewStory: true },
  { id: 's4', username: 'LoopMaster', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', hasNewStory: true },
  { id: 's5', username: 'SixFlagsFan', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', hasNewStory: false },
  { id: 's6', username: 'RMC_Rider', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=200', hasNewStory: true },
  { id: 's7', username: 'AdrenaJunkie', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', hasNewStory: false },
];

// ── Friend Activity ──

export interface FriendActivityItem {
  id: string;
  username: string;
  avatarUrl: string;
  action: string;
  rideName: string;
  coasterId: string; // references COASTER_BY_ID
  parkName: string;
  timestamp: string;
  rideImageUrl: string;
  rating?: number; // 1-5 stars, optional
}

export const MOCK_FRIEND_ACTIVITY: FriendActivityItem[] = [
  {
    id: 'fa1',
    username: 'CoasterKing',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    action: 'rode',
    rideName: 'Steel Vengeance',
    coasterId: 'steel-vengeance',
    parkName: 'Cedar Point',
    timestamp: '12m ago',
    rideImageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Steel_Vengeance_Drop_View.jpg',
    rating: 5,
  },
  {
    id: 'fa2',
    username: 'ThemeParkJen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    action: 'rated',
    rideName: 'Millennium Force',
    coasterId: 'millennium-force',
    parkName: 'Cedar Point',
    timestamp: '1h ago',
    rideImageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Millennium_Force_(Cedar_Point)_06.JPG',
    rating: 4,
  },
  {
    id: 'fa3',
    username: 'LoopMaster',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    action: 'visited',
    rideName: 'X2',
    coasterId: 'x2',
    parkName: 'Six Flags Magic Mountain',
    timestamp: '3h ago',
    rideImageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/X2-firstdrop.jpg',
  },
];

// ── Featured Park ──

export interface FeaturedParkData {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  description: string;
  coasterCount: number;
  topRide: string;
  rating: number;
}

export const MOCK_FEATURED_PARK: FeaturedParkData = {
  id: 'cedar-point',
  name: 'Cedar Point',
  location: 'Sandusky, Ohio',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/CedarPoint_Overview_BackHalf_DSCN9502_%28cropped%29.JPG/800px-CedarPoint_Overview_BackHalf_DSCN9502_%28cropped%29.JPG',
  description: 'The Roller Coaster Capital of the World returns with 17 coasters and a brand new lineup for the season.',
  coasterCount: 17,
  topRide: 'Steel Vengeance',
  rating: 4.8,
};

// ── Daily Challenge ──

export interface DailyChallengeData {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: string;
  timeRemaining: string;
  participantCount: number;
}

export const MOCK_DAILY_CHALLENGE: DailyChallengeData = {
  id: 'dc1',
  title: 'Coastle #127',
  description: 'Guess today\'s mystery coaster in 6 tries',
  icon: 'game-controller',
  reward: '3-day streak',
  timeRemaining: '14h 23m',
  participantCount: 2847,
};

// ── Did You Know Facts ──

export interface CoasterFactData {
  id: string;
  fact: string;
  source: string;
  relatedRide?: string;
  relatedPark?: string;
  icon: string;
}

export const MOCK_COASTER_FACTS: CoasterFactData[] = [
  {
    id: 'f1',
    fact: 'Steel Vengeance holds the record for most airtime on any roller coaster at 27.2 seconds of weightlessness.',
    source: 'RCDB',
    relatedRide: 'Steel Vengeance',
    relatedPark: 'Cedar Point',
    icon: 'timer-outline',
  },
  {
    id: 'f2',
    fact: 'Formula Rossa at Ferrari World is the fastest coaster in the world, reaching 149.1 mph in just 4.9 seconds.',
    source: 'Guinness World Records',
    relatedRide: 'Formula Rossa',
    relatedPark: 'Ferrari World Abu Dhabi',
    icon: 'speedometer-outline',
  },
  {
    id: 'f3',
    fact: 'The first roller coaster in America was the Switchback Railway at Coney Island, opened in 1884. It cost 5 cents to ride.',
    source: 'Smithsonian',
    icon: 'book-outline',
  },
];

// ── Nearby Parks ──

export interface NearbyParkItem {
  id: string;
  name: string;
  distance: string;
  imageUrl: string;
  coasterCount: number;
  isOpen: boolean;
  nextOpenTime?: string;
}

export const MOCK_NEARBY_PARKS: NearbyParkItem[] = [
  {
    id: 'sfmm',
    name: 'Six Flags Magic Mountain',
    distance: '52 mi',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Six_Flags_Magic_Mountain_%2813208988393%29.jpg/400px-Six_Flags_Magic_Mountain_%2813208988393%29.jpg',
    coasterCount: 16,
    isOpen: true,
  },
  {
    id: 'knotts',
    name: 'Knott\'s Berry Farm',
    distance: '38 mi',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Knott%27s_Berry_Farm%2C_2021.jpg/400px-Knott%27s_Berry_Farm%2C_2021.jpg',
    coasterCount: 10,
    isOpen: true,
  },
  {
    id: 'disney',
    name: 'Disneyland Resort',
    distance: '41 mi',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Pixarpiersunset2019_%28cropped%29_%28cropped%29.jpg/400px-Pixarpiersunset2019_%28cropped%29_%28cropped%29.jpg',
    coasterCount: 6,
    isOpen: false,
    nextOpenTime: 'Opens 8:00 AM',
  },
];

// ── Feed Item Union Type ──

export type FeedItemType =
  | 'news'
  | 'trending'
  | 'friendActivity'
  | 'featuredPark'
  | 'dailyChallenge'
  | 'didYouKnow'
  | 'nearbyParks';

export interface FeedSection {
  id: string;
  type: FeedItemType;
}

/**
 * The ordered feed layout. Each entry defines a section in the scroll feed.
 * News items appear individually between sections for variety.
 */
export const FEED_LAYOUT: FeedSection[] = [
  { id: 'feed-news-0', type: 'news' },
  { id: 'feed-trending', type: 'trending' },
  { id: 'feed-news-1', type: 'news' },
  { id: 'feed-friend-activity', type: 'friendActivity' },
  { id: 'feed-featured-park', type: 'featuredPark' },
  { id: 'feed-news-2', type: 'news' },
  { id: 'feed-daily-challenge', type: 'dailyChallenge' },
  { id: 'feed-did-you-know', type: 'didYouKnow' },
  { id: 'feed-news-3', type: 'news' },
  { id: 'feed-nearby-parks', type: 'nearbyParks' },
];
