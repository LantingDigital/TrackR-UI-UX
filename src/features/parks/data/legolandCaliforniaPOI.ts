import { ParkPOI } from '../types';

// ============================================
// LEGOLAND California — Complete Point of Interest Database
// Source: Official Park Map, Wikipedia, OpenStreetMap
//
// Park center: 33.1264, -117.3115
// Located in Carlsbad, CA
// Layout: 11 themed areas arranged in a rough loop
// ============================================

// ============================================
// LEGO GALAXY (New 2026)
// ============================================

const LEGO_GALAXY_RIDES: ParkPOI[] = [
  {
    id: 'ride-galacticoaster',
    mapNumber: 1,
    name: 'Galacticoaster',
    type: 'ride',
    area: 'lego-galaxy',
    x: 0.72, y: 0.22,
    lng: -117.3085, lat: 33.1285,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'galacticoaster',
    description: 'Indoor family coaster — 1,500 feet of track through the cosmos with 625 possible ride combinations',
  },
  {
    id: 'ride-galaxy-spin',
    mapNumber: 2,
    name: 'Galaxy Spin',
    type: 'ride',
    area: 'lego-galaxy',
    x: 0.68, y: 0.20,
    lng: -117.3090, lat: 33.1288,
    thrillLevel: 'mild',
    description: 'Cosmic spinning ride in LEGO Galaxy',
  },
  {
    id: 'ride-space-flyer',
    mapNumber: 3,
    name: 'Space Flyer',
    type: 'ride',
    area: 'lego-galaxy',
    x: 0.75, y: 0.25,
    lng: -117.3082, lat: 33.1282,
    thrillLevel: 'low',
    description: 'Toddler-friendly space adventure ride',
  },
];

const LEGO_GALAXY_FOOD: ParkPOI[] = [
  {
    id: 'food-cosmic-bites',
    name: 'Cosmic Bites',
    type: 'food',
    area: 'lego-galaxy',
    x: 0.70, y: 0.24,
    lng: -117.3088, lat: 33.1283,
    menuItems: ['space food', 'snacks', 'drinks'],
    menuDescription: 'Space-themed snacks and treats',
  },
];

const LEGO_GALAXY_SHOPS: ParkPOI[] = [
  {
    id: 'shop-galactic-gear',
    name: 'Galactic Gear',
    type: 'shop',
    area: 'lego-galaxy',
    x: 0.73, y: 0.23,
    lng: -117.3084, lat: 33.1284,
    description: 'Space-themed LEGO sets and merchandise',
  },
];

// ============================================
// CASTLE HILL
// ============================================

const CASTLE_HILL_RIDES: ParkPOI[] = [
  {
    id: 'ride-the-dragon',
    mapNumber: 4,
    name: 'The Dragon',
    type: 'ride',
    area: 'castle-hill',
    x: 0.58, y: 0.28,
    lng: -117.3102, lat: 33.1280,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'the-dragon',
    description: 'Indoor/outdoor roller coaster through an enchanted LEGOLAND Castle',
  },
  {
    id: 'ride-royal-joust',
    mapNumber: 5,
    name: 'Royal Joust',
    type: 'ride',
    area: 'castle-hill',
    x: 0.55, y: 0.30,
    lng: -117.3106, lat: 33.1278,
    heightRequirement: { min: 36 },
    thrillLevel: 'low',
    description: 'LEGO horse ride through the enchanted forest',
  },
  {
    id: 'ride-merlin-challenge',
    mapNumber: 6,
    name: "Merlin's Challenge",
    type: 'ride',
    area: 'castle-hill',
    x: 0.60, y: 0.32,
    lng: -117.3100, lat: 33.1276,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    description: 'Spinning teacup-style ride around Merlin',
  },
  {
    id: 'ride-hideaways',
    name: 'The Hideaways',
    type: 'attraction',
    area: 'castle-hill',
    x: 0.56, y: 0.33,
    lng: -117.3105, lat: 33.1275,
    thrillLevel: 'low',
    description: 'Wooden playground castle for kids',
  },
];

