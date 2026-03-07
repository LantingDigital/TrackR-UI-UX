import { EnrichedCoaster } from '../types';
import { COASTER_BY_ID } from '../../../data/coasterIndex';
import { COASTER_DETAILS } from '../../../data/coasterDetails';

// ============================================
// Enriched Coaster Data — Knott's Berry Farm
// Curated from pipeline/data/coasters/*.json
// ============================================

const ENRICHED_COASTERS: Record<string, EnrichedCoaster> = {
  ghostrider: {
    id: 'ghostrider',
    name: 'GhostRider',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Custom Coasters International',
    material: 'Wood',
    type: 'Sit-down',
    heightFt: 118,
    speedMph: 56,
    lengthFt: 4533,
    inversions: 0,
    yearOpened: 1998,
    dropFt: 108,
    gForce: 3.1,
    duration: 160,
    propulsion: 'Chain lift',
    designer: 'Dennis McNulty, Larry Bill',
    status: 'Operating',
    description:
      'The longest wooden coaster on the West Coast, GhostRider towers 118 feet over Ghost Town and delivers 4,533 feet of aggressive airtime and laterals through its twisting layout.',
    notableFeatures: [
      'Longest wooden coaster on the US West Coast',
      'Major Great Coasters International retrack in 2016',
      'Themed to a haunted mine train',
    ],
    records: ['Longest wooden coaster west of the Mississippi at opening'],
  },
  xcelerator: {
    id: 'xcelerator',
    name: 'Xcelerator',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Intamin',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 205,
    speedMph: 82,
    lengthFt: 2202,
    inversions: 0,
    yearOpened: 2002,
    dropFt: 200,
    duration: 62,
    propulsion: 'Hydraulic launch',
    designer: 'Werner Stengel',
    model: 'Accelerator Coaster',
    status: 'Operating',
    description:
      "Intamin's first hydraulic launch coaster rockets riders from 0 to 82 mph in 2.3 seconds before climbing a 205-foot top hat with a 200-foot beyond-vertical drop.",
    notableFeatures: [
      "World's first hydraulically-launched coaster",
      '1950s hot rod theme',
      '205-foot top hat element',
    ],
    records: ["World's first Intamin Accelerator Coaster"],
  },
  'silver-bullet': {
    id: 'silver-bullet',
    name: 'Silver Bullet',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Bolliger & Mabillard',
    material: 'Steel',
    type: 'Inverted',
    heightFt: 146,
    speedMph: 55,
    lengthFt: 3125,
    inversions: 6,
    yearOpened: 2004,
    dropFt: 109,
    gForce: 3,
    duration: 150,
    propulsion: 'Chain lift',
    model: 'Inverted Coaster',
    status: 'Operating',
    description:
      'A Bolliger & Mabillard inverted coaster that sends riders through six inversions including a cobra roll and two corkscrews while suspended beneath the track.',
    notableFeatures: [
      '6 inversions including cobra roll',
      'Western silver mine theme',
      'Sweeps over the park lake',
    ],
  },
  hangtime: {
    id: 'hangtime',
    name: 'HangTime',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Gerstlauer',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 150,
    speedMph: 57,
    lengthFt: 2198,
    inversions: 5,
    yearOpened: 2018,
    dropFt: 122,
    duration: 75,
    propulsion: 'Chain lift',
    model: 'Infinity Coaster',
    status: 'Operating',
    description:
      "California's first dive coaster features a 96-degree beyond-vertical drop and five inversions on a compact Gerstlauer Infinity Coaster layout in the Boardwalk area.",
    notableFeatures: [
      'Steepest drop in California at opening (96°)',
      '5 inversions',
      'Boardwalk/surf theme with LED lighting',
    ],
    records: ['Steepest drop on a coaster in California at opening'],
  },
  'montezooma-the-forbidden-fortress': {
    id: 'montezooma-the-forbidden-fortress',
    name: 'MonteZOOMa: The Forbidden Fortress',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Schwarzkopf',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 148,
    speedMph: 55,
    lengthFt: 800,
    inversions: 1,
    yearOpened: 1978,
    duration: 36,
    propulsion: 'Flywheel launch',
    designer: 'Werner Stengel',
    model: 'Shuttle Loop - Flywheel',
    status: 'Closed',
    description:
      'A classic Schwarzkopf shuttle loop launched by flywheel, this 1978 icon was one of the oldest looping shuttle coasters still in its original location before closing in 2022.',
    notableFeatures: [
      'Flywheel launch system',
      'Classic Schwarzkopf shuttle loop',
      'Operated for 44 years',
    ],
  },
  jaguar: {
    id: 'jaguar',
    name: 'Jaguar!',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Zierer',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 65,
    speedMph: 35,
    lengthFt: 2602,
    inversions: 0,
    yearOpened: 1995,
    dropFt: 45,
    duration: 120,
    propulsion: 'Drive tire lifts',
    designer: 'Werner Stengel',
    model: 'Tivoli',
    status: 'Operating',
    description:
      'A family coaster that winds through the Fiesta Village Aztec pyramid, Jaguar! is a 2,602-foot journey at moderate speeds — long enough for a two-minute ride.',
    notableFeatures: [
      'Winds through Fiesta Village pyramid',
      '2-minute ride duration',
      'Family-friendly thrill level',
    ],
  },
  'sierra-sidewinder': {
    id: 'sierra-sidewinder',
    name: 'Sierra Sidewinder',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Mack Rides',
    material: 'Steel',
    type: 'Spinning',
    heightFt: 62,
    speedMph: 37,
    lengthFt: 1410,
    inversions: 0,
    yearOpened: 2007,
    dropFt: 39,
    duration: 70,
    designer: 'Werner Stengel',
    model: 'Spinning Coaster',
    status: 'Operating',
    description:
      'A Mack spinning coaster in Camp Snoopy where cars freely rotate as they navigate the twisting layout, creating a different experience every ride.',
    notableFeatures: [
      'First multi-car spinning coaster in the US',
      'Free-spinning cars',
      'Camp Snoopy location',
    ],
  },
  'pony-express': {
    id: 'pony-express',
    name: 'Pony Express',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Zamperla',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 44,
    speedMph: 38,
    lengthFt: 1300,
    inversions: 0,
    yearOpened: 2008,
    duration: 36,
    model: 'MotoCoaster',
    status: 'Operating',
    description:
      'Riders straddle motorcycle-style seats on this Zamperla MotoCoaster that launches through a Western-themed layout at 38 mph.',
    notableFeatures: [
      'Motorcycle-style seating position',
      'First Zamperla MotoCoaster in the US',
      'Launch coaster',
    ],
  },
  'coast-rider': {
    id: 'coast-rider',
    name: 'Coast Rider',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Mack Rides',
    material: 'Steel',
    type: 'Wild Mouse',
    heightFt: 52,
    speedMph: 35,
    lengthFt: 1339,
    inversions: 0,
    yearOpened: 2013,
    dropFt: 50,
    duration: 150,
    model: 'Wild Mouse',
    status: 'Operating',
    description:
      'A Mack wild mouse coaster in the Boardwalk area with sharp hairpin turns and sudden drops, themed to a beachside boardwalk ride.',
    notableFeatures: [
      'Tight hairpin turns',
      'Beach/boardwalk theming',
      'Family-friendly wild mouse layout',
    ],
  },
  'timberline-twister': {
    id: 'timberline-twister',
    name: 'Timberline Twister',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Bradley & Kaye',
    material: 'Steel',
    type: 'Kiddie',
    heightFt: 30,
    speedMph: 0,
    lengthFt: 480,
    inversions: 0,
    yearOpened: 1983,
    duration: 55,
    status: 'Closed',
    description:
      'A compact kiddie coaster that operated in Camp Snoopy for 40 years before closing in 2023.',
  },
  'snoopys-tenderpaw-twister-coaster': {
    id: 'snoopys-tenderpaw-twister-coaster',
    name: "Snoopy's Tenderpaw Twister Coaster",
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Zamperla',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 15,
    speedMph: 16,
    lengthFt: 508,
    inversions: 0,
    yearOpened: 2024,
    model: 'Family Coaster 155M',
    status: 'Operating',
    description:
      "The newest addition to Camp Snoopy, this gentle Zamperla family coaster opened in 2024 as a replacement for Timberline Twister.",
  },
  'wacky-soap-box-racers': {
    id: 'wacky-soap-box-racers',
    name: 'Wacky Soap Box Racers',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'Arrow Dynamics',
    material: 'Steel',
    type: 'Sit-down',
    heightFt: 27,
    speedMph: 30,
    lengthFt: 1778,
    inversions: 0,
    yearOpened: 1976,
    model: 'Steeplechase',
    status: 'Closed',
    description:
      'One of only two Arrow steeplechase coasters ever built, this quad-track racer operated from 1976 to 1996.',
  },
  'windjammer-surf-racers': {
    id: 'windjammer-surf-racers',
    name: 'Windjammer Surf Racers',
    park: "Knott's Berry Farm",
    country: 'US',
    continent: 'North America',
    manufacturer: 'TOGO',
    material: 'Steel',
    type: 'Wild Mouse',
    heightFt: 0,
    speedMph: 0,
    lengthFt: 0,
    inversions: 0,
    yearOpened: 1997,
    propulsion: 'Chain lift',
    designer: 'TOGO',
    model: 'Looping Mouse',
    status: 'Closed',
    description:
      'A notoriously troubled TOGO racing coaster that operated sporadically from 1997 to 2000 before being removed.',
  },
};

