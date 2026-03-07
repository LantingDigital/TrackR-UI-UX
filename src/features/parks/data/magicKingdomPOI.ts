import { ParkPOI } from '../types';

// ============================================
// Walt Disney World Magic Kingdom — Complete Point of Interest Database
// Source: OpenStreetMap, Official 2025 Park Map
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 28.4177, -81.5812
// ============================================

// ============================================
// RIDES — ROLLER COASTERS
// ============================================

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-space-mountain',
    mapNumber: 1,
    name: 'Space Mountain',
    type: 'ride',
    area: 'tomorrowland',
    x: 0.72, y: 0.35,
    lng: -81.5772, lat: 28.4192,
    heightRequirement: { min: 44 },
    thrillLevel: 'moderate',
    coasterId: 'space-mountain-wdw',
  },
  {
    id: 'ride-tron-lightcycle',
    mapNumber: 2,
    name: 'TRON Lightcycle / Run',
    type: 'ride',
    area: 'tomorrowland',
    x: 0.78, y: 0.25,
    lng: -81.5767, lat: 28.4205,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'tron-lightcycle-run',
  },
  {
    id: 'ride-big-thunder-mountain',
    mapNumber: 3,
    name: 'Big Thunder Mountain Railroad',
    type: 'ride',
    area: 'frontierland-mk',
    x: 0.22, y: 0.25,
    lng: -81.5847, lat: 28.4203,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'big-thunder-mountain-railroad-wdw',
  },
  {
    id: 'ride-seven-dwarfs',
    mapNumber: 4,
    name: 'Seven Dwarfs Mine Train',
    type: 'ride',
    area: 'fantasyland',
    x: 0.55, y: 0.18,
    lng: -81.5801, lat: 28.4206,
    heightRequirement: { min: 38 },
    thrillLevel: 'moderate',
    coasterId: 'seven-dwarfs-mine-train',
  },
  {
    id: 'ride-barnstormer-mk',
    mapNumber: 5,
    name: 'The Barnstormer',
    type: 'ride',
    area: 'fantasyland',
    x: 0.62, y: 0.22,
    lng: -81.5784, lat: 28.4206,
    heightRequirement: { min: 35 },
    thrillLevel: 'mild',
    coasterId: 'the-barnstormer',
  },
];

// ============================================
// RIDES — MAJOR ATTRACTIONS
// ============================================

