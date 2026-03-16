import { ParkPOI } from '../types';

// ============================================
// Six Flags Great America — Complete Point of Interest Database
// Source: Official 2025 Park Map, RCDB, OpenStreetMap
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 42.3716, -87.9354
// Gurnee, Illinois
// ============================================

// ============================================
// RIDES — ROLLER COASTERS
// ============================================

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-raging-bull',
    mapNumber: 1,
    name: 'Raging Bull',
    type: 'ride',
    area: 'county-fair-sfga',
    x: 0.35, y: 0.25,
    lng: -87.9368, lat: 42.3735,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'raging-bull',
    fastLaneEligible: true,
  },
  {
    id: 'ride-goliath-sfga',
    mapNumber: 2,
    name: 'Goliath',
    type: 'ride',
    area: 'county-fair-sfga',
    x: 0.30, y: 0.20,
    lng: -87.9374, lat: 42.3740,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'goliath-six-flags-great-america',
    fastLaneEligible: true,
  },
  {
    id: 'ride-maxx-force',
    mapNumber: 3,
    name: 'Maxx Force',
    type: 'ride',
    area: 'carousel-plaza',
    x: 0.48, y: 0.35,
    lng: -87.9350, lat: 42.3728,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'maxx-force',
    fastLaneEligible: true,
  },
  {
    id: 'ride-x-flight',
    mapNumber: 4,
    name: 'X-Flight',
    type: 'ride',
    area: 'carousel-plaza',
    x: 0.50, y: 0.30,
    lng: -87.9347, lat: 42.3732,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'x-flight',
    fastLaneEligible: true,
  },
  {
    id: 'ride-batman-sfga',
    mapNumber: 5,
    name: 'Batman The Ride',
    type: 'ride',
    area: 'dc-universe-sfga',
    x: 0.62, y: 0.42,
    lng: -87.9332, lat: 42.3722,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'batman-the-ride-six-flags-great-america',
    fastLaneEligible: true,
  },
  {
    id: 'ride-american-eagle',
    mapNumber: 6,
    name: 'American Eagle',
    type: 'ride',
    area: 'county-fair-sfga',
    x: 0.25, y: 0.15,
    lng: -87.9380, lat: 42.3745,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'american-eagle',
  },
  {
    id: 'ride-wrath-of-rakshasa',
    mapNumber: 7,
    name: 'Wrath of Rakshasa',
    type: 'ride',
    area: 'mardi-gras-sfga',
    x: 0.72, y: 0.30,
    lng: -87.9318, lat: 42.3732,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'wrath-of-rakshasa',
    fastLaneEligible: true,
  },
  {
    id: 'ride-viper-sfga',
    mapNumber: 8,
    name: 'Viper',
    type: 'ride',
    area: 'county-fair-sfga',
    x: 0.28, y: 0.30,
    lng: -87.9376, lat: 42.3730,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'viper-six-flags-great-america',
  },
  {
    id: 'ride-whizzer',
    mapNumber: 9,
    name: 'Whizzer',
    type: 'ride',
    area: 'carousel-plaza',
    x: 0.45, y: 0.28,
    lng: -87.9353, lat: 42.3734,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'whizzer',
  },
  {
    id: 'ride-flash-vertical-velocity',
    mapNumber: 10,
    name: 'The Flash: Vertical Velocity',
    type: 'ride',
    area: 'yankee-harbor',
    x: 0.55, y: 0.55,
    lng: -87.9340, lat: 42.3710,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'the-flash-vertical-velocity-six-flags-great-america',
    fastLaneEligible: true,
  },
  {
    id: 'ride-joker-sfga',
    mapNumber: 11,
    name: 'Joker',
    type: 'ride',
    area: 'dc-universe-sfga',
    x: 0.65, y: 0.38,
    lng: -87.9328, lat: 42.3725,
    heightRequirement: { min: 52 },
    thrillLevel: 'high',
    coasterId: 'joker-six-flags-great-america',
    fastLaneEligible: true,
  },
  {
    id: 'ride-little-dipper',
    mapNumber: 12,
    name: 'Little Dipper',
    type: 'ride',
    area: 'kidzopolis',
    x: 0.40, y: 0.65,
    lng: -87.9358, lat: 42.3702,
    heightRequirement: { min: 36 },
    thrillLevel: 'low',
    coasterId: 'little-dipper',
  },
  {
    id: 'ride-sprocket-rockets',
    mapNumber: 13,
    name: 'Sprocket Rockets',
    type: 'ride',
    area: 'kidzopolis',
    x: 0.42, y: 0.62,
    lng: -87.9355, lat: 42.3705,
    heightRequirement: { min: 36 },
    thrillLevel: 'low',
    coasterId: 'sprocket-rockets',
  },
];

