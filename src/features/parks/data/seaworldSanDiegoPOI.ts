import { ParkPOI } from '../types';

// ============================================
// SeaWorld San Diego — Complete Point of Interest Database
// Source: Official Park Map, Wikipedia, RCDB
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// Park center: 32.7657, -117.2263
// Layout: Roughly oval along Mission Bay shoreline
// Entrance at south, rides on west/north edges, shows/exhibits center
// ============================================

// ============================================
// ROLLER COASTERS
// ============================================

const COASTERS: ParkPOI[] = [
  {
    id: 'ride-emperor-swsd',
    mapNumber: 1,
    name: 'Emperor',
    type: 'ride',
    area: 'bayside-swsd',
    x: 0.42, y: 0.28,
    lng: -117.2275, lat: 32.7680,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'emperor',
    description: 'B&M dive coaster — tallest, fastest, longest dive coaster in CA (153 ft, 60 mph)',
  },
  {
    id: 'ride-electric-eel-swsd',
    mapNumber: 2,
    name: 'Electric Eel',
    type: 'ride',
    area: 'ocean-explorer-swsd',
    x: 0.65, y: 0.35,
    lng: -117.2250, lat: 32.7675,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'electric-eel',
    description: 'Premier Rides Sky Rocket II — multi-launch to 150 ft, 62 mph',
  },
  {
    id: 'ride-arctic-rescue-swsd',
    mapNumber: 3,
    name: 'Arctic Rescue',
    type: 'ride',
    area: 'arctic-rescue-area',
    x: 0.75, y: 0.25,
    lng: -117.2240, lat: 32.7685,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'arctic-rescue',
    description: 'Intamin launched straddle coaster — fastest and longest on the West Coast (2,800 ft)',
  },
  {
    id: 'ride-manta-swsd',
    mapNumber: 4,
    name: 'Manta',
    type: 'ride',
    area: 'ocean-explorer-swsd',
    x: 0.58, y: 0.42,
    lng: -117.2258, lat: 32.7671,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'manta-sd',
    description: 'Mack launched coaster with two LSM launches up to 43 mph and bat ray aquarium',
  },
  {
    id: 'ride-journey-to-atlantis-swsd',
    mapNumber: 5,
    name: 'Journey to Atlantis',
    type: 'ride',
    area: 'bayside-swsd',
    x: 0.35, y: 0.40,
    lng: -117.2282, lat: 32.7670,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'journey-to-atlantis-sd',
    description: 'Flume/coaster hybrid through the lost city of Atlantis — reinvented in 2025',
  },
];

// ============================================
// OTHER RIDES & ATTRACTIONS
// ============================================

const OTHER_RIDES: ParkPOI[] = [
  {
    id: 'ride-shipwreck-rapids-swsd',
    mapNumber: 6,
    name: 'Shipwreck Rapids',
    type: 'ride',
    area: 'shipwreck-reef',
    x: 0.55, y: 0.22,
    lng: -117.2260, lat: 32.7688,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    description: 'River rapids ride with waterfalls and whirlpools',
  },
  {
    id: 'ride-tentacle-twirl-swsd',
    name: 'Tentacle Twirl',
    type: 'ride',
    area: 'ocean-explorer-swsd',
    x: 0.62, y: 0.38,
    lng: -117.2252, lat: 32.7673,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
    description: 'Zierer wave swinger ride (2017)',
  },
  {
    id: 'ride-sea-dragon-drop-swsd',
    name: 'Sea Dragon Drop',
    type: 'ride',
    area: 'ocean-explorer-swsd',
    x: 0.60, y: 0.40,
    lng: -117.2255, lat: 32.7672,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
    description: 'Drop tower in Ocean Explorer area',
  },
  {
    id: 'ride-octarock-swsd',
    name: 'Octarock',
    type: 'ride',
    area: 'sesame-street-bay',
    x: 0.48, y: 0.68,
    lng: -117.2268, lat: 32.7650,
    heightRequirement: { withCompanion: 36 },
    thrillLevel: 'low',
    description: 'Spinning octopus ride for families',
  },
  {
    id: 'ride-rescue-rafter-swsd',
    name: 'Rescue Rafter',
    type: 'ride',
    area: 'rescue-jr-swsd',
    x: 0.40, y: 0.62,
    lng: -117.2278, lat: 32.7654,
    heightRequirement: { withCompanion: 36 },
    thrillLevel: 'low',
    description: 'Family raft ride in Rescue Jr. area',
  },
  {
    id: 'ride-tidepool-twist-swsd',
    name: 'Tidepool Twist',
    type: 'ride',
    area: 'sesame-street-bay',
    x: 0.50, y: 0.65,
    lng: -117.2265, lat: 32.7652,
    heightRequirement: { withCompanion: 36 },
    thrillLevel: 'low',
    description: 'Spinning teacup-style ride for kids',
  },
  {
    id: 'attraction-skytower-swsd',
    name: 'Skytower',
    type: 'attraction',
    area: 'bayside-swsd',
    x: 0.45, y: 0.35,
    lng: -117.2272, lat: 32.7674,
    description: '320-foot observation tower with panoramic views of San Diego and Mission Bay',
  },
  {
    id: 'attraction-explorers-reef-swsd',
    name: "Explorer's Reef",
    type: 'attraction',
    area: 'entrance-plaza-swsd',
    x: 0.48, y: 0.82,
    lng: -117.2268, lat: 32.7642,
    description: 'Interactive touch pools just inside the entrance with sharks and rays',
  },
  {
    id: 'attraction-shark-encounter-swsd',
    name: 'Shark Encounter',
    type: 'attraction',
    area: 'bayside-swsd',
    x: 0.38, y: 0.45,
    lng: -117.2280, lat: 32.7668,
    description: 'Walk-through tunnel aquarium with sharks, eels, and fish',
  },
  {
    id: 'attraction-wild-arctic-swsd',
    name: 'Wild Arctic',
    type: 'attraction',
    area: 'wild-arctic-swsd',
    x: 0.72, y: 0.30,
    lng: -117.2245, lat: 32.7682,
    description: 'Walk-through exhibit with beluga whales, walruses, and sea otters',
  },
  {
    id: 'attraction-turtle-reef-swsd',
    name: 'Turtle Reef',
    type: 'attraction',
    area: 'ocean-explorer-swsd',
    x: 0.63, y: 0.45,
    lng: -117.2251, lat: 32.7670,
    description: 'Sea turtle habitat and underwater viewing',
  },
  {
    id: 'attraction-penguin-encounter-swsd',
    name: 'Penguin Encounter',
    type: 'attraction',
    area: 'arctic-rescue-area',
    x: 0.70, y: 0.28,
    lng: -117.2248, lat: 32.7683,
    description: 'Walk-through penguin habitat with Antarctic environment',
  },
];