const MAJOR_RIDES: ParkPOI[] = [
  {
    id: 'ride-pirates-caribbean',
    mapNumber: 6,
    name: 'Pirates of the Caribbean',
    type: 'ride',
    area: 'adventureland',
    x: 0.28, y: 0.52,
    lng: -81.5849, lat: 28.4177,
    thrillLevel: 'low',
  },
  {
    id: 'ride-jungle-cruise',
    mapNumber: 7,
    name: 'Jungle Cruise',
    type: 'ride',
    area: 'adventureland',
    x: 0.25, y: 0.48,
    lng: -81.5835, lat: 28.4179,
    thrillLevel: 'low',
  },
  {
    id: 'ride-splash-mountain',
    mapNumber: 8,
    name: 'Tiana\'s Bayou Adventure',
    type: 'ride',
    area: 'frontierland-mk',
    x: 0.18, y: 0.32,
    lng: -81.5851, lat: 28.4192,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-haunted-mansion',
    mapNumber: 9,
    name: 'Haunted Mansion',
    type: 'ride',
    area: 'liberty-square',
    x: 0.35, y: 0.28,
    lng: -81.5829, lat: 28.4209,
    thrillLevel: 'low',
  },
  {
    id: 'ride-its-a-small-world',
    mapNumber: 10,
    name: "it's a small world",
    type: 'ride',
    area: 'fantasyland',
    x: 0.50, y: 0.22,
    lng: -81.5820, lat: 28.4208,
    thrillLevel: 'low',
  },
  {
    id: 'ride-peter-pans-flight',
    mapNumber: 11,
    name: "Peter Pan's Flight",
    type: 'ride',
    area: 'fantasyland',
    x: 0.48, y: 0.28,
    lng: -81.5820, lat: 28.4202,
    thrillLevel: 'low',
  },
  {
    id: 'ride-buzz-lightyear',
    mapNumber: 12,
    name: "Buzz Lightyear's Space Ranger Spin",
    type: 'ride',
    area: 'tomorrowland',
    x: 0.68, y: 0.40,
    lng: -81.5798, lat: 28.4180,
    thrillLevel: 'low',
  },
  {
    id: 'ride-tomorrowland-speedway',
    mapNumber: 13,
    name: 'Tomorrowland Speedway',
    type: 'ride',
    area: 'tomorrowland',
    x: 0.75, y: 0.30,
    lng: -81.5793, lat: 28.4194,
    heightRequirement: { min: 32 },
    thrillLevel: 'low',
  },
  {
    id: 'ride-people-mover',
    mapNumber: 14,
    name: 'Tomorrowland Transit Authority PeopleMover',
    type: 'ride',
    area: 'tomorrowland',
    x: 0.70, y: 0.38,
    lng: -81.5792, lat: 28.4185,
    thrillLevel: 'low',
  },
  {
    id: 'ride-dumbo',
    mapNumber: 15,
    name: 'Dumbo the Flying Elephant',
    type: 'ride',
    area: 'fantasyland',
    x: 0.60, y: 0.20,
    lng: -81.5789, lat: 28.4204,
    thrillLevel: 'low',
  },
  {
    id: 'ride-magic-carpets',
    mapNumber: 16,
    name: 'The Magic Carpets of Aladdin',
    type: 'ride',
    area: 'adventureland',
    x: 0.30, y: 0.50,
    lng: -81.5835, lat: 28.4185,
    thrillLevel: 'low',
  },
  {
    id: 'ride-under-the-sea',
    mapNumber: 17,
    name: 'Under the Sea ~ Journey of The Little Mermaid',
    type: 'ride',
    area: 'fantasyland',
    x: 0.58, y: 0.15,
    lng: -81.5799, lat: 28.4213,
    thrillLevel: 'low',
  },
  {
    id: 'ride-mad-tea-party',
    mapNumber: 18,
    name: 'Mad Tea Party',
    type: 'ride',
    area: 'fantasyland',
    x: 0.55, y: 0.25,
    lng: -81.5798, lat: 28.4200,
    thrillLevel: 'mild',
  },
  {
    id: 'ride-prince-charming-regal-carrousel',
    mapNumber: 19,
    name: 'Prince Charming Regal Carrousel',
    type: 'ride',
    area: 'fantasyland',
    x: 0.48, y: 0.32,
    lng: -81.5812, lat: 28.4201,
    thrillLevel: 'low',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-be-our-guest',
    name: 'Be Our Guest Restaurant',
    type: 'food',
    area: 'fantasyland',
    x: 0.52, y: 0.18,
    lng: -81.5811, lat: 28.4212,
    menuItems: ['french onion soup', 'steak', 'pork chop', 'desserts'],
    menuDescription: 'Table-service dining in Beast\'s Castle',
    servesAlcohol: true,
  },
  {
    id: 'food-cosmic-rays',
    name: "Cosmic Ray's Starlight Cafe",
    type: 'food',
    area: 'tomorrowland',
    x: 0.65, y: 0.42,
    lng: -81.5799, lat: 28.4182,
    menuItems: ['burgers', 'chicken', 'hot dogs', 'salad', 'fries'],
    menuDescription: 'Largest counter-service restaurant in Magic Kingdom',
  },
  {
    id: 'food-pecos-bills',
    name: "Pecos Bill Tall Tale Inn and Cafe",
    type: 'food',
    area: 'frontierland-mk',
    x: 0.28, y: 0.42,
    lng: -81.5840, lat: 28.4186,
    menuItems: ['burgers', 'nachos', 'rice bowls', 'fajitas'],
    menuDescription: 'Tex-Mex style burgers and nachos',
  },
  {
    id: 'food-columbia-harbour-house',
    name: 'Columbia Harbour House',
    type: 'food',
    area: 'liberty-square',
    x: 0.38, y: 0.35,
    lng: -81.5821, lat: 28.4198,
    menuItems: ['fish', 'lobster roll', 'fried shrimp', 'chicken nuggets', 'clam chowder'],
    menuDescription: 'New England seafood and fried fare',
  },
  {
    id: 'food-aloha-isle',
    name: 'Aloha Isle',
    type: 'food',
    area: 'adventureland',
    x: 0.32, y: 0.48,
    lng: -81.5836, lat: 28.4183,
    menuItems: ['dole whip', 'pineapple float', 'frozen treats'],
    menuDescription: 'Famous Dole Whip frozen treats',
  },
  {
    id: 'food-casey-corner',
    name: "Casey's Corner",
    type: 'food',
    area: 'main-street-usa',
    x: 0.52, y: 0.62,
    lng: -81.5808, lat: 28.4168,
    menuItems: ['hot dogs', 'corn dog nuggets', 'fries'],
    menuDescription: 'Baseball-themed hot dog stand on Main Street',
  },
  {
    id: 'food-sleepy-hollow',
    name: 'Sleepy Hollow Refreshments',
    type: 'food',
    area: 'liberty-square',
    x: 0.40, y: 0.42,
    lng: -81.5824, lat: 28.4192,
    menuItems: ['funnel cake', 'waffles', 'ice cream', 'fruit'],
    menuDescription: 'Funnel cakes and waffle sandwiches',
  },
  {
    id: 'food-main-street-bakery',
    name: 'Main Street Bakery (Starbucks)',
    type: 'food',
    area: 'main-street-usa',
    x: 0.48, y: 0.65,
    lng: -81.5812, lat: 28.4165,
    menuItems: ['coffee', 'starbucks', 'pastries', 'muffins', 'cookies'],
    menuDescription: 'Starbucks coffee and fresh baked goods',
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-emporium-mk',
    name: 'The Emporium',
    type: 'shop',
    area: 'main-street-usa',
    x: 0.45, y: 0.68,
    lng: -81.5815, lat: 28.4168,
    description: 'Largest shop in Magic Kingdom, Disney merchandise',
  },
  {
    id: 'shop-memento-mori',
    name: 'Memento Mori',
    type: 'shop',
    area: 'liberty-square',
    x: 0.36, y: 0.30,
    lng: -81.5827, lat: 28.4205,
    description: 'Haunted Mansion-themed merchandise',
  },
  {
    id: 'shop-big-top-souvenirs',
    name: 'Big Top Souvenirs',
    type: 'shop',
    area: 'fantasyland',
    x: 0.58, y: 0.22,
    lng: -81.5790, lat: 28.4208,
    description: 'Fantasyland gifts and souvenirs',
  },
  {
    id: 'shop-merchant-of-venus',
    name: 'Merchant of Venus',
    type: 'shop',
    area: 'tomorrowland',
    x: 0.68, y: 0.38,
    lng: -81.5795, lat: 28.4183,
    description: 'Tomorrowland merchandise and novelties',
  },
];

