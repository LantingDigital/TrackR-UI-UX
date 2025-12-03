export interface NewsItem {
  id: string;
  source: string;
  image: string;
  title: string;
  subtitle: string;
  timestamp: string;
  isUnread: boolean;
  isSaved: boolean;
}

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    source: 'CoasterNation',
    image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800',
    title: 'Cedar Point Announces Major New Coaster for 2025 Season',
    subtitle: 'The Ohio amusement park reveals plans for a record-breaking attraction that promises to redefine thrill rides.',
    timestamp: '2h ago',
    isUnread: true,
    isSaved: false,
  },
  {
    id: '2',
    source: 'Theme Park Insider',
    image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800',
    title: 'Six Flags and Cedar Fair Merger: What It Means for Season Pass Holders',
    subtitle: 'Industry experts weigh in on the implications of the largest theme park merger in history.',
    timestamp: '5h ago',
    isUnread: true,
    isSaved: false,
  },
  {
    id: '3',
    source: 'Coaster Studios',
    image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=800',
    title: 'Top 10 Hidden Gems: Underrated Coasters You Need to Ride',
    subtitle: 'Our latest video explores amazing roller coasters that fly under the radar.',
    timestamp: '1d ago',
    isUnread: false,
    isSaved: true,
  },
  {
    id: '4',
    source: 'RCDB',
    image: 'https://images.unsplash.com/photo-1534579070695-f323205f9580?w=800',
    title: 'New RMC Conversion Announced for Classic Wooden Coaster',
    subtitle: 'Another beloved wooden coaster is getting the Iron Horse treatment this winter.',
    timestamp: '2d ago',
    isUnread: false,
    isSaved: false,
  },
];
