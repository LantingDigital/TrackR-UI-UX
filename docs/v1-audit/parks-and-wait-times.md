# Parks & Wait Times -- v1 Backend Audit

## Screens/Components Covered
- ParksScreen.tsx (L1-584) -- Parks hub: switcher, quick actions, dashboard, pass, guides
- ParkDetailScreen.tsx (L1-718) -- Park detail: hero, stats, coaster list
- ParkDashboard.tsx (L1-42) -- Wrapper: WeatherStepsHeader + WaitTimesCard
- WaitTimesCard.tsx (L1-211) -- Horizontal wait time pill carousel with LIVE badge
- WeatherStepsHeader.tsx (L1-178) -- Weather display + hourly forecast + steps ring
- RideListView.tsx (L1-516) -- Full-screen ride list sheet with search
- FoodListView.tsx (L1-506) -- Full-screen food list sheet with search
- POIListRow.tsx (L1-284) -- Shared row component for rides and food
- ParkGuidesSection.tsx (L1-507) -- Guide cards + GuideBottomSheet
- services/waitTimes.ts (L1-205) -- Mock wait time generation service

## Current Data Sources
- Wait times: `fetchWaitTimes()` in `services/waitTimes.ts` -- mock generator using seeded random + crowd curves. Uses `PARK_RIDE_DEFINITIONS` when available, falls back to `COASTER_DATABASE` stats.
- Weather: `MOCK_WEATHER` from `data/mockDashboardData.ts` (hardcoded Knott's, 78F sunny)
- Steps: `MOCK_STEPS` from `data/mockDashboardData.ts` (hardcoded 7432/10000)
- Ride/food POI lists: `parkPOIRegistry` (bundled static data per park)
- Park list/switcher: `buildParkList()` (local function from coaster database)
- Ride completion: `rideLogStore` (in-memory, resets on app restart)
- Park guides: `getGuidesForPark()` from `data/guides/` (bundled static content)
- Ride definitions: `PARK_RIDE_DEFINITIONS` (static per-park ride data with peak/min waits)
- Wait time colors: `getWaitColor()` in `data/mockDashboardData.ts` (tiered: green/yellow/orange/red)

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Park switcher (MorphingPill) | ParksScreen ~L200 | Selects active park | Same + fetch park-specific data | Read: wait times API for selected park |
| 2 | Quick action: Stats | ParksScreen ~L280 | Navigates to ParkDetailScreen | Same | None |
| 3 | Quick action: Food | ParksScreen ~L285 | Opens FoodListView sheet | Same | None |
| 4 | Quick action: Rides | ParksScreen ~L290 | Opens RideListView sheet | Same | None |
| 5 | Quick action: Pass | ParksScreen ~L295 | Opens PassDetail or AddTicket flow | Same | Read/Write: wallet/{userId}/tickets |
| 6 | Wait time pill tap | WaitTimesCard ~L150 | Opens POI action sheet for ride | Same | None (nav only) |
| 7 | Wait time LIVE badge | WaitTimesCard ~L85 | Static badge display | Show only when data is live (not mock) | Conditional on API connection |
| 8 | Weather display | WeatherStepsHeader L50-80 | Shows MOCK_WEATHER (78F) | Show real weather for selected park | Read: weather API |
| 9 | Hourly forecast carousel | WeatherStepsHeader L90-130 | Scrollable hourly pills (mock) | Real hourly forecast | Read: weather API |
| 10 | Steps ring | WeatherStepsHeader L140-170 | Shows MOCK_STEPS (7432/10000) | Real step count from HealthKit | Read: HealthKit API |
| 11 | Scroll-driven header collapse | ParksScreen ~L450-550 | Header morphs on scroll | Same (client-side) | None |
| 12 | Guide card press | ParkGuidesSection L76 | Opens GuideBottomSheet | Same | None (static content) |
| 13 | GuideBottomSheet close button | ParkGuidesSection L218 | Closes sheet | Same | None |
| 14 | GuideBottomSheet drag-dismiss | ParkGuidesSection L153-181 | Pan gesture to dismiss | Same | None |
| 15 | GuideBottomSheet backdrop tap | ParkGuidesSection L198 | Closes sheet | Same | None |
| 16 | GuideBottomSheet linked text tap | ParkGuidesSection L247 | Opens POI action sheet | Same | None |
| 17 | RideListView close button | RideListView L291-296 | Closes sheet | Same | None |
| 18 | RideListView drag-dismiss | RideListView L185-212 | Pan gesture to dismiss | Same | None |
| 19 | RideListView search input | RideListView L310-316 | Filters ride list by name | Same (client-side filter) | None |
| 20 | RideListView clear search | RideListView L319-325 | Clears search text | Same | None |
| 21 | RideListView ride row press | RideListView L233-235 | Opens POI action sheet | Same | None |
| 22 | FoodListView close button | FoodListView ~L291 | Closes sheet | Same | None |
| 23 | FoodListView drag-dismiss | FoodListView ~L185 | Pan gesture to dismiss | Same | None |
| 24 | FoodListView search input | FoodListView ~L310 | Filters food list (name + menu items) | Same (client-side) | None |
| 25 | FoodListView food row press | FoodListView ~L233 | Opens POI action sheet | Same | None |
| 26 | ParkDetail back button | ParkDetailScreen L339 | Navigates back | Same | None |
| 27 | ParkDetail coaster row press | ParkDetailScreen L419 | No-op (comment: "Future: CoasterDetailScreen") | Open CoasterDetailScreen | None (static data) |
| 28 | ParkDetail progress bar | ParkDetailScreen ~L400 | Shows % of coasters ridden (from rideLogStore) | Same but from Firestore | Read: rideLogs/{userId} |

## Wait Times Service Architecture
- `fetchWaitTimes(parkSlug)` returns `ParkWaitTimesResponse | null`
- Two generation paths: explicit `PARK_RIDE_DEFINITIONS` or fallback from `COASTER_DATABASE`
- Mock uses seeded random (stable within each hour), crowd curve (peaks 12-3pm)
- Status generator: open (95%), closed/temp-closed/weather-delay (5%)
- **Interface is clean**: swap body of `fetchWaitTimes()` for Queue-Times API call
- Types: `RideWaitTimeData { id, name, parkSlug, waitMinutes, status, lastUpdated, historicalAvgMinutes }`
- Status enum: `'open' | 'closed' | 'temporarily-closed' | 'weather-delay'`

## Third-Party API Requirements
- **Queue-Times API** (queue-times.com) -- Live wait times for 600+ parks. v1 M2 target.
  - Replace `fetchWaitTimes()` body with HTTP call to Queue-Times
  - Match Queue-Times park/ride IDs to local coaster database IDs
  - Cache responses (API rate limits unknown -- poll every 5-10 min max)
  - Fallback to mock data when API is unavailable or park not covered
- **Weather API** (OpenWeatherMap, WeatherKit, or similar) -- Current + hourly forecast per park GPS coords
  - Replace MOCK_WEATHER with real API call
  - Cache per park, refresh every 30-60 min
- **Apple HealthKit** (expo-health or react-native-health) -- Step count for steps ring
  - Replace MOCK_STEPS with HealthKit read
  - Requires user permission prompt
  - iOS only (no Android HealthConnect equivalent needed for v1)

## Cloud Function Requirements
- `proxyWaitTimes(parkSlug)` -- Proxies Queue-Times API to keep API key server-side. Caches responses in Firestore/memory. Returns same `ParkWaitTimesResponse` shape.
- OR: call Queue-Times directly from client with key in app config (less secure but simpler for v1)

## Firestore Collections Required
- `parkWaitTimes/{parkSlug}` -- Cached wait times: { rides: [...], lastFetched, source: 'queue-times'|'mock' }
  - Only needed if proxying through Cloud Function
- Ride completion data already in `rideLogs/{userId}` (used by ParkDetailScreen progress bar)

## Open Questions
- Queue-Times API: pricing model? Rate limits? Park coverage for target parks?
- ID mapping: how to match Queue-Times ride IDs to local COASTER_DATABASE IDs?
- Weather API choice: free tier of OpenWeatherMap vs Apple WeatherKit (free for Apple devs)?
- Steps: is HealthKit integration v1 scope or nice-to-have?
- Should wait times update in real-time (WebSocket) or polling (every N minutes)?
- LIVE badge: show only when Queue-Times data is fresh, or always when API is connected?
- ParkDetail coaster row press: what does CoasterDetailScreen look like? Needs design.
- Guides: all static content or eventually user-contributed?
- Offline: should wait times be cached for offline viewing with "last updated X min ago"?
