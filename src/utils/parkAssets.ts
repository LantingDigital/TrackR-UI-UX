/**
 * Park Assets Utility
 *
 * Handles mapping between park names and their bundled asset files.
 * Assets are stored in:
 * - assets/wallet/parks/card-art/{park-slug}.jpg
 * - assets/wallet/parks/logos/{park-slug}.png
 *
 * Park slugs use hyphenated lowercase names (e.g., "cedar-point", "kings-island")
 */

import { ImageSourcePropType } from 'react-native';
import parkHeroesData from '../../assets/parks/heroes/park_heroes.json';

/**
 * Remote hero image URLs from Wikimedia Commons
 * Indexed by both the original key AND the slug derived from the entry's
 * display name, so lookups work regardless of minor naming differences
 * (e.g. "legoland-california" vs "legoland-california-resort").
 */
const HERO_URL_REGISTRY: Record<string, string> = {};
for (const [key, entry] of Object.entries(parkHeroesData)) {
  const { heroUrl, name } = entry as any;
  if (heroUrl) {
    HERO_URL_REGISTRY[key] = heroUrl;
    if (name) {
      const nameSlug = name
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      if (nameSlug !== key) {
        HERO_URL_REGISTRY[nameSlug] = heroUrl;
      }
    }
  }
}

/**
 * Registry of available park card art images
 * Add new parks here as you create their card art
 *
 * Usage: require() must be static, so we pre-register all available images
 */
const CARD_ART_REGISTRY: Record<string, ImageSourcePropType> = {
  // Cedar Fair Parks
  'carowinds': require('../../assets/wallet/parks/card-art/carowinds.jpg'),
  'cedar-point': require('../../assets/wallet/parks/card-art/cedar-point.jpg'),
  'kings-island': require('../../assets/wallet/parks/card-art/kings-island.jpg'),
  // 'kings-dominion': require('../../assets/wallet/parks/card-art/kings-dominion.jpg'),
  // 'canada-s-wonderland': require('../../assets/wallet/parks/card-art/canadas-wonderland.jpg'),

  // Six Flags Parks
  // 'six-flags-magic-mountain': require('../../assets/wallet/parks/card-art/six-flags-magic-mountain.jpg'),
  // 'six-flags-great-adventure': require('../../assets/wallet/parks/card-art/six-flags-great-adventure.jpg'),

  // Disney Parks
  // 'walt-disney-world': require('../../assets/wallet/parks/card-art/walt-disney-world.jpg'),
  // 'disneyland': require('../../assets/wallet/parks/card-art/disneyland.jpg'),

  // Universal Parks
  // 'universal-orlando': require('../../assets/wallet/parks/card-art/universal-orlando.jpg'),
  // 'universal-hollywood': require('../../assets/wallet/parks/card-art/universal-hollywood.jpg'),

  // SeaWorld Parks
  // 'seaworld-orlando': require('../../assets/wallet/parks/card-art/seaworld-orlando.jpg'),
  // 'busch-gardens-tampa': require('../../assets/wallet/parks/card-art/busch-gardens-tampa.jpg'),

  // Independent Parks
  // 'holiday-world': require('../../assets/wallet/parks/card-art/holiday-world.jpg'),
  // 'dollywood': require('../../assets/wallet/parks/card-art/dollywood.jpg'),
};

/**
 * Registry of available park logo images
 * Logos should be PNG with transparency
 */
const LOGO_REGISTRY: Record<string, ImageSourcePropType> = {
  'carowinds': require('../../assets/wallet/parks/logos/carowinds.png'),
  'cedar-point': require('../../assets/wallet/parks/logos/cedar-point.png'),
  'kings-island': require('../../assets/wallet/parks/logos/kings-island.png'),
};

/**
 * Convert a park name to a slug (hyphenated lowercase)
 * Example: "Cedar Point" -> "cedar-point"
 * Example: "Six Flags Magic Mountain" -> "six-flags-magic-mountain"
 */
export const parkNameToSlug = (parkName: string): string => {
  return parkName
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Get card art image source for a park
 * Returns undefined if no card art is available for this park
 */
export const getCardArtForPark = (parkName: string): ImageSourcePropType | undefined => {
  const slug = parkNameToSlug(parkName);
  return CARD_ART_REGISTRY[slug];
};

/**
 * Get logo image source for a park
 * Returns undefined if no logo is available for this park
 */
export const getLogoForPark = (parkName: string): ImageSourcePropType | undefined => {
  const slug = parkNameToSlug(parkName);
  return LOGO_REGISTRY[slug];
};

/**
 * Check if a park has custom card art available
 */
export const hasCardArt = (parkName: string): boolean => {
  const slug = parkNameToSlug(parkName);
  return slug in CARD_ART_REGISTRY;
};

/**
 * Check if a park has a logo available
 */
export const hasLogo = (parkName: string): boolean => {
  const slug = parkNameToSlug(parkName);
  return slug in LOGO_REGISTRY;
};

/**
 * Get remote hero image URL for a park (Wikimedia Commons)
 * Returns undefined if no hero image is available
 * This is the fallback when no bundled card art exists
 */
export const getHeroUrlForPark = (parkName: string): string | undefined => {
  const slug = parkNameToSlug(parkName);
  return HERO_URL_REGISTRY[slug];
};

/**
 * Get all available park slugs with card art
 */
export const getAvailableParks = (): string[] => {
  return Object.keys(CARD_ART_REGISTRY);
};

/**
 * Generate a consistent color for a park based on its name
 * Used for gradient fallback when no card art is available
 */
export const getParkGradientColors = (parkName: string): [string, string] => {
  // Generate a hash from the park name for consistent colors
  let hash = 0;
  for (let i = 0; i < parkName.length; i++) {
    hash = parkName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to HSL for pleasant colors
  const hue = Math.abs(hash % 360);
  const saturation = 45 + Math.abs((hash >> 8) % 20); // 45-65%
  const lightness1 = 35 + Math.abs((hash >> 16) % 15); // 35-50% (darker)
  const lightness2 = 50 + Math.abs((hash >> 24) % 15); // 50-65% (lighter)

  return [
    `hsl(${hue}, ${saturation}%, ${lightness1}%)`,
    `hsl(${hue}, ${saturation}%, ${lightness2}%)`,
  ];
};

/**
 * Format park initials for fallback display
 * Example: "Cedar Point" -> "CP"
 * Example: "Six Flags Magic Mountain" -> "SF"
 */
export const getParkInitials = (parkName: string): string => {
  const words = parkName.split(' ').filter(word =>
    !['the', 'of', 'at', 'and', '&'].includes(word.toLowerCase())
  );

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return parkName.substring(0, 2).toUpperCase();
};