// ============================================
// RIDES — THRILL / FLAT RIDES
// ============================================

const THRILL_RIDES: ParkPOI[] = [
  {
    id: 'ride-revolution',
    mapNumber: 14,
    name: 'Revolution',
    type: 'ride',
    area: 'carousel-plaza',
    x: 0.52, y: 0.38,
    lng: -87.9345, lat: 42.3725,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    description: 'Giant looping pendulum ride',
  },
  {
    id: 'ride-king-chaos',
    mapNumber: 15,
    name: 'King Chaos',
    type: 'ride',
    area: 'mardi-gras-sfga',
    x: 0.70, y: 0.35,
    lng: -87.9320, lat: 42.3728,
    heightRequirement: { min: 52 },
    thrillLevel: 'aggressive',
    description: 'Giant swinging frisbee ride',
  },
  {
    id: 'ride-giant-drop',
    mapNumber: 16,
    name: 'Giant Drop',
    type: 'ride',
    area: 'southwest-territory',
    x: 0.20, y: 0.40,
    lng: -87.9386, lat: 42.3722,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    description: '227-foot free-fall drop tower',
  },
  {
    id: 'ride-roaring-rapids',
    mapNumber: 17,
    name: 'Roaring Rapids',
    type: 'ride',
    area: 'southwest-territory',
    x: 0.18, y: 0.35,
    lng: -87.9390, lat: 42.3728,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    description: 'Whitewater raft ride adventure',
  },
  {
    id: 'ride-buccaneer-battle',
    mapNumber: 18,
    name: 'Buccaneer Battle',
    type: 'ride',
    area: 'yankee-harbor',
    x: 0.58, y: 0.50,
    lng: -87.9336, lat: 42.3715,
    heightRequirement: { min: 42 },
    thrillLevel: 'mild',
    description: 'Interactive water blaster boat ride',
  },
  {
    id: 'ride-dare-devil-dive-sfga',
    mapNumber: 19,
    name: 'Dare Devil Dive',
    type: 'ride',
    area: 'carousel-plaza',
    x: 0.46, y: 0.40,
    lng: -87.9352, lat: 42.3722,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    description: 'Sky coaster free-fall swing',
  },
];

