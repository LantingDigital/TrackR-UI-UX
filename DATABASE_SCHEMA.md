# TrackR Database Schema v1

## Firestore Collection Architecture

```
firestore/
├── coasters/{coasterId}              # Lean document — stats, classification, search
│   └── content/wiki                  # Subcollection: full Wikipedia article text
├── parks/{parkId}                    # Every park that has coasters
│   └── content/wiki                  # Subcollection: full Wikipedia article text
└── metadata/
    └── geography                     # Single doc: browsable country/region index
```

Four collections (two are subcollections). Flat, queryable, scalable.

### Why the subcollection split?

Firestore charges per document read and always loads the **full document**. A coaster's
stats are ~1-2KB. A full Wikipedia article is 5-30KB. If the full article lived in the
main document, every list scroll, every search result, every Coastle game would download
10-20x more data than needed.

The `content/wiki` subcollection is only fetched when someone taps into a coaster detail
view or asks the AI a question. This keeps list views fast and cheap, while still having
the full knowledge base available for deep features.

---

## `coasters/{coasterId}`

The core document. One per coaster. Optimized for both display and search.

```typescript
interface Coaster {
  // ── Identity ──────────────────────────────────────────
  id: string;                      // Firestore doc ID (slug: "steel-vengeance")
  name: string;                    // "Steel Vengeance"
  formerNames: string[];           // ["Mean Streak"] — important for search & history

  // ── Location (denormalized from park for fast queries) ──
  parkId: string;                  // FK → parks collection
  parkName: string;                // "Cedar Point"
  country: string;                 // ISO 3166-1 alpha-2: "US"
  countryName: string;             // "United States"
  region: string;                  // "Ohio" (state, province, prefecture, etc.)
  continent: string;               // "North America"

  // ── Core Stats (imperial + metric, both stored at ingest) ──
  heightFt: number | null;
  heightM: number | null;
  speedMph: number | null;
  speedKmh: number | null;
  lengthFt: number | null;
  lengthM: number | null;
  dropFt: number | null;
  dropM: number | null;
  inversions: number;              // 0 if none
  gForce: number | null;           // Max G-force (e.g., 4.5)
  duration: number | null;         // Ride duration in seconds

  // ── Classification ────────────────────────────────────
  material: "Wood" | "Steel" | "Hybrid";
  type: string;                    // See TYPE_VALUES below
  propulsion: string | null;       // See PROPULSION_VALUES below
  manufacturer: string;
  designer: string | null;         // Sometimes differs from manufacturer
  model: string | null;            // e.g., "Mega-Lite", "Wing Coaster", "Raptor Track"

  // ── Status & Timeline ─────────────────────────────────
  status: "operating" | "closed" | "sbno" | "under_construction" | "announced";
  yearOpened: number | null;
  yearClosed: number | null;       // null if still operating

  // ── Rich Content ──────────────────────────────────────
  description: string | null;      // Wikipedia intro paragraph (2-4 sentences)
  history: string | null;          // Key historical notes (renamed, relocated, RMC'd, etc.)
  notableFeatures: string[];       // ["world record holder", "first of its kind", etc.]
  records: string[];               // ["tallest hybrid coaster", "most airtime on a wooden coaster"]

  // ── Media ─────────────────────────────────────────────
  imageUrl: string | null;         // Wikimedia Commons image URL (CC licensed)
  imageAttribution: string | null; // Required attribution for the image

  // ── Metadata ──────────────────────────────────────────
  wikiUrl: string | null;          // Source Wikipedia article
  dataSource: string[];            // ["wikipedia", "park_website", "manufacturer"]
  lastUpdated: Timestamp;          // When this record was last modified
  dataQuality: "verified" | "partial" | "stub";  // How complete is this entry

  // ── Search Optimization ───────────────────────────────
  searchTerms: string[];           // Lowercase: ["steel vengeance", "mean streak", "cedar point", "rmc"]
}
```

---