const CASTLE_HILL_FOOD: ParkPOI[] = [
  {
    id: 'food-knights-smokehouse',
    name: "Knights' Smokehouse BBQ",
    type: 'food',
    area: 'castle-hill',
    x: 0.57, y: 0.26,
    lng: -117.3104, lat: 33.1282,
    menuItems: ['bbq', 'pulled pork', 'brisket', 'ribs', 'chicken', 'beer'],
    menuDescription: 'True Texas BBQ with craft beer',
    servesAlcohol: true,
  },
  {
    id: 'food-chicken-crown',
    name: 'Chicken and Crown',
    type: 'food',
    area: 'castle-hill',
    x: 0.59, y: 0.27,
    lng: -117.3101, lat: 33.1281,
    menuItems: ['chicken tenders', 'fries', 'dipping sauces'],
    menuDescription: 'Chicken tenders with hand-tossed golden fries',
  },
];

// ============================================
// LEGO NINJAGO WORLD
// ============================================

const NINJAGO_RIDES: ParkPOI[] = [
  {
    id: 'ride-ninjago-the-ride',
    mapNumber: 7,
    name: 'LEGO NINJAGO The Ride',
    type: 'ride',
    area: 'lego-ninjago-world',
    x: 0.65, y: 0.35,
    lng: -117.3094, lat: 33.1273,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    description: 'Interactive dark ride with hand gesture technology — defeat the Great Devourer',
  },
  {
    id: 'ride-cole-rock-climb',
    name: "Cole's Rock Climb",
    type: 'ride',
    area: 'lego-ninjago-world',
    x: 0.63, y: 0.37,
    lng: -117.3096, lat: 33.1271,
    thrillLevel: 'low',
    description: 'Climbing and spinning ride for young ninjas',
  },
  {
    id: 'ride-zane-temple-build',
    name: "Zane's Temple Build",
    type: 'attraction',
    area: 'lego-ninjago-world',
    x: 0.67, y: 0.36,
    lng: -117.3091, lat: 33.1272,
    description: 'Interactive LEGO building area in NINJAGO World',
  },
];

const NINJAGO_SHOPS: ParkPOI[] = [
  {
    id: 'shop-wus-warehouse',
    name: "Wu's Warehouse",
    type: 'shop',
    area: 'lego-ninjago-world',
    x: 0.64, y: 0.34,
    lng: -117.3095, lat: 33.1274,
    description: 'NINJAGO merchandise and LEGO sets',
  },
];

// ============================================
// THE LEGO MOVIE WORLD
// ============================================

const LEGO_MOVIE_RIDES: ParkPOI[] = [
  {
    id: 'ride-emmets-flying-adventure',
    mapNumber: 8,
    name: "Emmet's Flying Adventure Ride",
    type: 'ride',
    area: 'lego-movie-world',
    x: 0.42, y: 0.30,
    lng: -117.3122, lat: 33.1278,
    heightRequirement: { min: 40 },
    thrillLevel: 'mild',
    description: 'Flying theater ride through The LEGO Movie universe',
  },
  {
    id: 'ride-unikittys-disco-drop',
    mapNumber: 9,
    name: "Unikitty's Disco Drop",
    type: 'ride',
    area: 'lego-movie-world',
    x: 0.40, y: 0.32,
    lng: -117.3125, lat: 33.1276,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    description: 'Bouncing drop tower themed to Unikitty',
  },
  {
    id: 'ride-bennys-play-ship',
    mapNumber: 10,
    name: "Benny's Play Ship",
    type: 'attraction',
    area: 'lego-movie-world',
    x: 0.44, y: 0.31,
    lng: -117.3119, lat: 33.1277,
    thrillLevel: 'low',
    description: 'Interactive play area in a spaceship',
  },
];

const LEGO_MOVIE_FOOD: ParkPOI[] = [
  {
    id: 'food-everything-is-ramen',
    name: 'Everything is Ramen',
    type: 'food',
    area: 'lego-movie-world',
    x: 0.43, y: 0.33,
    lng: -117.3121, lat: 33.1275,
    menuItems: ['ramen', 'rice bowls', 'salads', 'noodles', 'asian'],
    menuDescription: 'Homemade ramen, rice bowls, and salads',
  },
];

// ============================================
// IMAGINATION ZONE
// ============================================

