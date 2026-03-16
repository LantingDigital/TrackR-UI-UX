import { ParkPOI } from '../types';

// ============================================
// LEGOLAND Florida — Complete Point of Interest Database
// Source: Official Park Map, Wikipedia, OpenStreetMap
//
// Park center: 27.9889, -81.6913
// Located in Winter Haven, FL
// Layout: 14+ themed areas, built on former Cypress Gardens site
// ============================================

// ============================================
// THE BEGINNING (Park Entrance)
// ============================================

const THE_BEGINNING: ParkPOI[] = [
  {
    id: 'attraction-legoland-story-llf',
    name: 'The LEGOLAND Story',
    type: 'attraction',
    area: 'the-beginning-llf',
    x: 0.50, y: 0.88,
    lng: -81.6913, lat: 27.9858,
    description: 'Museum-style attraction telling the history of LEGO and LEGOLAND',
  },
  {
    id: 'ride-island-in-the-sky-llf',
    mapNumber: 1,
    name: 'Island in the Sky',
    type: 'ride',
    area: 'the-beginning-llf',
    x: 0.52, y: 0.82,
    lng: -81.6910, lat: 27.9864,
    thrillLevel: 'low',
    description: 'Rotating observation tower — 150 feet above the park for panoramic views',
  },
];

// ============================================
// FUN TOWN
// ============================================

const FUN_TOWN_RIDES: ParkPOI[] = [
  {
    id: 'ride-grand-carousel-llf',
    mapNumber: 2,
    name: 'The Grand Carousel',
    type: 'ride',
    area: 'fun-town-llf',
    x: 0.48, y: 0.75,
    lng: -81.6916, lat: 27.9871,
    thrillLevel: 'low',
    description: 'Classic double-decker carousel in the heart of Fun Town',
  },
  {
    id: 'ride-factory-tour-llf',
    name: 'LEGO Factory Tour',
    type: 'attraction',
    area: 'fun-town-llf',
    x: 0.45, y: 0.73,
    lng: -81.6920, lat: 27.9873,
    description: 'See how LEGO bricks are made and get a free souvenir brick',
  },
];

const FUN_TOWN_FOOD: ParkPOI[] = [
  {
    id: 'food-fun-town-pizza-llf',
    name: 'Fun Town Pizza & Pasta Buffet',
    type: 'food',
    area: 'fun-town-llf',
    x: 0.46, y: 0.76,
    lng: -81.6918, lat: 27.9870,
    menuItems: ['pizza', 'pasta', 'salad', 'breadsticks', 'buffet'],
    menuDescription: 'All-you-can-eat pizza, pasta, salads, and breadsticks',
  },
  {
    id: 'food-grannys-apple-fries-llf',
    name: "Granny's Apple Fries",
    type: 'food',
    area: 'fun-town-llf',
    x: 0.50, y: 0.74,
    lng: -81.6913, lat: 27.9872,
    menuItems: ['apple fries', 'cinnamon sugar', 'desserts'],
    menuDescription: 'Famous warm apple fries dusted with cinnamon sugar',
  },
];

const FUN_TOWN_SHOPS: ParkPOI[] = [
  {
    id: 'shop-big-shop-llf',
    name: 'The Big Shop',
    type: 'shop',
    area: 'fun-town-llf',
    x: 0.47, y: 0.78,
    lng: -81.6917, lat: 27.9868,
    description: 'The largest LEGO store at LEGOLAND Florida',
  },
];

// ============================================
// DUPLO VALLEY
// ============================================

const DUPLO_VALLEY: ParkPOI[] = [
  {
    id: 'ride-duplo-train-llf',
    mapNumber: 3,
    name: 'DUPLO Train',
    type: 'ride',
    area: 'duplo-valley-llf',
    x: 0.55, y: 0.70,
    lng: -81.6907, lat: 27.9876,
    thrillLevel: 'low',
    description: 'Fun train journey through a LEGO countryside with farms and campgrounds',
  },
  {
    id: 'ride-duplo-tractor-llf',
    name: 'DUPLO Tractor',
    type: 'ride',
    area: 'duplo-valley-llf',
    x: 0.57, y: 0.68,
    lng: -81.6904, lat: 27.9878,
    thrillLevel: 'low',
    description: 'Gentle tractor ride for the youngest guests',
  },
  {
    id: 'ride-duplo-tot-spot-llf',
    name: 'DUPLO Tot Spot',
    type: 'attraction',
    area: 'duplo-valley-llf',
    x: 0.56, y: 0.72,
    lng: -81.6906, lat: 27.9874,
    description: 'Toddler play area with oversized DUPLO bricks',
  },
];