// ============================================
// THEATERS & ATTRACTIONS
// ============================================

const THEATERS_AND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-cinderella-castle',
    name: 'Cinderella Castle',
    type: 'attraction',
    area: 'fantasyland',
    x: 0.48, y: 0.40,
    lng: -81.5812, lat: 28.4195,
    description: 'Iconic park landmark',
  },
  {
    id: 'attraction-country-bear-jamboree',
    name: 'Country Bear Jamboree',
    type: 'theater',
    area: 'frontierland-mk',
    x: 0.25, y: 0.40,
    lng: -81.5842, lat: 28.4188,
    description: 'Audio-animatronic musical show',
  },
  {
    id: 'attraction-enchanted-tiki-room',
    name: 'Walt Disney\'s Enchanted Tiki Room',
    type: 'theater',
    area: 'adventureland',
    x: 0.30, y: 0.55,
    lng: -81.5839, lat: 28.4184,
    description: 'Classic audio-animatronic show',
  },
  {
    id: 'attraction-hall-of-presidents',
    name: 'The Hall of Presidents',
    type: 'theater',
    area: 'liberty-square',
    x: 0.32, y: 0.32,
    lng: -81.5821, lat: 28.4197,
    description: 'Audio-animatronic presidential show',
  },
  {
    id: 'attraction-mickeys-philharmagic',
    name: "Mickey's PhilharMagic",
    type: 'theater',
    area: 'fantasyland',
    x: 0.50, y: 0.30,
    lng: -81.5817, lat: 28.4200,
    description: '3D animated musical show',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-mk',
    name: 'Main Entrance',
    type: 'service',
    area: 'main-street-usa',
    x: 0.48, y: 0.88,
    lng: -81.5812, lat: 28.4148,
    description: 'Main park entrance and tunnel',
  },
  {
    id: 'restroom-main-street-mk',
    name: 'Restrooms (Main Street)',
    type: 'service',
    area: 'main-street-usa',
    x: 0.50, y: 0.72,
    lng: -81.5810, lat: 28.4158,
    approximateLocation: true,
    description: 'Restrooms on Main Street USA',
  },
  {
    id: 'restroom-adventureland',
    name: 'Restrooms (Adventureland)',
    type: 'service',
    area: 'adventureland',
    x: 0.28, y: 0.55,
    lng: -81.5838, lat: 28.4182,
    approximateLocation: true,
    description: 'Restrooms in Adventureland',
  },
  {
    id: 'restroom-fantasyland',
    name: 'Restrooms (Fantasyland)',
    type: 'service',
    area: 'fantasyland',
    x: 0.56, y: 0.20,
    lng: -81.5795, lat: 28.4208,
    approximateLocation: true,
    description: 'Restrooms in Fantasyland',
  },
  {
    id: 'restroom-tomorrowland',
    name: 'Restrooms (Tomorrowland)',
    type: 'service',
    area: 'tomorrowland',
    x: 0.72, y: 0.40,
    lng: -81.5795, lat: 28.4185,
    approximateLocation: true,
    description: 'Restrooms in Tomorrowland',
  },
  {
    id: 'restroom-frontierland',
    name: 'Restrooms (Frontierland)',
    type: 'service',
    area: 'frontierland-mk',
    x: 0.20, y: 0.38,
    lng: -81.5845, lat: 28.4193,
    approximateLocation: true,
    description: 'Restrooms in Frontierland',
  },
  {
    id: 'service-first-aid-mk',
    name: 'First Aid',
    type: 'service',
    area: 'main-street-usa',
    x: 0.52, y: 0.60,
    lng: -81.5808, lat: 28.4170,
    description: 'First aid station behind Main Street',
  },
  {
    id: 'service-guest-services-mk',
    name: 'Guest Relations',
    type: 'service',
    area: 'main-street-usa',
    x: 0.46, y: 0.85,
    lng: -81.5815, lat: 28.4150,
    description: 'Guest relations and City Hall',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const MAGIC_KINGDOM_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...MAJOR_RIDES,
  ...FOOD,
  ...SHOPS,
  ...THEATERS_AND_ATTRACTIONS,
  ...SERVICES,
];
