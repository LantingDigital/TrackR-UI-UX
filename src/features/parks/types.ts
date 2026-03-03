import { CoastleCoaster } from '../coastle/types/coastle';

// ============================================
// Parks Hub — Types
// ============================================

export interface ParkGuide {
  id: string;
  title: string;
  category: 'strategy' | 'food' | 'tips' | 'hidden-gems';
  icon: string; // emoji
  preview: string;
  readTimeMinutes: number;
  content: string;
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
  | 'camp-snoopy'
  | 'fiesta-village'
  | 'boardwalk'
  | 'ghost-town'
  | 'california-marketplace'
  | 'western-trails';

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