// ============================================
// LEGO GALAXY (New 2026)
// ============================================

const LEGO_GALAXY_RIDES: ParkPOI[] = [
  {
    id: 'ride-galacticoaster-llf',
    mapNumber: 4,
    name: 'Galacticoaster',
    type: 'ride',
    area: 'lego-galaxy-llf',
    x: 0.62, y: 0.62,
    lng: -81.6898, lat: 27.9884,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'galacticoaster-llf',
    description: 'Indoor family coaster — customizable LEGO spacecraft through an interstellar mission',
  },
  {
    id: 'ride-galaxy-spin-llf',
    mapNumber: 5,
    name: 'Galaxy Spin',
    type: 'ride',
    area: 'lego-galaxy-llf',
    x: 0.60, y: 0.60,
    lng: -81.6901, lat: 27.9886,
    thrillLevel: 'mild',
    description: 'Cosmic spinning ride in LEGO Galaxy',
  },
];

const LEGO_GALAXY_FOOD: ParkPOI[] = [
  {
    id: 'food-cosmic-bites-llf',
    name: 'Cosmic Bites',
    type: 'food',
    area: 'lego-galaxy-llf',
    x: 0.61, y: 0.64,
    lng: -81.6900, lat: 27.9882,
    menuItems: ['space food', 'snacks', 'drinks'],
    menuDescription: 'Space-themed snacks and treats',
  },
];

const LEGO_GALAXY_SHOPS: ParkPOI[] = [
  {
    id: 'shop-galactic-gear-llf',
    name: 'Galactic Gear',
    type: 'shop',
    area: 'lego-galaxy-llf',
    x: 0.63, y: 0.63,
    lng: -81.6897, lat: 27.9883,
    description: 'Space-themed LEGO sets and merchandise',
  },
];

// ============================================
// LEGO KINGDOMS
// ============================================

const KINGDOMS_RIDES: ParkPOI[] = [
  {
    id: 'ride-the-dragon-llf',
    mapNumber: 6,
    name: 'The Dragon',
    type: 'ride',
    area: 'lego-kingdoms-llf',
    x: 0.40, y: 0.55,
    lng: -81.6927, lat: 27.9891,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'the-dragon-llf',
    description: 'Indoor/outdoor roller coaster through an enchanted LEGOLAND Castle',
  },
  {
    id: 'ride-royal-joust-llf',
    mapNumber: 7,
    name: 'The Joust',
    type: 'ride',
    area: 'lego-kingdoms-llf',
    x: 0.38, y: 0.53,
    lng: -81.6930, lat: 27.9893,
    heightRequirement: { min: 36 },
    thrillLevel: 'low',
    description: 'LEGO horse ride through the enchanted forest',
  },
  {
    id: 'ride-merlin-challenge-llf',
    mapNumber: 8,
    name: "Merlin's Challenge",
    type: 'ride',
    area: 'lego-kingdoms-llf',
    x: 0.42, y: 0.57,
    lng: -81.6924, lat: 27.9889,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    description: 'Spinning teacup-style ride around Merlin',
  },
  {
    id: 'ride-forestmens-hideout-llf',
    name: "The Forestmen's Hideout",
    type: 'attraction',
    area: 'lego-kingdoms-llf',
    x: 0.39, y: 0.56,
    lng: -81.6929, lat: 27.9890,
    thrillLevel: 'low',
    description: 'Wooden playground castle for kids',
  },
];

const KINGDOMS_FOOD: ParkPOI[] = [
  {
    id: 'food-dragons-den-llf',
    name: "Dragon's Den",
    type: 'food',
    area: 'lego-kingdoms-llf',
    x: 0.41, y: 0.54,
    lng: -81.6925, lat: 27.9892,
    menuItems: ['hot dogs', 'bratwurst', 'corn dogs', 'funnel cake'],
    menuDescription: 'Loaded hot dogs, bratwurst sausages, and mini corn dogs',
  },
  {
    id: 'food-kingdom-cones-llf',
    name: 'Kingdom Cones',
    type: 'food',
    area: 'lego-kingdoms-llf',
    x: 0.43, y: 0.52,
    lng: -81.6923, lat: 27.9894,
    menuItems: ['ice cream', 'cones', 'sundaes'],
    menuDescription: 'Ice cream and frozen treats',
  },
];