const IMAGINATION_RIDES: ParkPOI[] = [
  {
    id: 'ride-lego-technic-coaster',
    mapNumber: 11,
    name: 'LEGO Technic Coaster',
    type: 'ride',
    area: 'imagination-zone',
    x: 0.50, y: 0.42,
    lng: -117.3112, lat: 33.1266,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'lego-technic-coaster',
    description: 'Wild mouse-style coaster with twists and turns',
  },
  {
    id: 'ride-bionicle-blaster',
    mapNumber: 12,
    name: 'Bionicle Blaster',
    type: 'ride',
    area: 'imagination-zone',
    x: 0.48, y: 0.44,
    lng: -117.3114, lat: 33.1264,
    thrillLevel: 'mild',
    description: 'Spinning circular ride',
  },
  {
    id: 'ride-aquazone-wave-racers',
    mapNumber: 13,
    name: 'Aquazone Wave Racers',
    type: 'ride',
    area: 'imagination-zone',
    x: 0.52, y: 0.40,
    lng: -117.3110, lat: 33.1268,
    heightRequirement: { min: 34 },
    thrillLevel: 'mild',
    description: 'Wave-creating jet ski ride on water',
  },
  {
    id: 'ride-build-n-test',
    name: "Build 'n Test",
    type: 'attraction',
    area: 'imagination-zone',
    x: 0.53, y: 0.43,
    lng: -117.3109, lat: 33.1265,
    description: 'Build and race custom LEGO cars',
  },
];

const IMAGINATION_FOOD: ParkPOI[] = [
  {
    id: 'food-pizza-pit-stop',
    name: 'The Pizza Pit Stop',
    type: 'food',
    area: 'imagination-zone',
    x: 0.51, y: 0.45,
    lng: -117.3111, lat: 33.1263,
    menuItems: ['pizza', 'salad'],
    menuDescription: 'Individual-sized pizzas made fresh to order',
  },
];

// ============================================
// LEGO CITY (Fun Town)
// ============================================

const LEGO_CITY_RIDES: ParkPOI[] = [
  {
    id: 'ride-driving-school',
    mapNumber: 14,
    name: 'Driving School',
    type: 'ride',
    area: 'lego-city-llc',
    x: 0.35, y: 0.50,
    lng: -117.3130, lat: 33.1258,
    heightRequirement: { min: 34 },
    thrillLevel: 'low',
    description: "Kids drive electric cars on a road course and earn a LEGOLAND driver's license",
  },
  {
    id: 'ride-jr-driving-school',
    name: 'Junior Driving School',
    type: 'ride',
    area: 'lego-city-llc',
    x: 0.33, y: 0.52,
    lng: -117.3133, lat: 33.1256,
    heightRequirement: { min: 34, max: 48 },
    thrillLevel: 'low',
    description: 'Driving school for younger kids',
  },
  {
    id: 'ride-police-helicopter',
    mapNumber: 15,
    name: 'Police & Fire Academy',
    type: 'ride',
    area: 'lego-city-llc',
    x: 0.37, y: 0.48,
    lng: -117.3128, lat: 33.1260,
    thrillLevel: 'low',
    description: 'Family pedal-powered fire truck race',
  },
  {
    id: 'ride-coast-cruise',
    mapNumber: 16,
    name: 'Coast Cruise',
    type: 'ride',
    area: 'lego-city-llc',
    x: 0.32, y: 0.48,
    lng: -117.3134, lat: 33.1260,
    thrillLevel: 'low',
    description: 'Boat ride past LEGO scenes along the waterfront',
  },
  {
    id: 'ride-skipper-school',
    name: "Skipper's School",
    type: 'ride',
    area: 'lego-city-llc',
    x: 0.30, y: 0.50,
    lng: -117.3137, lat: 33.1258,
    thrillLevel: 'low',
    description: 'Boat ride where kids steer their own vessel',
  },
];

const LEGO_CITY_FOOD: ParkPOI[] = [
  {
    id: 'food-burger-stop',
    name: 'Burger Stop',
    type: 'food',
    area: 'lego-city-llc',
    x: 0.34, y: 0.49,
    lng: -117.3131, lat: 33.1259,
    menuItems: ['burgers', 'cheeseburgers', 'fries', 'chicken tenders'],
    menuDescription: '100% all-beef hamburgers with French fries',
  },
  {
    id: 'food-fun-town-market',
    name: 'Fun Town Market',
    type: 'food',
    area: 'lego-city-llc',
    x: 0.36, y: 0.51,
    lng: -117.3129, lat: 33.1257,
    menuItems: ['philly cheesesteak', 'stir fry', 'salad bar', 'ice cream'],
    menuDescription: 'Market-style restaurant with fresh food prepared in front of you',
  },
];

