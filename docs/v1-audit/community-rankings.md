# Community Rankings -- v1 Backend Audit

## Decisions Made (2026-03-11)

- **Game leaderboards are public.** Scores are system-verified (can't be faked), so public visibility is fair.
- **Ride stat leaderboards are friends-only.** Ride counts and stats are self-reported (could be faked), so limiting to friends prevents gaming.
- **Pro users get colored/gold name on leaderboards** (Clash Royale style — prominent visual flair). But everyone is eligible to appear on leaderboards regardless of Pro status. Pro badge is cosmetic identity, not a gate.

---

## Screens/Components Covered
- CommunityRankingsTab.tsx (L1-513) -- Category chips, time filter, ranked entry list
- rankingsStore.ts -- Module-level read-only store
- data/mockRankingsData.ts -- 6 categories x 10 entries hardcoded

## Current Data Sources
- Rankings data: `MOCK_RANKINGS` from `data/mockRankingsData.ts` (hardcoded)
- Store: `rankingsStore.ts` -- read-only: `getCategories()`, `getCategory()`
- Categories: overall, airtime, intensity, smoothness, theming, pacing (6 total)
- Each entry: { id, name, park, averageScore, totalRatings, rankChange, imageUrl }
- Time filter: 3 chips (All Time, This Year, This Month) -- **UI-only, no filtering logic**

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Category chip (Overall) | CommunityRankingsTab L286-294 | Selects category, animates underline | Same + fetch from Firestore | Read: rankings/overall |
| 2 | Category chip (Airtime) | CommunityRankingsTab L286-294 | Selects category | Same + fetch | Read: rankings/airtime |
| 3 | Category chip (Intensity) | CommunityRankingsTab L286-294 | Selects category | Same + fetch | Read: rankings/intensity |
| 4 | Category chip (Smoothness) | CommunityRankingsTab L286-294 | Selects category | Same + fetch | Read: rankings/smoothness |
| 5 | Category chip (Theming) | CommunityRankingsTab L286-294 | Selects category | Same + fetch | Read: rankings/theming |
| 6 | Category chip (Pacing) | CommunityRankingsTab L286-294 | Selects category | Same + fetch | Read: rankings/pacing |
| 7 | Time filter: All Time | CommunityRankingsTab L300-307 | Sets filter state but NO data change | Actually filter aggregation window | Read: Cloud Function with time param |
| 8 | Time filter: This Year | CommunityRankingsTab L300-307 | Same -- UI-only toggle | Filter to current year ratings | Read: Cloud Function with time param |
| 9 | Time filter: This Month | CommunityRankingsTab L300-307 | Same -- UI-only toggle | Filter to current month ratings | Read: Cloud Function with time param |
| 10 | Coaster entry row tap | CommunityRankingsTab L191, L317-325 | No-op (no navigation) | Open CoasterDetailScreen or RideActionSheet | Read: coasters/{coasterId} |
| 11 | Scroll list | CommunityRankingsTab L280 | ScrollView of all entries | Paginated FlatList from Firestore | Read: paginated query |

## Firestore Collections Required
- `rankings/{category}` -- Aggregated ranking doc per category: { entries: [{ coasterId, name, park, averageScore, totalRatings, rankChange }], lastComputed }
- OR `rankings/{category}/entries/{coasterId}` -- Individual entry docs for pagination
- Source truth: aggregated from `rideLogs/{userId}/ratings` across all users

## Cloud Function Requirements
- `computeRankings` -- Scheduled (daily or hourly): aggregates all user ratings by category, computes averageScore and totalRatings, determines rankChange vs previous period, writes to rankings collection
- `getRankings(category, timeWindow)` -- Callable: returns top-N entries for a category + time filter (all-time, this-year, this-month). Could be a direct Firestore read if pre-computed.

## Data Flow: Current vs Required
- **Current:** App boots -> rankingsStore loads MOCK_RANKINGS -> getCategories() returns all 6 -> getCategory(id) returns 10 entries -> UI renders. Time filter changes state but data is identical.
- **Required:** App boots -> fetch rankings/overall from Firestore (or call getRankings CF) -> cache in store -> user switches category -> fetch that category -> user changes time filter -> re-fetch with time param -> UI renders fresh data. rankChange computed server-side by comparing current period to previous.

## Open Questions
- Ranking computation frequency: real-time (on each rating) or batch (daily cron)?
- Minimum rating threshold: how many ratings before a coaster appears in rankings?
- Should users see their own rating next to the community average?
- rankChange: compared to what period? Previous day? Previous week?
- Pagination: top 10, top 25, top 100? Infinite scroll?
- Should there be a "Your Rankings" section showing the user's personal top lists?
- Are the 6 categories final, or should they be configurable server-side?