// ============================================
// LAND OF ADVENTURE
// ============================================

const ADVENTURE_RIDES: ParkPOI[] = [
  {
    id: 'ride-coastersaurus-llf',
    mapNumber: 9,
    name: 'Coastersaurus',
    type: 'ride',
    area: 'land-of-adventure-llf',
    x: 0.30, y: 0.48,
    lng: -81.6940, lat: 27.9898,
    heightRequirement: { min: 42 },
    thrillLevel: 'mild',
    coasterId: 'coastersaurus-llf',
    description: 'Wooden roller coaster winding through a prehistoric LEGO dinosaur landscape',
  },
  {
    id: 'ride-lost-kingdom-llf',
    mapNumber: 10,
    name: 'Lost Kingdom Adventure',
    type: 'ride',
    area: 'land-of-adventure-llf',
    x: 0.28, y: 0.50,
    lng: -81.6943, lat: 27.9896,
    heightRequirement: { min: 30 },
    thrillLevel: 'mild',
    description: 'Interactive laser-shooting dark ride through ancient temples',
  },
  {
    id: 'ride-beetle-bounce-llf',
    mapNumber: 11,
    name: 'Beetle Bounce',
    type: 'ride',
    area: 'land-of-adventure-llf',
    x: 0.32, y: 0.46,
    lng: -81.6937, lat: 27.9900,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    description: 'Bounce up 15 feet toward LEGO scarab beetles and back down',
  },
  {
    id: 'ride-safari-trek-llf',
    mapNumber: 12,
    name: 'Safari Trek',
    type: 'ride',
    area: 'land-of-adventure-llf',
    x: 0.26, y: 0.52,
    lng: -81.6946, lat: 27.9894,
    heightRequirement: { min: 34 },
    thrillLevel: 'low',
    description: 'Drive past life-sized LEGO safari animals',
  },
  {
    id: 'ride-pharaohs-revenge-llf',
    name: "Pharaoh's Revenge",
    type: 'attraction',
    area: 'land-of-adventure-llf',
    x: 0.29, y: 0.49,
    lng: -81.6942, lat: 27.9897,
    description: 'Interactive Egyptian-themed play area with foam ball blasters',
  },
];

// ============================================
// LEGO CITY
// ============================================

const LEGO_CITY_RIDES: ParkPOI[] = [
  {
    id: 'ride-driving-school-llf',
    mapNumber: 13,
    name: 'Ford Driving School',
    type: 'ride',
    area: 'lego-city-llf',
    x: 0.25, y: 0.38,
    lng: -81.6948, lat: 27.9908,
    thrillLevel: 'low',
    description: "Kids drive electric cars on a road course and earn a LEGOLAND driver's license",
  },
  {
    id: 'ride-jr-driving-school-llf',
    name: 'Ford Jr. Driving School',
    type: 'ride',
    area: 'lego-city-llf',
    x: 0.23, y: 0.40,
    lng: -81.6950, lat: 27.9906,
    heightRequirement: { max: 48 },
    thrillLevel: 'low',
    description: 'Driving school for younger kids',
  },
  {
    id: 'ride-boating-school-llf',
    mapNumber: 14,
    name: 'Boating School',
    type: 'ride',
    area: 'lego-city-llf',
    x: 0.27, y: 0.36,
    lng: -81.6945, lat: 27.9910,
    heightRequirement: { min: 34 },
    thrillLevel: 'low',
    description: 'Kids pilot electric boats around a waterway course',
  },
  {
    id: 'ride-rescue-academy-llf',
    mapNumber: 15,
    name: 'Rescue Academy',
    type: 'ride',
    area: 'lego-city-llf',
    x: 0.22, y: 0.35,
    lng: -81.6952, lat: 27.9911,
    thrillLevel: 'low',
    description: 'Family pedal-powered fire truck race to put out the fire',
  },
  {
    id: 'ride-coast-guard-academy-llf',
    mapNumber: 16,
    name: 'Coast Guard Academy',
    type: 'ride',
    area: 'lego-city-llf',
    x: 0.20, y: 0.37,
    lng: -81.6955, lat: 27.9909,
    heightRequirement: { min: 34 },
    thrillLevel: 'low',
    description: 'Navigate boats through a course of LEGO obstacles',
  },
  {
    id: 'ride-flying-school-llf',
    mapNumber: 17,
    name: 'Flying School',
    type: 'ride',
    area: 'lego-city-llf',
    x: 0.24, y: 0.33,
    lng: -81.6949, lat: 27.9913,
    heightRequirement: { min: 44 },
    thrillLevel: 'moderate',
    coasterId: 'flying-school-llf',
    description: 'Suspended family coaster — hang below the track and soar',
  },
];

