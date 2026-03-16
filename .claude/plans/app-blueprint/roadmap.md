# 5. Phased Roadmap

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
