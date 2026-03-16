import { ParkPOI } from '../types';

// ============================================
// Universal Studios Florida — Complete Point of Interest Database
// Source: Official 2025 Park Map, Wikipedia, OpenStreetMap
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 28.4752, -81.4670
// Layout: clockwise loop from entrance through themed areas
// ============================================

// ============================================
// RIDES — PRODUCTION CENTRAL / MINION LAND
// ============================================

const PRODUCTION_CENTRAL_RIDES: ParkPOI[] = [
  {
    id: 'ride-villain-con-minion-blast',
    mapNumber: 1,
    name: "Illumination's Villain-Con Minion Blast",
    type: 'ride',
    area: 'production-central',
    x: 0.30, y: 0.75,
    lng: -81.4685, lat: 28.4741,
    thrillLevel: 'mild',
    description: 'Interactive gaming dark ride with Minions',
  },
  {
    id: 'ride-despicable-me-usf',
    mapNumber: 2,
    name: 'Despicable Me Minion Mayhem',
    type: 'ride',
    area: 'production-central',
    x: 0.28, y: 0.70,
    lng: -81.4688, lat: 28.4745,
    heightRequirement: { min: 40 },
    thrillLevel: 'mild',
    description: '3D motion simulator with the Minions',
  },
  {
    id: 'ride-fast-and-furious-drift-usf',
    mapNumber: 3,
    name: 'Fast & Furious: Hollywood Drift',
    type: 'ride',
    area: 'production-central',
    x: 0.22, y: 0.60,
    lng: -81.4695, lat: 28.4753,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'fast-and-furious-hollywood-drift-usf',
    underConstruction: true,
    description: 'Coaster replacing Hollywood Rip Ride Rockit (opening 2027)',
  },
];

// ============================================
// RIDES — NEW YORK
// ============================================

const NEW_YORK_RIDES: ParkPOI[] = [
  {
    id: 'ride-revenge-of-the-mummy-usf',
    mapNumber: 4,
    name: 'Revenge of the Mummy',
    type: 'ride',
    area: 'new-york',
    x: 0.35, y: 0.48,
    lng: -81.4680, lat: 28.4760,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'revenge-of-the-mummy-universal-studios-florida',
    description: 'High-speed indoor coaster through Ancient Egypt',
  },
  {
    id: 'ride-transformers-usf',
    mapNumber: 5,
    name: 'TRANSFORMERS: The Ride 3D',
    type: 'ride',
    area: 'new-york',
    x: 0.32, y: 0.55,
    lng: -81.4683, lat: 28.4755,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    description: 'Ultra-immersive 3D dark ride with Autobots',
  },
  {
    id: 'ride-race-through-new-york',
    mapNumber: 6,
    name: 'Race Through New York Starring Jimmy Fallon',
    type: 'ride',
    area: 'new-york',
    x: 0.38, y: 0.52,
    lng: -81.4676, lat: 28.4758,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Flying theater ride through New York City',
  },
];

// ============================================
// RIDES — SAN FRANCISCO
// ============================================

const SAN_FRANCISCO_RIDES: ParkPOI[] = [
  {
    id: 'ride-fast-and-furious-supercharged',
    mapNumber: 7,
    name: 'Fast & Furious: Supercharged',
    type: 'ride',
    area: 'san-francisco',
    x: 0.48, y: 0.38,
    lng: -81.4668, lat: 28.4768,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Bus-based motion ride through Fast & Furious action',
  },
];

// ============================================
// RIDES — DIAGON ALLEY
// ============================================

const DIAGON_ALLEY_RIDES: ParkPOI[] = [
  {
    id: 'ride-escape-from-gringotts',
    mapNumber: 8,
    name: 'Harry Potter and the Escape from Gringotts',
    type: 'ride',
    area: 'diagon-alley',
    x: 0.58, y: 0.30,
    lng: -81.4658, lat: 28.4774,
    heightRequirement: { min: 42 },
    thrillLevel: 'high',
    description: 'Hybrid coaster and 3D dark ride in Gringotts bank',
  },
  {
    id: 'ride-hogwarts-express-kings-cross',
    mapNumber: 9,
    name: "Hogwarts Express - King's Cross Station",
    type: 'ride',
    area: 'diagon-alley',
    x: 0.55, y: 0.25,
    lng: -81.4661, lat: 28.4778,
    thrillLevel: 'low',
    description: 'Immersive train to Islands of Adventure (park-to-park ticket required)',
  },
];

