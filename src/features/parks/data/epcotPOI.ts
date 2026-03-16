import { ParkPOI } from '../types';

// ============================================
// EPCOT — Complete Point of Interest Database
// Source: Official 2025 Park Map, RCDB, Wikipedia
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 28.3747, -81.5494
// EPCOT layout: circular World Showcase Lagoon in the north half,
// World Celebration/Discovery/Nature neighborhoods in the south half,
// entrance at the very south (Spaceship Earth).
// ============================================

// ============================================
// RIDES — ROLLER COASTERS
// ============================================

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-cosmic-rewind',
    mapNumber: 1,
    name: 'Guardians of the Galaxy: Cosmic Rewind',
    type: 'ride',
    area: 'world-discovery',
    x: 0.65, y: 0.55,
    lng: -81.5478, lat: 28.3747,
    heightRequirement: { min: 42 },
    thrillLevel: 'aggressive',
    coasterId: 'guardians-of-the-galaxy-cosmic-rewind',
    fastLaneEligible: true,
  },
];

// ============================================
// RIDES — MAJOR ATTRACTIONS
// ============================================

const MAJOR_RIDES: ParkPOI[] = [
  {
    id: 'ride-test-track',
    mapNumber: 2,
    name: 'Test Track',
    type: 'ride',
    area: 'world-discovery',
    x: 0.70, y: 0.60,
    lng: -81.5474, lat: 28.3737,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'High-speed vehicle design and testing experience reaching 65 mph',
  },
  {
    id: 'ride-mission-space',
    mapNumber: 3,
    name: 'Mission: SPACE',
    type: 'ride',
    area: 'world-discovery',
    x: 0.72, y: 0.52,
    lng: -81.5470, lat: 28.3745,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    description: 'Simulated space mission to Mars (Orange: intense, Green: mild)',
  },
  {
    id: 'ride-spaceship-earth',
    mapNumber: 4,
    name: 'Spaceship Earth',
    type: 'ride',
    area: 'world-celebration',
    x: 0.50, y: 0.85,
    lng: -81.5494, lat: 28.3755,
    thrillLevel: 'low',
    description: 'Iconic geodesphere dark ride through the history of communication',
  },
  {
    id: 'ride-frozen-ever-after',
    mapNumber: 5,
    name: 'Frozen Ever After',
    type: 'ride',
    area: 'world-showcase-norway',
    x: 0.35, y: 0.42,
    lng: -81.5520, lat: 28.3730,
    heightRequirement: { min: 0 },
    thrillLevel: 'mild',
    description: 'Boat ride through the world of Frozen',
  },
  {
    id: 'ride-remys-ratatouille',
    mapNumber: 6,
    name: "Remy's Ratatouille Adventure",
    type: 'ride',
    area: 'world-showcase-france',
    x: 0.58, y: 0.18,
    lng: -81.5488, lat: 28.3685,
    thrillLevel: 'mild',
    description: 'Trackless dark ride shrunk to the size of a rat',
  },
  {
    id: 'ride-soarin',
    mapNumber: 7,
    name: "Soarin' Around the World",
    type: 'ride',
    area: 'world-nature',
    x: 0.32, y: 0.58,
    lng: -81.5525, lat: 28.3740,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Simulated hang-gliding over world landmarks',
  },
  {
    id: 'ride-living-with-the-land',
    mapNumber: 8,
    name: 'Living with the Land',
    type: 'ride',
    area: 'world-nature',
    x: 0.30, y: 0.60,
    lng: -81.5528, lat: 28.3738,
    thrillLevel: 'low',
    description: 'Boat ride through working greenhouses and agriculture',
  },
  {
    id: 'ride-seas-nemo',
    mapNumber: 9,
    name: 'The Seas with Nemo & Friends',
    type: 'ride',
    area: 'world-nature',
    x: 0.28, y: 0.55,
    lng: -81.5530, lat: 28.3745,
    thrillLevel: 'low',
    description: 'Clamshell ride through the undersea world of Finding Nemo',
  },
  {
    id: 'ride-figment',
    mapNumber: 10,
    name: 'Journey Into Imagination with Figment',
    type: 'ride',
    area: 'world-celebration',
    x: 0.42, y: 0.62,
    lng: -81.5510, lat: 28.3735,
    thrillLevel: 'low',
    description: 'Whimsical dark ride with the beloved dragon Figment',
  },
  {
    id: 'ride-gran-fiesta-tour',
    mapNumber: 11,
    name: 'Gran Fiesta Tour Starring the Three Caballeros',
    type: 'ride',
    area: 'world-showcase-mexico',
    x: 0.28, y: 0.45,
    lng: -81.5535, lat: 28.3725,
    thrillLevel: 'low',
    description: 'Boat ride inside the Mexico pyramid',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  // World Showcase dining (one per country)
  {
    id: 'food-san-angel-inn',
    name: 'San Angel Inn Restaurante',
    type: 'food',
    area: 'world-showcase-mexico',
    x: 0.27, y: 0.44,
    lng: -81.5536, lat: 28.3726,
    menuItems: ['tacos', 'mole', 'enchiladas', 'margaritas'],
    menuDescription: 'Mexican dining inside the pyramid',
    servesAlcohol: true,
  },
  {
    id: 'food-akershus',
    name: 'Akershus Royal Banquet Hall',
    type: 'food',
    area: 'world-showcase-norway',
    x: 0.34, y: 0.40,
    lng: -81.5522, lat: 28.3728,
    menuItems: ['norwegian buffet', 'salmon', 'meatballs'],
    menuDescription: 'Princess character dining with Norwegian cuisine',
    servesAlcohol: true,
  },
  {
    id: 'food-nine-dragons',
    name: 'Nine Dragons Restaurant',
    type: 'food',
    area: 'world-showcase-china',
    x: 0.30, y: 0.35,
    lng: -81.5530, lat: 28.3720,
    menuItems: ['dim sum', 'fried rice', 'kung pao', 'noodles'],
    menuDescription: 'Chinese cuisine with views of World Showcase Lagoon',
    servesAlcohol: true,
  },
  {
    id: 'food-biergarten',
    name: 'Biergarten Restaurant',
    type: 'food',
    area: 'world-showcase-germany',
    x: 0.38, y: 0.28,
    lng: -81.5515, lat: 28.3710,
    menuItems: ['bratwurst', 'schnitzel', 'pretzels', 'beer'],
    menuDescription: 'German buffet with live entertainment',
    servesAlcohol: true,
  },
  {
    id: 'food-via-napoli',
    name: 'Via Napoli Ristorante e Pizzeria',
    type: 'food',
    area: 'world-showcase-italy',
    x: 0.45, y: 0.22,
    lng: -81.5505, lat: 28.3700,
    menuItems: ['pizza', 'pasta', 'wine', 'tiramisu'],
    menuDescription: 'Wood-fired Neapolitan pizza',
    servesAlcohol: true,
  },
  {
    id: 'food-teppan-edo',
    name: 'Teppan Edo',
    type: 'food',
    area: 'world-showcase-japan',
    x: 0.58, y: 0.22,
    lng: -81.5485, lat: 28.3700,
    menuItems: ['teppanyaki', 'sushi', 'sake', 'miso'],
    menuDescription: 'Japanese teppanyaki with tableside cooking',
    servesAlcohol: true,
  },
  {
    id: 'food-spice-road-table',
    name: 'Spice Road Table',
    type: 'food',
    area: 'world-showcase-morocco',
    x: 0.62, y: 0.25,
    lng: -81.5480, lat: 28.3705,
    menuItems: ['hummus', 'lamb', 'falafel', 'moroccan wine'],
    menuDescription: 'Mediterranean small plates on the lagoon',
    servesAlcohol: true,
  },
  {
    id: 'food-les-halles',
    name: 'Les Halles Boulangerie-Patisserie',
    type: 'food',
    area: 'world-showcase-france',
    x: 0.60, y: 0.20,
    lng: -81.5483, lat: 28.3690,
    menuItems: ['croissants', 'quiche', 'pastries', 'sandwiches', 'macarons'],
    menuDescription: 'French bakery and pastries',
  },
  {
    id: 'food-rose-crown',
    name: 'Rose & Crown Dining Room',
    type: 'food',
    area: 'world-showcase-uk',
    x: 0.65, y: 0.28,
    lng: -81.5475, lat: 28.3708,
    menuItems: ['fish and chips', 'bangers and mash', 'beer', 'scotch egg'],
    menuDescription: 'British pub fare with lagoon views',
    servesAlcohol: true,
  },
  {
    id: 'food-le-cellier',
    name: 'Le Cellier Steakhouse',
    type: 'food',
    area: 'world-showcase-canada',
    x: 0.70, y: 0.35,
    lng: -81.5468, lat: 28.3715,
    menuItems: ['steak', 'poutine', 'cheddar cheese soup', 'filet mignon'],
    menuDescription: 'Canadian steakhouse in a wine cellar setting',
    servesAlcohol: true,
  },
  // World Celebration/Discovery/Nature dining
  {
    id: 'food-space-220',
    name: 'Space 220 Restaurant',
    type: 'food',
    area: 'world-discovery',
    x: 0.68, y: 0.58,
    lng: -81.5476, lat: 28.3740,
    menuItems: ['steak', 'seafood', 'cocktails', 'fine dining'],
    menuDescription: 'Fine dining with simulated space station views',
    servesAlcohol: true,
  },
  {
    id: 'food-sunshine-seasons',
    name: 'Sunshine Seasons',
    type: 'food',
    area: 'world-nature',
    x: 0.31, y: 0.59,
    lng: -81.5527, lat: 28.3739,
    menuItems: ['salads', 'sandwiches', 'asian', 'grilled items'],
    menuDescription: 'Food court in The Land pavilion',
  },
  {
    id: 'food-connections-eatery',
    name: 'Connections Eatery',
    type: 'food',
    area: 'world-celebration',
    x: 0.52, y: 0.72,
    lng: -81.5492, lat: 28.3748,
    menuItems: ['burgers', 'pizza', 'salads', 'pasta'],
    menuDescription: 'Quick-service near Spaceship Earth',
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-creations',
    name: 'Creations Shop',
    type: 'shop',
    area: 'world-celebration',
    x: 0.48, y: 0.78,
    lng: -81.5496, lat: 28.3752,
    description: 'Main EPCOT merchandise and souvenirs',
  },
  {
    id: 'shop-mitsukoshi',
    name: 'Mitsukoshi Department Store',
    type: 'shop',
    area: 'world-showcase-japan',
    x: 0.57, y: 0.24,
    lng: -81.5486, lat: 28.3702,
    description: 'Japanese merchandise, snacks, and pearl experience',
  },
  {
    id: 'shop-mouse-gear',
    name: 'Mouse Gear',
    type: 'shop',
    area: 'world-discovery',
    x: 0.62, y: 0.65,
    lng: -81.5482, lat: 28.3735,
    description: 'Disney merchandise and apparel',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-epcot',
    name: 'Main Entrance',
    type: 'service',
    area: 'world-celebration',
    x: 0.50, y: 0.95,
    lng: -81.5494, lat: 28.3765,
    description: 'Main park entrance',
  },
  {
    id: 'restroom-entrance-epcot',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'world-celebration',
    x: 0.48, y: 0.90,
    lng: -81.5496, lat: 28.3762,
    approximateLocation: true,
  },
  {
    id: 'restroom-discovery-epcot',
    name: 'Restrooms (World Discovery)',
    type: 'service',
    area: 'world-discovery',
    x: 0.66, y: 0.58,
    lng: -81.5477, lat: 28.3738,
    approximateLocation: true,
  },
  {
    id: 'restroom-nature-epcot',
    name: 'Restrooms (World Nature)',
    type: 'service',
    area: 'world-nature',
    x: 0.30, y: 0.56,
    lng: -81.5528, lat: 28.3742,
    approximateLocation: true,
  },
  {
    id: 'restroom-mexico-epcot',
    name: 'Restrooms (Mexico)',
    type: 'service',
    area: 'world-showcase-mexico',
    x: 0.26, y: 0.43,
    lng: -81.5538, lat: 28.3727,
    approximateLocation: true,
  },
  {
    id: 'restroom-america-epcot',
    name: 'Restrooms (America)',
    type: 'service',
    area: 'world-showcase-america',
    x: 0.50, y: 0.18,
    lng: -81.5498, lat: 28.3695,
    approximateLocation: true,
  },
  {
    id: 'restroom-uk-epcot',
    name: 'Restrooms (United Kingdom)',
    type: 'service',
    area: 'world-showcase-uk',
    x: 0.66, y: 0.30,
    lng: -81.5474, lat: 28.3710,
    approximateLocation: true,
  },
  {
    id: 'service-first-aid-epcot',
    name: 'First Aid',
    type: 'service',
    area: 'world-discovery',
    x: 0.60, y: 0.68,
    lng: -81.5484, lat: 28.3732,
    description: 'First aid station near Test Track',
    approximateLocation: true,
  },
  {
    id: 'service-guest-services-epcot',
    name: 'Guest Relations',
    type: 'service',
    area: 'world-celebration',
    x: 0.52, y: 0.88,
    lng: -81.5492, lat: 28.3760,
    description: 'Guest relations and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const EPCOT_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...MAJOR_RIDES,
  ...FOOD,
  ...SHOPS,
  ...SERVICES,
];