## `coasters/{coasterId}/content/wiki`

Full Wikipedia article content. Only loaded on-demand for detail views and AI features.

```typescript
interface CoasterWikiContent {
  // ── Full Article ──────────────────────────────────────
  articleTitle: string;            // Wikipedia article title (may differ from coaster name)
  introSection: string;           // Lead section / intro paragraphs
  sections: {                     // Each major section of the article
    title: string;                // "History", "Ride experience", "Design", "Records", etc.
    content: string;              // Full text of that section
  }[];
  fullText: string;               // Entire article as plain text (for AI consumption)

  // ── Structured Extras ─────────────────────────────────
  categories: string[];           // Wikipedia categories the article belongs to
  infoboxRaw: Record<string, string>; // Raw key-value pairs from the infobox

  // ── Metadata ──────────────────────────────────────────
  wikiUrl: string;
  wikiPageId: number;             // Wikipedia page ID for API lookups
  fetchedAt: Timestamp;           // When this content was scraped
  articleLength: number;          // Character count (for quality estimation)
}
```

**Why store `fullText` AND `sections`?**
- `sections` lets you show structured content in the app (expandable "History", "Ride Experience" panels)
- `fullText` is what you feed to an AI model for Q&A — one flat string, no parsing needed
- `introSection` powers the `description` field on the main coaster doc (just the summary)

**Storage impact**: ~15KB average per coaster × 2,000 coasters = **~30MB total**. Negligible.

---

### Controlled Vocabulary

These aren't enums (new types get invented), but these are the known values:

```typescript
// type field — seating/ride style
const TYPE_VALUES = [
  "Sit-down",           // Standard (most common)
  "Inverted",           // Feet dangling, track above
  "Flying",             // Face-down prone position
  "Wing",               // Seats on either side of track
  "Floorless",          // Sit-down but no floor
  "Dive",               // Vertical drop, wide cars
  "Stand-up",           // Standing position
  "Suspended",          // Swinging cars, track above
  "Spinning",           // Cars rotate freely
  "Bobsled",            // Free-rolling on half-pipe track
  "4th Dimension",      // Seats rotate on axis perpendicular to track
  "Pipeline",           // Inline between rails
  "Shuttle",            // Doesn't complete circuit
  "Water",              // Splash element integral
  "Family",             // Lower thrill, all ages
  "Kiddie",             // Children's coaster
  "Alpine / Mountain",  // Terrain coaster / alpine coaster
  "Mine Train",         // Themed mine cars on curving track
  "Wild Mouse",         // Tight turns, small cars
  "Strata",             // 400+ ft (only 2 exist)
  "Hyper",              // 200-299 ft
  "Giga",               // 300-399 ft
];

// propulsion field — how the coaster gets moving
const PROPULSION_VALUES = [
  "Chain lift",
  "Cable lift",
  "LSM launch",         // Linear synchronous motor
  "LIM launch",         // Linear induction motor
  "Hydraulic launch",
  "Pneumatic launch",
  "Catapult",
  "Tire drive",
  "Gravity",            // Shuttle coasters, no lift
  "Spinning lift",
  "Vertical lift",
  "Spike",              // Beyond vertical spike element
];

// manufacturer field — major manufacturers (not exhaustive)
const MAJOR_MANUFACTURERS = [
  "Bolliger & Mabillard",     // B&M
  "Intamin",
  "Rocky Mountain Construction", // RMC
  "Vekoma",
  "Mack Rides",
  "Gerstlauer",
  "Arrow Dynamics",
  "Great Coasters International", // GCI
  "Gravity Group",
  "S&S Worldwide",
  "Premier Rides",
  "Zamperla",
  "Philadelphia Toboggan Coasters", // PTC
  "Maurer Rides",
  "Chance Rides",
  "Custom Coasters International", // CCI (defunct)
  "Schwarzkopf",
  "Zierer",
  "Dynamic Attractions",
  "Jinma Rides",                   // Major Chinese manufacturer
  "Beijing Shibaolai",
  "SBF Visa Group",
];
```

