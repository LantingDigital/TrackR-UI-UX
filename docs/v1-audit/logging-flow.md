# Logging Flow -- v1 Backend Audit

## Screens/Components Covered
- LogConfirmCard.tsx (lines 1-692) -- Full-screen card overlay (legacy, may be unused)
- LogConfirmSheet.tsx (lines 1-1231) -- Bottom sheet log confirmation (primary)
- LogModal.tsx (lines 1-903) -- Search/discovery for finding coasters to log
- LogbookLogSheet.tsx (lines 1-513) -- Logbook tab's search-only sheet

## Current Data Sources
- Coaster data: `COASTER_BY_ID` from `data/coasterIndex.ts` (static bundled, ~3000+ coasters)
- Coaster details: `COASTER_DETAILS` from `data/coasterDetails.ts` (top-200 descriptions)
- Card art: `CARD_ART`, `CARD_ART_FOCAL` from `data/cardArt.ts` (bundled webp assets)
- Ride logs: `rideLogStore.ts` in-memory store (addQuickLog, getTodayRideCountForCoaster)
- Search: `searchItems()` / `COASTER_INDEX` (local fuzzy match on bundled index)

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Search input (LogModal) | LogModal L391-403 | Filters local coaster index | Same (client-side search) | None |
| 2 | Autocomplete row tap | LogModal L605-637 | Calls onCardSelect, opens LogConfirmSheet | Same but persist | Write: rideLogs/{userId}/logs |
| 3 | Carousel card tap | LogModal L348-359 | Calls onCardSelect, opens LogConfirmSheet | Same but persist | Write: rideLogs/{userId}/logs |
| 4 | Trending row tap | LogModal L313-332 | Calls onCardSelect, opens LogConfirmSheet | Same but persist | Write: rideLogs/{userId}/logs |
| 5 | "Rate All" button | LogModal L303-310 | Navigates to RateRidesScreen | Same | None (navigation only) |
| 6 | Pending rating row tap | LogModal L289-300 | Calls onCardSelect (opens confirm) | Should open RatingSheet directly | None |
| 7 | Clear search (X button) | LogModal L-- | Clears text, crossfades back to discovery | Same | None |
| 8 | "Log It" button | LogConfirmSheet L751-759 | Calls onConfirm -> addQuickLog in-memory | Persist to Firestore | Write: rideLogs/{userId}/logs/{logId} |
| 9 | Celebration animation | LogConfirmSheet L314-357 | Checkmark + confetti after confirm | Same (client-side) | None |
| 10 | "Rate this ride" button | LogConfirmSheet L785-788 | Calls onRate, opens RatingSheet | Same | None (opens rating flow) |
| 11 | "Maybe later (N)" skip | LogConfirmSheet L789-791 | Auto-dismiss after 5s countdown | Same | None |
| 12 | Close button (X) | LogConfirmSheet L511-517 | Dismisses sheet | Same | None |
| 13 | Backdrop tap | LogConfirmSheet L488-492 | Dismisses (confirm phase only) | Same | None |
| 14 | Drag-to-dismiss | LogConfirmSheet L371-398 | Pan gesture dismisses sheet | Same | None |
| 15 | Pager swipe (page 2) | LogConfirmSheet L549-702 | Horizontal scroll to ride info | Same (static data) | None |
| 16 | Pager dot indicators | LogConfirmSheet L705-712 | Animated dots for page position | Same | None |
| 17 | Re-ride badge | LogConfirmSheet L528-533 | Shows "Ride #N today" from in-memory count | Same but from Firestore | Read: today's logs for coaster |
| 18 | LogbookLogSheet search | LogbookLogSheet L276-289 | Text input searches COASTER_INDEX | Same | None |
| 19 | LogbookLogSheet clear (X) | LogbookLogSheet L291-301 | Clears search, refocuses | Same | None |
| 20 | LogbookLogSheet result tap | LogbookLogSheet L327-356 | Dismisses + calls onCoasterSelect | Delegates to LogConfirmSheet | Write: rideLogs/{userId}/logs |
| 21 | LogbookLogSheet backdrop tap | LogbookLogSheet L236-238 | Dismisses sheet | Same | None |
| 22 | LogbookLogSheet drag dismiss | LogbookLogSheet L164-191 | Pan gesture dismisses | Same | None |

## Firestore Collections Required
- `rideLogs/{userId}/logs/{logId}` -- Schema:
  ```
  {
    id: string,
    coasterId: string,
    coasterName: string,
    parkName: string,
    timestamp: ISO string,
    seat?: { row: string, position: 'left'|'middle'|'right' },
    rideCount: number (within-day sequence),
    notes?: string,
    createdAt: serverTimestamp,
    updatedAt: serverTimestamp
  }
  ```
- `rideLogs/{userId}/meta` -- Denormalized counters:
  ```
  { creditCount: number, totalRideCount: number }
  ```

## Cloud Function Requirements
- `onRideLogCreate` -- Trigger on new log document:
  - Update creditCount/totalRideCount in meta doc
  - Check if new credit (first log for this coaster) and update accordingly
  - Push to friends' activity feeds (M2)

## Third-Party API Requirements
- None for logging flow itself

## Open Questions
- LogConfirmCard.tsx vs LogConfirmSheet.tsx: are both still used, or is the card version legacy?
- Should seat position be captured in the quick log flow or deferred to a detail edit?
- Should rideCount (the within-day sequence number) be server-computed to prevent race conditions on rapid multi-device logging?
- The `generateLogId()` function uses client-side UUID -- should this be Firestore auto-ID instead?
