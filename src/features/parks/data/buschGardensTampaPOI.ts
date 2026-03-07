import { ParkPOI } from '../types';

// ============================================
// Busch Gardens Tampa Bay — Complete Point of Interest Database
// Source: RCDB, OpenStreetMap, Official 2025 Park Map
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 28.0370, -82.4215
// ============================================

// ============================================
// RIDES — ROLLER COASTERS
// ============================================

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-iron-gwazi',
    mapNumber: 1,
    name: 'Iron Gwazi',
    type: 'ride',
    area: 'pantopia',
    x: 0.55, y: 0.35,
    lng: -82.4234, lat: 28.0345,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'iron-gwazi',
    fastLaneEligible: true,
  },
  {
    id: 'ride-sheikra',
    mapNumber: 2,
    name: 'SheiKra',
    type: 'ride',
    area: 'stanleyville',
    x: 0.65, y: 0.45,
    lng: -82.4249, lat: 28.0366,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'sheikra',
    fastLaneEligible: true,
  },
  {
    id: 'ride-montu',
    mapNumber: 3,
    name: 'Montu',
    type: 'ride',
    area: 'egypt',
    x: 0.30, y: 0.25,
    lng: -82.4174, lat: 28.0346,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'montu',
    fastLaneEligible: true,
  },
  {
    id: 'ride-kumba',
    mapNumber: 4,
    name: 'Kumba',
    type: 'ride',
    area: 'congo',
    x: 0.40, y: 0.40,
    lng: -82.4232, lat: 28.0397,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'kumba',
    fastLaneEligible: true,
  },
  {
    id: 'ride-cheetah-hunt',
    mapNumber: 5,
    name: 'Cheetah Hunt',
    type: 'ride',
    area: 'pantopia',
    x: 0.50, y: 0.28,
    lng: -82.4208, lat: 28.0342,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'cheetah-hunt',
    fastLaneEligible: true,
  },
  {
    id: 'ride-cobra-curse',
    mapNumber: 6,
    name: "Cobra's Curse",
    type: 'ride',
    area: 'egypt',
    x: 0.28, y: 0.32,
    lng: -82.4186, lat: 28.0347,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'cobras-curse',
  },
  {
    id: 'ride-tigris',
    mapNumber: 7,
    name: 'Tigris',
    type: 'ride',
    area: 'stanleyville',
    x: 0.62, y: 0.50,
    lng: -82.4250, lat: 28.0377,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'tigris',
    fastLaneEligible: true,
  },
  {
    id: 'ride-scorpion',
    mapNumber: 8,
    name: 'Scorpion',
    type: 'ride',
    area: 'pantopia',
    x: 0.52, y: 0.38,
    lng: -82.4234, lat: 28.0375,
    heightRequirement: { min: 42 },
    thrillLevel: 'high',
    coasterId: 'scorpion-busch-gardens',
  },
  {
    id: 'ride-sand-serpent',
    mapNumber: 9,
    name: 'Sand Serpent',
    type: 'ride',
    area: 'pantopia',
    x: 0.48, y: 0.32,
    lng: -82.4224, lat: 28.0385,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'sand-serpent',
  },
  {
    id: 'ride-air-grover',
    mapNumber: 10,
    name: 'Air Grover',
    type: 'ride',
    area: 'sesame-street-safari',
    x: 0.72, y: 0.68,
    lng: -82.4253, lat: 28.0345,
    heightRequirement: { min: 38, withCompanion: 35 },
    thrillLevel: 'mild',
    coasterId: 'air-grover',
  },
];

// ============================================
// RIDES — FLAT / THRILL RIDES
// ============================================