// ============================================
// SHOWS / THEATERS
// ============================================

const SHOWS: ParkPOI[] = [
  {
    id: 'theater-orca-encounter-swsd',
    name: 'Orca Encounter',
    type: 'theater',
    area: 'orca-encounter-area',
    x: 0.30, y: 0.32,
    lng: -117.2288, lat: 32.7678,
    description: 'Educational orca presentation at Bayside Amphitheater',
  },
  {
    id: 'theater-dolphin-adventures-swsd',
    name: 'Dolphin Adventures',
    type: 'theater',
    area: 'bayside-swsd',
    x: 0.35, y: 0.50,
    lng: -117.2283, lat: 32.7665,
    description: 'Dolphin performance and educational show',
  },
  {
    id: 'theater-sea-lion-live-swsd',
    name: 'Sea Lions Live',
    type: 'theater',
    area: 'bayside-swsd',
    x: 0.32, y: 0.55,
    lng: -117.2286, lat: 32.7662,
    description: 'Sea lion and otter comedy show',
  },
  {
    id: 'theater-cirque-swsd',
    name: 'Cirque Electrique',
    type: 'theater',
    area: 'bayside-swsd',
    x: 0.40, y: 0.48,
    lng: -117.2276, lat: 32.7667,
    description: 'Acrobatic nighttime spectacular (seasonal)',
  },
];

// ============================================
// FOOD & DINING
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-calypso-bay-swsd',
    name: 'Calypso Bay Smokehouse',
    type: 'food',
    area: 'shipwreck-reef',
    x: 0.52, y: 0.25,
    lng: -117.2262, lat: 32.7686,
    menuItems: ['bbq', 'brisket', 'ribs', 'pulled pork', 'mac and cheese'],
    menuDescription: 'Smoked meats and BBQ platters',
    servesAlcohol: true,
  },
  {
    id: 'food-explorers-cafe-swsd',
    name: "Explorer's Café",
    type: 'food',
    area: 'entrance-plaza-swsd',
    x: 0.52, y: 0.78,
    lng: -117.2264, lat: 32.7645,
    menuItems: ['pizza', 'chicken tenders', 'salads', 'desserts'],
    menuDescription: 'Large family dining space near entrance with varied menu',
  },
  {
    id: 'food-shipwreck-reef-cafe-swsd',
    name: 'Shipwreck Reef Café',
    type: 'food',
    area: 'shipwreck-reef',
    x: 0.58, y: 0.28,
    lng: -117.2256, lat: 32.7684,
    menuItems: ['burgers', 'bbq chicken', 'sandwiches', 'fries'],
    menuDescription: 'Burgers, BBQ, and hearty platters with outdoor seating',
    servesAlcohol: true,
  },
  {
    id: 'food-manta-pizza-swsd',
    name: 'Manta Pizza',
    type: 'food',
    area: 'ocean-explorer-swsd',
    x: 0.56, y: 0.44,
    lng: -117.2259, lat: 32.7669,
    menuItems: ['pizza', 'salad', 'desserts'],
    menuDescription: 'Pizza and salads near the Manta coaster',
  },
  {
    id: 'food-chicken-snack-shack-swsd',
    name: 'Chicken Snack Shack',
    type: 'food',
    area: 'bayside-swsd',
    x: 0.42, y: 0.42,
    lng: -117.2274, lat: 32.7671,
    menuItems: ['fried chicken', 'chicken nuggets', 'sandwiches', 'salad'],
    menuDescription: 'Fried chicken and quick bites',
  },
  {
    id: 'food-hibisco-swsd',
    name: 'Hibisco Modern Mexican',
    type: 'food',
    area: 'bayside-swsd',
    x: 0.38, y: 0.52,
    lng: -117.2280, lat: 32.7664,
    menuItems: ['tacos', 'burritos', 'guacamole', 'margaritas', 'mexican'],
    menuDescription: 'Modern Mexican cuisine with craft cocktails',
    servesAlcohol: true,
  },
  {
    id: 'food-tidal-swsd',
    name: 'Tidal',
    type: 'food',
    area: 'ocean-explorer-swsd',
    x: 0.64, y: 0.42,
    lng: -117.2249, lat: 32.7671,
    menuItems: ['lobster rolls', 'seafood', 'fish tacos'],
    menuDescription: 'Premium seafood including buttery lobster rolls',
    servesAlcohol: true,
  },
  {
    id: 'food-dine-with-orcas-swsd',
    name: 'Dine With Orcas',
    type: 'food',
    area: 'orca-encounter-area',
    x: 0.28, y: 0.35,
    lng: -117.2290, lat: 32.7676,
    menuItems: ['buffet', 'premium dining', 'desserts'],
    menuDescription: 'Premium buffet dining alongside orca habitat',
    servesAlcohol: true,
  },
];

