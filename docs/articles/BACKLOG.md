# Article Backlog

Topic pipeline for TrackR's in-app news feed. Goal: 15-20 articles ready before launch.

## Status Key
- PITCHED = awaiting Caleb's approval
- APPROVED = greenlit, ready to research deep + write
- RESEARCHED = deep research done, ready to write
- DRAFTED = written, awaiting Caleb's review
- APPROVED-FINAL = Caleb approved, ready to publish
- PUBLISHED = live in Firestore

## Queue

### Pitched (awaiting Caleb's pick)

| # | Title | Type | Status | Sources Found | Notes |
|---|-------|------|--------|---------------|-------|
| 1 | SoCal's Coaster Arms Race (SFMM + Knott's + Universal + Olympics) | TOPIC | IN FIRESTORE (draft) | 12 (Screamscape x2, Attractions Mag, Inside Universal, Deadline, LA Biz Journal, Sports Examiner, Yahoo, CoasterForce, Reddit, Vekoma, Instagram) | Firestore ID: `2026-03-18-socal-coaster-arms-race`. Humanized. Awaiting Caleb review + hero art. |
| 2 | Tormenta Rampaging Run: World's First Giga Dive Coaster | NEWS | IN FIRESTORE (draft) | 12 (Six Flags, People x2, CBS News, blooloop x2, Arlington TX, Guide to SFoT, Coasterpedia, B&M List, Reddit x2) | Firestore ID: `2026-03-18-tormenta-rampaging-run`. Humanized. Awaiting Caleb review + hero art. |
| 3 | NightFlight Expedition: Dollywood's $50M Hybrid | NEWS | IN FIRESTORE (draft) | 15 (Dollywood press x3, Knoxville News Sentinel, Amusement Today, blooloop, Herschend Corp, Coaster101, Idaho News/USA Today, YouTube x4, Reddit, Facebook) | Firestore ID: `2026-03-18-nightflight-expedition`. Humanized. Awaiting Caleb review + hero art. |
| 4 | RMC Goes Small: Family Kingdom Raptor + RMC's Future | TOPIC | IN FIRESTORE (draft) | 15 (Coaster101, Coasterpedia, ParkFans, CoasterForce, YouTube x4, Reddit x2, Instagram, Facebook x3, Attractions Mag) | Firestore ID: `2026-03-18-rmc-goes-small`. Humanized. Awaiting Caleb review + hero art. |

### Future Ideas (not yet pitched)

| Topic | Type | Why it's article-worthy | Discovery source |
|-------|------|------------------------|-----------------|
| Rock 'N' Roller Coaster Muppets retheme | NEWS | Iconic ride getting IP swap, Memorial Day 2026. Industry trend of refreshing vs rebuilding. | Perplexity research |
| Epic Universe: The First Month Report Card | NEWS/TOPIC | How the park is actually operating, early entry shuffles, Stardust Racers delays, crowd management. Trip planning angle. | Inside the Magic, Instagram |
| Six Flags Great Adventure mystery coaster (post-Kingda Ka) | NEWS | Purple track going vertical, confirmed record-breaker, name TBA. Most anticipated 2027 project. | People, Screamscape |
| Fast & Furious: Hollywood Drift (Universal) | NEWS | Replacing Rip Ride Rockit in Florida + new in Hollywood. Major IP coaster. | Disney Fanatic, Universal press |
| "What Is a Dive Coaster?" explainer | TOPIC | Evergreen. Pairs perfectly with Tormenta article. History from Oblivion to present. | Enthusiast knowledge + RCDB |
| 2026 Season Preview: Every New Coaster Opening This Year | TOPIC | Comprehensive roundup. Updated List format. | Coaster101 master list |
| Falcon's Flight (Six Flags Qiddiya) | NEWS | Will be tallest, fastest, longest coaster on Earth. Testing soon. | Screamscape, multiple outlets |
| The MonteZOOMa Story: Knott's Long Road Back | TOPIC | History of Montezooma's Revenge, why it closed, what MonteZOOMa is. Nostalgia + new. | Screamscape, Knott's history |

## Research Protocol

1. **Discover**: Broad Perplexity scan for trending topics (weekly)
2. **Identify**: Pick the story from discovery sources (Screamscape, Reddit, Coaster101, park press)
3. **Exhaust**: Deep Perplexity search on the specific topic. Find EVERY article, press release, video, Reddit thread. Cross-reference facts. Get details only one outlet reported.
4. **Write**: Synthesize into one article citing all sources with clickable links
5. **No single-source articles. Ever.**

## Content Calendar Target
- Pre-launch: 2-3 articles per week
- Mix: ~60% NEWS, ~40% TOPIC (evergreen)
- Goal: 15-20 articles before TestFlight beta

## Firestore State (as of 2026-03-18)

All articles live in `articles/{docId}` collection in Firebase project `trackr-coaster-app`.

### Published (status: published)
| Doc ID | Title | Category |
|--------|-------|----------|
| article-weekly-digest-march-10-16 | This Week in Coasters: March 10-16, 2026 | news-digest |
| article-sf-cf-merger | Six Flags and Cedar Fair Merger | industry |
| article-cedar-point-2025 | Cedar Point Record-Breaking Coaster | news |
| article-hidden-gems | Top 10 Hidden Gems | ride-review |
| article-rmc-conversion | New RMC Conversion | news |

### Drafts (status: draft, awaiting Caleb review)
| Doc ID | Title | Category |
|--------|-------|----------|
| 2026-03-18-tormenta-rampaging-run | Tormenta Rampaging Run | New Rides |
| 2026-03-18-socal-coaster-arms-race | SoCal's Coaster Arms Race | Industry |
| 2026-03-18-nightflight-expedition | NightFlight Expedition | New Rides |
| 2026-03-18-rmc-goes-small | RMC Goes Small | Industry |

### Pending
- All 9 articles have `bannerImageUrl: ""` -- hero art briefs sent to nanobanana-2 agent, not yet delivered
- Tag false positives: RMC article has "B&M" tag (passing mention), NightFlight has "Universal" tag (Hagrid comparison). Clean up in Firestore after review.
- 8 more topics in Future Ideas queue awaiting Caleb's approval for next batch

## Tools
- Publish script: `scripts/publish-articles.js` (reads markdown from `docs/articles/2026-*.md`, pushes to Firestore via REST API)
- Requires valid Firebase CLI auth (`firebase login --reauth` if expired)
- Node.js `https` module may timeout on Google OAuth -- use curl fallback if needed (worked 2026-03-18)
- Humanizer skill: loaded via `/humanize`, catches AI patterns (rule of three, "seamlessly", title case, significance inflation, -ing phrases, copula avoidance)
