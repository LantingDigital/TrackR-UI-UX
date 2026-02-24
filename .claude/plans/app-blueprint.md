# TrackR — Complete App Blueprint

> **Created**: February 21, 2026
> **Status**: Active — Source of Truth
> **Replaces**: `v1-mvp-roadmap.md` (Phase 0-7 structure is retired)

---

## 1. Vision & Identity

**TrackR is the definitive theme park companion app.**

It's not just a credit logger — it's the app every park-goer opens before, during, and after their visit. Casual visitors use it as a park day utility. Enthusiasts use it to track, rate, and analyze every ride. The community makes it a daily destination even when you're nowhere near a park.

### Core Pillars

| Pillar | What It Means |
|--------|---------------|
| **Premium UX** | Every interaction feels polished. Spring physics, morph animations, haptic feedback. The app *feels* expensive. |
| **All-in-One Utility** | Wait times, maps, food, wallet, navigation — all in one app. No switching between 5 different park apps. |
| **Intelligent Rating System** | Weighted criteria auto-generate personal rankings. You don't decide if Ride A beats Ride B — the math does. |
| **Community** | The social layer is a core pillar, not an afterthought. Community hub, live features, collaborative guides. |
| **AI-Enhanced** | Claude for content and analysis, custom ML for force profiles, smart algorithms for recommendations. |

### What Makes TrackR Different

1. **The rating system**: Customizable weighted criteria that automatically rank your rides. No manual ordering — rate each ride honestly and watch your personal Top 50 sort itself.
2. **All-in-one park companion**: Wait times + maps + wallet + food search + logging in ONE app. Nobody else combines all of this.
3. **Premium feel**: Hero morph animations, spring physics on every touch, haptic feedback everywhere. No other coaster app feels this good.

---

## 2. User Experience Modes

TrackR uses a **single adaptive UI** with two modes: **Guest** and **Enthusiast**. Same screens, different emphasis.

### Onboarding

First launch presents a friendly choice:
- **"I'm visiting a park"** → Guest Mode (default)
- **"I track my rides"** → Enthusiast Mode

This sets the default mode. It's always changeable in Settings.

### Guest Mode (Park Day Utility)

Designed for casual park visitors who want a better park day.

**Home screen emphasis**: Wait times, park map quick-access, food search, wallet
**Visible but secondary**: News feed, logging prompt
**Hidden until discovered**: Credit count, detailed stats, ride forces profile

**Guest cares about:**
- What ride should I go on next? (wait times)
- Where's the nearest corn dog? (food search across all nearby parks)
- Let me pull up my ticket (wallet)
- How do I get to [ride]? (navigation)
- Where did I park? (car locator)

### Enthusiast Mode (Full Experience)

Designed for coaster enthusiasts who log, rate, and analyze.

**Home screen emphasis**: Log button, credit count, news feed, action pills
**All features visible**: Ratings, statistics, ride comparison, force profiles
**Community features**: Prominent hub access, friend activity

**Enthusiast cares about:**
- Log this ride FAST (< 10 seconds)
- What's my weighted score for [coaster]?
- How does Ride A compare to Ride B?
- What's my credit count?
- What are other enthusiasts saying?

### Conversion (Guest → Enthusiast)

No hard gates. Soft conversion moments:
- Guest taps a coaster's stats → inline nudge: "Want to rate this ride? Switch to Enthusiast Mode"
- After a park visit → notification: "You visited 8 rides today. Want to log them?"
- Always accessible via Settings toggle

### Architecture Impact

- ONE set of screen components, not two parallel apps
- Mode stored in user preferences (context/store)
- Conditional rendering based on mode for layout priority and feature visibility
- Components accept a `mode` prop or read from context where needed

---

## 3. Navigation Structure

### 5-Tab Layout (unchanged)

```
Home | Discover | Play | Activity | Profile
```

| Tab | Guest Emphasis | Enthusiast Emphasis |
|-----|---------------|---------------------|
| **Home** | Wait times, park map, food search, pinned parks | News feed, log/search/scan action buttons, credit count |
| **Discover** | Browse parks, food & drink, park guides | Coaster encyclopedia, rankings, ride analysis |
| **Play** | In-line entertainment, daily trivia | Game center, collectible cards, challenges |
| **Activity** | Recent visits (simple list) | Pending ratings, ride history, credit milestones |
| **Profile** | Wallet, car locator, settings | Stats dashboard, shareable card, criteria setup, wallet |

