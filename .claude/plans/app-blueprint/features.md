# 4. Complete Feature Map

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
