import { CoastleCoaster } from '../coastle/types/coastle';

// ============================================
// Parks Hub — Types
// ============================================

export type GuideCategory =
  | 'strategy'
  | 'food'
  | 'tips'
  | 'hidden-gems'
  | 'must-do'
  | 'new-this-year'
  | 'getting-there'
  | 'best-for';

export interface ParkGuide {
  id: string;
  title: string;
  category: GuideCategory;
  icon: string; // emoji
  preview: string;
  readTimeMinutes: number;
  content: string;
}

// ---- Wait Times ----

export type RideStatus = 'open' | 'closed' | 'temporarily-closed' | 'weather-delay';

export interface RideWaitTimeData {
  id: string;
  name: string;
  parkSlug: string;
  waitMinutes: number;
  status: RideStatus;
  lastUpdated: number;         // timestamp ms
  historicalAvgMinutes: number; // average wait for comparison
}

export interface ParkWaitTimesResponse {
  parkSlug: string;
  parkName: string;
  lastUpdated: number;
  rides: RideWaitTimeData[];
}

// ---- Enriched Coaster Detail ----

export interface EnrichedCoaster extends CoastleCoaster {
  dropFt?: number;
  gForce?: number;
  duration?: number;           // seconds
  propulsion?: string;         // e.g. "Chain lift", "Hydraulic launch"
  designer?: string;           // e.g. "CCI", "Werner Stengel"
  model?: string;              // e.g. "Accelerator Coaster", "Infinity Coaster"
  status?: string;             // e.g. "Operating", "SBNO"
  description?: string;        // 1-2 sentence summary
  imageUrl?: string;
  wikiUrl?: string;
  notableFeatures?: string[];  // e.g. ["Tallest drop in the park", "Night rides"]
  records?: string[];          // e.g. ["Longest wooden coaster in the Western US"]
}

// ---- Map Graph Types ----

/** @deprecated Use ParkPOI for renderable points, WalkwayNode for path intersections */
export interface MapNode {
  id: string;
  x: number; // 0-1 percentage
  y: number; // 0-1 percentage
  type: 'ride' | 'restaurant' | 'restroom' | 'entrance' | 'intersection' | 'shop' | 'theater' | 'attraction' | 'service';
  name?: string;
  coasterId?: string;
  waitTimeMinutes?: number;
}

export interface MapEdge {
  from: string;
  to: string;
  weight: number;
}

/** Intersection-only node for pathfinding (not rendered on map) */
export interface WalkwayNode {
  id: string;
  x: number; // 0-1 percentage
  y: number; // 0-1 percentage
}

/** @deprecated Use UnifiedParkMapData */
export interface ParkMapData {
  parkSlug: string;
  nodes: MapNode[];
  edges: MapEdge[];
}

/** Unified map data: POIs (rendered) + walkway nodes (pathfinding) + edges */
export interface UnifiedParkMapData {
  parkSlug: string;
  pois: ParkPOI[];
  walkwayNodes: WalkwayNode[];
  edges: MapEdge[];
}

// ---- Point of Interest Types ----