const LEGO_CITY_FOOD: ParkPOI[] = [
  {
    id: 'food-kickn-chicken-llf',
    name: "Kick'n Chicken Co.",
    type: 'food',
    area: 'lego-city-llf',
    x: 0.26, y: 0.39,
    lng: -81.6947, lat: 27.9907,
    menuItems: ['chicken tenders', 'chicken sandwiches', 'fries', 'salad'],
    menuDescription: 'Chicken tenders, sandwiches, and sides',
  },
  {
    id: 'food-burger-kitchen-llf',
    name: 'The Burger Kitchen',
    type: 'food',
    area: 'lego-city-llf',
    x: 0.21, y: 0.36,
    lng: -81.6953, lat: 27.9910,
    menuItems: ['burgers', 'cheeseburgers', 'fries', 'chicken tenders'],
    menuDescription: 'Classic burgers and fries',
  },
];

// ============================================
// LEGO TECHNIC
// ============================================

const TECHNIC_RIDES: ParkPOI[] = [
  {
    id: 'ride-great-lego-race-llf',
    mapNumber: 18,
    name: 'The Great LEGO Race',
    type: 'ride',
    area: 'lego-technic-llf',
    x: 0.30, y: 0.28,
    lng: -81.6940, lat: 27.9918,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'the-great-lego-race-llf',
    description: 'VR-enhanced roller coaster — race against LEGO Technic vehicles',
  },
  {
    id: 'ride-aquazone-wave-racers-llf',
    mapNumber: 19,
    name: 'AQUAZONE Wave Racers',
    type: 'ride',
    area: 'lego-technic-llf',
    x: 0.28, y: 0.26,
    lng: -81.6943, lat: 27.9920,
    heightRequirement: { min: 40 },
    thrillLevel: 'mild',
    description: 'Wave-creating jet ski ride on water',
  },
  {
    id: 'ride-technicycle-llf',
    mapNumber: 20,
    name: 'Technicycle',
    type: 'ride',
    area: 'lego-technic-llf',
    x: 0.32, y: 0.30,
    lng: -81.6937, lat: 27.9916,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    description: 'Pedal-powered ride that spins and lifts you into the air',
  },
];

// ============================================
// IMAGINATION ZONE
// ============================================

const IMAGINATION_RIDES: ParkPOI[] = [
  {
    id: 'ride-kid-power-towers-llf',
    mapNumber: 21,
    name: 'Kid Power Towers',
    type: 'ride',
    area: 'imagination-zone-llf',
    x: 0.42, y: 0.32,
    lng: -81.6924, lat: 27.9914,
    heightRequirement: { min: 38 },
    thrillLevel: 'mild',
    description: 'Pull yourself up for a view and float gently back down',
  },
  {
    id: 'ride-build-n-test-llf',
    name: "Build 'n' Test",
    type: 'attraction',
    area: 'imagination-zone-llf',
    x: 0.44, y: 0.34,
    lng: -81.6921, lat: 27.9912,
    description: 'Build and race custom LEGO cars down ramps',
  },
  {
    id: 'ride-hero-factory-llf',
    name: 'Hero Factory',
    type: 'attraction',
    area: 'imagination-zone-llf',
    x: 0.40, y: 0.33,
    lng: -81.6927, lat: 27.9913,
    description: 'Hands-on LEGO building activities',
  },
];

// ============================================
// LEGO NINJAGO WORLD
// ============================================