// ============================================
// FOOD
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-big-orleans',
    name: 'Big Orleans Bistro',
    type: 'food',
    area: 'mardi-gras-sfga',
    x: 0.68, y: 0.38,
    lng: -87.9322, lat: 42.3725,
    menuDescription: 'Cajun and Creole flavors',
    menuItems: ['jambalaya', 'gumbo', 'po boys', 'beignets'],
  },
  {
    id: 'food-hometown-hotdogs',
    name: 'Hometown Hot Dogs',
    type: 'food',
    area: 'hometown-square',
    x: 0.48, y: 0.72,
    lng: -87.9350, lat: 42.3696,
    menuDescription: 'Chicago-style hot dogs and fries',
    menuItems: ['chicago dogs', 'fries', 'lemonade', 'corn dogs'],
  },
  {
    id: 'food-mooseburger-lodge',
    name: 'Mooseburger Lodge',
    type: 'food',
    area: 'county-fair-sfga',
    x: 0.32, y: 0.28,
    lng: -87.9372, lat: 42.3732,
    menuDescription: 'Burgers, chicken tenders, and comfort food',
    menuItems: ['burgers', 'chicken tenders', 'fries', 'milkshakes'],
  },
  {
    id: 'food-southwest-cooking-co',
    name: 'Southwest Cooking Company',
    type: 'food',
    area: 'southwest-territory',
    x: 0.22, y: 0.38,
    lng: -87.9384, lat: 42.3724,
    menuDescription: 'Tex-Mex and southwestern fare',
    menuItems: ['tacos', 'burritos', 'nachos', 'quesadillas'],
  },
  {
    id: 'food-starbucks-sfga',
    name: 'Starbucks',
    type: 'food',
    area: 'hometown-square',
    x: 0.46, y: 0.78,
    lng: -87.9352, lat: 42.3692,
    menuDescription: 'Coffee, specialty drinks, and pastries',
    menuItems: ['coffee', 'frappuccino', 'pastries', 'iced tea'],
  },
  {
    id: 'food-dc-diner',
    name: 'DC Diner',
    type: 'food',
    area: 'dc-universe-sfga',
    x: 0.60, y: 0.40,
    lng: -87.9334, lat: 42.3722,
    menuDescription: 'Pizza, pasta, and classic American food',
    menuItems: ['pizza', 'pasta', 'garlic bread', 'salad'],
  },
  {
    id: 'food-harbor-house',
    name: 'Harbor House',
    type: 'food',
    area: 'yankee-harbor',
    x: 0.56, y: 0.52,
    lng: -87.9338, lat: 42.3712,
    menuDescription: 'Seafood and fried fish',
    menuItems: ['fish and chips', 'shrimp basket', 'coleslaw', 'clam chowder'],
  },
  {
    id: 'food-dippin-dots-sfga',
    name: "Dippin' Dots",
    type: 'food',
    area: 'carousel-plaza',
    x: 0.50, y: 0.42,
    lng: -87.9347, lat: 42.3720,
    menuDescription: 'Flash-frozen ice cream beads',
    menuItems: ['dippin dots', 'ice cream'],
  },
  {
    id: 'food-funnel-cake-sfga',
    name: 'Funnel Cake Factory',
    type: 'food',
    area: 'county-fair-sfga',
    x: 0.34, y: 0.32,
    lng: -87.9370, lat: 42.3728,
    menuDescription: 'Fresh funnel cakes and desserts',
    menuItems: ['funnel cake', 'churros', 'elephant ears'],
  },
];

// ============================================
// SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-hometown-general-store',
    name: 'Hometown General Store',
    type: 'shop',
    area: 'hometown-square',
    x: 0.47, y: 0.75,
    lng: -87.9351, lat: 42.3694,
    description: 'Main park merchandise, souvenirs, and apparel',
  },
  {
    id: 'shop-dc-comics-shop',
    name: 'DC Comics Super Store',
    type: 'shop',
    area: 'dc-universe-sfga',
    x: 0.63, y: 0.44,
    lng: -87.9330, lat: 42.3720,
    description: 'DC Comics merchandise and superhero gear',
  },
  {
    id: 'shop-southwest-traders',
    name: 'Southwest Traders',
    type: 'shop',
    area: 'southwest-territory',
    x: 0.20, y: 0.42,
    lng: -87.9387, lat: 42.3720,
    description: 'Western-themed souvenirs and novelties',
  },
  {
    id: 'shop-county-fair-gifts',
    name: 'County Fair Gifts',
    type: 'shop',
    area: 'county-fair-sfga',
    x: 0.33, y: 0.22,
    lng: -87.9371, lat: 42.3738,
    description: 'Ride photos and park merchandise',
  },
];

// ============================================
// SHOWS / ATTRACTIONS
// ============================================