---

## `parks/{parkId}`

One document per park. Parks are the organizing unit for the geographic browse.

```typescript
interface Park {
  // ── Identity ──────────────────────────────────────────
  id: string;                      // Firestore doc ID (slug: "cedar-point")
  name: string;                    // "Cedar Point"
  formerNames: string[];           // For search

  // ── Location ──────────────────────────────────────────
  country: string;                 // ISO: "US"
  countryName: string;             // "United States"
  region: string;                  // "Ohio"
  continent: string;               // "North America"
  city: string | null;             // "Sandusky"
  latitude: number | null;         // 41.4784
  longitude: number | null;        // -82.6834
  address: string | null;

  // ── Park Info ─────────────────────────────────────────
  status: "operating" | "closed" | "seasonal";
  yearOpened: number | null;
  yearClosed: number | null;
  owner: string | null;            // "Cedar Fair Entertainment"
  chain: string | null;            // Parent chain/group if applicable
  website: string | null;

  // ── Aggregated Stats (updated when coasters change) ──
  coasterCount: number;            // Active coasters only
  totalCoasterCount: number;       // Including closed/SBNO

  // ── Rich Content ──────────────────────────────────────
  description: string | null;      // Brief park overview
  imageUrl: string | null;
  imageAttribution: string | null;

  // ── Metadata ──────────────────────────────────────────
  wikiUrl: string | null;
  dataSource: string[];
  lastUpdated: Timestamp;
}
```

---

## `parks/{parkId}/content/wiki`

Same pattern as coasters — full Wikipedia article for parks, loaded on-demand.

```typescript
interface ParkWikiContent {
  articleTitle: string;
  introSection: string;
  sections: {
    title: string;
    content: string;
  }[];
  fullText: string;

  categories: string[];
  infoboxRaw: Record<string, string>;

  wikiUrl: string;
  wikiPageId: number;
  fetchedAt: Timestamp;
  articleLength: number;
}
```

This powers park detail pages, "about this park" content, and AI-driven park Q&A.

---

## `metadata/geography`

Single document that powers the browse-by-location UI. Rebuilt whenever parks change.

```typescript
interface GeographyIndex {
  continents: {
    [continentName: string]: {
      countries: {
        [countryCode: string]: {
          name: string;            // "United States"
          regions: string[];       // ["Ohio", "California", "Florida", ...]
          parkCount: number;
          coasterCount: number;
        };
      };
    };
  };
  lastUpdated: Timestamp;
}
```

This single document is tiny (a few KB even with every country) and eliminates the need for
aggregation queries when building the browse UI. One read, full hierarchy.

---

## Query Patterns

These are the queries the app features need, and how the schema supports them:

| Feature | Query | How It Works |
|---------|-------|--------------|
| **Coastle** | All coasters for game pool | `coasters` collection (cache locally) |
| **Search** | Find coaster by name | `coasters where searchTerms array-contains "query"` |
| **Discover: Fastest** | Top coasters by speed | `coasters orderBy speedMph desc limit 20` |
| **Discover: Newest** | Recently opened | `coasters where yearOpened >= 2023 orderBy yearOpened desc` |
| **Discover: By manufacturer** | All B&M coasters | `coasters where manufacturer == "Bolliger & Mabillard"` |
| **Parks: Browse by region** | All parks in Ohio | `parks where country == "US" and region == "Ohio"` |
| **Parks: Coasters at park** | Cedar Point coasters | `coasters where parkId == "cedar-point"` |
| **Parks: Browse hierarchy** | Country → region list | Single read: `metadata/geography` |
| **Home: Recommendations** | Filtered by preferences | Compound query on speed/height/material/etc. |
| **Logging** | Find coaster to log | Same as search |
| **Battle Mode** | Random coaster pairs | Cached full list, random selection client-side |
| **Geofencing** | Parks near user | `parks` with lat/lng + client-side distance calc (or Geohash) |

