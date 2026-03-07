import { ParkPOI } from '../types';

// ============================================
// Dollywood — Complete Point of Interest Database
// Source: RCDB, OpenStreetMap, Official 2025 Park Map
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 35.7950, -83.5315
// ============================================

// ============================================
// RIDES — ROLLER COASTERS
// ============================================

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-lightning-rod',
    mapNumber: 1,
    name: 'Lightning Rod',
    type: 'ride',
    area: 'jukebox-junction',
    x: 0.35, y: 0.30,
    lng: -83.5355, lat: 35.7942,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'lightning-rod',
    fastLaneEligible: true,
  },
  {
    id: 'ride-wild-eagle',
    mapNumber: 2,
    name: 'Wild Eagle',
    type: 'ride',
    area: 'wilderness-pass',
    x: 0.65, y: 0.22,
    lng: -83.5297, lat: 35.7940,
    heightRequirement: { min: 50 },
    thrillLevel: 'aggressive',
    coasterId: 'wild-eagle',
    fastLaneEligible: true,
  },
  {
    id: 'ride-tennessee-tornado',
    mapNumber: 3,
    name: 'Tennessee Tornado',
    type: 'ride',
    area: 'craftsmans-valley',
    x: 0.75, y: 0.45,
    lng: -83.5289, lat: 35.7933,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'tennessee-tornado',
    fastLaneEligible: true,
  },
  {
    id: 'ride-mystery-mine',
    mapNumber: 4,
    name: 'Mystery Mine',
    type: 'ride',
    area: 'timber-canyon',
    x: 0.55, y: 0.35,
    lng: -83.5304, lat: 35.7954,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'mystery-mine',
    fastLaneEligible: true,
  },
  {
    id: 'ride-thunderhead',
    mapNumber: 5,
    name: 'Thunderhead',
    type: 'ride',
    area: 'timber-canyon',
    x: 0.50, y: 0.28,
    lng: -83.5320, lat: 35.7965,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'thunderhead',
    fastLaneEligible: true,
  },
  {
    id: 'ride-firechaser-express',
    mapNumber: 6,
    name: 'FireChaser Express',
    type: 'ride',
    area: 'wilderness-pass',
    x: 0.60, y: 0.30,
    lng: -83.5286, lat: 35.7942,
    heightRequirement: { min: 39 },
    thrillLevel: 'moderate',
    coasterId: 'firechaser-express',
  },
  {
    id: 'ride-blazing-fury',
    mapNumber: 7,
    name: 'Blazing Fury',
    type: 'ride',
    area: 'craftsmans-valley',
    x: 0.72, y: 0.40,
    lng: -83.5292, lat: 35.7936,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'blazing-fury',
  },
  {
    id: 'ride-dragonflier',
    mapNumber: 8,
    name: 'Dragonflier',
    type: 'ride',
    area: 'wildwood-grove',
    x: 0.82, y: 0.55,
    lng: -83.5309, lat: 35.7979,
    heightRequirement: { min: 39 },
    thrillLevel: 'moderate',
    coasterId: 'dragonflier',
  },
  {
    id: 'ride-big-bear-mountain',
    mapNumber: 9,
    name: 'Big Bear Mountain',
    type: 'ride',
    area: 'wildwood-grove',
    x: 0.85, y: 0.50,
    lng: -83.5302, lat: 35.7984,
    heightRequirement: { min: 39 },
    thrillLevel: 'moderate',
    coasterId: 'big-bear-mountain',
    fastLaneEligible: true,
  },
];

// ============================================
// RIDES — FLAT / THRILL RIDES
// ============================================

