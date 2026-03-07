/**
 * Area Labels — human-readable names for ParkArea slugs.
 *
 * Single source of truth for converting area IDs like 'ghost-town'
 * to display names like 'Ghost Town'. Used by POIListRow, list views,
 * and any component that needs to display area names.
 */

export const AREA_LABELS: Record<string, string> = {
  // Knott's Berry Farm
  'camp-snoopy': 'Camp Snoopy',
  'fiesta-village': 'Fiesta Village',
  'boardwalk': 'Boardwalk',
  'ghost-town': 'Ghost Town',
  'california-marketplace': 'California Marketplace',
  'western-trails': 'Western Trails',
  // Cedar Point
  'main-midway': 'Main Midway',
  'frontier-town': 'Frontier Town',
  'frontierland': 'Frontierland',
  'gemini-midway': 'Gemini Midway',
  'cedar-point-shores': 'Cedar Point Shores',
  'celebration-plaza': 'Celebration Plaza',
  'the-boardwalk-cp': 'The Boardwalk',
  'kiddy-kingdom': 'Kiddy Kingdom',
  // Kings Island
  'international-street': 'International Street',
  'action-zone': 'Action Zone',
  'rivertown': 'Rivertown',
  'coney-mall': 'Coney Mall',
  'area-72': 'Area 72',
  'planet-snoopy': 'Planet Snoopy',
  'adventure-port': 'Adventure Port',
  'oktoberfest': 'Oktoberfest',
  // Carowinds
  'county-fair': 'County Fair',
  'blue-ridge-junction': 'Blue Ridge Junction',
  'carolina-boardwalk': 'Carolina Boardwalk',
  'celebration-square': 'Celebration Square',
  'camp-snoopy-cw': 'Camp Snoopy',
  'plant-hatchery': 'Plant Hatchery',
  // Six Flags Magic Mountain
  'dc-universe': 'DC Universe',
  'screampunk-district': 'Screampunk District',
  'the-movie-district': 'The Movie District',
  'rapids-camp-crossing': 'Rapids Camp Crossing',
  'baja-ridge': 'Baja Ridge',
  'samurai-summit': 'Samurai Summit',
  'cyclone-bay': 'Cyclone Bay',
  'looney-tunes-land': 'Looney Tunes Land',
  // Universal Studios Hollywood
  'upper-lot': 'Upper Lot',
  'lower-lot': 'Lower Lot',
  'wizarding-world': 'Wizarding World',
  'super-nintendo-world': 'Super Nintendo World',
  'springfield': 'Springfield',
  'jurassic-world-area': 'Jurassic World',
  'citywalk': 'CityWalk',
  // Six Flags Great Adventure
  'main-street-sfga': 'Main Street',
  'fantasy-forest': 'Fantasy Forest',
  'adventure-seeker': 'Adventure Seeker',
  'movietown': 'Movietown',
  'frontier-adventures': 'Frontier Adventures',
  'plaza-del-carnaval': 'Plaza del Carnaval',
  'lakefront': 'Lakefront',
  'safari-kids': 'Safari Kids',
  // Busch Gardens Tampa Bay
  'morocco': 'Morocco',
  'egypt': 'Egypt',
  'nairobi': 'Nairobi',
  'congo': 'Congo',
  'jungala': 'Jungala',
  'stanleyville': 'Stanleyville',
  'sesame-street-safari': 'Sesame Street Safari',
  'pantopia': 'Pantopia',
  'bird-gardens': 'Bird Gardens',
  // Hersheypark
  'chocolatetown': 'Chocolatetown',
  'kissing-tower-hill': 'Kissing Tower Hill',
  'the-hollow': 'The Hollow',
  'midway-america': 'Midway America',
  'pioneer-frontier': 'Pioneer Frontier',
  'minetown': 'Minetown',
  'music-box-way': 'Music Box Way',
  'founders-way': "Founder's Way",
  // Dollywood
  'showstreet': 'Showstreet',
  'craftsmans-valley': "Craftsman's Valley",
  'timber-canyon': 'Timber Canyon',
  'wilderness-pass': 'Wilderness Pass',
  'jukebox-junction': 'Jukebox Junction',
  'country-fair-dw': 'Country Fair',
  'wildwood-grove': 'Wildwood Grove',
  'adventures-in-imagination': 'Adventures in Imagination',
  // Universal Islands of Adventure
  'port-of-entry': 'Port of Entry',
  'marvel-super-hero-island': 'Marvel Super Hero Island',
  'toon-lagoon': 'Toon Lagoon',
  'skull-island': 'Skull Island',
  'jurassic-park': 'Jurassic Park',
  'wizarding-world-hogsmeade': 'Wizarding World of Harry Potter',
  'the-lost-continent': 'The Lost Continent',
  'seuss-landing': 'Seuss Landing',
  // Magic Kingdom
  'main-street-usa': 'Main Street, U.S.A.',
  'adventureland': 'Adventureland',
  'frontierland-mk': 'Frontierland',
  'liberty-square': 'Liberty Square',
  'fantasyland': 'Fantasyland',
  'tomorrowland': 'Tomorrowland',
};

/** Get human-readable area label, falling back to the raw slug with title-casing */
export function getAreaLabel(area: string): string {
  return AREA_LABELS[area] ?? area.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