const NINJAGO_RIDES: ParkPOI[] = [
  {
    id: 'ride-ninjago-the-ride-llf',
    mapNumber: 22,
    name: 'LEGO NINJAGO The Ride',
    type: 'ride',
    area: 'lego-ninjago-world-llf',
    x: 0.55, y: 0.30,
    lng: -81.6907, lat: 27.9916,
    thrillLevel: 'moderate',
    description: 'Interactive 4D dark ride with hand gesture technology — defeat the Great Devourer',
  },
  {
    id: 'ride-cole-rock-climb-llf',
    name: "Cole's Rock Climb",
    type: 'ride',
    area: 'lego-ninjago-world-llf',
    x: 0.53, y: 0.32,
    lng: -81.6910, lat: 27.9914,
    thrillLevel: 'low',
    description: 'Climbing and spinning ride for young ninjas',
  },
  {
    id: 'ride-zane-temple-build-llf',
    name: "Zane's Temple Build",
    type: 'attraction',
    area: 'lego-ninjago-world-llf',
    x: 0.57, y: 0.31,
    lng: -81.6904, lat: 27.9915,
    description: 'Interactive LEGO building area in NINJAGO World',
  },
];

const NINJAGO_SHOPS: ParkPOI[] = [
  {
    id: 'shop-wus-warehouse-llf',
    name: "Wu's Warehouse",
    type: 'shop',
    area: 'lego-ninjago-world-llf',
    x: 0.54, y: 0.29,
    lng: -81.6908, lat: 27.9917,
    description: 'NINJAGO merchandise and LEGO sets',
  },
];

// ============================================
// THE LEGO MOVIE WORLD
// ============================================

const LEGO_MOVIE_RIDES: ParkPOI[] = [
  {
    id: 'ride-masters-of-flight-llf',
    mapNumber: 23,
    name: 'THE LEGO MOVIE Masters of Flight',
    type: 'ride',
    area: 'lego-movie-world-llf',
    x: 0.65, y: 0.38,
    lng: -81.6894, lat: 27.9908,
    heightRequirement: { min: 40 },
    thrillLevel: 'mild',
    description: 'Flying theater ride through The LEGO Movie universe on a triple-decker couch',
  },
  {
    id: 'ride-unikittys-disco-drop-llf',
    mapNumber: 24,
    name: "Unikitty's Disco Drop",
    type: 'ride',
    area: 'lego-movie-world-llf',
    x: 0.67, y: 0.40,
    lng: -81.6891, lat: 27.9906,
    heightRequirement: { min: 40 },
    thrillLevel: 'mild',
    description: 'Spinning, bouncing, and dropping tower themed to Unikitty',
  },
  {
    id: 'ride-bennys-play-ship-llf',
    mapNumber: 25,
    name: "Benny's Play Ship",
    type: 'attraction',
    area: 'lego-movie-world-llf',
    x: 0.63, y: 0.36,
    lng: -81.6897, lat: 27.9910,
    thrillLevel: 'low',
    description: 'Interactive play area in a spaceship',
  },
];

const LEGO_MOVIE_FOOD: ParkPOI[] = [
  {
    id: 'food-taco-everyday-llf',
    name: 'Taco Everyday',
    type: 'food',
    area: 'lego-movie-world-llf',
    x: 0.66, y: 0.42,
    lng: -81.6893, lat: 27.9904,
    menuItems: ['tacos', 'quesadillas', 'churros', 'nachos'],
    menuDescription: 'Tacos, quesadillas, and churros',
  },
];

// ============================================
// HEARTLAKE CITY
// ============================================

const HEARTLAKE_RIDES: ParkPOI[] = [
  {
    id: 'ride-mias-riding-adventure-llf',
    mapNumber: 26,
    name: "Mia's Riding Adventure",
    type: 'ride',
    area: 'heartlake-city-llf',
    x: 0.70, y: 0.50,
    lng: -81.6888, lat: 27.9896,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    description: 'Spinning disc coaster — one of the most thrilling rides in LEGOLAND',
  },
  {
    id: 'ride-heartlake-horse-llf',
    name: 'Heartlake Horse',
    type: 'ride',
    area: 'heartlake-city-llf',
    x: 0.72, y: 0.48,
    lng: -81.6885, lat: 27.9898,
    thrillLevel: 'low',
    description: 'Gentle horseback ride through Heartlake City',
  },
];

const HEARTLAKE_FOOD: ParkPOI[] = [
  {
    id: 'food-heartlake-pizza-llf',
    name: 'Pepper & Roni\'s Pizza Stop',
    type: 'food',
    area: 'heartlake-city-llf',
    x: 0.71, y: 0.52,
    lng: -81.6887, lat: 27.9894,
    menuItems: ['pizza', 'cheese pizza', 'pepperoni', 'veggie'],
    menuDescription: 'Personal-sized cheese, pepperoni, or veggie pizzas',
  },
];