const THRILL_RIDES: ParkPOI[] = [
  {
    id: 'ride-drop-line',
    mapNumber: 10,
    name: 'Drop Line',
    type: 'ride',
    area: 'timber-canyon',
    x: 0.52, y: 0.32,
    lng: -83.5313, lat: 35.7961,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
  },
  {
    id: 'ride-barnstormer',
    mapNumber: 11,
    name: 'Barnstormer',
    type: 'ride',
    area: 'country-fair-dw',
    x: 0.42, y: 0.55,
    lng: -83.5325, lat: 35.7941,
    heightRequirement: { min: 36 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-dizzy-disk',
    mapNumber: 12,
    name: 'Dizzy Disk',
    type: 'ride',
    area: 'country-fair-dw',
    x: 0.40, y: 0.52,
    lng: -83.5320, lat: 35.7945,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-river-rampage',
    mapNumber: 13,
    name: 'Smoky Mountain River Rampage',
    type: 'ride',
    area: 'craftsmans-valley',
    x: 0.70, y: 0.42,
    lng: -83.5347, lat: 35.7932,
    heightRequirement: { min: 36 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-daredevil-falls',
    mapNumber: 14,
    name: 'Daredevil Falls',
    type: 'ride',
    area: 'craftsmans-valley',
    x: 0.68, y: 0.38,
    lng: -83.5295, lat: 35.7938,
    heightRequirement: { min: 36 },
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-whistle-punk-chaser',
    mapNumber: 15,
    name: 'Whistle Punk Chaser',
    type: 'ride',
    area: 'timber-canyon',
    x: 0.54, y: 0.38,
    lng: -83.5314, lat: 35.7965,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
  },
  {
    id: 'ride-treetop-tower',
    mapNumber: 16,
    name: 'Treetop Tower',
    type: 'ride',
    area: 'wildwood-grove',
    x: 0.80, y: 0.52,
    lng: -83.5308, lat: 35.7962,
    thrillLevel: 'low',
    description: 'Observation tower in Wildwood Grove',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-front-porch-cafe',
    name: 'Front Porch Cafe',
    type: 'food',
    area: 'showstreet',
    x: 0.28, y: 0.78,
    lng: -83.5330, lat: 35.7935,
    menuItems: ['cinnamon bread', 'pastries', 'coffee', 'breakfast'],
    menuDescription: 'Famous cinnamon bread and pastries',
  },
  {
    id: 'food-aunt-grannys',
    name: "Aunt Granny's Buffet",
    type: 'food',
    area: 'showstreet',
    x: 0.25, y: 0.72,
    lng: -83.5332, lat: 35.7940,
    menuItems: ['buffet', 'southern food', 'fried chicken', 'biscuits', 'country ham'],
    menuDescription: 'Southern buffet with fried chicken and country ham',
    servesAlcohol: false,
  },
  {
    id: 'food-hickory-house-bbq',
    name: 'Hickory House BBQ',
    type: 'food',
    area: 'craftsmans-valley',
    x: 0.68, y: 0.42,
    lng: -83.5295, lat: 35.7935,
    menuItems: ['bbq', 'pulled pork', 'ribs', 'brisket', 'cornbread'],
    menuDescription: 'Smoky Mountain BBQ pulled pork and ribs',
  },
  {
    id: 'food-red-rooster',
    name: 'Red Rooster Sandwich Shop',
    type: 'food',
    area: 'jukebox-junction',
    x: 0.38, y: 0.35,
    lng: -83.5322, lat: 35.7962,
    menuItems: ['sandwiches', 'wraps', 'salad'],
    menuDescription: 'Sandwiches and wraps',
  },
  {
    id: 'food-grannys-country-kitchen',
    name: "Granny's Country Kitchen",
    type: 'food',
    area: 'country-fair-dw',
    x: 0.44, y: 0.58,
    lng: -83.5315, lat: 35.7940,
    menuItems: ['fried chicken', 'mashed potatoes', 'gravy', 'biscuits', 'southern food'],
    menuDescription: 'Southern fried chicken dinner',
  },
  {
    id: 'food-lumber-jacks-pizza',
    name: "Lumber Jack's Pizza",
    type: 'food',
    area: 'timber-canyon',
    x: 0.52, y: 0.35,
    lng: -83.5308, lat: 35.7960,
    menuItems: ['pizza', 'salad', 'breadsticks'],
    menuDescription: 'Pizza and salads',
  },
  {
    id: 'food-till-and-harvest',
    name: 'Till & Harvest',
    type: 'food',
    area: 'wildwood-grove',
    x: 0.78, y: 0.58,
    lng: -83.5305, lat: 35.7975,
    menuItems: ['burgers', 'chicken tenders', 'salad', 'fries'],
    menuDescription: 'Farm-to-table burgers and chicken',
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-showstreet-emporium',
    name: 'Showstreet Emporium',
    type: 'shop',
    area: 'showstreet',
    x: 0.30, y: 0.75,
    lng: -83.5328, lat: 35.7938,
    description: 'Main park gift shop and Dolly merchandise',
  },
  {
    id: 'shop-valley-wood-carvers',
    name: 'Valley Wood Carvers',
    type: 'shop',
    area: 'craftsmans-valley',
    x: 0.72, y: 0.44,
    lng: -83.5293, lat: 35.7935,
    description: 'Handcrafted wood carvings and gifts',
  },
  {
    id: 'shop-dolly-closet',
    name: "Dolly's Closet",
    type: 'shop',
    area: 'showstreet',
    x: 0.26, y: 0.70,
    lng: -83.5333, lat: 35.7942,
    description: 'Dolly Parton merchandise and apparel',
  },
];

// ============================================
// THEATERS & ATTRACTIONS
// ============================================

const THEATERS_AND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-dollys-home-on-wheels',
    name: "Dolly's Home-on-Wheels",
    type: 'attraction',
    area: 'showstreet',
    x: 0.30, y: 0.80,
    lng: -83.5328, lat: 35.7933,
    description: "Replica of Dolly Parton's tour bus",
  },
  {
    id: 'attraction-chasing-rainbows',
    name: 'Chasing Rainbows Museum',
    type: 'attraction',
    area: 'showstreet',
    x: 0.32, y: 0.76,
    lng: -83.5326, lat: 35.7937,
    description: 'Museum of Dolly Parton memorabilia',
  },
  {
    id: 'attraction-showstreet-palace',
    name: 'Showstreet Palace Theater',
    type: 'theater',
    area: 'showstreet',
    x: 0.28, y: 0.68,
    lng: -83.5330, lat: 35.7943,
    description: 'Main performance theater',
  },
  {
    id: 'attraction-back-porch-theater',
    name: 'Back Porch Theater',
    type: 'theater',
    area: 'adventures-in-imagination',
    x: 0.22, y: 0.62,
    lng: -83.5338, lat: 35.7948,
    description: 'Live music and comedy shows',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-dw',
    name: 'Main Entrance',
    type: 'service',
    area: 'showstreet',
    x: 0.25, y: 0.88,
    lng: -83.5335, lat: 35.7928,
    description: 'Main park entrance',
  },
  {
    id: 'restroom-showstreet',
    name: 'Restrooms (Showstreet)',
    type: 'service',
    area: 'showstreet',
    x: 0.28, y: 0.82,
    lng: -83.5330, lat: 35.7932,
    approximateLocation: true,
    description: 'Restrooms on Showstreet',
  },
  {
    id: 'restroom-timber-canyon',
    name: 'Restrooms (Timber Canyon)',
    type: 'service',
    area: 'timber-canyon',
    x: 0.52, y: 0.36,
    lng: -83.5308, lat: 35.7958,
    approximateLocation: true,
    description: 'Restrooms in Timber Canyon',
  },
  {
    id: 'restroom-craftsmans',
    name: 'Restrooms (Craftsman\'s Valley)',
    type: 'service',
    area: 'craftsmans-valley',
    x: 0.70, y: 0.45,
    lng: -83.5295, lat: 35.7935,
    approximateLocation: true,
    description: "Restrooms in Craftsman's Valley",
  },
  {
    id: 'restroom-wildwood',
    name: 'Restrooms (Wildwood Grove)',
    type: 'service',
    area: 'wildwood-grove',
    x: 0.82, y: 0.56,
    lng: -83.5305, lat: 35.7975,
    approximateLocation: true,
    description: 'Restrooms in Wildwood Grove',
  },
  {
    id: 'service-first-aid-dw',
    name: 'First Aid',
    type: 'service',
    area: 'showstreet',
    x: 0.24, y: 0.85,
    lng: -83.5336, lat: 35.7930,
    description: 'First aid station',
  },
  {
    id: 'service-guest-services-dw',
    name: 'Guest Services',
    type: 'service',
    area: 'showstreet',
    x: 0.26, y: 0.90,
    lng: -83.5334, lat: 35.7926,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const DOLLYWOOD_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...THRILL_RIDES,
  ...FOOD,
  ...SHOPS,
  ...THEATERS_AND_ATTRACTIONS,
  ...SERVICES,
];
