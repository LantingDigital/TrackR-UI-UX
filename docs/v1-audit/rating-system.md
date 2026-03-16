# Rating System -- v1 Backend Audit

## Screens/Components Covered
- RatingSheet.tsx (lines 1-1192) -- Bottom sheet with slider-per-criterion rating
- CriteriaWeightEditorScreen.tsx (lines 1-1230) -- Full screen to customize criteria weights
- RateRidesScreen.tsx (lines 1-396) -- Grid of unrated coasters, batch rating flow

## Current Data Sources
- Criteria config: `rideLogStore.ts` getCriteria/getCriteriaConfig (in-memory, defaults to 7 criteria)
- Ratings: `rideLogStore.ts` ratings map keyed by coasterId (in-memory)
- Unrated coasters: `rideLogStore.ts` getUnratedCoasters() (derived from logs - ratings)
- Coaster index: `COASTER_BY_ID` (static bundled data)
- Card art: `CARD_ART`, `CARD_ART_FOCAL`, `getRarityFromRank`, `RARITY_GRADIENTS`

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Criterion slider drag | RatingSheet L685-767 | HalfPointSlider, 0.5 increments, zero-rerender | Same | None (client until submit) |
| 2 | Score bar (live) | RatingSheet L533-537 | Animated bar fills based on weighted score | Same | None |
| 3 | Notes toggle | RatingSheet L551-559 | Expands/collapses notes TextInput | Same | None |
| 4 | Notes text input | RatingSheet L817-828 | Multiline text, stored in local state | Persist with rating | Write: ratings/{userId}/{coasterId} |
| 5 | "Save Rating" / "Update Rating" | RatingSheet L851-858 | Calls upsertCoasterRating (in-memory) | Persist to Firestore | Write: ratings/{userId}/{coasterId} |
| 6 | Celebration animation | RatingSheet L282-318 | Content fades, checkmark+confetti, auto-close | Same (client) | None |
| 7 | Close button (X) | RatingSheet L447-454 | Dismisses sheet | Same | None |
| 8 | Backdrop tap | RatingSheet L426-429 | Dismisses sheet | Same | None |
| 9 | Pan gesture dismiss | RatingSheet L340-372 | Drag down to dismiss | Same | None |
| 10 | Compact bar (scroll) | RatingSheet L457-461 | Fades in when hero scrolls off | Same | None |
| 11 | Hero section | RatingSheet L479-530 | Blurred art bg + portrait card + name/park | Same | None |
| 12 | Template chips | CriteriaEditor L708-719 | Taps apply preset weights (Thrill/Theme/Balanced) | Same, persist config | Write: users/{userId}/criteriaConfig |
| 13 | Criterion switch toggle | CriteriaEditor L661-674 | Enables/disables criterion, redistributes weights | Same | Write: users/{userId}/criteriaConfig |
| 14 | Criterion lock button | CriteriaEditor L644-649 | Locks weight from redistribution | Same, persist | Write: users/{userId}/criteriaConfig |
| 15 | Weight slider drag | CriteriaEditor L342-401 | Dragging redistributes weights across unlocked criteria | Same | None (client until save) |
| 16 | "Distribute Evenly" button | CriteriaEditor L951-953 | Evenly distributes among unlocked | Same | None |
| 17 | "Save Changes" button | CriteriaEditor L980-984 | updateCriteriaConfig (in-memory) | Persist to Firestore | Write: users/{userId}/criteriaConfig |
| 18 | "Revert" button | CriteriaEditor L987-989 | Resets to original values | Same (client-only) | None |
| 19 | Back button (unsaved) | CriteriaEditor L882-894 | Alert: "Discard?" | Same | None |
| 20 | Distribution bar | CriteriaEditor L500-531 | Animated segment bar showing weight split | Same | None |
| 21 | Card tap (RateRides grid) | RateRidesScreen L195-199 | Opens RatingSheet for that coaster | Same | None |
| 22 | Back button (RateRides) | RateRidesScreen L227-230 | goBack() | Same | None |
| 23 | Auto-close (all rated) | RateRidesScreen L218-225 | Auto-navigates back after 2.5s | Same | None |
| 24 | Grid card render | RateRidesScreen L247-278 | FadeIn/FadeOut with Layout spring | Same | None |

## Firestore Collections Required
- `ratings/{userId}/{coasterId}` -- Schema:
  ```
  {
    coasterId: string,
    coasterName: string,
    parkName: string,
    criteriaRatings: { [criterionId]: number },  // 0.0-10.0 in 0.5 steps
    weightedScore: number,  // 0-100 computed value
    notes?: string,
    createdAt: serverTimestamp,
    updatedAt: serverTimestamp
  }
  ```
- `users/{userId}/criteriaConfig` -- Schema:
  ```
  {
    criteria: [
      { id, name, icon, weight, isLocked? },  // 7 criteria
    ],
    hasCompletedSetup: boolean,
    lastModifiedAt: ISO string
  }
  ```

## Cloud Function Requirements
- `onRatingWrite` -- Trigger on rating create/update:
  - Update global aggregate scores for the coaster (for rankings/trending)
  - Recompute user's personal rankings list
- `getGlobalRankings` -- Aggregates all user ratings for a coaster into a community score

## Third-Party API Requirements
- None

## Open Questions
- Should criteria config be per-user or should there be a global default that new users inherit?
- When a user changes criteria weights, should existing ratings be recomputed with new weights?
- The `isLocked` property on criteria -- is this a client-only UX concept or should it persist?
- Should `weightedScore` be recomputed server-side (authoritative) or trust client calculation?
- RateRidesScreen currently rebuilds items from store on mount only -- should it listen for real-time updates?
