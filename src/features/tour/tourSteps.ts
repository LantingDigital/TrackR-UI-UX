// ============================================
// Guided Tour v2 — Step Definitions (14 steps)
// ============================================

import type { TourStep } from './types';

export const TOUR_STEPS: TourStep[] = [
  // ── Home ──
  {
    id: 'welcome',
    kind: 'observe',
    tab: 'Home',
    targetId: null,
    title: 'Welcome to TrackR',
    body: "Your home for everything coasters. Let's take a quick look around.",
  },
  {
    id: 'morphing-pill-demo',
    kind: 'interact',
    tab: 'Home',
    targetId: 'home-action-pills',
    title: 'Quick Actions',
    body: 'These morph into full experiences with a single tap.',
    instruction: 'Tap the Log button to see it in action.',
    action: { type: 'morphingPill', pillId: 'log' },
    timeoutMs: 8000,
  },
  {
    id: 'search-demo',
    kind: 'interact',
    tab: 'Home',
    targetId: 'home-search-bar',
    title: 'Search Anything',
    body: 'Find any coaster, park, or news article instantly.',
    instruction: "Tap the search bar and type 'Steel'.",
    action: {
      type: 'search',
      prefillQuery: 'Steel Vengeance',
      expectedCoasterId: 'steel-vengeance',
    },
    timeoutMs: 12000,
  },
  {
    id: 'feed-intro',
    kind: 'observe',
    tab: 'Home',
    targetId: 'home-news-feed',
    title: 'Your Feed',
    body: 'The latest coaster news, park announcements, and community highlights.',
  },

  // ── Parks ──
  {
    id: 'parks-hub',
    kind: 'observe',
    tab: 'Parks',
    targetId: null,
    title: 'Your Park Hub',
    body: 'Everything about your home park in one place. Switch parks anytime from the header.',
  },
  {
    id: 'parks-actions',
    kind: 'observe',
    tab: 'Parks',
    targetId: 'parks-quick-action-row',
    title: 'Park Quick Actions',
    body: 'Jump to the map, find food, check ride wait times, or pull up your pass.',
  },
  {
    id: 'parks-dashboard',
    kind: 'observe',
    tab: 'Parks',
    targetId: 'parks-dashboard',
    title: 'Live Dashboard',
    body: 'Weather, steps, and real-time ride wait times at a glance.',
  },

  // ── Logbook ──
  {
    id: 'logbook-intro',
    kind: 'observe',
    tab: 'Logbook',
    targetId: null,
    title: 'Your Logbook',
    body: 'Track every ride you take. This is the heart of TrackR.',
  },
  {
    id: 'logbook-views',
    kind: 'interact',
    tab: 'Logbook',
    targetId: 'logbook-segmented-control',
    title: 'Three Views',
    body: 'See your rides from every angle.',
    instruction: 'Tap Collection to switch views.',
    action: { type: 'segmentedControl', targetSegment: 'Collection' },
    timeoutMs: 8000,
  },

  // ── Community ──
  {
    id: 'community-intro',
    kind: 'observe',
    tab: 'Community',
    targetId: null,
    title: 'Community',
    body: 'Connect with fellow enthusiasts. Share rides, compete on rankings, and play Coastle.',
  },
  {
    id: 'coastle-tease',
    kind: 'interact',
    tab: 'Community',
    targetId: null,
    title: "Let's Play Coastle",
    body: "TrackR's own coaster guessing game. Try one round.",
    instruction: 'Submit a guess to continue.',
    action: { type: 'coastleRound', roundCount: 1 },
    timeoutMs: 30000,
  },

  // ── Profile ──
  {
    id: 'profile-intro',
    kind: 'observe',
    tab: 'Profile',
    targetId: null,
    title: 'Your Profile',
    body: 'Your rider identity — stats, top coasters, and settings.',
  },
  {
    id: 'profile-settings',
    kind: 'interact',
    tab: 'Profile',
    targetId: 'profile-settings-button',
    title: 'Settings',
    body: 'Customize your experience.',
    instruction: 'Tap Settings to take a look.',
    action: { type: 'tapNavigate', expectedScreen: 'Settings' },
    timeoutMs: 8000,
  },

  // ── Finish ──
  {
    id: 'tour-complete',
    kind: 'observe',
    tab: 'Home',
    targetId: null,
    title: "You're All Set!",
    body: 'Start logging rides, exploring parks, and climbing the rankings. Happy riding!',
  },
];
