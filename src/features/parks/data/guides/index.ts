// ============================================
// Park Guides — Index
//
// Central export for all park guide data.
// Look up guides by park slug.
// ============================================

import { ParkGuide } from '../../types';
import { KNOTTS_GUIDES } from './knottsGuides';
import { CEDAR_POINT_GUIDES } from './cedarPointGuides';
import { KINGS_ISLAND_GUIDES } from './kingsIslandGuides';
import { CAROWINDS_GUIDES } from './carowindsGuides';
import { MAGIC_MOUNTAIN_GUIDES } from './magicMountainGuides';

/**
 * All park guides keyed by park slug.
 * Add new parks here as guides are written.
 */
export const PARK_GUIDES: Record<string, ParkGuide[]> = {
  'knotts-berry-farm': KNOTTS_GUIDES,
  'cedar-point': CEDAR_POINT_GUIDES,
  'kings-island': KINGS_ISLAND_GUIDES,
  'carowinds': CAROWINDS_GUIDES,
  'six-flags-magic-mountain': MAGIC_MOUNTAIN_GUIDES,
};

/**
 * Get guides for a specific park.
 * Returns an empty array for parks without guide content.
 */
export function getGuidesForPark(parkSlug: string): ParkGuide[] {
  return PARK_GUIDES[parkSlug] ?? [];
}

/**
 * Get all park slugs that have guide content.
 */
export function getParksWithGuides(): string[] {
  return Object.keys(PARK_GUIDES);
}

// Re-export individual park guides for direct imports
export { KNOTTS_GUIDES } from './knottsGuides';
export { CEDAR_POINT_GUIDES } from './cedarPointGuides';
export { KINGS_ISLAND_GUIDES } from './kingsIslandGuides';
export { CAROWINDS_GUIDES } from './carowindsGuides';
export { MAGIC_MOUNTAIN_GUIDES } from './magicMountainGuides';
