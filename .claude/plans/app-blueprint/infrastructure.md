# 6. Data & Infrastructure Strategy

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

# 7. AI Strategy

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
