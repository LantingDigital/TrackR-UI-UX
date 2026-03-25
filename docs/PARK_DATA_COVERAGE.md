# Park Data Coverage Report

Generated: 2026-03-24 from ThemeParks.wiki API

## Summary

| Metric | Count |
|--------|-------|
| Destinations | 96 |
| Parks (with entities) | 120 |
| Parks (empty, no data) | 2 |
| Total Attractions | 4,335 |
| Total Restaurants | 2,096 |
| Total Shows | 857 |
| **Total Entities** | **7,288** |

Empty parks (no children from API): Chimelong Birds Park, Chimelong Spaceship

## Data Completeness Per Entity

Every entity from ThemeParks.wiki includes:
- Unique stable GUID (document ID)
- Name
- Entity type (ATTRACTION / RESTAURANT / SHOW)
- GPS coordinates (lat/lng) -- most entities, some null
- Tags (ride type, height requirements, FastPass info, opening dates)

Restaurants have placeholder fields for menu data (filled by Phase 4 Google Maps scraping):
- cuisineType, menuItems, menuHighlights, priceRange, lastMenuUpdate, menuSource -- all initially null

## Top 20 Parks by Entity Count

| Park | Attractions | Restaurants | Shows | Total |
|---|---|---|---|---|
| Kings Island | 74 | 96 | 16 | 186 |
| Canada's Wonderland | 84 | 70 | 4 | 158 |
| Europa-Park | 86 | 0 | 68 | 154 |
| Cedar Point | 70 | 59 | 0 | 129 |
| Six Flags Fiesta Texas | 57 | 53 | 9 | 119 |
| Hong Kong Disneyland Park | 46 | 4 | 65 | 115 |
| Carowinds | 59 | 54 | 1 | 114 |
| Knott's Berry Farm | 36 | 55 | 21 | 112 |
| Six Flags Great America | 47 | 44 | 21 | 112 |
| SeaWorld San Diego | 16 | 20 | 74 | 110 |
| Worlds of Fun | 57 | 53 | 0 | 110 |
| Disneyland Park | 52 | 30 | 24 | 106 |
| Dollywood | 61 | 43 | 0 | 104 |
| Alton Towers | 53 | 34 | 17 | 104 |
| Six Flags New England | 57 | 46 | 0 | 103 |
| Six Flags Over Texas | 60 | 31 | 11 | 102 |
| Kings Dominion | 42 | 44 | 16 | 102 |
| Six Flags Magic Mountain | 40 | 32 | 2 | 74 |
| Magic Kingdom Park | 35 | 21 | 17 | 73 |
| Busch Gardens Williamsburg | 39 | 19 | 28 | 86 |

## Geofence Configuration

Every park gets a circular geofence based on estimated park size:
- **1000m radius**: Disney resort parks, Epic Universe
- **800m radius**: Large regional parks (Cedar Point, SFMM, Kings Island, Busch Gardens, Universal, Europa-Park, Efteling)
- **400m radius**: Water parks (Hurricane Harbor, Soak City, Typhoon Lagoon, etc.)
- **600m radius**: Default for all other parks

Each geofence includes a test mock location (~50m NE of center) for dev testing.

## Schedule/Hours Coverage

ThemeParks.wiki `/entity/{parkId}/schedule` provides operating hours for all parks that report them. Tested IoA: 62 schedule entries covering ~1 month forward, with OPERATING hours and EXTRA_HOURS (early entry).

Daily refresh Cloud Function (`refreshParkHoursScheduled`) runs at 5am ET and pulls schedule data for all parks.

## Wait Times Coverage

See `docs/WAIT_TIMES_COVERAGE.md` for detailed per-park wait times analysis. Summary: ALL 35 Queue-Times parks confirmed available via ThemeParks.wiki, plus 87 additional parks.

## Pipeline Status

| Phase | Status | Notes |
|---|---|---|
| 1. ThemeParks.wiki API Consumer | COMPLETE | All endpoints, rate limiting, batch helpers |
| 2. Populate Firestore | BLOCKED (Firebase auth) | populateParks CF + local script ready |
| 3. Hours + Geofence + Maps | COMPLETE (code) | refreshParkHours CF + geofence utility + maps deep links |
| 4. Google Maps Menu Scraping | NOT STARTED | Needs browser slot work after population |
| 5. Wait Times Coverage | COMPLETE | docs/WAIT_TIMES_COVERAGE.md |
| 6. Validation | NOT STARTED | Needs Firestore data first |