### Modal / Overlay Pattern

All modals continue as in-screen overlays using the MorphingPill hero morph system. No stack navigators for modals.

Stack navigation may be added for:
- Discover → Park Detail → Coaster Detail (push navigation)
- Community → Post Detail → Comments (push navigation)
- Profile → Sub-screens (wallet management, criteria setup, stats detail)

---

## 4. Complete Feature Map

Every feature TrackR will include, organized by category.

### 4.1 Core App & Utility

| Feature | Description | Mode | Phase |
|---------|-------------|------|-------|
| **Guest/Enthusiast Mode Toggle** | Adaptive UI with onboarding selection and settings toggle | Both | 2 |
| **AR Park Navigation** | Hold up camera, see AR arrows directing you to a ride. Uses ARKit + Google Maps/Street View API for indoor positioning. AI recognizes landmarks for orientation. | Both | 8 |
| **Offline Mode** | Download essential park data (maps, menus, ride info) for offline access. Critical for parks with poor cell service. | Both | 3 |
| **Car Locator** | Drop a GPS pin for vehicle location. Shows walking directions back to car. | Both | 3 |
| **Digital Wallet** | Secure organizer for photos/screenshots of tickets, passes, reservations. Not payments — document storage with QR/barcode display and brightness boost. | Both | 2 |
| **Personalized News Feed** | Aggregated news from park sources. Customizable with "pinned" parks for priority content. | Both | 3 |
| **Customizable "My Park" Home Screen** | Optional personalized dashboard for a favorite park — shows that park's wait times, events, weather, food at a glance. Replaces default Home for users who have a "home park." | Both | 7 |
| **Integrated Accessibility Info** | Dedicated, filterable category for ride accessibility information (height requirements, transfer types, sensory warnings, companion policies). | Both | 5 |

### 4.2 Logging, Data & Analysis

| Feature | Description | Mode | Phase |
|---------|-------------|------|-------|
| **Quick Log** | Log a ride in < 10 seconds. Tap Log → search coaster → confirm. Stored as pending rating. | Enthusiast | 1 |
| **Weighted Rating System** | Customizable criteria (Airtime, Intensity, Smoothness, Theming, Pacing + custom). Each criterion weighted. Produces a 0-100 weighted score. Personal rankings auto-generated. | Enthusiast | 1 |
| **Seat & Row Logging** | Optional field to record which seat/row on each ride. Tracked over time for analysis. | Enthusiast | 1 |
| **Credit Count & Milestones** | Track unique coasters ridden. Milestone celebrations (50, 100, 200, etc.). | Enthusiast | 1 |
| **RCDB Integration** | Pulls coaster data (stats, images, manufacturer, type) from Roller Coaster DataBase. Powers search, Discover, and ride details. | Both | 3 |
| **Personal Statistics Dashboard** | Visualizes ride history — top coasters, parks visited, ride count charts, criteria breakdowns, season-over-season trends. | Enthusiast | 6 |
| **Ride Comparison Tool** | Side-by-side comparison of two or more coasters. Claude-powered narrative analysis of differences. Stat comparison table. | Enthusiast | 8 |
| **"My Ride Forces" Profile** | Analyzes a user's ratings to profile their G-force preferences (airtime junkie vs intensity seeker). Recommends similar coasters they haven't ridden. Custom ML model long-term. | Enthusiast | 8 |
| **Categorized Attraction Log** | Rides automatically categorized by type (steel, wood, hybrid, flat ride, water ride, etc.) from RCDB data. | Enthusiast | 3 |

### 4.3 Community & Social