const SHOWS: ParkPOI[] = [
  {
    id: 'show-grand-music-hall',
    name: 'Grand Music Hall',
    type: 'theater',
    area: 'carousel-plaza',
    x: 0.44, y: 0.38,
    lng: -87.9354, lat: 42.3725,
    description: 'Live musical performances and seasonal shows',
  },
  {
    id: 'show-dc-stunt-show',
    name: 'DC Stunt Show',
    type: 'theater',
    area: 'dc-universe-sfga',
    x: 0.64, y: 0.46,
    lng: -87.9328, lat: 42.3718,
    description: 'Live-action stunt spectacular featuring DC heroes',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  // Entrances
  {
    id: 'entrance-main-sfga',
    name: 'Main Entrance',
    type: 'service',
    area: 'hometown-square',
    x: 0.46, y: 0.88,
    lng: -87.9353, lat: 42.3685,
    description: 'Main park entrance and guest services',
  },
  // Restrooms
  {
    id: 'restroom-entrance-sfga',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'hometown-square',
    x: 0.44, y: 0.82,
    lng: -87.9355, lat: 42.3690,
    description: 'Restrooms near main entrance',
  },
  {
    id: 'restroom-county-fair',
    name: 'Restrooms (County Fair)',
    type: 'service',
    area: 'county-fair-sfga',
    x: 0.30, y: 0.26,
    lng: -87.9375, lat: 42.3734,
    description: 'Restrooms in County Fair area',
  },
  {
    id: 'restroom-dc-universe',
    name: 'Restrooms (DC Universe)',
    type: 'service',
    area: 'dc-universe-sfga',
    x: 0.62, y: 0.45,
    lng: -87.9332, lat: 42.3719,
    description: 'Restrooms in DC Universe area',
  },
  {
    id: 'restroom-mardi-gras',
    name: 'Restrooms (Mardi Gras)',
    type: 'service',
    area: 'mardi-gras-sfga',
    x: 0.72, y: 0.36,
    lng: -87.9318, lat: 42.3726,
    description: 'Restrooms in Mardi Gras area',
  },
  {
    id: 'restroom-southwest',
    name: 'Restrooms (Southwest Territory)',
    type: 'service',
    area: 'southwest-territory',
    x: 0.19, y: 0.38,
    lng: -87.9388, lat: 42.3724,
    description: 'Restrooms in Southwest Territory',
  },
  {
    id: 'restroom-yankee',
    name: 'Restrooms (Yankee Harbor)',
    type: 'service',
    area: 'yankee-harbor',
    x: 0.57, y: 0.54,
    lng: -87.9337, lat: 42.3710,
    description: 'Restrooms in Yankee Harbor',
  },
  // Guest Services
  {
    id: 'service-first-aid-sfga',
    name: 'First Aid',
    type: 'service',
    area: 'hometown-square',
    x: 0.42, y: 0.80,
    lng: -87.9357, lat: 42.3692,
    description: 'First aid and medical assistance',
  },
  {
    id: 'service-guest-relations-sfga',
    name: 'Guest Relations',
    type: 'service',
    area: 'hometown-square',
    x: 0.48, y: 0.86,
    lng: -87.9349, lat: 42.3687,
    description: 'Guest services, season pass processing, lost and found',
  },
  {
    id: 'service-flash-pass-sfga',
    name: 'Flash Pass Center',
    type: 'service',
    area: 'hometown-square',
    x: 0.50, y: 0.84,
    lng: -87.9347, lat: 42.3688,
    description: 'Flash Pass sales and pickup',
  },
  // Lockers
  {
    id: 'service-lockers-sfga',
    name: 'Lockers (Entrance)',
    type: 'service',
    area: 'hometown-square',
    x: 0.48, y: 0.90,
    lng: -87.9350, lat: 42.3683,
    approximateLocation: true,
    description: 'Rental lockers near entrance',
  },
  // ATMs
  {
    id: 'service-atm-entrance-sfga',
    name: 'ATM (Entrance)',
    type: 'service',
    area: 'hometown-square',
    x: 0.45, y: 0.85,
    lng: -87.9354, lat: 42.3688,
    description: 'ATM near main entrance',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const SIX_FLAGS_GREAT_AMERICA_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...THRILL_RIDES,
  ...FOOD,
  ...SHOPS,
  ...SHOWS,
  ...SERVICES,
];
