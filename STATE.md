# TrackR — Current State

Last updated: 2026-03-14

## Active Work: Onboarding Screen Iteration

### Screen 1: Card Art Landing — APPROVED
`src/features/onboarding/screens/OnboardingCardLanding.tsx`

### Screen 2: Search Demo — APPROVED
`src/features/onboarding/screens/OnboardingSearch.tsx` (wrapper)
`src/features/onboarding/screens/OnboardingSearchEmbed.tsx` (stripped HomeScreen, ~1500 lines)
`src/features/onboarding/screens/OnboardingCoasterSheet.tsx` (stripped CoasterSheet, ~840 lines)

Full cinematic demo with real components:
- Sequence 1: Search BAR morph → type "Steel Vengeance" → backspace → "Steel Curtain" → stat card with snap scroll → close → generic modal → close
- Sequence 2: Search PILL morph → type "Fury 325" → stat card → snap scroll → close → generic modal → close → loop
- Real MorphingPill, SearchBar, MorphingActionButton components
- Real CoasterSheet with card art, stats, additional info, about section
- Animated search results (Reanimated FadeIn/FadeOut)
- Popular Rides with card art, Popular Parks, Trending, Recent Searches
- Rich quick stats card for top result
- Shadow-matched transitions (no flicker, no pop, no double layer)

### Remaining onboarding screens to build:
- Screen 3: Log demo (from Log action button)
- Screen 4: Scan demo (from Scan action button)
- Screen 5+: Rate & Rank, Collection, Community, Wallet

### Key architectural decisions (for future screens):
- Embed real HomeScreen components (strip down, don't build up)
- Transform scale into phone frame at full pixel dimensions
- Shadow values must match between pill and underlying element (0.30 opacity, radius 20)
- closeShadowFade=false for bar origin, true for button origin
- Hide underlying element during morph, show in atomic cleanup
- Use setTimeout chains (not withDelay on same shared value) for sequencing

---

## Build Note
Dev build signed with paid Apple Developer cert (Team ID: Q9H59NQ25W).
Build: `xcodebuild -workspace ios/TrackR.xcworkspace -configuration Debug -scheme TrackR -destination "id=00008140-00044DA42E00401C" -allowProvisioningUpdates`

## Strategy (locked 2026-03-11)
- Identity: "The premium home for your coaster life"
- Target: Thoosies first. GP in v2.
- App Store target: June 22, 2026

## Backend Progress
- Sprint 1 DONE: Native build with @react-native-firebase
- Sprint 2 next: Firebase Auth integration
- Apple Developer account ACTIVE (Team ID: Q9H59NQ25W)