| Feature | Description | Mode | Phase |
|---------|-------------|------|-------|
| **Community Hub** | Dedicated moderated social space. Posts, comments, media sharing. Topic-based channels (park-specific, general discussion, news). | Both | 4 |
| **Community Polls** | Users can add simple polls to their posts. Fun engagement tool. | Both | 4 |
| **Collaborative Park Guides** | Wiki-style guides maintained by trusted community members. Park tips, ride recommendations, food reviews, local secrets. Community-sourced, editorially curated. | Both | 4 |
| **"Friends in the Park" Live Map** | Opt-in live location sharing with intentional friends (must mutually accept). See where friends are on the park map. Privacy-first — sharing is time-limited and per-session. | Enthusiast | 5 |
| **Social Discovery & Ride "Twinning"** | Find nearby users with similar ride preferences. Algorithm generates a "Compatibility Score" based on overlapping ratings. Opt-in only. | Enthusiast | 7 |
| **Meet-Up Planning Tool** | Create and RSVP to in-park meetups within the Community Hub. Specify time, location (mapped), and max group size. | Both | 5 |
| **Photo Location Spotter** | Map layer highlighting community-vetted photo spots in each park. Users can submit and upvote locations. | Both | 5 |

### 4.4 Engagement & Content

| Feature | Description | Mode | Phase |
|---------|-------------|------|-------|
| **Game Center** | Suite of games designed for line entertainment. Hub in Play tab. | Both | 6 |
| **Daily Trivia** | Daily coaster/park trivia question. Streaks tracked. | Both | 6 |
| **Themed Trivia Packs** | Unlockable trivia packs by park, manufacturer, era, etc. | Both | 6 |
| **"Guess the Coaster"** | Image/description clue game. Identify the coaster from hints. | Both | 6 |
| **"Stat Sort"** | Sort/rank coasters by various stats. Quick puzzle game. | Both | 6 |
| **Collectible Cards** | Coaster cards with beautiful designs. Earned by logging rides. One-time GPS verification required for fairness. Orderable as physical prints from a manufacturer. | Enthusiast | 6 |
| **Shareable Stat Cards** | Beautiful, stylized cards showing personal stats. Share to Instagram, Twitter, etc. Multiple templates. | Enthusiast | 6 |
| **"On This Day" Memories** | Surfaces ride logs from this date in previous years. Notification + Home screen card. | Enthusiast | 6 |
| **Element-by-Element Ride Analysis** | Claude-powered detailed narrative breakdown of major attractions (elements, pacing, forces at each point). | Enthusiast | 8 |
| **Stylized Trip Reports** | Auto-generates visually stunning trip report summaries from a day's logs. Shareable to social media. | Enthusiast | 7 |
| **App-Wide Easter Eggs** | Hidden jokes, references, and surprises for the enthusiast community. Discovered through usage. | Both | 9 |

### 4.5 Planning & Park Day

| Feature | Description | Mode | Phase |
|---------|-------------|------|-------|
| **Wait Time Tracker** | Real-time wait times pulled from Queue-Times.com / ThemeParks.wiki API. Displayed on park map and in list view. | Both | 3 |
| **Wait Time Forecaster** | ML-predicted wait times based on historical data, weather, day of week, events. "Best time to ride" suggestions. | Both | 8 |
| **Personalized Itinerary Planner** | Creates optimized park day schedules. Factors in wait times, ride priority, walking distance, food breaks. | Both | 7 |
| **Food & Beverage Database** | Searchable database of all park food locations. Menus, dietary filters (vegan, gluten-free, allergy-safe), photos. Scrape public menus + community reviews. Users can search "corn dog" and find every location across nearby parks. | Both | 3 |
| **Historical Weather Planner** | API-driven tool showing typical historical weather for planned travel dates. Helps plan what to wear/bring. | Both | 7 |
| **Souvenir & Gift Shop Database** | Crowd-sourced guide to park gift shops and their exclusive merchandise. | Both | 7 |

### 4.6 Commerce & Monetization

| Feature | Description | Mode | Phase |
|---------|-------------|------|-------|
| **Pro Subscription** | Premium tier enhancing the experience. Ad-free, full data export, unlimited Game Center, advanced stats, custom criteria weights, offline mode, shareable content. Price TBD (subscription + marketplace cut model). Possibly tiered (Free / Plus / Pro). | Both | 9 |
| **Creator Marketplace** | E-commerce platform for exclusive fan-designed merchandise. TrackR takes a percentage on sales. Curated quality. | Both | 9 |
| **Physical Card Ordering** | Order physical prints of your collectible coaster cards from a partnered manufacturer. | Enthusiast | 9 |