// ============================================
// SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-park-entrance-swsd',
    name: 'SeaWorld Store',
    type: 'shop',
    area: 'entrance-plaza-swsd',
    x: 0.50, y: 0.85,
    lng: -117.2266, lat: 32.7640,
    description: 'Main gift shop near park entrance',
  },
  {
    id: 'shop-arctic-gifts-swsd',
    name: 'Arctic Gifts',
    type: 'shop',
    area: 'arctic-rescue-area',
    x: 0.73, y: 0.27,
    lng: -117.2243, lat: 32.7684,
    description: 'Polar-themed merchandise near Arctic Rescue',
  },
  {
    id: 'shop-ocean-explorer-swsd',
    name: 'Ocean Treasures',
    type: 'shop',
    area: 'ocean-explorer-swsd',
    x: 0.60, y: 0.36,
    lng: -117.2254, lat: 32.7675,
    description: 'Ocean and marine life themed gifts',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-swsd',
    name: 'Main Entrance',
    type: 'service',
    area: 'entrance-plaza-swsd',
    x: 0.50, y: 0.92,
    lng: -117.2266, lat: 32.7635,
    description: 'SeaWorld San Diego main entrance and ticket booths',
  },
  {
    id: 'restroom-entrance-swsd',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'entrance-plaza-swsd',
    x: 0.46, y: 0.88,
    lng: -117.2270, lat: 32.7638,
  },
  {
    id: 'restroom-bayside-swsd',
    name: 'Restrooms (Bayside)',
    type: 'service',
    area: 'bayside-swsd',
    x: 0.36, y: 0.48,
    lng: -117.2282, lat: 32.7667,
  },
  {
    id: 'restroom-ocean-explorer-swsd',
    name: 'Restrooms (Ocean Explorer)',
    type: 'service',
    area: 'ocean-explorer-swsd',
    x: 0.62, y: 0.40,
    lng: -117.2253, lat: 32.7672,
  },
  {
    id: 'restroom-shipwreck-swsd',
    name: 'Restrooms (Shipwreck Reef)',
    type: 'service',
    area: 'shipwreck-reef',
    x: 0.54, y: 0.24,
    lng: -117.2261, lat: 32.7687,
  },
  {
    id: 'restroom-sesame-swsd',
    name: 'Restrooms (Sesame Street)',
    type: 'service',
    area: 'sesame-street-bay',
    x: 0.46, y: 0.66,
    lng: -117.2270, lat: 32.7651,
  },
  {
    id: 'service-first-aid-swsd',
    name: 'First Aid',
    type: 'service',
    area: 'entrance-plaza-swsd',
    x: 0.44, y: 0.85,
    lng: -117.2272, lat: 32.7640,
  },
  {
    id: 'service-guest-services-swsd',
    name: 'Guest Services',
    type: 'service',
    area: 'entrance-plaza-swsd',
    x: 0.54, y: 0.88,
    lng: -117.2262, lat: 32.7638,
  },
];

// ============================================
// Combined Export
// ============================================

export const SEAWORLD_SAN_DIEGO_POI: ParkPOI[] = [
  ...COASTERS,
  ...OTHER_RIDES,
  ...SHOWS,
  ...FOOD,
  ...SHOPS,
  ...SERVICES,
];