---

## Data Ingestion Priority

### Wave 1: Major Markets (target: ~800-1000 coasters)
1. **United States** — by state (FL, OH, CA, PA, TX, NJ, VA, MO, GA, MA, then remaining)
2. **United Kingdom** — by country/region
3. **Germany** — by state (Bundesland)
4. **Japan** — by prefecture
5. **Canada** — by province
6. **China** — by province (major parks only initially)

### Wave 2: Europe + Asia Expansion (~500 more)
7. **Spain, France, Netherlands, Sweden, Denmark, Italy** — by region
8. **South Korea, UAE, Singapore, Malaysia, Australia**
9. **Mexico, Brazil, Colombia**

### Wave 3: Long Tail (~200-500 more)
10. Remaining countries with known coasters
11. Smaller parks, family coasters, alpine coasters
12. Historical/closed coasters of note

---

## Firestore Indexes Needed

```
// Compound indexes for common queries
coasters: country + region (ASC)
coasters: parkId + status (ASC)
coasters: manufacturer + status (ASC)
coasters: speedMph (DESC) + status
coasters: heightFt (DESC) + status
coasters: yearOpened (DESC) + status
coasters: material + type (ASC)
coasters: continent + status (ASC)

parks: country + region (ASC)
parks: continent + status (ASC)
parks: chain + status (ASC)
```

---

## What Gets Extracted From Each Wikipedia Page

For every coaster article, the pipeline captures **everything**:

```
Wikipedia Article
├── Infobox (structured)        → Parsed into coaster stats fields
│   ├── Height, speed, length, drop
│   ├── Inversions, G-force, duration
│   ├── Manufacturer, designer, model
│   ├── Material, type, propulsion
│   ├── Status, opening date, closing date
│   ├── Park, location, coordinates
│   └── Former names, cost, capacity
│
├── Lead section (summary)      → coaster.description (main doc)
│                                 + content/wiki.introSection
│
├── Article body (all sections) → content/wiki.sections[]
│   ├── History                   (construction, opening, modifications)
│   ├── Ride experience           (what the ride feels like)
│   ├── Design / Engineering      (technical details)
│   ├── Records                   (world records held)
│   ├── Reception                 (reviews, awards)
│   ├── Incidents                 (if any)
│   └── Any other sections
│
├── Categories                  → content/wiki.categories[]
│   (e.g., "Roller coasters in Ohio", "Cedar Point", "B&M coasters")
│
└── Full text (concatenated)    → content/wiki.fullText
    (ready for AI consumption — search, Q&A, embeddings)
```

For parks, same structure: infobox → park fields, full article → subcollection.

**The main coaster/park document stays lean** (~1-2KB) for fast list views and queries.
**The content subcollection has everything** (~5-30KB) for deep features and AI.

This means:
- Scrolling a list of 50 coasters = 50 × 1.5KB = **75KB** (fast)
- Opening one coaster detail = 1 × 20KB = **20KB** (still fast)
- AI answering a question = reads 1-5 full articles = **100KB max** (trivial)

---

## Notes

- **Imperial + Metric**: Both stored at ingest. No runtime conversion needed. Wikipedia usually provides both.
- **Denormalization**: Park name/country/region are duplicated on coasters intentionally. This is correct Firestore practice — avoids joins on every read.
- **searchTerms**: Built at ingest time. Includes lowercase name, former names, park name, manufacturer abbreviations (e.g., "b&m", "rmc"), and model names. Powers array-contains queries.
- **dataQuality**: "verified" = all core stats confirmed from 2+ sources. "partial" = some fields missing. "stub" = just name/park/basic info.
- **Status field on coasters**: Critical for filtering. "sbno" = Standing But Not Operating (common in the coaster world). "under_construction" and "announced" let you track upcoming coasters.
- **formerNames**: Many coasters get renamed (Mean Streak → Steel Vengeance, Mantis → Rougarou). Essential for search and historical context.