const LEGO_CITY_SHOPS: ParkPOI[] = [
  {
    id: 'shop-lego-factory-tour',
    name: 'LEGO Factory Tour',
    type: 'attraction',
    area: 'lego-city-llc',
    x: 0.38, y: 0.47,
    lng: -117.3126, lat: 33.1261,
    description: 'See how LEGO bricks are made and get a free souvenir brick',
  },
  {
    id: 'shop-big-shop',
    name: 'The Big Shop',
    type: 'shop',
    area: 'lego-city-llc',
    x: 0.38, y: 0.53,
    lng: -117.3126, lat: 33.1255,
    description: 'The largest LEGO store at LEGOLAND',
  },
];

// ============================================
// PIRATE SHORES
// ============================================

const PIRATE_SHORES_RIDES: ParkPOI[] = [
  {
    id: 'ride-pirate-reef',
    mapNumber: 17,
    name: 'Pirate Reef',
    type: 'ride',
    area: 'pirate-shores',
    x: 0.25, y: 0.40,
    lng: -117.3143, lat: 33.1268,
    heightRequirement: { min: 34 },
    thrillLevel: 'mild',
    description: 'Water cannon battle between blue and red pirate ships',
  },
  {
    id: 'ride-splash-battle',
    mapNumber: 18,
    name: 'Splash Battle',
    type: 'ride',
    area: 'pirate-shores',
    x: 0.22, y: 0.38,
    lng: -117.3147, lat: 33.1270,
    heightRequirement: { min: 34 },
    thrillLevel: 'mild',
    description: 'Interactive water ride — fire water cannons at targets and other boats',
  },
  {
    id: 'ride-treasure-falls',
    mapNumber: 19,
    name: 'Treasure Falls',
    type: 'ride',
    area: 'pirate-shores',
    x: 0.24, y: 0.42,
    lng: -117.3145, lat: 33.1266,
    heightRequirement: { min: 34 },
    thrillLevel: 'mild',
    description: 'Log flume ride with a splash-down finale',
  },
];

const PIRATE_SHORES_FOOD: ParkPOI[] = [
  {
    id: 'food-burger-kitchen',
    name: 'Burger Kitchen',
    type: 'food',
    area: 'pirate-shores',
    x: 0.23, y: 0.39,
    lng: -117.3146, lat: 33.1269,
    menuItems: ['burgers', 'beyond burgers', 'chicken tenders', 'fries'],
    menuDescription: 'California burgers and Beyond Burgers',
  },
];

// ============================================
// LAND OF ADVENTURE
// ============================================

const ADVENTURE_RIDES: ParkPOI[] = [
  {
    id: 'ride-lost-kingdom',
    mapNumber: 20,
    name: 'Lost Kingdom Adventure',
    type: 'ride',
    area: 'land-of-adventure',
    x: 0.20, y: 0.55,
    lng: -117.3150, lat: 33.1253,
    heightRequirement: { min: 30 },
    thrillLevel: 'mild',
    description: 'Interactive laser-shooting dark ride through ancient temples',
  },
  {
    id: 'ride-beetle-bounce',
    mapNumber: 21,
    name: 'Beetle Bounce Drop',
    type: 'ride',
    area: 'land-of-adventure',
    x: 0.18, y: 0.53,
    lng: -117.3153, lat: 33.1255,
    heightRequirement: { min: 36, max: 55 },
    thrillLevel: 'mild',
    description: 'Launch 15 feet toward LEGO scarab beetles and bounce back',
  },
  {
    id: 'ride-cargo-ace',
    mapNumber: 22,
    name: 'Cargo Ace',
    type: 'ride',
    area: 'land-of-adventure',
    x: 0.22, y: 0.57,
    lng: -117.3147, lat: 33.1251,
    thrillLevel: 'low',
    coasterId: 'cargo-ace',
    description: 'Kids rollercoaster for aspiring pilots — fly through the air',
  },
  {
    id: 'ride-safari-trek',
    name: 'Safari Trek',
    type: 'ride',
    area: 'land-of-adventure',
    x: 0.19, y: 0.58,
    lng: -117.3151, lat: 33.1250,
    thrillLevel: 'low',
    description: 'Drive past LEGO safari animals',
  },
];

// ============================================
// DINO VALLEY
// ============================================