// ============================================
// ID Resolution
// ============================================

// Wait time IDs use "ride-" prefix and sometimes abbreviated names.
// This maps those to enriched coaster IDs.
const RIDE_ID_ALIASES: Record<string, string> = {
  'ride-ghostrider': 'ghostrider',
  'ride-xcelerator': 'xcelerator',
  'ride-silver-bullet': 'silver-bullet',
  'ride-hangtime': 'hangtime',
  'ride-montezooma': 'montezooma-the-forbidden-fortress',
  'ride-pony-express': 'pony-express',
  'ride-jaguar': 'jaguar',
  'ride-coast-rider': 'coast-rider',
  'ride-sierra-sidewinder': 'sierra-sidewinder',
};

/** Resolve any ride ID format to a coaster detail ID */
export function resolveCoasterId(rawId: string): string {
  // Check alias map first (handles ride- prefix and abbreviations)
  if (RIDE_ID_ALIASES[rawId]) return RIDE_ID_ALIASES[rawId];
  // Strip ride- prefix as fallback
  const stripped = rawId.startsWith('ride-') ? rawId.slice(5) : rawId;
  return stripped;
}

/** Look up enriched coaster data by any ID format */
export function getEnrichedCoaster(rawId: string): EnrichedCoaster | null {
  const resolved = resolveCoasterId(rawId);

  // Check curated enriched data first (Knott's Berry Farm)
  if (ENRICHED_COASTERS[resolved]) {
    return ENRICHED_COASTERS[resolved];
  }

  // Fall back to global coaster index + details
  const entry = COASTER_BY_ID[resolved];
  if (entry) {
    const details = COASTER_DETAILS[resolved];
    const enriched: EnrichedCoaster = {
      id: entry.id,
      name: entry.name,
      park: entry.park,
      country: entry.country,
      continent: entry.continent,
      manufacturer: entry.manufacturer,
      material: entry.material as EnrichedCoaster['material'],
      type: entry.type,
      heightFt: entry.heightFt,
      speedMph: entry.speedMph,
      lengthFt: entry.lengthFt,
      inversions: entry.inversions,
      yearOpened: entry.yearOpened,
      dropFt: entry.dropFt,
      gForce: entry.gForce,
      duration: entry.duration,
      propulsion: entry.propulsion,
      designer: entry.designer,
      model: entry.model,
      status: entry.status,
      imageUrl: entry.imageUrl,
      description: details?.description,
      notableFeatures: details?.notableFeatures,
      records: details?.records,
      wikiUrl: details?.wikiUrl,
    };
    return enriched;
  }

  return null;
}