// ============================================
// RIDES — WORLD EXPO / SPRINGFIELD
// ============================================

const WORLD_EXPO_RIDES: ParkPOI[] = [
  {
    id: 'ride-men-in-black',
    mapNumber: 10,
    name: 'MEN IN BLACK Alien Attack',
    type: 'ride',
    area: 'world-expo',
    x: 0.68, y: 0.42,
    lng: -81.4645, lat: 28.4765,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    description: 'Interactive dark ride shooting aliens through New York',
  },
  {
    id: 'ride-simpsons-ride-usf',
    mapNumber: 11,
    name: 'The Simpsons Ride',
    type: 'ride',
    area: 'springfield-usf',
    x: 0.72, y: 0.50,
    lng: -81.4640, lat: 28.4760,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Motion simulator through Springfield with the Simpson family',
  },
  {
    id: 'ride-kang-and-kodos',
    mapNumber: 12,
    name: "Kang & Kodos' Twirl 'n' Hurl",
    type: 'ride',
    area: 'springfield-usf',
    x: 0.74, y: 0.52,
    lng: -81.4638, lat: 28.4758,
    thrillLevel: 'low',
    description: 'Spinning ride with Simpsons aliens',
  },
];

// ============================================
// RIDES — DREAMWORKS LAND / HOLLYWOOD
// ============================================

const OTHER_RIDES: ParkPOI[] = [
  {
    id: 'ride-et-adventure',
    mapNumber: 13,
    name: 'E.T. Adventure',
    type: 'ride',
    area: 'dreamworks-land',
    x: 0.82, y: 0.62,
    lng: -81.4628, lat: 28.4748,
    thrillLevel: 'low',
    description: 'Classic dark ride flying with E.T. to his home planet',
  },
  {
    id: 'ride-dreamworks-trolls',
    mapNumber: 14,
    name: 'DreamWorks Destination',
    type: 'ride',
    area: 'dreamworks-land',
    x: 0.80, y: 0.65,
    lng: -81.4630, lat: 28.4745,
    thrillLevel: 'low',
    description: 'Interactive character meet and play area',
  },
];

// ============================================
// SHOWS & ATTRACTIONS
// ============================================