export type ParkArea =
  // Knott's Berry Farm
  | 'camp-snoopy'
  | 'fiesta-village'
  | 'boardwalk'
  | 'ghost-town'
  | 'california-marketplace'
  | 'western-trails'
  // Cedar Point
  | 'main-midway'
  | 'frontier-town'
  | 'frontierland'
  | 'gemini-midway'
  | 'cedar-point-shores'
  | 'celebration-plaza'
  | 'the-boardwalk-cp'
  | 'kiddy-kingdom'
  // Kings Island
  | 'international-street'
  | 'action-zone'
  | 'rivertown'
  | 'coney-mall'
  | 'area-72'
  | 'planet-snoopy'
  | 'adventure-port'
  | 'oktoberfest'
  // Carowinds
  | 'county-fair'
  | 'blue-ridge-junction'
  | 'carolina-boardwalk'
  | 'celebration-square'
  | 'camp-snoopy-cw'
  | 'plant-hatchery'
  // Six Flags Magic Mountain
  | 'dc-universe'
  | 'screampunk-district'
  | 'the-movie-district'
  | 'rapids-camp-crossing'
  | 'baja-ridge'
  | 'samurai-summit'
  | 'cyclone-bay'
  | 'looney-tunes-land'
  // Universal Studios Hollywood
  | 'upper-lot'
  | 'lower-lot'
  | 'wizarding-world'
  | 'super-nintendo-world'
  | 'springfield'
  | 'jurassic-world-area'
  | 'citywalk'
  // Six Flags Great Adventure
  | 'main-street-sfga'
  | 'fantasy-forest'
  | 'adventure-seeker'
  | 'movietown'
  | 'frontier-adventures'
  | 'plaza-del-carnaval'
  | 'lakefront'
  | 'safari-kids'
  // Busch Gardens Tampa Bay
  | 'morocco'
  | 'egypt'
  | 'nairobi'
  | 'congo'
  | 'jungala'
  | 'stanleyville'
  | 'sesame-street-safari'
  | 'pantopia'
  | 'bird-gardens'
  // Hersheypark
  | 'chocolatetown'
  | 'kissing-tower-hill'
  | 'the-hollow'
  | 'midway-america'
  | 'pioneer-frontier'
  | 'minetown'
  | 'music-box-way'
  | 'founders-way'
  // Dollywood
  | 'showstreet'
  | 'craftsmans-valley'
  | 'timber-canyon'
  | 'wilderness-pass'
  | 'jukebox-junction'
  | 'country-fair-dw'
  | 'wildwood-grove'
  | 'adventures-in-imagination'
  // Universal Islands of Adventure
  | 'port-of-entry'
  | 'marvel-super-hero-island'
  | 'toon-lagoon'
  | 'skull-island'
  | 'jurassic-park'
  | 'wizarding-world-hogsmeade'
  | 'the-lost-continent'
  | 'seuss-landing'
  // Magic Kingdom
  | 'main-street-usa'
  | 'adventureland'
  | 'frontierland-mk'
  | 'liberty-square'
  | 'fantasyland'
  | 'tomorrowland';

export type ThrillLevel = 'low' | 'mild' | 'moderate' | 'high' | 'aggressive';

export type POIType = 'ride' | 'food' | 'shop' | 'theater' | 'attraction' | 'service';

/** Map rendering category — determines dot color and zoom tier */
export type MapCategory = 'coaster' | 'ride' | 'food' | 'show' | 'shop' | 'service';

export interface HeightRequirement {
  min?: number;          // minimum height in inches (solo)
  max?: number;          // maximum height in inches
  withCompanion?: number; // minimum height with supervising companion
  companionMin?: number;  // companion must be at least this tall
}

export interface ParkPOI {
  id: string;
  mapNumber?: number;       // numbered marker from official park map
  name: string;
  type: POIType;
  area: ParkArea;
  x: number;                // 0-1 map position
  y: number;                // 0-1 map position
  lng?: number;             // real longitude (from OSM)
  lat?: number;             // real latitude (from OSM)

  // Ride-specific
  heightRequirement?: HeightRequirement;
  thrillLevel?: ThrillLevel;
  coasterId?: string;       // links to CoastleCoaster
  fastLaneEligible?: boolean;
  underConstruction?: boolean;

  // Food-specific
  menuItems?: string[];     // searchable: "chicken tenders", "burgers", etc.
  menuDescription?: string; // short summary
  servesAlcohol?: boolean;
  openSelectDays?: boolean;

  // General
  description?: string;
  waitTimeMinutes?: number;   // live/mock wait time (rides only)
  approximateLocation?: boolean; // true = estimated coords, not GPS-verified
}

// ---- Park Data ----

export interface ParkData {
  name: string;
  coasters: CoastleCoaster[];
  count: number;
  country: string;
  /** Full location string, e.g. "Buena Park, California, USA" */
  location: string;
  continent: string;
  sortedCoasters: CoastleCoaster[];
  topStats: { tallest: number; fastest: number; mostInversions: number };
}
