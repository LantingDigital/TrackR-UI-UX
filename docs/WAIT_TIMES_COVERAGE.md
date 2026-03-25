# Wait Times Coverage — ThemeParks.wiki vs Queue-Times

Generated: 2026-03-24

## Summary

ThemeParks.wiki provides live wait time data for ALL 35 parks currently in Queue-Times mapping, plus 87 additional parks (122 total). Tested 10 parks — all returned live data. Parks that are seasonally closed (e.g., Cedar Point, Hersheypark in late March) return entities with queue fields but 0 operating rides.

**Recommendation: ThemeParks.wiki as PRIMARY, Queue-Times as FALLBACK.**

ThemeParks.wiki advantages over Queue-Times:
- Single API for wait times + entity data + schedules + GPS coordinates
- Stable entity GUIDs (vs Queue-Times numeric IDs that can change)
- Additional queue types: SINGLE_RIDER, RETURN_TIME, PAID_RETURN_TIME (Lightning Lane/Express Pass data)
- Richer status enums: OPERATING, CLOSED, DOWN, REFURBISHMENT (vs Queue-Times simple is_open boolean)
- No API key required, generous 300 req/min rate limit

## Per-Park Coverage Table

| TrackR Slug | Park Name | ThemeParks.wiki ID | Queue-Times ID | TW Wait Times? | Recommended Source |
|---|---|---|---|---|---|
| cedar-point | Cedar Point | c8299e1a-...f8dc | 50 | YES (seasonal) | ThemeParks.wiki |
| kings-island | Kings Island | a0df8d87-...914b | 60 | YES | ThemeParks.wiki |
| knotts-berry-farm | Knott's Berry Farm | 0a6123bb-...0558 | 61 | YES | ThemeParks.wiki |
| canadas-wonderland | Canada's Wonderland | 66f5d97a-...b06d | 58 | YES (seasonal) | ThemeParks.wiki |
| carowinds | Carowinds | 24cdcaa8-...eb18d6 | 59 | YES | ThemeParks.wiki |
| kings-dominion | Kings Dominion | 95162318-...aa0279 | 62 | YES | ThemeParks.wiki |
| dorney-park | Dorney Park | 19d7f29b-...d14ccf | 69 | YES (seasonal) | ThemeParks.wiki |
| worlds-of-fun | Worlds of Fun | bb731eae-...031743 | 63 | YES | ThemeParks.wiki |
| valleyfair | Valleyfair | 1989dca9-...f692b95 | 68 | YES (seasonal) | ThemeParks.wiki |
| michigan-adventure | Michigan's Adventure | e9805d65-...b4784 | 70 | YES (seasonal) | ThemeParks.wiki |
| six-flags-magic-mountain | Six Flags Magic Mountain | c6073ab0-...684bc | 32 | YES | ThemeParks.wiki |
| six-flags-great-adventure | Six Flags Great Adventure | 556f0126-...ed188 | 37 | YES | ThemeParks.wiki |
| six-flags-over-texas | Six Flags Over Texas | 4535960b-...02a9c | 34 | YES | ThemeParks.wiki |
| six-flags-over-georgia | Six Flags Over Georgia | 0c7ab128-...dfc16 | 35 | YES | ThemeParks.wiki |
| six-flags-fiesta-texas | Six Flags Fiesta Texas | 8be1e984-...2e87c | 39 | YES | ThemeParks.wiki |
| six-flags-great-america | Six Flags Great America | 15805a4d-...c1f5b1e | 38 | YES | ThemeParks.wiki |
| six-flags-new-england | Six Flags New England | d553882d-...8aec0 | 43 | YES | ThemeParks.wiki |
| magic-kingdom | Magic Kingdom Park | 75ea578a-...65ef9 | 6 | YES | ThemeParks.wiki |
| epcot | EPCOT | 47f90d2c-...a88b | 5 | YES | ThemeParks.wiki |
| hollywood-studios | Disney's Hollywood Studios | 288747d1-...bad8 | 7 | YES | ThemeParks.wiki |
| animal-kingdom | Disney's Animal Kingdom | 1c84a229-...2c7693 | 8 | YES | ThemeParks.wiki |
| disneyland | Disneyland Park | 7340550b-...d49a66 | 16 | YES | ThemeParks.wiki |
| disney-california-adventure | Disney California Adventure | 832fcd51-...75d843b127c | 17 | YES | ThemeParks.wiki |
| universal-studios-florida | Universal Studios Florida | eb3f4560-...bc57 | 65 | YES | ThemeParks.wiki |
| islands-of-adventure | Universal Islands of Adventure | 267615cc-...a591f | 64 | YES | ThemeParks.wiki |
| epic-universe | Universals Epic Universe | 12dbb85b-...11fc | 334 | YES | ThemeParks.wiki |
| universal-studios-hollywood | Universal Studios | bc4005c5-...6427 | 66 | YES | ThemeParks.wiki |
| seaworld-orlando | SeaWorld Orlando | 27d64dee-...cd946 | 21 | YES | ThemeParks.wiki |
| seaworld-san-diego | SeaWorld San Diego | 75122979-...227c | 20 | YES | ThemeParks.wiki |
| busch-gardens-tampa | Busch Gardens Tampa | fc40c99a-...275c2 | 24 | YES | ThemeParks.wiki |
| busch-gardens-williamsburg | Busch Gardens Williamsburg | 98f634cd-...b84d | 23 | YES | ThemeParks.wiki |
| hersheypark | Hersheypark | 0f044655-...ca787 | 15 | YES (seasonal) | ThemeParks.wiki |
| dollywood | Dollywood | 7502308a-...b3c | 55 | YES | ThemeParks.wiki |
| silver-dollar-city | Silver Dollar City | d21fac4f-...85a6 | 10 | YES | ThemeParks.wiki |
| kennywood | Kennywood | 3dada5aa-...56be | 312 | YES | ThemeParks.wiki |

