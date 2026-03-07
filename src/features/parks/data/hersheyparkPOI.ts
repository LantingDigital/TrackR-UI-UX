import { ParkPOI } from '../types';

// ============================================
// Hersheypark — Complete Point of Interest Database
// Source: RCDB, OpenStreetMap, Official 2025 Park Map
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 40.2890, -76.6540
// ============================================

// ============================================
// RIDES — ROLLER COASTERS
// ============================================

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-candymonium',
    mapNumber: 1,
    name: 'Candymonium',
    type: 'ride',
    area: 'chocolatetown',
    x: 0.25, y: 0.75,
    lng: -76.6587, lat: 40.2863,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'candymonium',
    fastLaneEligible: true,
  },
  {
    id: 'ride-fahrenheit',
    mapNumber: 2,
    name: 'Fahrenheit',
    type: 'ride',
    area: 'the-hollow',
    x: 0.55, y: 0.40,
    lng: -76.6552, lat: 40.2902,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'fahrenheit',
    fastLaneEligible: true,
  },
  {
    id: 'ride-skyrush',
    mapNumber: 3,
    name: 'Skyrush',
    type: 'ride',
    area: 'pioneer-frontier',
    x: 0.72, y: 0.25,
    lng: -76.6553, lat: 40.2866,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'skyrush',
    fastLaneEligible: true,
  },
  {
    id: 'ride-storm-runner',
    mapNumber: 4,
    name: 'Storm Runner',
    type: 'ride',
    area: 'midway-america',
    x: 0.60, y: 0.35,
    lng: -76.6534, lat: 40.2898,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'storm-runner',
    fastLaneEligible: true,
  },
  {
    id: 'ride-great-bear',
    mapNumber: 5,
    name: 'Great Bear',
    type: 'ride',
    area: 'midway-america',
    x: 0.65, y: 0.42,
    lng: -76.6530, lat: 40.2869,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'great-bear',
    fastLaneEligible: true,
  },
  {
    id: 'ride-superdooperlooper',
    mapNumber: 6,
    name: 'SuperDooperLooper',
    type: 'ride',
    area: 'midway-america',
    x: 0.62, y: 0.45,
    lng: -76.6547, lat: 40.2862,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'superdooperlooper',
  },
  {
    id: 'ride-comet',
    mapNumber: 7,
    name: 'Comet',
    type: 'ride',
    area: 'pioneer-frontier',
    x: 0.75, y: 0.30,
    lng: -76.6550, lat: 40.2873,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'comet-hersheypark',
  },
  {
    id: 'ride-wildcat-revenge',
    mapNumber: 8,
    name: "Wildcat's Revenge",
    type: 'ride',
    area: 'midway-america',
    x: 0.58, y: 0.32,
    lng: -76.6556, lat: 40.2925,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'wildcats-revenge',
    fastLaneEligible: true,
  },
  {
    id: 'ride-sooperdooperlooper',
    mapNumber: 9,
    name: 'Jolly Rancher Remix',
    type: 'ride',
    area: 'the-hollow',
    x: 0.50, y: 0.48,
    lng: -76.6538, lat: 40.2900,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'jolly-rancher-remix',
  },
  {
    id: 'ride-lightning-racer',
    mapNumber: 10,
    name: 'Lightning Racer',
    type: 'ride',
    area: 'pioneer-frontier',
    x: 0.78, y: 0.22,
    lng: -76.6535, lat: 40.2936,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'lightning-racer',
    fastLaneEligible: true,
  },
  {
    id: 'ride-laff-trakk',
    mapNumber: 11,
    name: 'Laff Trakk',
    type: 'ride',
    area: 'kissing-tower-hill',
    x: 0.42, y: 0.55,
    lng: -76.6552, lat: 40.2934,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'laff-trakk',
  },
  {
    id: 'ride-trailblazer',
    mapNumber: 12,
    name: 'Trailblazer',
    type: 'ride',
    area: 'pioneer-frontier',
    x: 0.70, y: 0.28,
    lng: -76.6532, lat: 40.2890,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'trailblazer',
  },
  {
    id: 'ride-cocoa-cruiser',
    mapNumber: 13,
    name: 'Cocoa Cruiser',
    type: 'ride',
    area: 'founders-way',
    x: 0.35, y: 0.65,
    lng: -76.6549, lat: 40.2884,
    heightRequirement: { min: 36 },
    thrillLevel: 'low',
  },
];

// ============================================
// RIDES — FLAT / THRILL RIDES
// ============================================