// ============================================
// PIRATES' COVE
// ============================================

const PIRATES_COVE_RIDES: ParkPOI[] = [
  {
    id: 'ride-pirate-river-quest-llf',
    mapNumber: 27,
    name: 'Pirate River Quest',
    type: 'ride',
    area: 'pirates-cove-llf',
    x: 0.68, y: 0.60,
    lng: -81.6890, lat: 27.9886,
    thrillLevel: 'low',
    description: 'Scenic boat ride through historic Cypress Gardens waterways with LEGO pirates',
  },
  {
    id: 'ride-battle-of-brickbeard-llf',
    name: "Battle of Brickbeard's Bounty",
    type: 'attraction',
    area: 'pirates-cove-llf',
    x: 0.66, y: 0.58,
    lng: -81.6893, lat: 27.9888,
    description: 'Live-action pirate stunt show on water',
  },
];

// ============================================
// MINILAND USA
// ============================================

const MINILAND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-miniland-usa-llf',
    name: 'Miniland USA',
    type: 'attraction',
    area: 'miniland-usa-llf',
    x: 0.55, y: 0.50,
    lng: -81.6907, lat: 27.9896,
    description: 'Over 32 million LEGO bricks recreating famous American landmarks and cities',
  },
  {
    id: 'attraction-star-wars-miniland-llf',
    name: 'Star Wars Miniland',
    type: 'attraction',
    area: 'miniland-usa-llf',
    x: 0.53, y: 0.52,
    lng: -81.6910, lat: 27.9894,
    description: 'LEGO recreations of iconic Star Wars movie scenes',
  },
];

// ============================================
// CYPRESS GARDENS
// ============================================

const CYPRESS_GARDENS: ParkPOI[] = [
  {
    id: 'attraction-cypress-gardens-llf',
    name: 'Cypress Gardens',
    type: 'attraction',
    area: 'cypress-gardens-llf',
    x: 0.65, y: 0.68,
    lng: -81.6894, lat: 27.9878,
    description: 'Historic botanical garden with 75+ years of horticultural wonders',
  },
];

// ============================================
// SERVICES (Park-wide)
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-llf',
    name: 'Main Entrance',
    type: 'service',
    area: 'the-beginning-llf',
    x: 0.50, y: 0.95,
    lng: -81.6913, lat: 27.9851,
  },
  {
    id: 'restroom-entrance-llf',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'the-beginning-llf',
    x: 0.48, y: 0.92,
    lng: -81.6916, lat: 27.9854,
  },
  {
    id: 'restroom-fun-town-llf',
    name: 'Restrooms (Fun Town)',
    type: 'service',
    area: 'fun-town-llf',
    x: 0.44, y: 0.77,
    lng: -81.6921, lat: 27.9869,
  },
  {
    id: 'restroom-lego-city-llf',
    name: 'Restrooms (LEGO City)',
    type: 'service',
    area: 'lego-city-llf',
    x: 0.24, y: 0.37,
    lng: -81.6949, lat: 27.9909,
  },
  {
    id: 'restroom-kingdoms-llf',
    name: 'Restrooms (LEGO Kingdoms)',
    type: 'service',
    area: 'lego-kingdoms-llf',
    x: 0.40, y: 0.58,
    lng: -81.6927, lat: 27.9888,
  },
  {
    id: 'restroom-adventure-llf',
    name: 'Restrooms (Land of Adventure)',
    type: 'service',
    area: 'land-of-adventure-llf',
    x: 0.27, y: 0.51,
    lng: -81.6945, lat: 27.9895,
  },
  {
    id: 'restroom-ninjago-llf',
    name: 'Restrooms (NINJAGO World)',
    type: 'service',
    area: 'lego-ninjago-world-llf',
    x: 0.56, y: 0.33,
    lng: -81.6906, lat: 27.9913,
  },
  {
    id: 'restroom-movie-world-llf',
    name: 'Restrooms (LEGO Movie World)',
    type: 'service',
    area: 'lego-movie-world-llf',
    x: 0.64, y: 0.37,
    lng: -81.6896, lat: 27.9909,
  },
  {
    id: 'restroom-heartlake-llf',
    name: 'Restrooms (Heartlake City)',
    type: 'service',
    area: 'heartlake-city-llf',
    x: 0.73, y: 0.51,
    lng: -81.6884, lat: 27.9895,
  },
  {
    id: 'service-first-aid-llf',
    name: 'First Aid',
    type: 'service',
    area: 'fun-town-llf',
    x: 0.49, y: 0.80,
    lng: -81.6914, lat: 27.9866,
  },
  {
    id: 'service-guest-services-llf',
    name: 'Guest Services',
    type: 'service',
    area: 'the-beginning-llf',
    x: 0.52, y: 0.90,
    lng: -81.6910, lat: 27.9856,
  },
];

