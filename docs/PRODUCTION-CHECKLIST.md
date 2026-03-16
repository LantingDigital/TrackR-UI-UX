# TrackR Production Checklist

Target: Ship by end of 2026.

## Homepage - Feed
- [ ] News article cards have no images (blank slides) -- need article thumbnails/art
- [ ] Scroll-triggered entrance animations for feed sections (friend activity, games, etc. should animate in as you scroll to them, not all at once on load)
- [ ] Trending section animates on mount -- good, keep it. Other sections need similar treatment
- [ ] Performance lag when returning to Home from Parks tab (dev mode; production build was smooth -- investigate if dev-only or real issue)

## Homepage - Navigation & Interaction
- [ ] Bookmark/save button on news articles should navigate to a saved articles screen
- [ ] Friend activity tap logic:
  - Tap coaster NAME -> opens CoasterSheet (may already work)
  - Tap POST body / profile / anything else -> navigate to that friend's post in Community tab
- [ ] Build saved articles / bookmarks screen

## Search
- [ ] Search modal shows real coaster photos -- should use NanoBanana card art instead
- [ ] Popular parks section in search has no park images
- [ ] Search should support: rides, parks, AND food
- [ ] Food search: location-aware, if at a park just type food name and get results from nearest parks
- [ ] Park stats cards (like coaster detail cards but for parks)

## Card Art
- [ ] Park card art -- NanoBanana-style prompts for parks (for featured park, search results, etc.)
- [ ] Ensure all coaster thumbnails everywhere use card art, not real photos

## Map
- [ ] Map logic (park map, ride locations, navigation)

## Games
- [ ] 5th mini-game (TBD -- no concept yet)
- [ ] Polish existing 4 games (Coastle, Trivia, Speed Sorter, Blind Ranking)

## Settings
- [ ] Settings screens match design vision

## Onboarding
- [ ] Redo onboarding flow

## Login / Auth
- [ ] Redo login flow
- [ ] Firebase Auth integration

## Backend
- [ ] Firebase backend (user accounts, ride logs, ratings, social)
- [ ] Data sync / offline support

## Other Screens
- [ ] Activity screen (pending ratings inbox)
- [ ] Discover screen (encyclopedia browsing)
- [ ] Wallet rebuild (Apple Wallet-style)
- [ ] Community features
- [ ] Profile / stats