const THRILL_RIDES: ParkPOI[] = [
  {
    id: 'ride-kissing-tower',
    mapNumber: 14,
    name: 'Kissing Tower',
    type: 'ride',
    area: 'kissing-tower-hill',
    x: 0.45, y: 0.52,
    lng: -76.6522, lat: 40.2873,
    thrillLevel: 'low',
    description: 'Observation tower with panoramic views',
  },
  {
    id: 'ride-hershey-triple-tower',
    mapNumber: 15,
    name: 'Hershey Triple Tower',
    type: 'ride',
    area: 'kissing-tower-hill',
    x: 0.44, y: 0.50,
    lng: -76.6535, lat: 40.2882,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
  },
  {
    id: 'ride-wave-swinger',
    mapNumber: 16,
    name: 'Wave Swinger',
    type: 'ride',
    area: 'midway-america',
    x: 0.62, y: 0.40,
    lng: -76.6548, lat: 40.2869,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-coal-cracker',
    mapNumber: 17,
    name: 'Coal Cracker',
    type: 'ride',
    area: 'pioneer-frontier',
    x: 0.68, y: 0.32,
    lng: -76.6536, lat: 40.2869,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-tidal-force',
    mapNumber: 18,
    name: 'Tidal Force',
    type: 'ride',
    area: 'pioneer-frontier',
    x: 0.74, y: 0.26,
    lng: -76.6545, lat: 40.2914,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-chocolatier',
    name: 'The Chocolatier Restaurant',
    type: 'food',
    area: 'chocolatetown',
    x: 0.22, y: 0.80,
    lng: -76.6580, lat: 40.2860,
    menuItems: ['burgers', 'flatbreads', 'salads', 'chocolate desserts'],
    menuDescription: 'Upscale dining with Hershey chocolate desserts',
    servesAlcohol: true,
  },
  {
    id: 'food-simply-good',
    name: 'Simply Good',
    type: 'food',
    area: 'founders-way',
    x: 0.30, y: 0.68,
    lng: -76.6565, lat: 40.2870,
    menuItems: ['burgers', 'chicken tenders', 'fries', 'salad'],
    menuDescription: 'Quick-service burgers and chicken',
  },
  {
    id: 'food-spring-creek-smokehouse',
    name: 'Spring Creek Smokehouse',
    type: 'food',
    area: 'pioneer-frontier',
    x: 0.72, y: 0.28,
    lng: -76.6548, lat: 40.2875,
    menuItems: ['bbq', 'brisket', 'pulled pork', 'ribs', 'cornbread'],
    menuDescription: 'BBQ brisket, pulled pork, and ribs',
    servesAlcohol: true,
  },
  {
    id: 'food-food-hall-chocolatetown',
    name: 'Chocolatetown Food Hall',
    type: 'food',
    area: 'chocolatetown',
    x: 0.28, y: 0.78,
    lng: -76.6578, lat: 40.2862,
    menuItems: ['pizza', 'burgers', 'tacos', 'asian', 'desserts'],
    menuDescription: 'Multi-station food hall with diverse options',
  },
  {
    id: 'food-kettle-kitchen',
    name: 'Kettle Kitchen',
    type: 'food',
    area: 'the-hollow',
    x: 0.52, y: 0.45,
    lng: -76.6545, lat: 40.2885,
    menuItems: ['kettle corn', 'popcorn', 'funnel cake', 'snacks'],
    menuDescription: 'Kettle corn and park snacks',
  },
  {
    id: 'food-dippin-dots-hp',
    name: "Dippin' Dots",
    type: 'food',
    area: 'midway-america',
    x: 0.58, y: 0.38,
    lng: -76.6540, lat: 40.2890,
    menuItems: ["dippin' dots", 'ice cream'],
    menuDescription: "Dippin' Dots ice cream",
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-chocolatetown-sweet-shop',
    name: 'Chocolatetown Sweet Shop',
    type: 'shop',
    area: 'chocolatetown',
    x: 0.24, y: 0.82,
    lng: -76.6582, lat: 40.2858,
    description: 'Hershey candy and chocolate merchandise',
  },
  {
    id: 'shop-emporium-hp',
    name: 'Emporium',
    type: 'shop',
    area: 'founders-way',
    x: 0.32, y: 0.72,
    lng: -76.6562, lat: 40.2868,
    description: 'Large gift shop and park souvenirs',
  },
  {
    id: 'shop-frontier-general',
    name: 'Frontier General Store',
    type: 'shop',
    area: 'pioneer-frontier',
    x: 0.70, y: 0.30,
    lng: -76.6545, lat: 40.2893,
    description: 'Western-themed gifts',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-hp',
    name: 'Main Entrance',
    type: 'service',
    area: 'chocolatetown',
    x: 0.20, y: 0.88,
    lng: -76.6585, lat: 40.2855,
    description: 'Main park entrance',
  },
  {
    id: 'restroom-chocolatetown',
    name: 'Restrooms (Chocolatetown)',
    type: 'service',
    area: 'chocolatetown',
    x: 0.26, y: 0.82,
    lng: -76.6580, lat: 40.2860,
    approximateLocation: true,
    description: 'Restrooms in Chocolatetown',
  },
  {
    id: 'restroom-midway-hp',
    name: 'Restrooms (Midway America)',
    type: 'service',
    area: 'midway-america',
    x: 0.60, y: 0.42,
    lng: -76.6540, lat: 40.2888,
    approximateLocation: true,
    description: 'Restrooms in Midway America',
  },
  {
    id: 'restroom-pioneer-hp',
    name: 'Restrooms (Pioneer Frontier)',
    type: 'service',
    area: 'pioneer-frontier',
    x: 0.74, y: 0.28,
    lng: -76.6545, lat: 40.2900,
    approximateLocation: true,
    description: 'Restrooms in Pioneer Frontier',
  },
  {
    id: 'restroom-hollow-hp',
    name: 'Restrooms (The Hollow)',
    type: 'service',
    area: 'the-hollow',
    x: 0.52, y: 0.42,
    lng: -76.6545, lat: 40.2886,
    approximateLocation: true,
    description: 'Restrooms in The Hollow',
  },
  {
    id: 'service-first-aid-hp',
    name: 'First Aid',
    type: 'service',
    area: 'founders-way',
    x: 0.34, y: 0.65,
    lng: -76.6560, lat: 40.2873,
    description: 'First aid station',
  },
  {
    id: 'service-guest-services-hp',
    name: 'Guest Services',
    type: 'service',
    area: 'chocolatetown',
    x: 0.22, y: 0.86,
    lng: -76.6583, lat: 40.2857,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const HERSHEYPARK_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...THRILL_RIDES,
  ...FOOD,
  ...SHOPS,
  ...SERVICES,
];