// ============================================
// Additional Food & Shops
// ============================================

const EXTRA_FOOD: ParkPOI[] = [
  {
    id: 'food-firehouse-icecream-llf',
    name: 'Firehouse Ice Cream',
    type: 'food',
    area: 'lego-city-llf',
    x: 0.23, y: 0.34,
    lng: -81.6951, lat: 27.9912,
    menuItems: ['ice cream', 'sundaes', 'milkshakes'],
    menuDescription: 'Ice cream and frozen treats in a firehouse setting',
  },
  {
    id: 'food-funnel-cake-llf',
    name: 'Funnel Cake Factory',
    type: 'food',
    area: 'fun-town-llf',
    x: 0.47, y: 0.72,
    lng: -81.6917, lat: 27.9874,
    menuItems: ['funnel cake', 'cinnamon sugar', 'chocolate', 'strawberry'],
    menuDescription: 'Fresh funnel cakes with toppings',
  },
];

const EXTRA_SHOPS: ParkPOI[] = [
  {
    id: 'shop-city-shop-llf',
    name: 'City Walk Shop',
    type: 'shop',
    area: 'lego-city-llf',
    x: 0.25, y: 0.41,
    lng: -81.6948, lat: 27.9905,
    description: 'LEGO City themed sets and merchandise',
  },
  {
    id: 'shop-kingdoms-shop-llf',
    name: "King's Market",
    type: 'shop',
    area: 'lego-kingdoms-llf',
    x: 0.43, y: 0.53,
    lng: -81.6923, lat: 27.9893,
    description: 'Medieval-themed LEGO merchandise',
  },
  {
    id: 'shop-technic-shop-llf',
    name: 'LEGO Ferrari Build & Race',
    type: 'attraction',
    area: 'lego-technic-llf',
    x: 0.33, y: 0.27,
    lng: -81.6936, lat: 27.9919,
    description: 'Build and race LEGO Ferrari cars — interactive experience',
  },
];

// ============================================
// Export ALL POIs
// ============================================

export const LEGOLAND_FLORIDA_POI: ParkPOI[] = [
  // The Beginning
  ...THE_BEGINNING,
  // Fun Town
  ...FUN_TOWN_RIDES,
  ...FUN_TOWN_FOOD,
  ...FUN_TOWN_SHOPS,
  // DUPLO Valley
  ...DUPLO_VALLEY,
  // LEGO Galaxy
  ...LEGO_GALAXY_RIDES,
  ...LEGO_GALAXY_FOOD,
  ...LEGO_GALAXY_SHOPS,
  // LEGO Kingdoms
  ...KINGDOMS_RIDES,
  ...KINGDOMS_FOOD,
  // Land of Adventure
  ...ADVENTURE_RIDES,
  // LEGO City
  ...LEGO_CITY_RIDES,
  ...LEGO_CITY_FOOD,
  // LEGO Technic
  ...TECHNIC_RIDES,
  // Imagination Zone
  ...IMAGINATION_RIDES,
  // LEGO NINJAGO World
  ...NINJAGO_RIDES,
  ...NINJAGO_SHOPS,
  // LEGO Movie World
  ...LEGO_MOVIE_RIDES,
  ...LEGO_MOVIE_FOOD,
  // Heartlake City
  ...HEARTLAKE_RIDES,
  ...HEARTLAKE_FOOD,
  // Pirates' Cove
  ...PIRATES_COVE_RIDES,
  // Miniland USA
  ...MINILAND_ATTRACTIONS,
  // Cypress Gardens
  ...CYPRESS_GARDENS,
  // Services
  ...SERVICES,
  // Extra food & shops
  ...EXTRA_FOOD,
  ...EXTRA_SHOPS,
];
