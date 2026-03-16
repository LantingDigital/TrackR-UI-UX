# Activity -- v1 Backend Audit

## Screens/Components Covered
- ActivityScreen.tsx (lines 1-527) -- Standalone activity screen with pending ratings + timeline

## Current Data Sources
- Pending ratings: `MOCK_PENDING` hardcoded array (3 items, lines 40-44)
- Activity timeline: `MOCK_ACTIVITY` hardcoded array (8 items, lines 46-55)
- **100% mock data.** No connection to rideLogStore or any live data source.

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Back button | ActivityScreen L232-241 | navigation.goBack() | Same | None |
| 2 | "Rate Now" button (PendingCard) | ActivityScreen L94-96 | haptics.select() only -- **does nothing** | Open RatingSheet for that coaster | Read: unrated coasters from Firestore |
| 3 | Pending card display | ActivityScreen L76-121 | Renders MOCK_PENDING data | Render from rideLogStore.getUnratedCoasters() | Read: rideLogs/{userId} where unrated |
| 4 | Empty pending state | ActivityScreen L125-148 | Shows "All caught up!" when MOCK_PENDING empty | Same, driven by real data | Read: unrated count |
| 5 | Timeline entry display | ActivityScreen L152-205 | Renders MOCK_ACTIVITY with dot + line | Render from actual ride log history | Read: rideLogs/{userId}/logs (recent) |
| 6 | Timeline dot color | ActivityScreen L174-177 | Pending = gray border, rated = accent fill | Same, driven by real data | Read: ratings/{userId}/{coasterId} |
| 7 | Rating badge | ActivityScreen L188-193 | Shows mock rating number | Show real weightedScore / 10 | Read: ratings/{userId}/{coasterId} |
| 8 | "Pending" badge | ActivityScreen L194-198 | Shows "Pending" text for isPending items | Shows for coasters without rating | Derived |
| 9 | Scroll view | ActivityScreen L246-293 | Scrolls pending + timeline sections | Same | None |
| 10 | Section "Pending Ratings" count badge | ActivityScreen L259-263 | Shows MOCK_PENDING.length | Show real unrated count | Read: unrated count |

## Firestore Collections Required
- `rideLogs/{userId}/logs/{logId}` -- For recent activity timeline
- `ratings/{userId}/{coasterId}` -- To determine rated vs pending status
- `rideLogs/{userId}/meta` -- For aggregate counts

## Cloud Function Requirements
- `getUserActivity` -- Optional: could be a simple client-side query of recent logs + ratings join. No dedicated Cloud Function needed unless friend activity is included.

## Third-Party API Requirements
- None

## Critical Finding

**This entire screen uses hardcoded mock data and has a non-functional "Rate Now" button.** It is the least connected screen in the audit scope. The v1 backend work needed:

1. Replace `MOCK_PENDING` with `getUnratedCoasters()` from rideLogStore (or Firestore query)
2. Replace `MOCK_ACTIVITY` with `getAllLogs()` joined with ratings
3. Wire "Rate Now" button to actually open RatingSheet
4. Consider merging this functionality into LogbookScreen's Pending tab (they overlap significantly)

## Open Questions
- Should ActivityScreen be a standalone screen or merged into LogbookScreen? The Pending tab in LogbookScreen already shows unrated coasters with similar UI.
- Should the activity timeline include friend activity (M2 scope) or just the user's own?
- Is this screen accessible from the current navigation structure? It imports useNavigation but it is unclear which tab/button navigates here.
- The "Rate Now" button is completely non-functional (just fires haptics) -- is this a known stub or a bug?
- Should the timeline here be de-duped with the LogbookScreen timeline, or are they intentionally separate views?