---

## 5. Phased Roadmap

Completely rebuilt. Quality over speed — no hard deadline.

### Phase 1: Core Experience (IN PROGRESS)

**Goal**: The logging + rating loop is flawless.

| Task | Status |
|------|--------|
| Tab navigation with React Navigation v7 | DONE |
| Hero morph animation system (MorphingPill) | DONE |
| Log morph → coaster search → LogConfirmationCard | DONE |
| Quick Log path (log + pending) | Needs polish |
| Rate Now path (log + RatingModal) | Needs connection |
| Weighted rating system with custom criteria | DONE |
| Success states for both paths | Not started |
| Pending logs appear in Activity tab | Not started |
| Credit count tracking + milestone events | Partial |
| Seat/row logging option | Not started |
| Animation polish (60fps on device) | Ongoing |
| Reanimated migration (HomeScreen Batch B-D) | Remaining |

**Deliverable**: An enthusiast can log a ride in < 10 seconds, rate it with weighted criteria, see their personal rankings auto-update, and find pending ratings in Activity.

---

### Phase 2: Digital Wallet & Mode System

**Goal**: The Guest experience has a reason to exist. Wallet works.

| Task | Description |
|------|-------------|
| Rebuild wallet from scratch | Apple Wallet-style card stack for tickets/passes/reservations |
| Document storage | Photo/screenshot capture and organization for park documents |
| QR/barcode display | Brightness boost, gate mode for quick scan |
| Scan button → wallet quick-use | MorphingPill opens wallet overlay from Home |
| Guest/Enthusiast mode system | Context provider, onboarding flow, mode-adaptive layouts |
| Onboarding screens | First-launch experience: mode selection, optional park selection |
| User accounts & auth | Firebase Auth (email, Google, Apple Sign-In) |
| Basic cloud sync | Firestore for user data persistence across devices |

**Deliverable**: A Guest downloads TrackR, picks their home park, stores their tickets, and has a reason to keep the app installed.

---

### Phase 3: Park Data & Discovery

**Goal**: Real park data powers the app. RCDB, wait times, food, and offline access.

| Task | Description |
|------|-------------|
| RCDB integration | Coaster data import: stats, images, type, manufacturer, park association |
| Queue-Times API | Real-time wait times from third-party API |
| Food & beverage database | Scrape public menus, build searchable database with dietary filters |
| Discover screen rebuild | Encyclopedia: browse parks, coasters, park guides. Search + filter |
| Park detail view | Push navigation to park page (coaster list, map, info, food) |
| Coaster detail view | Stats, photos, community ratings, your rating, ride history |
| Categorized attraction log | Auto-categorize logged rides by type from RCDB data |
| News feed with pinned parks | Aggregated news, user pins favorite parks for priority content |
| Offline mode | Download park data for offline access (maps, menus, ride info) |
| Car locator | GPS pin drop + walking directions |
| Wait time display | List view + map overlay for current wait times |

**Deliverable**: Open the app, see live wait times, search for food, browse the coaster encyclopedia, and use it all offline.

---

### Phase 4: Community Foundation

**Goal**: Users can talk to each other. The social layer launches.

| Task | Description |
|------|-------------|
| Community hub UI | Feed of posts, topic channels (park-specific + general) |
| Post creation | Text, images, links. Rich text editor. |
| Comments & replies | Threaded comments on posts |
| Community polls | Attach simple polls to posts |
| Collaborative park guides | Wiki-style guide editor for trusted contributors |
| Moderation system | Report, flag, hide, ban. Automated content filtering. |
| User profiles (public) | Display name, avatar, credit count, top coasters, recent activity |
| Follow / friend system | Mutual friend requests + follow for public profiles |
| Notification system | Push notifications for replies, mentions, friend requests |

**Deliverable**: A moderated community space where users post, comment, poll, and build park guides together.

---

### Phase 5: Social & Live Features

**Goal**: Real-time social features that make park days better with friends.

