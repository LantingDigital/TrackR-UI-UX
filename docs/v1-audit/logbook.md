# Logbook -- v1 Backend Audit

## Screens/Components Covered
- LogbookScreen.tsx (lines 1-400+) -- Main logbook tab (Timeline, Collection, Stats, Pending views)
- LogbookLogSheet.tsx (lines 1-513) -- Search sheet for logging from Logbook tab
- TimelineActionSheet.tsx (lines 1-459) -- Long-press actions on timeline entries
- LogConfirmSheet.tsx (covered in logging-flow.md, used here too)
- RatingSheet.tsx (covered in rating-system.md, used here too)

## Current Data Sources
- All ride logs: `rideLogStore.ts` getAllLogs() (in-memory)
- Credit/ride counts: `rideLogStore.ts` getCreditCount/getTotalRideCount (in-memory)
- Ratings: `rideLogStore.ts` getAllRatings() (in-memory, keyed by coasterId)
- Unrated coasters: `rideLogStore.ts` getUnratedCoasters() (derived)
- Coaster metadata: `COASTER_BY_ID` (static bundled index)
- Card art: `CARD_ART`, `getRarityFromRank` (bundled assets)

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Segmented control (4 tabs) | LogbookScreen ~L162-222 | Animated pill switches Timeline/Collection/Stats/Pending | Same (client-side) | None |
| 2 | Timeline entry tap | LogbookScreen ~L279-281 | Opens detail view (implementation varies) | Open CoasterSheet or LogDetail | Read: log + rating data |
| 3 | Timeline entry long-press | LogbookScreen ~L281-282 | Opens TimelineActionSheet | Same | None |
| 4 | "Edit Date" action | TimelineActionSheet L212-245 | Inline DateTimePicker, updates in-memory | Persist date change | Write: rideLogs/{userId}/logs/{logId}.timestamp |
| 5 | DateTimePicker selection | TimelineActionSheet L124-130 | Stores pending date locally | Same (applied on dismiss) | None |
| 6 | "Edit Rating" / "Rate This Ride" | TimelineActionSheet L248-277 | Calls onEditRating callback | Opens RatingSheet | Write: ratings/{userId}/{coasterId} |
| 7 | "Delete Ride" action | TimelineActionSheet L279-298 | Calls onDelete callback | Persist deletion | Write: delete rideLogs/{userId}/logs/{logId} |
| 8 | Collection card tap | LogbookScreen ~L389 | Opens card detail (flip animation) | Show CoasterSheet or RatingSheet | None |
| 9 | Collection card long-press | LogbookScreen ~L390 | Opens CardActionSheet | Same | None |
| 10 | Stats view display | LogbookScreen (Stats tab) | Computed from in-memory logs/ratings | Same but from Firestore | Read: rideLogs/{userId}/meta |
| 11 | Pending tab display | LogbookScreen (Pending view) | List of unrated coasters | Same but from Firestore | Read: derived from logs - ratings |
| 12 | Pending tab "Pending" dot | LogbookScreen ~L202-203 | Shows dot when unratedCount > 0 | Same | Read: unrated count |
| 13 | FAB "Log Ride" button | LogbookScreen (bottom) | Opens LogbookLogSheet | Same | None |
| 14 | LogbookLogSheet search input | LogbookLogSheet L276-289 | Text search of COASTER_INDEX | Same (client-side) | None |
| 15 | LogbookLogSheet result row tap | LogbookLogSheet L327-356 | Dismisses sheet, triggers onCoasterSelect | Opens LogConfirmSheet | Write: rideLogs/{userId}/logs |
| 16 | LogbookLogSheet clear button | LogbookLogSheet L291-301 | Clears text, refocuses input | Same | None |
| 17 | LogbookLogSheet close button | LogbookLogSheet L256-262 | Dismisses sheet | Same | None |
| 18 | LogbookLogSheet drag dismiss | LogbookLogSheet L164-191 | Pan gesture to dismiss | Same | None |
| 19 | LogbookLogSheet backdrop tap | LogbookLogSheet L236-238 | Dismisses sheet | Same | None |
| 20 | Date group headers | LogbookScreen ~L350 | Formatted from log timestamps | Same | None |
| 21 | Score badge on timeline | LogbookScreen ~L302-307 | Shows weighted score / 10 | Same, from Firestore | Read: ratings/{userId}/{coasterId} |
| 22 | "Unrated" badge | LogbookScreen ~L308-312 | Shows when no rating exists | Same | Read: absence of rating |
| 23 | Empty state (Timeline) | LogbookScreen ~L334-343 | "No rides logged yet" message | Same | None |
| 24 | Empty state (Collection) | LogbookScreen ~L394-400 | "No collection yet" message | Same | None |

## Firestore Collections Required
- `rideLogs/{userId}/logs/{logId}` -- (defined in logging-flow.md)
- `rideLogs/{userId}/meta` -- { creditCount, totalRideCount, lastLogAt }
- `ratings/{userId}/{coasterId}` -- (defined in rating-system.md)

## Cloud Function Requirements
- `onRideLogDelete` -- Trigger on log deletion:
  - Recompute creditCount (check if other logs exist for that coaster)
  - Decrement totalRideCount
- `onRideLogUpdate` -- Trigger on timestamp edit:
  - Recompute rideCount (within-day sequence) if date changed across days

## Third-Party API Requirements
- None

## Open Questions
- Stats view content: what specific stats should be shown? (top parks, rides per month chart, longest streak, etc.) Currently unclear from the code.
- Collection view: should locked cards (coasters not yet ridden) be shown? Currently the code suggests a grid of all known coasters with unlock state.
- Should log deletion require confirmation (Alert.alert)? The TimelineActionSheet fires onDelete directly.
- Should the Pending tab show a count badge in the segmented control, or just the dot?
- How should the Collection sort order work? By recency of log? Alphabetical? Rarity?