const SHOWS_AND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-bourne-stuntacular',
    name: 'The Bourne Stuntacular',
    type: 'theater',
    area: 'hollywood-usf',
    x: 0.85, y: 0.72,
    lng: -81.4625, lat: 28.4738,
    description: 'Live-action stunt show blending stage and screen',
  },
  {
    id: 'attraction-horror-makeup-show',
    name: 'Universal Orlando Horror Make-Up Show',
    type: 'theater',
    area: 'new-york',
    x: 0.40, y: 0.58,
    lng: -81.4674, lat: 28.4753,
    description: 'Comedy show about movie horror effects',
  },
  {
    id: 'attraction-animal-actors-usf',
    name: 'Animal Actors On Location!',
    type: 'theater',
    area: 'dreamworks-land',
    x: 0.78, y: 0.60,
    lng: -81.4632, lat: 28.4750,
    description: 'Live animal performance show',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-leaky-cauldron',
    name: 'Leaky Cauldron',
    type: 'food',
    area: 'diagon-alley',
    x: 0.56, y: 0.32,
    lng: -81.4660, lat: 28.4772,
    menuItems: ['fish & chips', 'shepherds pie', 'bangers & mash', 'butterbeer', 'soup'],
    menuDescription: 'British pub fare in the heart of Diagon Alley',
    servesAlcohol: true,
  },
  {
    id: 'food-florean-fortescues',
    name: "Florean Fortescue's Ice-Cream Parlour",
    type: 'food',
    area: 'diagon-alley',
    x: 0.60, y: 0.28,
    lng: -81.4656, lat: 28.4776,
    menuItems: ['ice cream', 'butterbeer ice cream', 'desserts'],
    menuDescription: 'Wizarding World ice cream with unique flavors',
  },
  {
    id: 'food-finnegans',
    name: "Finnegan's Bar and Grill",
    type: 'food',
    area: 'new-york',
    x: 0.36, y: 0.50,
    lng: -81.4678, lat: 28.4759,
    menuItems: ['bangers & mash', 'shepherds pie', 'fish & chips', 'burgers', 'beer'],
    menuDescription: 'Irish-American pub with classic fare',
    servesAlcohol: true,
  },
  {
    id: 'food-lombards',
    name: "Lombard's Seafood Grille",
    type: 'food',
    area: 'san-francisco',
    x: 0.50, y: 0.40,
    lng: -81.4666, lat: 28.4766,
    menuItems: ['seafood', 'fish', 'shrimp', 'crab', 'steak'],
    menuDescription: 'Full-service seafood restaurant on the lagoon',
    servesAlcohol: true,
  },
  {
    id: 'food-krusty-burger-usf',
    name: 'Krusty Burger',
    type: 'food',
    area: 'springfield-usf',
    x: 0.70, y: 0.48,
    lng: -81.4642, lat: 28.4762,
    menuItems: ['burgers', 'fries', 'chicken sandwiches', 'hot dogs'],
    menuDescription: 'Simpsons-themed burgers and fast food',
  },
  {
    id: 'food-moes-tavern-usf',
    name: "Moe's Tavern",
    type: 'food',
    area: 'springfield-usf',
    x: 0.71, y: 0.50,
    lng: -81.4641, lat: 28.4760,
    menuItems: ['duff beer', 'flaming moe', 'cocktails'],
    menuDescription: "Duff Beer and Flaming Moe's",
    servesAlcohol: true,
  },
  {
    id: 'food-lard-lad-donuts-usf',
    name: 'Lard Lad Donuts',
    type: 'food',
    area: 'springfield-usf',
    x: 0.73, y: 0.52,
    lng: -81.4639, lat: 28.4758,
    menuItems: ['donuts', 'giant donut', 'pink donut'],
    menuDescription: 'Big Pink Donut and other treats',
  },
  {
    id: 'food-london-taxi-hut',
    name: 'London Taxi Hut',
    type: 'food',
    area: 'diagon-alley',
    x: 0.54, y: 0.26,
    lng: -81.4662, lat: 28.4777,
    menuItems: ['jacket potatoes', 'shepherds pie', 'beans', 'broccoli cheese'],
    menuDescription: 'Jacket potatoes with British toppings',
  },
  {
    id: 'food-mels-drive-in',
    name: "Mel's Drive-In",
    type: 'food',
    area: 'hollywood-usf',
    x: 0.84, y: 0.74,
    lng: -81.4626, lat: 28.4736,
    menuItems: ['burgers', 'cobb salad', 'milkshakes', 'fries'],
    menuDescription: "50's themed diner with burgers and shakes",
  },
  {
    id: 'food-minions-cafe-usf',
    name: 'Minions Cafe',
    type: 'food',
    area: 'production-central',
    x: 0.26, y: 0.72,
    lng: -81.4690, lat: 28.4743,
    menuItems: ['burgers', 'tots', 'chicken', 'banana pudding'],
    menuDescription: 'Minion-themed quick service dining',
  },
  {
    id: 'food-central-park-crepes',
    name: 'Central Park Crepes',
    type: 'food',
    area: 'hollywood-usf',
    x: 0.86, y: 0.70,
    lng: -81.4623, lat: 28.4740,
    menuItems: ['crepes', 'brisket crepe', 'lemon blueberry', 'savory crepes'],
    menuDescription: 'Sweet and savory crepes',
  },
  {
    id: 'food-starbucks-usf',
    name: 'Starbucks',
    type: 'food',
    area: 'new-york',
    x: 0.34, y: 0.58,
    lng: -81.4682, lat: 28.4753,
    menuItems: ['coffee', 'latte', 'espresso', 'frappuccino'],
    menuDescription: 'Starbucks coffee and beverages',
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-weasleys-wizard-wheezes',
    name: "Weasleys' Wizard Wheezes",
    type: 'shop',
    area: 'diagon-alley',
    x: 0.58, y: 0.30,
    lng: -81.4658, lat: 28.4774,
    description: 'Jokes, tricks, and Wizarding World novelties',
  },
  {
    id: 'shop-ollivanders-usf',
    name: 'Ollivanders',
    type: 'shop',
    area: 'diagon-alley',
    x: 0.57, y: 0.28,
    lng: -81.4659, lat: 28.4776,
    description: 'Interactive wand experience and shop',
  },
  {
    id: 'shop-borgin-and-burkes',
    name: 'Borgin and Burkes',
    type: 'shop',
    area: 'diagon-alley',
    x: 0.62, y: 0.32,
    lng: -81.4654, lat: 28.4772,
    description: 'Dark Arts merchandise in Knockturn Alley',
  },
  {
    id: 'shop-quality-quidditch',
    name: 'Quality Quidditch Supplies',
    type: 'shop',
    area: 'diagon-alley',
    x: 0.59, y: 0.26,
    lng: -81.4657, lat: 28.4778,
    description: 'Quidditch gear and broom replicas',
  },
  {
    id: 'shop-universal-studios-store-usf',
    name: 'Universal Studios Store',
    type: 'shop',
    area: 'production-central',
    x: 0.24, y: 0.80,
    lng: -81.4692, lat: 28.4737,
    description: 'Main park merchandise and souvenirs',
  },
  {
    id: 'shop-kwik-e-mart-usf',
    name: 'Kwik-E-Mart',
    type: 'shop',
    area: 'springfield-usf',
    x: 0.72, y: 0.54,
    lng: -81.4640, lat: 28.4756,
    description: 'Simpsons-themed gifts and Squishees',
  },
  {
    id: 'shop-supply-vault',
    name: 'Supply Vault',
    type: 'shop',
    area: 'production-central',
    x: 0.26, y: 0.68,
    lng: -81.4690, lat: 28.4747,
    description: 'Minion-themed merchandise',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-usf',
    name: 'Main Entrance',
    type: 'service',
    area: 'production-central',
    x: 0.22, y: 0.85,
    lng: -81.4695, lat: 28.4733,
    description: 'Main park entrance from CityWalk',
  },
  {
    id: 'restroom-production-central',
    name: 'Restrooms (Production Central)',
    type: 'service',
    area: 'production-central',
    x: 0.25, y: 0.78,
    lng: -81.4692, lat: 28.4738,
    approximateLocation: true,
    description: 'Restrooms near park entrance',
  },
  {
    id: 'restroom-new-york',
    name: 'Restrooms (New York)',
    type: 'service',
    area: 'new-york',
    x: 0.38, y: 0.55,
    lng: -81.4676, lat: 28.4755,
    approximateLocation: true,
    description: 'Restrooms in New York area',
  },
  {
    id: 'restroom-san-francisco',
    name: 'Restrooms (San Francisco)',
    type: 'service',
    area: 'san-francisco',
    x: 0.50, y: 0.42,
    lng: -81.4666, lat: 28.4764,
    approximateLocation: true,
    description: 'Restrooms in San Francisco area',
  },
  {
    id: 'restroom-diagon-alley',
    name: 'Restrooms (Diagon Alley)',
    type: 'service',
    area: 'diagon-alley',
    x: 0.54, y: 0.34,
    lng: -81.4662, lat: 28.4770,
    approximateLocation: true,
    description: 'Restrooms near Diagon Alley',
  },
  {
    id: 'restroom-springfield-usf',
    name: 'Restrooms (Springfield)',
    type: 'service',
    area: 'springfield-usf',
    x: 0.74, y: 0.55,
    lng: -81.4638, lat: 28.4756,
    approximateLocation: true,
    description: 'Restrooms in Springfield area',
  },
  {
    id: 'restroom-dreamworks-land',
    name: 'Restrooms (DreamWorks Land)',
    type: 'service',
    area: 'dreamworks-land',
    x: 0.80, y: 0.63,
    lng: -81.4630, lat: 28.4747,
    approximateLocation: true,
    description: 'Restrooms in DreamWorks Land',
  },
  {
    id: 'service-first-aid-usf',
    name: 'First Aid',
    type: 'service',
    area: 'new-york',
    x: 0.40, y: 0.60,
    lng: -81.4674, lat: 28.4751,
    description: 'First aid station',
  },
  {
    id: 'service-guest-services-usf',
    name: 'Guest Services',
    type: 'service',
    area: 'production-central',
    x: 0.20, y: 0.88,
    lng: -81.4697, lat: 28.4730,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const UNIVERSAL_STUDIOS_FLORIDA_POI: ParkPOI[] = [
  ...PRODUCTION_CENTRAL_RIDES,
  ...NEW_YORK_RIDES,
  ...SAN_FRANCISCO_RIDES,
  ...DIAGON_ALLEY_RIDES,
  ...WORLD_EXPO_RIDES,
  ...OTHER_RIDES,
  ...SHOWS_AND_ATTRACTIONS,
  ...FOOD,
  ...SHOPS,
  ...SERVICES,
];