| Task | Description |
|------|-------------|
| "Friends in the Park" live map | Opt-in, time-limited live location sharing on park map |
| Meet-up planning tool | Create/RSVP to in-park meetups with time, mapped location, group size |
| Photo location spotter | Map layer of community-vetted photo spots. Submit + upvote. |
| Accessibility information | Filterable database: height requirements, transfer types, sensory warnings, companion policies |
| Enhanced friend activity feed | See what friends are logging, rating, visiting in real-time |

**Deliverable**: Plan a meetup, share your location with friends at the park, find the best photo spots.

---

### Phase 6: Entertainment & Engagement

**Goal**: Play tab comes alive. Daily engagement hooks.

| Task | Description |
|------|-------------|
| Game center hub | Play tab redesign with game tiles, daily challenge, streaks |
| Daily trivia | Daily coaster/park question with streak tracking |
| Themed trivia packs | Unlockable packs (by park, manufacturer, era) |
| "Guess the Coaster" | Image/clue game to identify coasters |
| "Stat Sort" | Quick sorting/ranking puzzle game |
| Collectible cards | Earned by logging rides. GPS verification for fairness. Beautiful card designs. |
| Shareable stat cards | Multiple templates, social media export |
| "On This Day" memories | Surface historical logs, notification + Home card |
| Personal statistics dashboard | Charts, trends, breakdowns, top lists in Profile |
| Activity screen polish | History view, milestone celebrations (50, 100, 200 credits) |

**Deliverable**: Open the app every day for trivia, collect cards by visiting parks, share beautiful stats.

---

### Phase 7: Planning & Personalization

**Goal**: TrackR helps you plan the perfect park day.

| Task | Description |
|------|-------------|
| Itinerary planner | Optimized park day schedules based on wait times, priorities, walking distance |
| Historical weather planner | API-driven typical weather for planned dates |
| Souvenir & gift shop database | Crowd-sourced shop + merchandise guide |
| Stylized trip reports | Auto-generated shareable trip summaries from daily logs |
| Social discovery & "twinning" | Find users with similar tastes, compatibility score |
| "My Park" customizable home | Personalized dashboard for home park (wait times, events, weather, food) |

**Deliverable**: Plan a trip, get weather info, know what shops to hit, and share a gorgeous trip report after.

---

### Phase 8: AI & Advanced Analysis

**Goal**: Intelligence layer that no other coaster app has.

| Task | Description |
|------|-------------|
| Ride comparison tool | Claude-powered side-by-side comparison with narrative analysis |
| "My Ride Forces" profile | Analyze rating patterns to profile force preferences. Recommend similar unridden coasters. |
| Element-by-element analysis | Claude-generated detailed breakdowns of major attractions |
| AR park navigation | Camera-based AR walking directions using ARKit + Maps API. AI landmark recognition for orientation. |
| Wait time forecaster | ML model predicting wait times from historical data, weather, crowds |

**Deliverable**: AI that understands your ride preferences and guides you through the park.

---

### Phase 9: Commerce & Polish

**Goal**: Monetization is live. App is store-ready.

| Task | Description |
|------|-------------|
| Pro subscription | Implement subscription tiers (Free / Pro, possibly Plus). IAP via App Store. |
| Creator marketplace | E-commerce platform for fan merch. Curation, payments, TrackR cut. |
| Physical card ordering | Integration with manufacturer for printing/shipping collectible cards |
| Easter eggs | Hidden references and surprises throughout the app |
| Performance audit | 60fps on all animations, memory profiling, startup time |
| Error handling | Comprehensive error states, retry logic, graceful degradation |
| Onboarding polish | Refined first-run experience |
| App icon & splash | Final branding assets |
| Store listing | Screenshots, description, keywords, preview video |

**Deliverable**: TrackR is on the App Store.

---

## 6. Data & Infrastructure Strategy

### Backend: Firebase

Firebase is already in the project and provides everything needed:

| Service | Use |
|---------|-----|
| **Firebase Auth** | Email, Google, Apple Sign-In. User accounts. |
| **Cloud Firestore** | User data, ride logs, community posts, guides, friend lists |
| **Cloud Functions** | Server-side logic: moderation, notifications, marketplace transactions, AI API calls |
| **Cloud Storage** | User photos, card images, guide media |
| **Firebase Cloud Messaging** | Push notifications |
| **Firebase Analytics** | Usage tracking, funnel analysis |