const DINO_VALLEY_RIDES: ParkPOI[] = [
  {
    id: 'ride-coastersaurus',
    mapNumber: 23,
    name: 'Coastersaurus',
    type: 'ride',
    area: 'dino-valley',
    x: 0.30, y: 0.65,
    lng: -117.3137, lat: 33.1243,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    coasterId: 'coastersaurus',
    description: 'Wooden roller coaster through a prehistoric landscape of LEGO dinosaurs',
  },
  {
    id: 'ride-dino-coaster',
    name: 'DUPLO Dino Coaster',
    type: 'ride',
    area: 'dino-valley',
    x: 0.28, y: 0.63,
    lng: -117.3140, lat: 33.1245,
    thrillLevel: 'low',
    description: 'Gentle coaster for the littlest dinosaur fans',
  },
  {
    id: 'ride-dig-those-dinos',
    name: 'Dig Those Dinos',
    type: 'attraction',
    area: 'dino-valley',
    x: 0.32, y: 0.67,
    lng: -117.3134, lat: 33.1241,
    description: 'Sand area where kids dig for dinosaur fossils',
  },
];

// ============================================
// HEARTLAKE CITY
// ============================================

const HEARTLAKE_RIDES: ParkPOI[] = [
  {
    id: 'ride-heartlake-horse',
    name: 'Mia\'s Riding Adventure',
    type: 'ride',
    area: 'heartlake-city',
    x: 0.40, y: 0.62,
    lng: -117.3122, lat: 33.1246,
    heightRequirement: { min: 36 },
    thrillLevel: 'mild',
    description: 'Spinning horse ride in Heartlake City',
  },
  {
    id: 'ride-heartlake-express',
    name: 'Heartlake Express',
    type: 'ride',
    area: 'heartlake-city',
    x: 0.42, y: 0.60,
    lng: -117.3119, lat: 33.1248,
    thrillLevel: 'low',
    description: 'Train ride through Heartlake City',
  },
];

const HEARTLAKE_FOOD: ParkPOI[] = [
  {
    id: 'food-heartlake-pizza',
    name: 'Heartlake City Pizzeria',
    type: 'food',
    area: 'heartlake-city',
    x: 0.41, y: 0.64,
    lng: -117.3121, lat: 33.1244,
    menuItems: ['pizza', 'salad', 'breadsticks'],
    menuDescription: 'Pizza and salads in Heartlake City',
  },
];

// ============================================
// MINILAND USA (center of park)
// ============================================

const MINILAND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-miniland-usa',
    name: 'Miniland USA',
    type: 'attraction',
    area: 'miniland-usa',
    x: 0.50, y: 0.55,
    lng: -117.3112, lat: 33.1253,
    description: 'Millions of LEGO bricks recreating famous American landmarks',
  },
  {
    id: 'attraction-star-wars-miniland',
    name: 'Star Wars Miniland',
    type: 'attraction',
    area: 'miniland-usa',
    x: 0.48, y: 0.57,
    lng: -117.3114, lat: 33.1251,
    description: 'LEGO recreations of Star Wars movie scenes',
  },
];

// ============================================
// SERVICES (Park-wide)
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-llc',
    name: 'Main Entrance',
    type: 'service',
    area: 'lego-city-llc',
    x: 0.50, y: 0.90,
    lng: -117.3112, lat: 33.1218,
  },
  {
    id: 'restroom-entrance-llc',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'lego-city-llc',
    x: 0.48, y: 0.88,
    lng: -117.3114, lat: 33.1220,
  },
  {
    id: 'restroom-castle-hill',
    name: 'Restrooms (Castle Hill)',
    type: 'service',
    area: 'castle-hill',
    x: 0.56, y: 0.25,
    lng: -117.3105, lat: 33.1283,
  },
  {
    id: 'restroom-ninjago',
    name: 'Restrooms (NINJAGO World)',
    type: 'service',
    area: 'lego-ninjago-world',
    x: 0.66, y: 0.38,
    lng: -117.3092, lat: 33.1270,
  },
  {
    id: 'restroom-pirate-shores',
    name: 'Restrooms (Pirate Shores)',
    type: 'service',
    area: 'pirate-shores',
    x: 0.21, y: 0.41,
    lng: -117.3148, lat: 33.1267,
  },
  {
    id: 'restroom-imagination',
    name: 'Restrooms (Imagination Zone)',
    type: 'service',
    area: 'imagination-zone',
    x: 0.49, y: 0.46,
    lng: -117.3113, lat: 33.1262,
  },
  {
    id: 'restroom-dino-valley',
    name: 'Restrooms (Dino Valley)',
    type: 'service',
    area: 'dino-valley',
    x: 0.31, y: 0.66,
    lng: -117.3136, lat: 33.1242,
  },
  {
    id: 'restroom-adventure',
    name: 'Restrooms (Land of Adventure)',
    type: 'service',
    area: 'land-of-adventure',
    x: 0.20, y: 0.56,
    lng: -117.3150, lat: 33.1252,
  },
  {
    id: 'service-first-aid',
    name: 'First Aid',
    type: 'service',
    area: 'lego-city-llc',
    x: 0.40, y: 0.55,
    lng: -117.3122, lat: 33.1253,
  },
  {
    id: 'service-guest-services',
    name: 'Guest Services',
    type: 'service',
    area: 'lego-city-llc',
    x: 0.50, y: 0.85,
    lng: -117.3112, lat: 33.1223,
  },
];

