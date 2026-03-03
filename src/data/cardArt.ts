/**
 * Coaster Card Art — maps coasterId to AI-generated art
 *
 * For POC: California coasters with locally stored art.
 * For production: these would be CDN URLs.
 *
 * Coasters without entries here fall back to a styled placeholder
 * in the CoasterCard component.
 */

// Card art mapping — populated as art is generated
// Keys are coaster IDs from coasterIndex
export const CARD_ART: Record<string, any> = {
  // California coasters (POC) — uncomment as art is added to assets/cards/
  // 'twisted-colossus': require('../../assets/cards/twisted-colossus.jpg'),
  // 'x2': require('../../assets/cards/x2.jpg'),
  // 'tatsu': require('../../assets/cards/tatsu.jpg'),
  // 'ghostrider': require('../../assets/cards/ghostrider.jpg'),
  // 'xcelerator': require('../../assets/cards/xcelerator.jpg'),
};

/**
 * Derive rarity from popularity rank
 */
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export function getRarityFromRank(popularityRank: number): CardRarity {
  if (popularityRank <= 50) return 'legendary';
  if (popularityRank <= 200) return 'rare';
  if (popularityRank <= 500) return 'uncommon';
  return 'common';
}

/** Rarity display colors */
export const RARITY_COLORS: Record<CardRarity, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  legendary: '#FF9800',
};

/** Rarity gradient backgrounds for placeholder cards */
export const RARITY_GRADIENTS: Record<CardRarity, [string, string]> = {
  common: ['#E0E0E0', '#BDBDBD'],
  uncommon: ['#C8E6C9', '#81C784'],
  rare: ['#BBDEFB', '#64B5F6'],
  legendary: ['#FFE0B2', '#FFB74D'],
};