### Data Sources

| Data | Source | Strategy |
|------|--------|----------|
| **Coaster database** | RCDB (Roller Coaster DataBase) | API integration or licensed data import. Powers search, Discover, ride details. |
| **Wait times** | Queue-Times.com / ThemeParks.wiki API | Real-time third-party data. Community-reported as supplement long-term. |
| **Food & beverage** | Public menu scraping + community reviews | Scrape park websites for menus. Community adds reviews, photos, dietary info. |
| **Park maps** | Park-provided + community-enhanced | Official maps as base layer. Community adds POIs (photo spots, food, shops). |
| **Weather** | Weather API (OpenWeatherMap or similar) | Historical averages for planning. Current conditions for park day. |
| **Park guides** | Community-authored | Wiki-style system. Trusted contributors create and maintain. |
| **Souvenir/shops** | Community crowd-sourced | Users submit shop info, merch sightings. |

### Offline Strategy

- Essential data cached locally: park maps, ride info, user's logs and ratings
- Downloaded on-demand per park: menus, guide content, accessibility info
- Syncs when connectivity returns
- AsyncStorage or SQLite for local persistence (migrate from current in-memory store)

---

## 7. AI Strategy

Three tiers of intelligence:

### Tier 1: Smart Algorithms (No AI Cost)
- Weighted score calculation
- Personal ranking auto-generation
- Wait time-based itinerary optimization
- Ride recommendation based on rating similarity
- Compatibility score between users

### Tier 2: Claude API (Per-Call Cost)
- **Haiku** — Lightweight tasks: search query understanding, content classification, simple recommendations
- **Sonnet** — Ride comparison narratives, element-by-element analysis, trip report generation
- **Opus** — Complex analysis, force profile generation, personalized long-form content

### Tier 3: Custom ML (Long-Term Investment)
- Wait time prediction model (trained on historical data)
- "My Ride Forces" preference profiling
- AR landmark recognition for park navigation
- Coaster recommendation engine

### AI Integration Points

| Feature | Model | Trigger |
|---------|-------|---------|
| Ride comparison | Sonnet | User compares 2+ rides |
| Element analysis | Sonnet | User views detailed ride breakdown |
| Trip report | Sonnet | User generates shareable trip summary |
| Force profile | Custom ML + Sonnet | User has 20+ rated coasters |
| Search understanding | Haiku | Every search query (low cost) |
| Content moderation | Haiku | Every community post/comment |
| AR navigation | Custom ML (ARKit) | User activates AR mode |
| Wait time prediction | Custom ML | Background updates per park |

---

## 8. Monetization Framework

**Defer detailed pricing until closer to launch.** Framework established:

### Revenue Streams

1. **Pro Subscription** (primary)
   - Ad-free experience
   - Full data export
   - Unlimited Game Center access
   - Advanced statistics & charts
   - Custom criteria weights (unlimited)
   - Offline mode
   - Shareable content (stat cards, trip reports)
   - AI-powered features (ride comparison, force profile)
   - Possibly tiered: Free / Plus ($9.99/yr?) / Pro ($29.99/yr?)

2. **Creator Marketplace Cut** (secondary)
   - TrackR takes a percentage on fan-designed merchandise sales
   - Curated quality control — not an open marketplace

3. **Physical Card Sales** (supplementary)
   - Users order physical prints of collectible cards
   - Manufactured by partnered printer, TrackR takes margin

### Free Tier (Must Be Generous)

The free tier must be good enough that people WANT to use the app daily:
- Full logging and rating (core loop is free)
- Wait times and park maps
- Food search
- Wallet (document storage)
- Community hub (read + post)
- Basic stats
- Limited game plays per day
- 5 default rating criteria

### What Pro Unlocks

- Unlimited game plays
- AI-powered features
- Shareable content generation
- Advanced stats and charts
- Custom criteria beyond defaults
- Full data export
- Ad-free
- Offline mode

---

## 9. Current State Assessment

### What Exists & Works (as of Feb 2026)