## Live Test Results (2026-03-24, evening)

| Park | Live Entries | With Wait Times | Operating |
|---|---|---|---|
| Islands of Adventure | 29 | 1 | 9 |
| Magic Kingdom | 61 | 31 | 49 |
| Six Flags Magic Mountain | 42 | 40 | 38 |
| Cedar Point | 69 | 69 | 0 (seasonal) |
| Dollywood | 33 | 2 | 2 |
| Universal Studios Florida | 40 | 11 | 25 |
| Epic Universe | 21 | 11 | 19 |
| Knott's Berry Farm | 61 | 45 | 49 |
| Busch Gardens Tampa | 78 | 25 | 56 |
| Hersheypark | 57 | 0 | 0 (seasonal) |

## Cross-Agent Note for experience-agent

The `proxyWaitTimes` Cloud Function currently uses Queue-Times. It should be updated to:

1. **Check ThemeParks.wiki FIRST** using `/entity/{parkId}/live`
2. **Fall back to Queue-Times** only if ThemeParks.wiki returns no data
3. **Eventually deprecate Queue-Times entirely** if ThemeParks.wiki proves reliable over time

The ThemeParks.wiki entity IDs for each park are in `functions/src/data/themeparksWikiMapping.ts`.

The ThemeParks.wiki live data response includes:
- `queue.STANDBY.waitTime` — equivalent to Queue-Times `wait_time`
- `queue.SINGLE_RIDER.waitTime` — bonus data not in Queue-Times
- `queue.RETURN_TIME` — Lightning Lane / Virtual Queue state
- `queue.PAID_RETURN_TIME` — Express Pass / Individual Lightning Lane with price
- `status` — OPERATING / CLOSED / DOWN / REFURBISHMENT (richer than QT's boolean)

## Parks NOT on Queue-Times but ON ThemeParks.wiki

ThemeParks.wiki covers 87 additional parks not in our current Queue-Times mapping, including:
- All LEGOLAND parks (California, Florida, New York, Billund, Deutschland, Japan, Korea, Windsor)
- Europa-Park, Efteling, PortAventura, Phantasialand, Gardaland
- Tokyo Disney Resort (Disneyland + DisneySea)
- Shanghai Disneyland, Hong Kong Disneyland
- Universal Studios Beijing
- Disneyland Paris (both parks)
- All remaining Six Flags parks + Hurricane Harbor water parks
- Additional Cedar Fair parks (Soak City, Shores)
- Alton Towers, Thorpe Park, Chessington (UK Merlin parks)
- And more

Full list available via ThemeParks.wiki `/destinations` endpoint.