// ============================================
// Additional Food & Shops
// ============================================

const EXTRA_FOOD: ParkPOI[] = [
  {
    id: 'food-grannys-apple-fries',
    name: "Granny's Apple Fries",
    type: 'food',
    area: 'lego-city-llc',
    x: 0.36, y: 0.46,
    lng: -117.3129, lat: 33.1262,
    menuItems: ['apple fries', 'cinnamon sugar', 'desserts'],
    menuDescription: 'Famous warm crispy apple fries dusted with cinnamon sugar',
  },
  {
    id: 'food-pizza-pasta-buffet',
    name: 'Pizza & Pasta Buffet',
    type: 'food',
    area: 'castle-hill',
    x: 0.55, y: 0.35,
    lng: -117.3106, lat: 33.1273,
    menuItems: ['pizza', 'pasta', 'salad', 'breadsticks', 'buffet'],
    menuDescription: 'All-you-care-to-eat pizza, pasta, salads, and breadsticks',
  },
];

const EXTRA_SHOPS: ParkPOI[] = [
  {
    id: 'shop-city-shop',
    name: 'City Shop',
    type: 'shop',
    area: 'lego-city-llc',
    x: 0.37, y: 0.52,
    lng: -117.3128, lat: 33.1256,
    description: 'LEGO City themed sets and merchandise',
  },
  {
    id: 'shop-castle-shop',
    name: 'King\'s Market',
    type: 'shop',
    area: 'castle-hill',
    x: 0.61, y: 0.30,
    lng: -117.3098, lat: 33.1278,
    description: 'Medieval-themed LEGO merchandise',
  },
  {
    id: 'shop-dino-shop',
    name: 'Dino Trading Post',
    type: 'shop',
    area: 'dino-valley',
    x: 0.29, y: 0.64,
    lng: -117.3138, lat: 33.1244,
    description: 'Dinosaur-themed LEGO sets and toys',
  },
];

// ============================================
// Export ALL POIs
// ============================================

export const LEGOLAND_CALIFORNIA_POI: ParkPOI[] = [
  // LEGO Galaxy
  ...LEGO_GALAXY_RIDES,
  ...LEGO_GALAXY_FOOD,
  ...LEGO_GALAXY_SHOPS,
  // Castle Hill
  ...CASTLE_HILL_RIDES,
  ...CASTLE_HILL_FOOD,
  // NINJAGO World
  ...NINJAGO_RIDES,
  ...NINJAGO_SHOPS,
  // LEGO Movie World
  ...LEGO_MOVIE_RIDES,
  ...LEGO_MOVIE_FOOD,
  // Imagination Zone
  ...IMAGINATION_RIDES,
  ...IMAGINATION_FOOD,
  // LEGO City
  ...LEGO_CITY_RIDES,
  ...LEGO_CITY_FOOD,
  ...LEGO_CITY_SHOPS,
  // Pirate Shores
  ...PIRATE_SHORES_RIDES,
  ...PIRATE_SHORES_FOOD,
  // Land of Adventure
  ...ADVENTURE_RIDES,
  // Dino Valley
  ...DINO_VALLEY_RIDES,
  // Heartlake City
  ...HEARTLAKE_RIDES,
  ...HEARTLAKE_FOOD,
  // Miniland USA
  ...MINILAND_ATTRACTIONS,
  // Services
  ...SERVICES,
  // Extra food & shops
  ...EXTRA_FOOD,
  ...EXTRA_SHOPS,
];
