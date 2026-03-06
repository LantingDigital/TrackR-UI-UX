/**
 * Coaster Card Art — maps coasterId to AI-generated art
 *
 * Coasters without entries here fall back to a styled placeholder
 * in the CoasterCard component.
 */

// Card art mapping — keys are coaster IDs from coasterIndex
export const CARD_ART: Record<string, any> = {
  // ── Six Flags Magic Mountain ──
  'apocalypse-the-ride': require('../../assets/cards/apocalypse-the-ride.webp'),
  'batman-the-ride-six-flags-magic-mountain': require('../../assets/cards/batman-the-ride-six-flags-magic-mountain.webp'),
  'canyon-blaster-six-flags-magic-mountain': require('../../assets/cards/canyon-blaster-six-flags-magic-mountain.webp'),
  'flashback': require('../../assets/cards/flashback.webp'),
  'full-throttle': require('../../assets/cards/full-throttle.webp'),
  'gold-rusher': require('../../assets/cards/gold-rusher.webp'),
  'goliath': require('../../assets/cards/goliath.webp'),
  'green-lantern-first-flight': require('../../assets/cards/green-lantern-first-flight.webp'),
  'magic-flyer': require('../../assets/cards/magic-flyer.webp'),
  'ninja': require('../../assets/cards/ninja.webp'),
  'psyclone': require('../../assets/cards/psyclone.webp'),
  'road-runner-express': require('../../assets/cards/road-runner-express.webp'),
  'scream': require('../../assets/cards/scream.webp'),
  'shockwave-six-flags-magic-mountain': require('../../assets/cards/shockwave-six-flags-magic-mountain.webp'),
  'speedy-gonzales-hot-rod-racers': require('../../assets/cards/speedy-gonzales-hot-rod-racers.webp'),
  'superman-escape-from-krypton': require('../../assets/cards/superman-escape-from-krypton.webp'),
  'tatsu': require('../../assets/cards/tatsu.webp'),
  'the-new-revolution': require('../../assets/cards/the-new-revolution.webp'),
  'the-riddlers-revenge': require('../../assets/cards/the-riddlers-revenge.webp'),
  'twisted-colossus': require('../../assets/cards/twisted-colossus.webp'),
  'viper': require('../../assets/cards/viper.webp'),
  'west-coast-racers': require('../../assets/cards/west-coast-racers.webp'),
  'x2': require('../../assets/cards/x2.webp'),

  // ── Knott's Berry Farm ──
  'coast-rider': require('../../assets/cards/coast-rider.webp'),
  'ghostrider': require('../../assets/cards/ghostrider.webp'),
  'hangtime': require('../../assets/cards/hangtime.webp'),
  'jaguar': require('../../assets/cards/jaguar.webp'),
  'montezooma-the-forbidden-fortress': require('../../assets/cards/montezooma-the-forbidden-fortress.webp'),
  'pony-express': require('../../assets/cards/pony-express.webp'),
  'sierra-sidewinder': require('../../assets/cards/sierra-sidewinder.webp'),
  'silver-bullet': require('../../assets/cards/silver-bullet.webp'),
  'snoopys-tenderpaw-twister-coaster': require('../../assets/cards/snoopys-tenderpaw-twister-coaster.webp'),
  'timberline-twister': require('../../assets/cards/timberline-twister.webp'),
  'xcelerator': require('../../assets/cards/xcelerator.webp'),

  // ── Disneyland ──
  'big-thunder-mountain-railroad': require('../../assets/cards/big-thunder-mountain-railroad.webp'),
  'chip-n-dales-gadgetcoaster': require('../../assets/cards/chip-n-dales-gadgetcoaster.webp'),
  'matterhorn-bobsleds': require('../../assets/cards/matterhorn-bobsleds.webp'),
  'space-mountain': require('../../assets/cards/space-mountain.webp'),

  // ── Disney California Adventure ──
  'goofys-sky-school': require('../../assets/cards/goofys-sky-school.webp'),
  'incredicoaster': require('../../assets/cards/incredicoaster.webp'),

  // ── California's Great America ──
  'demon': require('../../assets/cards/demon.webp'),
  'flight-deck': require('../../assets/cards/flight-deck.webp'),
  'gold-striker': require('../../assets/cards/gold-striker.webp'),
  'patriot': require('../../assets/cards/patriot.webp'),
  'psycho-mouse': require('../../assets/cards/psycho-mouse.webp'),
  'railblazer': require('../../assets/cards/railblazer.webp'),
  'the-grizzly': require('../../assets/cards/the-grizzly.webp'),
  'woodstock-express': require('../../assets/cards/woodstock-express.webp'),

  // ── Universal Studios Hollywood ──
  'fast-furious-hollywood-drift': require('../../assets/cards/fast-furious-hollywood-drift.webp'),
  'flight-of-the-hippogriff-universal-studios-hollywood': require('../../assets/cards/flight-of-the-hippogriff-universal-studios-hollywood.webp'),
  'revenge-of-the-mummy-universal-studios-hollywood': require('../../assets/cards/revenge-of-the-mummy-universal-studios-hollywood.webp'),

  // ── SeaWorld San Diego ──
  'arctic-rescue': require('../../assets/cards/arctic-rescue.webp'),
  'electric-eel': require('../../assets/cards/electric-eel.webp'),
  'emperor': require('../../assets/cards/emperor.webp'),
  'journey-to-atlantis': require('../../assets/cards/journey-to-atlantis.webp'),
  'manta': require('../../assets/cards/manta.webp'),

  // ── Six Flags Discovery Kingdom ──
  'batman-the-ride-six-flags-discovery-kingdom': require('../../assets/cards/batman-the-ride-six-flags-discovery-kingdom.webp'),
  'boomerang-coast-to-coaster-six-flags-discovery-kingdom': require('../../assets/cards/boomerang-coast-to-coaster-six-flags-discovery-kingdom.webp'),
  'cobra-six-flags-discovery-kingdom': require('../../assets/cards/cobra-six-flags-discovery-kingdom.webp'),
  'kong': require('../../assets/cards/kong.webp'),
  'medusa': require('../../assets/cards/medusa.webp'),
  'roadrunner-express': require('../../assets/cards/roadrunner-express.webp'),
  'sidewinder-safari': require('../../assets/cards/sidewinder-safari.webp'),
  'superman-ultimate-flight': require('../../assets/cards/superman-ultimate-flight.webp'),
  'the-flash-vertical-velocity': require('../../assets/cards/the-flash-vertical-velocity.webp'),

  // ── Other California ──
  'crazy-dane-coaster': require('../../assets/cards/crazy-dane-coaster.webp'),
  'greased-lightnin': require('../../assets/cards/greased-lightnin.webp'),
  'invertigo': require('../../assets/cards/invertigo.webp'),
  'merlins-revenge': require('../../assets/cards/merlins-revenge.webp'),
  'pandemonium': require('../../assets/cards/pandemonium.webp'),
  'roar': require('../../assets/cards/roar.webp'),
  'screamin-demon': require('../../assets/cards/screamin-demon.webp'),
  'stealth': require('../../assets/cards/stealth.webp'),
  'whizzer': require('../../assets/cards/whizzer.webp'),

  // ── Cedar Point ──
  'blue-streak': require('../../assets/cards/blue-streak.webp'),
  'gatekeeper': require('../../assets/cards/gatekeeper.webp'),
  'magnum-xl-200': require('../../assets/cards/magnum-xl-200.webp'),
  'maverick': require('../../assets/cards/maverick.webp'),
  'millennium-force': require('../../assets/cards/millennium-force.webp'),
  'raptor': require('../../assets/cards/raptor.webp'),
  'rougarou': require('../../assets/cards/rougarou.webp'),
  'sirens-curse': require('../../assets/cards/sirens-curse.webp'),
  'steel-vengeance': require('../../assets/cards/steel-vengeance.webp'),
  'top-thrill-2': require('../../assets/cards/top-thrill-2.webp'),
  'valravn': require('../../assets/cards/valravn.webp'),
  'wicked-twister': require('../../assets/cards/wicked-twister.webp'),

  // ── Kings Island ──
  'banshee': require('../../assets/cards/banshee.webp'),
  'diamondback': require('../../assets/cards/diamondback.webp'),
  'firehawk': require('../../assets/cards/firehawk.webp'),
  'flight-of-fear': require('../../assets/cards/flight-of-fear.webp'),
  'mystic-timbers': require('../../assets/cards/mystic-timbers.webp'),
  'orion': require('../../assets/cards/orion.webp'),
  'son-of-beast': require('../../assets/cards/son-of-beast.webp'),
  'the-beast': require('../../assets/cards/the-beast.webp'),

  // ── Canada's Wonderland ──
  'behemoth': require('../../assets/cards/behemoth.webp'),
  'leviathan': require('../../assets/cards/leviathan.webp'),
  'yukon-striker': require('../../assets/cards/yukon-striker.webp'),

  // ── Six Flags Great Adventure ──
  'el-toro': require('../../assets/cards/el-toro.webp'),
  'great-american-scream-machine': require('../../assets/cards/great-american-scream-machine.webp'),
  'green-lantern': require('../../assets/cards/green-lantern.webp'),
  'kingda-ka': require('../../assets/cards/kingda-ka.webp'),

  // ── Kings Dominion ──
  'pantherian': require('../../assets/cards/pantherian.webp'),
  'twisted-timbers': require('../../assets/cards/twisted-timbers.webp'),
};

/**
 * Per-image focal point for hero cropping.
 * Values 0 (top) to 1 (bottom), default 0.5 (center).
 * Only add entries that need adjustment — omitted = centered.
 */
export const CARD_ART_FOCAL: Record<string, number> = {
  // Tune these as needed after reviewing in-app
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