| Component | Status | Notes |
|-----------|--------|-------|
| React Navigation v7 (tabs + fade) | DONE | Migrated from v6 |
| Custom AnimatedTabBar | DONE | Hide/show, badge, reset |
| Hero morph system (MorphingPill) | DONE | Bounce arc, content reveal |
| MorphingActionButton (pill ↔ circle) | DONE | Scroll-driven morphing |
| SearchModal (inside morph) | DONE | Input, debounce, section cards |
| LogModal (inside morph) | DONE | Coaster search for logging |
| LogConfirmationCard | DONE | Quick Log / Rate Now UI |
| RatingModal | DONE | Collapsing header, custom sliders |
| CriteriaSetupScreen | DONE | Criteria customization |
| rideLogStore | DONE | Module-level store with subscriptions |
| useSpringPress | DONE | Spring press feedback (Reanimated) |
| useMorphAnimation | DONE | Morph animation hook (Reanimated) |
| NewsCard / BaseCard | DONE | Feed cards with press feedback |
| RotatingPlaceholder | DONE | Animated search hints |
| SkeletonLoader | DONE | Shimmer loading states |
| Design system (theme tokens) | DONE | Colors, spacing, radius, typography, shadows |

### What Needs Work

| Area | Status | Action |
|------|--------|--------|
| Quick Log → success state | Not connected | Phase 1 |
| Rate Now → RatingModal connection | Not connected | Phase 1 |
| HomeScreen Reanimated migration (Batch B-D) | Partial | Phase 1 |
| Activity screen (pending inbox) | Placeholder | Phase 1 |
| Wallet system | BROKEN | Scrap and rebuild in Phase 2 |
| Discover screen | Placeholder | Rebuild in Phase 3 |
| Play screen | Placeholder | Build in Phase 6 |
| Profile screen | Basic | Expand in Phase 6 |

### Architecture Health

- **HomeScreen.tsx**: ~3298 lines. Needs refactoring — morph logic should be further extracted.
- **Reanimated migration**: ~70% complete. HomeScreen log morph, scan, and button modal values still use legacy Animated API.
- **Data**: All mock data currently. No backend integration.
- **Persistence**: In-memory only. Resets on app restart.

---

## 10. Design Principles

### Animation
- ALL animations use react-native-reanimated (never legacy Animated)
- Spring physics on all morphs and transitions
- 60fps target on physical device
- Haptic feedback on every user-initiated action
- See `.claude/animation/system.md` for spring presets and timing tokens

### Visual
- Light mode, minimal aesthetic
- Accent color: `#CF6769` (warm coral)
- Page background: `#F7F7F7`
- Cards: white with subtle shadow
- Typography: clean hierarchy (10-36pt range)
- See `.claude/design/system.md` for full design tokens

### Component Philosophy
- **Build once, reuse everywhere**: Perfect the foundational components (MorphingPill, BaseCard, useSpringPress, RatingModal) so they can be reused across the entire app with just dynamic value/shape adjustments.
- **Prefer in-screen overlays** over navigation transitions for modal experiences
- **Progressive complexity**: Simple by default, powerful when needed

---

## Appendix: Feature Cross-Reference

Where each major feature is used across tabs:

| Feature | Home | Discover | Play | Activity | Profile |
|---------|------|----------|------|----------|---------|
| Log morph | Origin | - | - | - | - |
| Search morph | Origin | Search bar | - | - | - |
| Wallet | Scan button | - | - | - | Management |
| Wait times | Quick view | Park detail | - | - | - |
| Food search | Quick access | Park detail | - | - | - |
| Community hub | Feed card | Park discussions | - | - | - |
| Rating system | Via log flow | Coaster detail | - | Rate pending | Criteria setup |
| Game center | - | - | All games | - | - |
| Stats | Credit count | - | - | History | Dashboard |
| Park map | Quick access | Park detail | - | - | - |
| AR navigation | - | Park detail | - | - | - |
| Trading cards | - | - | Collection | - | - |

---

*This blueprint is the source of truth for TrackR's vision and roadmap. Individual feature specs live in `.claude/features/`. Design system in `.claude/design/`. Animation conventions in `.claude/animation/`.*
