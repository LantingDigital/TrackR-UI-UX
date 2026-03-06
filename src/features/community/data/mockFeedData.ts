// ─── Extended Feed Mock Data ────────────────────────────────
//
// Replaces mockCommunityData MOCK_FEED with richer items:
// isLiked state, comments[], fullText, authorId, bucket lists.

import type {
  FeedItem,
  Comment,
} from '../types/community';

// ─── Helper: generate mock comments ────────────────────────

function makeComments(...entries: [string, string, string][]): Comment[] {
  return entries.map(([name, initials, text], i) => ({
    id: `c${Date.now()}-${i}`,
    authorId: `u-${initials.toLowerCase()}`,
    authorName: name,
    authorInitials: initials,
    text,
    timestamp: Date.now() - (i + 1) * 3600000,
    likeCount: Math.floor(Math.random() * 12),
    isLiked: false,
  }));
}

// ─── Feed Items ─────────────────────────────────────────────

export const MOCK_FEED_EXTENDED: FeedItem[] = [
  {
    id: 'f1',
    type: 'review',
    authorId: 'u-jd',
    authorName: 'John D.',
    authorInitials: 'JD',
    daysAgo: 2,
    likeCount: 34,
    commentCount: 3,
    isLiked: false,
    coasterId: 'steel-vengeance',
    coasterName: 'Steel Vengeance',
    parkName: 'Cedar Point',
    rating: 5,
    reviewText:
      'Absolutely insane airtime. The first drop in the back row is unlike anything I\'ve ever experienced. Best coaster on the planet.',
    comments: makeComments(
      ['Alex M.', 'AM', 'Back row is the move! Did you get a night ride?'],
      ['Sarah K.', 'SK', 'Agreed, nothing compares to SteVe.'],
      ['Tyler K.', 'TK', 'Front row is underrated though, the visuals are insane.'],
    ),
  },
  {
    id: 'f2',
    type: 'trip_report',
    authorId: 'u-am',
    authorName: 'Alex M.',
    authorInitials: 'AM',
    daysAgo: 3,
    likeCount: 47,
    commentCount: 4,
    isLiked: false,
    title: 'Epic Day at Cedar Point',
    parkId: 'cedar-point',
    parkName: 'Cedar Point',
    rideCount: 12,
    excerpt:
      'Arrived at rope drop and headed straight for Steel Vengeance. 45-minute wait but so worth it. Managed to marathon Maverick three times before lunch.',
    fullText:
      'Arrived at rope drop and headed straight for Steel Vengeance. 45-minute wait but so worth it. Managed to marathon Maverick three times before lunch. The park was surprisingly manageable for a Saturday.\n\nAfternoon highlights: Millennium Force walk-on (twice!), Top Thrill 2 was running smooth, and I finally got my first ride on Valravn. Not my favorite but the view from the top is incredible.\n\nEnded the night with back-to-back Steel Vengeance rides — the 9pm ride in near-darkness was a top 5 coaster moment for me. 12 total credits for the day. Cedar Point remains the GOAT.',
    comments: makeComments(
      ['Maria S.', 'MS', 'How was Top Thrill 2? I heard it\'s been having issues.'],
      ['Chris R.', 'CR', '12 credits in a day is impressive! What was your strategy?'],
      ['John D.', 'JD', 'Night rides on SteVe are unmatched.'],
      ['Tyler K.', 'TK', 'Jealous! Planning my trip for June.'],
    ),
  },
  {
    id: 'f3',
    type: 'top_list',
    authorId: 'u-tr',
    authorName: 'TrackR',
    authorInitials: 'TR',
    daysAgo: 4,
    likeCount: 89,
    commentCount: 5,
    isLiked: false,
    title: 'Best RMC Coasters',
    emoji: '\u{1F3D7}\u{FE0F}',
    items: [
      { coasterId: 'steel-vengeance', name: 'Steel Vengeance' },
      { coasterId: 'iron-gwazi', name: 'Iron Gwazi' },
      { coasterId: 'zadra', name: 'Zadra' },
      { coasterId: 'lightning-rod', name: 'Lightning Rod' },
      { coasterId: 'twisted-colossus', name: 'Twisted Colossus' },
    ],
    category: 'Steel',
    comments: makeComments(
      ['Alex M.', 'AM', 'Where\'s Wildcat\'s Revenge? That thing is elite.'],
      ['John D.', 'JD', 'Steel Vengeance at #1 is the only correct answer.'],
      ['Sarah K.', 'SK', 'Lightning Rod being that high is bold but I respect it.'],
      ['Maria S.', 'MS', 'Need to get to Zadra, everyone raves about it.'],
      ['Chris R.', 'CR', 'Twisted Colossus dueling is a top 3 coaster experience.'],
    ),
  },
  {
    id: 'f4',
    type: 'review',
    authorId: 'u-ms',
    authorName: 'Maria S.',
    authorInitials: 'MS',
    daysAgo: 5,
    likeCount: 52,
    commentCount: 2,
    isLiked: false,
    coasterId: 'velocicoaster',
    coasterName: 'Velocicoaster',
    parkName: 'Islands of Adventure',
    rating: 5,
    reviewText:
      'The theming is incredible and the inversions are so smooth. That top hat over the lagoon is a moment you\'ll never forget. Universal absolutely nailed this one — it might be the most complete coaster experience in the world.',
    comments: makeComments(
      ['Alex M.', 'AM', 'The top hat is genuinely breathtaking every single time.'],
      ['Chris R.', 'CR', 'Best themed coaster in the US, no question.'],
    ),
  },
  {
    id: 'f5',
    type: 'trip_report',
    authorId: 'u-sk',
    authorName: 'Sarah K.',
    authorInitials: 'SK',
    daysAgo: 7,
    likeCount: 32,
    commentCount: 3,
    isLiked: false,
    title: 'First Visit to Dollywood',
    parkId: 'dollywood',
    parkName: 'Dollywood',
    rideCount: 8,
    excerpt:
      'What a gem of a park. Lightning Rod blew my mind — the launches, the quad-down, everything. Wild Eagle was a pleasant surprise too.',
    fullText:
      'What a gem of a park. Lightning Rod blew my mind — the launches, the quad-down, everything. Wild Eagle was a pleasant surprise too. The food here is genuinely some of the best I\'ve had at any park.\n\nStarted the day with Lightning Rod (walk-on at 10am!) and was immediately speechless. The quad-down in the back row is an out-of-body experience. Rode it three more times throughout the day.\n\nWild Eagle surprised me — the wing coaster layout uses the terrain beautifully. Mystery Mine is a fun dark ride/coaster hybrid. Tennessee Tornado is short but packs a punch.\n\nThe park atmosphere is unmatched. Cinnamon bread from the Grist Mill is mandatory. Already planning my return trip for fall — I hear the park is gorgeous in October.',
    comments: makeComments(
      ['Maria S.', 'MS', 'The cinnamon bread alone is worth the trip!'],
      ['Tyler K.', 'TK', 'Lightning Rod in the back row changed my life.'],
      ['John D.', 'JD', 'Fall at Dollywood is magical. You won\'t regret it.'],
    ),
  },
  {
    id: 'f6',
    type: 'top_list',
    authorId: 'u-tr',
    authorName: 'TrackR',
    authorInitials: 'TR',
    daysAgo: 8,
    likeCount: 67,
    commentCount: 2,
    isLiked: false,
    title: 'Top B&M Inverts',
    emoji: '\u{1F504}',
    items: [
      { coasterId: 'montu', name: 'Montu' },
      { coasterId: 'nemesis', name: 'Nemesis' },
      { coasterId: 'afterburn', name: 'Afterburn' },
      { coasterId: 'banshee', name: 'Banshee' },
      { coasterId: 'raptor', name: 'Raptor' },
    ],
    category: 'Inverts',
    comments: makeComments(
      ['Alex M.', 'AM', 'Nemesis Reborn is supposed to be even better.'],
      ['Sarah K.', 'SK', 'Afterburn is so underrated, glad to see it here.'],
    ),
  },
  {
    id: 'f7',
    type: 'review',
    authorId: 'u-tk',
    authorName: 'Tyler K.',
    authorInitials: 'TK',
    daysAgo: 9,
    likeCount: 28,
    commentCount: 2,
    isLiked: false,
    coasterId: 'iron-gwazi',
    coasterName: 'Iron Gwazi',
    parkName: 'Busch Gardens Tampa',
    rating: 4,
    reviewText:
      'RMC magic at its finest. The wave turn delivers the most sustained lateral airtime I\'ve ever felt. Front row is a must. Only knock is the mid-course trim on hotter days — can slow things down a bit.',
    comments: makeComments(
      ['John D.', 'JD', 'Try going early morning, trims are lighter when it\'s cooler.'],
      ['Maria S.', 'MS', 'Wave turn in the front is an elite moment.'],
    ),
  },
  {
    id: 'f8',
    type: 'trip_report',
    authorId: 'u-cr',
    authorName: 'Chris R.',
    authorInitials: 'CR',
    daysAgo: 14,
    likeCount: 61,
    commentCount: 3,
    isLiked: false,
    title: 'Magic Mountain Marathon',
    parkId: 'sfmm',
    parkName: 'Six Flags Magic Mountain',
    rideCount: 15,
    excerpt:
      'Fifteen credits in one day! Started with X2 at rope drop, hit Twisted Colossus twice, and ended the night on Tatsu.',
    fullText:
      'Fifteen credits in one day! Started with X2 at rope drop, hit Twisted Colossus twice, and ended the night on Tatsu. Legs were jelly by sunset.\n\nX2 at rope drop with a 10-minute wait — still one of the most disorienting experiences in coasters. Twisted Colossus dueling is chef\'s kiss. Full Throttle\'s loop launch is incredibly underrated.\n\nSurprise of the day: West Coast Racers. I\'d heard mixed reviews but the racing element is genuinely fun. Tatsu in the back at sunset was the perfect way to close things out — that pretzel loop is still the best in the world.\n\nSFMM may not have the best operations but the sheer quantity and variety of coasters is unbeatable. 15 credits, zero regrets.',
    comments: makeComments(
      ['Sarah K.', 'SK', '15 credits! Your feet must have been destroyed.'],
      ['Tyler K.', 'TK', 'Tatsu at sunset is a spiritual experience.'],
      ['Alex M.', 'AM', 'Full Throttle is so good, people sleep on it.'],
    ),
  },
  {
    id: 'f9',
    type: 'bucket_list',
    authorId: 'u-sk',
    authorName: 'Sarah K.',
    authorInitials: 'SK',
    daysAgo: 6,
    likeCount: 41,
    commentCount: 2,
    isLiked: false,
    title: '2026 Must-Ride List',
    items: [
      { id: 'bl1', name: 'Fury 325', itemType: 'coaster', refId: 'fury-325', completed: false },
      { id: 'bl2', name: 'Steel Vengeance', itemType: 'coaster', refId: 'steel-vengeance', completed: true },
      { id: 'bl3', name: 'Velocicoaster', itemType: 'coaster', refId: 'velocicoaster', completed: true },
      { id: 'bl4', name: 'Iron Gwazi', itemType: 'coaster', refId: 'iron-gwazi', completed: false },
      { id: 'bl5', name: 'Hersheypark', itemType: 'park', refId: 'hersheypark', completed: false },
      { id: 'bl6', name: 'Stardust Racers', itemType: 'coaster', refId: 'stardust-racers', completed: false },
    ],
    comments: makeComments(
      ['Chris R.', 'CR', 'Fury 325 at night is transcendent. Get on that ASAP.'],
      ['Maria S.', 'MS', 'Add Pantheon to this list! You won\'t regret it.'],
    ),
  },
];