const THRILL_RIDES: ParkPOI[] = [
  {
    id: 'ride-falcon-fury',
    mapNumber: 11,
    name: "Falcon's Fury",
    type: 'ride',
    area: 'pantopia',
    x: 0.54, y: 0.30,
    lng: -82.4222, lat: 28.0370,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
  },
  {
    id: 'ride-congo-river-rapids',
    mapNumber: 12,
    name: 'Congo River Rapids',
    type: 'ride',
    area: 'congo',
    x: 0.42, y: 0.45,
    lng: -82.4235, lat: 28.0390,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-stanley-falls',
    mapNumber: 13,
    name: 'Stanley Falls',
    type: 'ride',
    area: 'stanleyville',
    x: 0.60, y: 0.52,
    lng: -82.4248, lat: 28.0372,
    heightRequirement: { min: 46 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-phoenix',
    mapNumber: 14,
    name: 'Phoenix',
    type: 'ride',
    area: 'egypt',
    x: 0.32, y: 0.28,
    lng: -82.4178, lat: 28.0392,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-serengeti-flyer',
    mapNumber: 15,
    name: 'Serengeti Flyer',
    type: 'ride',
    area: 'nairobi',
    x: 0.38, y: 0.48,
    lng: -82.4185, lat: 28.0365,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
  },
  {
    id: 'ride-jungle-flyers',
    mapNumber: 16,
    name: 'Jungle Flyers',
    type: 'ride',
    area: 'jungala',
    x: 0.45, y: 0.55,
    lng: -82.4192, lat: 28.0355,
    heightRequirement: { min: 38 },
    thrillLevel: 'mild',
  },
  {
    id: 'ride-skyride-bgt',
    mapNumber: 17,
    name: 'Skyride',
    type: 'ride',
    area: 'congo',
    x: 0.44, y: 0.42,
    lng: -82.4192, lat: 28.0372,
    thrillLevel: 'low',
  },
  {
    id: 'ride-serengeti-express',
    mapNumber: 18,
    name: 'Serengeti Express',
    type: 'ride',
    area: 'nairobi',
    x: 0.35, y: 0.50,
    lng: -82.4182, lat: 28.0362,
    thrillLevel: 'low',
    description: 'Train ride through the Serengeti Plain',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-zambia-smokehouse',
    name: 'Zambia Smokehouse',
    type: 'food',
    area: 'stanleyville',
    x: 0.62, y: 0.48,
    lng: -82.4212, lat: 28.0362,
    menuItems: ['bbq', 'ribs', 'chicken', 'brisket', 'smoked turkey'],
    menuDescription: 'Smoked BBQ ribs, chicken, and brisket',
    servesAlcohol: true,
  },
  {
    id: 'food-dragon-fire-grill',
    name: 'Dragon Fire Grill',
    type: 'food',
    area: 'pantopia',
    x: 0.50, y: 0.35,
    lng: -82.4198, lat: 28.0382,
    menuItems: ['burgers', 'chicken', 'salad', 'tacos'],
    menuDescription: 'Burgers, grilled chicken, and tacos',
    servesAlcohol: true,
  },
  {
    id: 'food-zagoras-cafe',
    name: "Zagora's Cafe",
    type: 'food',
    area: 'morocco',
    x: 0.20, y: 0.72,
    lng: -82.4162, lat: 28.0338,
    menuItems: ['pizza', 'pasta', 'salad', 'chicken tenders'],
    menuDescription: 'Moroccan-themed cafe with pizza and pasta',
  },
  {
    id: 'food-twisted-tails-pretzels',
    name: 'Twisted Tails Pretzels',
    type: 'food',
    area: 'congo',
    x: 0.40, y: 0.44,
    lng: -82.4188, lat: 28.0372,
    menuItems: ['pretzels', 'snacks'],
    menuDescription: 'Soft pretzels and snacks',
  },
  {
    id: 'food-rescue-cafe',
    name: 'Rescue Cafe',
    type: 'food',
    area: 'nairobi',
    x: 0.36, y: 0.52,
    lng: -82.4183, lat: 28.0360,
    menuItems: ['burgers', 'chicken tenders', 'fries'],
    menuDescription: 'Burgers and chicken tenders',
  },
  {
    id: 'food-garden-gate-cafe',
    name: 'Garden Gate Cafe',
    type: 'food',
    area: 'bird-gardens',
    x: 0.75, y: 0.75,
    lng: -82.4228, lat: 28.0332,
    menuItems: ['coffee', 'pastries', 'sandwiches'],
    menuDescription: 'Coffee, pastries, and light fare',
  },
  {
    id: 'food-dippin-dots-bgt',
    name: "Dippin' Dots",
    type: 'food',
    area: 'pantopia',
    x: 0.52, y: 0.32,
    lng: -82.4200, lat: 28.0386,
    menuItems: ["dippin' dots", 'ice cream'],
    menuDescription: "Dippin' Dots ice cream",
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-marrakesh-market',
    name: 'Marrakesh Market',
    type: 'shop',
    area: 'morocco',
    x: 0.22, y: 0.70,
    lng: -82.4165, lat: 28.0340,
    description: 'Moroccan-themed gifts and souvenirs',
  },
  {
    id: 'shop-xcursions',
    name: 'Xcursions',
    type: 'shop',
    area: 'morocco',
    x: 0.18, y: 0.75,
    lng: -82.4160, lat: 28.0335,
    description: 'Main park gift shop',
  },
  {
    id: 'shop-sheikra-shop',
    name: 'SheiKra Shop',
    type: 'shop',
    area: 'stanleyville',
    x: 0.64, y: 0.46,
    lng: -82.4214, lat: 28.0364,
    description: 'SheiKra ride photos and merchandise',
  },
  {
    id: 'shop-emporium-bgt',
    name: 'Emporium',
    type: 'shop',
    area: 'bird-gardens',
    x: 0.78, y: 0.72,
    lng: -82.4230, lat: 28.0335,
    description: 'Large gift shop and souvenirs',
  },
];

// ============================================
// THEATERS & ATTRACTIONS
// ============================================

const THEATERS_AND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-serengeti-safari',
    name: 'Serengeti Safari',
    type: 'attraction',
    area: 'nairobi',
    x: 0.35, y: 0.45,
    lng: -82.4182, lat: 28.0368,
    description: 'Open-air truck safari tour of the Serengeti Plain',
  },
  {
    id: 'attraction-edge-of-africa',
    name: 'Edge of Africa',
    type: 'attraction',
    area: 'egypt',
    x: 0.26, y: 0.35,
    lng: -82.4170, lat: 28.0385,
    description: 'Walk-through animal habitats',
  },
  {
    id: 'attraction-moroccan-palace-theater',
    name: 'Moroccan Palace Theater',
    type: 'theater',
    area: 'morocco',
    x: 0.24, y: 0.68,
    lng: -82.4168, lat: 28.0342,
    description: 'Indoor theater for live shows',
  },
  {
    id: 'attraction-gwazi-gliders',
    name: 'Gwazi Gliders',
    type: 'attraction',
    area: 'pantopia',
    x: 0.56, y: 0.33,
    lng: -82.4204, lat: 28.0387,
    description: 'Interactive zipline experience',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-bgt',
    name: 'Main Entrance',
    type: 'service',
    area: 'morocco',
    x: 0.18, y: 0.82,
    lng: -82.4158, lat: 28.0328,
    description: 'Main park entrance',
  },
  {
    id: 'restroom-morocco',
    name: 'Restrooms (Morocco)',
    type: 'service',
    area: 'morocco',
    x: 0.20, y: 0.78,
    lng: -82.4162, lat: 28.0332,
    approximateLocation: true,
    description: 'Restrooms in Morocco',
  },
  {
    id: 'restroom-egypt',
    name: 'Restrooms (Egypt)',
    type: 'service',
    area: 'egypt',
    x: 0.28, y: 0.30,
    lng: -82.4172, lat: 28.0390,
    approximateLocation: true,
    description: 'Restrooms in Egypt',
  },
  {
    id: 'restroom-congo',
    name: 'Restrooms (Congo)',
    type: 'service',
    area: 'congo',
    x: 0.42, y: 0.42,
    lng: -82.4190, lat: 28.0374,
    approximateLocation: true,
    description: 'Restrooms in Congo',
  },
  {
    id: 'restroom-stanleyville',
    name: 'Restrooms (Stanleyville)',
    type: 'service',
    area: 'stanleyville',
    x: 0.62, y: 0.55,
    lng: -82.4212, lat: 28.0355,
    approximateLocation: true,
    description: 'Restrooms in Stanleyville',
  },
  {
    id: 'service-first-aid-bgt',
    name: 'First Aid',
    type: 'service',
    area: 'nairobi',
    x: 0.34, y: 0.55,
    lng: -82.4180, lat: 28.0358,
    description: 'First aid station',
  },
  {
    id: 'service-guest-services-bgt',
    name: 'Guest Services',
    type: 'service',
    area: 'morocco',
    x: 0.16, y: 0.80,
    lng: -82.4156, lat: 28.0330,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const BUSCH_GARDENS_TAMPA_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...THRILL_RIDES,
  ...FOOD,
  ...SHOPS,
  ...THEATERS_AND_ATTRACTIONS,
  ...SERVICES,
];
