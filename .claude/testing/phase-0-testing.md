# Phase 0 Testing Instructions

> **Phase**: Prep Work - Foundation Setup
> **Completed**: December 8, 2024
> **Focus**: New tab structure, reusable hooks, animation constants

---

## How to Run

```bash
cd /Users/Lanting-Digital-LLC/Documents/Projects/mobile-apps/UI-UX-test/TrackR
npx expo start --ios --clear
```

---

## Test Checklist

### 1. Tab Bar Navigation

**Expected**: 5 tabs visible at bottom of screen

| Tab | Icon | What to Verify |
|-----|------|----------------|
| Home | 🏠 House | Loads news feed, action buttons (Log/Search/Scan) work |
| Discover | 🧭 Compass | Loads Discover screen (existing content) |
| Play | 🎮 Controller | Shows "Coming Soon" placeholder with game previews |
| Activity | ⏱ Clock | Shows pending ratings or "All Caught Up" empty state |
| Profile | 👤 Person | Loads profile hub with settings navigation |

**Test Steps**:
1. [ ] Launch app - verify 5 tabs are visible
2. [ ] Tap each tab - verify correct screen loads
3. [ ] Tap same tab twice - verify screen resets (scroll to top, close modals)
4. [ ] Verify tab highlight color is coral (#CF6769) when selected
5. [ ] Verify inactive tabs are gray (#999999)

---

### 2. Home Screen (Existing - Verify Still Works)

**Test Steps**:
1. [ ] Scroll down - header should collapse, action buttons become circles
2. [ ] Scroll up - header should expand, action buttons become pills
3. [ ] Tap search bar - search morph should open with blur backdrop
4. [ ] Tap X or backdrop - search morph should close smoothly
5. [ ] Tap "Log" button - log morph should open
6. [ ] Tap "Scan" button - wallet overlay should appear (may be buggy - that's Phase 2)
7. [ ] Verify news cards are tappable with press feedback

---

### 3. Activity Screen (New)

**Test Steps**:
1. [ ] Navigate to Activity tab
2. [ ] Verify header shows "Activity" with subtitle "Your ride journey"
3. [ ] If pending ratings exist:
   - [ ] Verify cards show coaster name, park name, and "Rate" indicator
   - [ ] Tap a pending card - Rating modal should open
   - [ ] Complete rating - card should disappear from pending
4. [ ] If no pending ratings:
   - [ ] Verify "All Caught Up!" empty state shows
5. [ ] Pull to refresh - verify refresh indicator appears
6. [ ] Verify "Recent Logs" and "Milestones" placeholder sections visible

---

### 4. Play Screen (New - Placeholder)

**Test Steps**:
1. [ ] Navigate to Play tab
2. [ ] Verify header shows "Play" with subtitle "Games & Challenges"
3. [ ] Verify game controller icon in center with "Coming Soon" message
4. [ ] Verify 3 game preview cards visible:
   - [ ] Daily Trivia
   - [ ] Guess the Coaster
   - [ ] Stat Sort
5. [ ] Verify each card has "Soon" badge
6. [ ] Scroll should work smoothly

---

### 5. Profile Screen (Existing - Verify Still Works)

**Test Steps**:
1. [ ] Navigate to Profile tab
2. [ ] Verify stats card shows Credits, Total Rides, Active Passes
3. [ ] Tap "My Wallet" - should navigate to wallet management
4. [ ] Tap "Rating Criteria" - should navigate to criteria setup
5. [ ] Verify "Coming Soon" items are grayed out

---

### 6. Animation Quality Check

**Test Steps**:
1. [ ] All press feedback should feel snappy (no lag)
2. [ ] Tab switches should be instant
3. [ ] Scroll should be 60fps smooth
4. [ ] Morph animations should have spring physics (slight bounce)
5. [ ] No visual glitches or flickers

---

## Known Issues (Pre-existing)

1. **Wallet/Scan button**: May be buggy - this is intentional, will be rebuilt in Phase 2
2. **TypeScript warning**: HomeScreen has a ref type mismatch - cosmetic, doesn't affect runtime

---

## What's NOT Being Tested Yet

- Log flow with "Quick Log" vs "Rate Now" (Phase 1)
- Rebuilt wallet system (Phase 2)
- Full Activity screen functionality (Phase 3)
- Discover screen rebuild (Phase 4)
- Mini-games integration (Phase 5)
- Stats dashboard (Phase 6)

---

## Reporting Issues

If something doesn't work as expected:
1. Note which test step failed
2. Describe what you expected vs. what happened
3. Check console for errors (`npx expo start` shows logs)
4. We'll address in the next session

---

## Success Criteria

Phase 0 is successful if:
- [ ] All 5 tabs are visible and navigable
- [ ] Home screen morphs still work perfectly
- [ ] Activity screen shows pending ratings correctly
- [ ] Play screen shows placeholder content
- [ ] No crashes or major visual bugs
- [ ] Animations feel polished at 60fps
