import { ParkPOI } from '../types';

// ============================================
// Disneyland Park (Anaheim, CA) — Complete Point of Interest Database
// Source: Official 2025 Park Map, Wikipedia, OpenStreetMap
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 33.8121, -117.9190
// Layout: Hub-and-spoke from Sleeping Beauty Castle
// 9 themed lands radiating from central hub
// ============================================

// ============================================
// MAIN STREET, U.S.A.
// ============================================

const MAIN_STREET: ParkPOI[] = [
  {
    id: 'ride-disneyland-railroad-main-st',
    mapNumber: 1,
    name: 'Disneyland Railroad - Main Street Station',
    type: 'ride',
    area: 'main-street-usa-dl',
    x: 0.50, y: 0.90,
    lng: -117.9190, lat: 33.8096,
    thrillLevel: 'low',
    description: 'Grand circle tour of the park by steam train',
  },
  {
    id: 'ride-main-street-vehicles',
    name: 'Main Street Vehicles',
    type: 'ride',
    area: 'main-street-usa-dl',
    x: 0.50, y: 0.82,
    lng: -117.9190, lat: 33.8103,
    thrillLevel: 'low',
    description: 'Horse-drawn streetcars, omnibuses, and fire engines',
  },
];

// ============================================
// ADVENTURELAND
// ============================================

const ADVENTURELAND: ParkPOI[] = [
  {
    id: 'ride-indiana-jones-adventure',
    mapNumber: 2,
    name: 'Indiana Jones Adventure',
    type: 'ride',
    area: 'adventureland-dl',
    x: 0.28, y: 0.58,
    lng: -117.9218, lat: 33.8114,
    heightRequirement: { min: 46 },
    thrillLevel: 'high',
    description: 'Enhanced motion vehicle ride through the Temple of the Forbidden Eye',
  },
  {
    id: 'ride-jungle-cruise',
    mapNumber: 3,
    name: 'Jungle Cruise',
    type: 'ride',
    area: 'adventureland-dl',
    x: 0.30, y: 0.65,
    lng: -117.9215, lat: 33.8108,
    thrillLevel: 'low',
    description: 'Boat tour through exotic rivers with animatronic animals',
  },
  {
    id: 'attraction-enchanted-tiki-room',
    name: "Walt Disney's Enchanted Tiki Room",
    type: 'theater',
    area: 'adventureland-dl',
    x: 0.35, y: 0.70,
    lng: -117.9210, lat: 33.8104,
    description: 'Audio-Animatronic tropical bird show',
  },
];

// ============================================
// NEW ORLEANS SQUARE
// ============================================

const NEW_ORLEANS_SQUARE: ParkPOI[] = [
  {
    id: 'ride-pirates-of-the-caribbean',
    mapNumber: 4,
    name: 'Pirates of the Caribbean',
    type: 'ride',
    area: 'new-orleans-square',
    x: 0.22, y: 0.52,
    lng: -117.9224, lat: 33.8119,
    thrillLevel: 'low',
    description: 'Boat ride through pirate-infested waters',
  },
  {
    id: 'ride-haunted-mansion',
    mapNumber: 5,
    name: 'Haunted Mansion',
    type: 'ride',
    area: 'new-orleans-square',
    x: 0.18, y: 0.45,
    lng: -117.9229, lat: 33.8125,
    thrillLevel: 'mild',
    description: 'Doom Buggy tour through a haunted estate with 999 happy haunts',
  },
];

// ============================================
// CRITTER COUNTRY
// ============================================

const CRITTER_COUNTRY: ParkPOI[] = [
  {
    id: 'ride-tiana-bayou-adventure',
    mapNumber: 6,
    name: "Tiana's Bayou Adventure",
    type: 'ride',
    area: 'critter-country',
    x: 0.15, y: 0.38,
    lng: -117.9233, lat: 33.8131,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Log flume ride through the bayou with Princess Tiana',
  },
  {
    id: 'ride-winnie-the-pooh',
    mapNumber: 7,
    name: 'The Many Adventures of Winnie the Pooh',
    type: 'ride',
    area: 'critter-country',
    x: 0.17, y: 0.35,
    lng: -117.9231, lat: 33.8134,
    thrillLevel: 'low',
    description: 'Gentle dark ride through the Hundred Acre Wood',
  },
];

// ============================================
// STAR WARS: GALAXY'S EDGE
// ============================================

const GALAXYS_EDGE: ParkPOI[] = [
  {
    id: 'ride-rise-of-the-resistance',
    mapNumber: 8,
    name: 'Star Wars: Rise of the Resistance',
    type: 'ride',
    area: 'galaxys-edge',
    x: 0.15, y: 0.22,
    lng: -117.9233, lat: 33.8145,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    description: 'Multi-system dark ride through a First Order Star Destroyer',
  },
  {
    id: 'ride-millennium-falcon',
    mapNumber: 9,
    name: 'Millennium Falcon: Smugglers Run',
    type: 'ride',
    area: 'galaxys-edge',
    x: 0.20, y: 0.28,
    lng: -117.9228, lat: 33.8140,
    heightRequirement: { min: 38 },
    thrillLevel: 'moderate',
    description: 'Interactive flight simulator piloting the Millennium Falcon',
  },
];

// ============================================
// FRONTIERLAND
// ============================================

const FRONTIERLAND: ParkPOI[] = [
  {
    id: 'ride-big-thunder-mountain',
    mapNumber: 10,
    name: 'Big Thunder Mountain Railroad',
    type: 'ride',
    area: 'frontierland-dl',
    x: 0.22, y: 0.30,
    lng: -117.9224, lat: 33.8138,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'big-thunder-mountain-railroad-disneyland',
    description: 'Runaway mine train coaster through the Old West',
  },
  {
    id: 'ride-mark-twain-riverboat',
    name: 'Mark Twain Riverboat',
    type: 'ride',
    area: 'frontierland-dl',
    x: 0.25, y: 0.40,
    lng: -117.9220, lat: 33.8129,
    thrillLevel: 'low',
    description: 'Scenic steamboat cruise around Tom Sawyer Island',
  },
  {
    id: 'ride-sailing-ship-columbia',
    name: 'Sailing Ship Columbia',
    type: 'ride',
    area: 'frontierland-dl',
    x: 0.27, y: 0.42,
    lng: -117.9218, lat: 33.8127,
    thrillLevel: 'low',
    description: 'Tall ship sailing around the Rivers of America',
  },
];

// ============================================
// FANTASYLAND
// ============================================

const FANTASYLAND: ParkPOI[] = [
  {
    id: 'ride-matterhorn-bobsleds',
    mapNumber: 11,
    name: 'Matterhorn Bobsleds',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.62, y: 0.45,
    lng: -117.9175, lat: 33.8125,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'matterhorn-bobsleds',
    description: 'Bobsled coaster through the icy Matterhorn mountain',
  },
  {
    id: 'ride-peter-pans-flight',
    mapNumber: 12,
    name: "Peter Pan's Flight",
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.42, y: 0.55,
    lng: -117.9200, lat: 33.8117,
    thrillLevel: 'low',
    description: 'Suspended dark ride flying over London and Neverland',
  },
  {
    id: 'ride-its-a-small-world',
    mapNumber: 13,
    name: "It's a Small World",
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.52, y: 0.35,
    lng: -117.9185, lat: 33.8135,
    thrillLevel: 'low',
    description: 'Gentle boat ride through singing dolls from around the world',
  },
  {
    id: 'ride-alice-in-wonderland',
    mapNumber: 14,
    name: 'Alice in Wonderland',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.55, y: 0.50,
    lng: -117.9182, lat: 33.8120,
    thrillLevel: 'low',
    description: 'Caterpillar ride through Wonderland scenes',
  },
  {
    id: 'ride-mr-toads-wild-ride',
    name: "Mr. Toad's Wild Ride",
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.44, y: 0.58,
    lng: -117.9198, lat: 33.8115,
    thrillLevel: 'low',
    description: 'Madcap dark ride through the English countryside',
  },
  {
    id: 'ride-snow-whites-enchanted-wish',
    name: "Snow White's Enchanted Wish",
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.46, y: 0.56,
    lng: -117.9196, lat: 33.8116,
    thrillLevel: 'low',
    description: 'Dark ride through the story of Snow White',
  },
  {
    id: 'ride-pinocchios-daring-journey',
    name: "Pinocchio's Daring Journey",
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.43, y: 0.53,
    lng: -117.9199, lat: 33.8119,
    thrillLevel: 'low',
    description: 'Dark ride through Pinocchio adventures',
  },
  {
    id: 'ride-king-arthur-carrousel',
    name: 'King Arthur Carrousel',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.48, y: 0.60,
    lng: -117.9192, lat: 33.8113,
    thrillLevel: 'low',
    description: 'Classic carousel with hand-painted horses',
  },
  {
    id: 'ride-dumbo',
    name: 'Dumbo the Flying Elephant',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.55, y: 0.55,
    lng: -117.9182, lat: 33.8118,
    thrillLevel: 'low',
    description: 'Spinning aerial ride on Dumbo elephants',
  },
  {
    id: 'ride-casey-jr-circus-train',
    name: 'Casey Jr. Circus Train',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.52, y: 0.42,
    lng: -117.9185, lat: 33.8130,
    thrillLevel: 'low',
    description: 'Mini train ride around Storybook Land',
  },
  {
    id: 'ride-storybook-land-canal-boats',
    name: 'Storybook Land Canal Boats',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.50, y: 0.45,
    lng: -117.9188, lat: 33.8128,
    thrillLevel: 'low',
    description: 'Boat ride past miniature Disney movie settings',
  },
  {
    id: 'ride-mad-tea-party',
    name: 'Mad Tea Party',
    type: 'ride',
    area: 'fantasyland-dl',
    x: 0.57, y: 0.48,
    lng: -117.9180, lat: 33.8122,
    thrillLevel: 'mild',
    description: 'Spinning teacups inspired by Alice in Wonderland',
  },
];

// ============================================
// TOONTOWN
// ============================================

const TOONTOWN: ParkPOI[] = [
  {
    id: 'ride-mickey-minnies-runaway-railway',
    mapNumber: 15,
    name: "Mickey & Minnie's Runaway Railway",
    type: 'ride',
    area: 'toontown',
    x: 0.60, y: 0.22,
    lng: -117.9177, lat: 33.8148,
    thrillLevel: 'mild',
    description: '2D-to-3D trackless dark ride with Mickey and Minnie',
  },
  {
    id: 'ride-roger-rabbits-car-toon-spin',
    mapNumber: 16,
    name: "Roger Rabbit's Car Toon Spin",
    type: 'ride',
    area: 'toontown',
    x: 0.65, y: 0.20,
    lng: -117.9172, lat: 33.8150,
    thrillLevel: 'mild',
    description: 'Spinning dark ride through Toontown',
  },
  {
    id: 'ride-gadgets-go-coaster',
    name: "Gadget's Go Coaster",
    type: 'ride',
    area: 'toontown',
    x: 0.62, y: 0.18,
    lng: -117.9175, lat: 33.8152,
    heightRequirement: { min: 35 },
    thrillLevel: 'mild',
    coasterId: 'gadgets-go-coaster',
    description: 'Junior coaster made from oversized household objects',
  },
];

// ============================================
// TOMORROWLAND
// ============================================

const TOMORROWLAND: ParkPOI[] = [
  {
    id: 'ride-space-mountain-dl',
    mapNumber: 17,
    name: 'Space Mountain',
    type: 'ride',
    area: 'tomorrowland-dl',
    x: 0.72, y: 0.35,
    lng: -117.9163, lat: 33.8133,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'space-mountain-disneyland',
    description: 'Indoor roller coaster through outer space in near-darkness',
  },
  {
    id: 'ride-buzz-lightyear',
    mapNumber: 18,
    name: 'Buzz Lightyear Astro Blasters',
    type: 'ride',
    area: 'tomorrowland-dl',
    x: 0.68, y: 0.40,
    lng: -117.9168, lat: 33.8128,
    thrillLevel: 'low',
    description: 'Interactive shooting dark ride battling Emperor Zurg',
  },
  {
    id: 'ride-finding-nemo-submarine',
    mapNumber: 19,
    name: 'Finding Nemo Submarine Voyage',
    type: 'ride',
    area: 'tomorrowland-dl',
    x: 0.65, y: 0.30,
    lng: -117.9172, lat: 33.8137,
    thrillLevel: 'low',
    description: 'Submarine ride through underwater scenes from Finding Nemo',
  },
  {
    id: 'ride-autopia',
    name: 'Autopia',
    type: 'ride',
    area: 'tomorrowland-dl',
    x: 0.75, y: 0.28,
    lng: -117.9160, lat: 33.8139,
    heightRequirement: { min: 32 },
    thrillLevel: 'low',
    description: 'Drive miniature cars through a scenic freeway',
  },
  {
    id: 'ride-astro-orbiter',
    name: 'Astro Orbiter',
    type: 'ride',
    area: 'tomorrowland-dl',
    x: 0.68, y: 0.50,
    lng: -117.9168, lat: 33.8120,
    thrillLevel: 'low',
    description: 'Elevated spinning rocket ride',
  },
  {
    id: 'ride-star-tours',
    mapNumber: 20,
    name: 'Star Tours - The Adventures Continue',
    type: 'ride',
    area: 'tomorrowland-dl',
    x: 0.70, y: 0.45,
    lng: -117.9165, lat: 33.8125,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: '3D motion simulator through Star Wars destinations',
  },
];

// ============================================
// SHOWS & ATTRACTIONS
// ============================================

const SHOWS_AND_ATTRACTIONS: ParkPOI[] = [
  {
    id: 'attraction-sleeping-beauty-castle',
    name: 'Sleeping Beauty Castle Walkthrough',
    type: 'attraction',
    area: 'fantasyland-dl',
    x: 0.48, y: 0.68,
    lng: -117.9192, lat: 33.8107,
    description: 'Walk through the castle with Sleeping Beauty dioramas',
  },
  {
    id: 'attraction-fantasmic',
    name: 'Fantasmic!',
    type: 'theater',
    area: 'frontierland-dl',
    x: 0.20, y: 0.35,
    lng: -117.9226, lat: 33.8133,
    description: 'Nighttime spectacular on the Rivers of America',
  },
  {
    id: 'attraction-great-moments-lincoln',
    name: 'Great Moments with Mr. Lincoln',
    type: 'theater',
    area: 'main-street-usa-dl',
    x: 0.52, y: 0.85,
    lng: -117.9185, lat: 33.8100,
    description: 'Audio-Animatronic Abraham Lincoln show',
  },
];

// ============================================
// FOOD LOCATIONS
// ============================================

const FOOD: ParkPOI[] = [
  // Main Street
  {
    id: 'food-jolly-holiday-bakery',
    name: 'Jolly Holiday Bakery Cafe',
    type: 'food',
    area: 'main-street-usa-dl',
    x: 0.45, y: 0.75,
    lng: -117.9196, lat: 33.8107,
    menuItems: ['pastries', 'sandwiches', 'salad', 'soup', 'coffee'],
    menuDescription: 'Mary Poppins themed bakery with pastries and sandwiches',
  },
  {
    id: 'food-carnation-cafe',
    name: 'Carnation Cafe',
    type: 'food',
    area: 'main-street-usa-dl',
    x: 0.52, y: 0.78,
    lng: -117.9185, lat: 33.8105,
    menuItems: ['burgers', 'meatloaf', 'pot roast', 'breakfast'],
    menuDescription: 'Classic American comfort food on Main Street',
  },
  {
    id: 'food-gibson-girl-ice-cream',
    name: 'Gibson Girl Ice Cream Parlor',
    type: 'food',
    area: 'main-street-usa-dl',
    x: 0.50, y: 0.80,
    lng: -117.9188, lat: 33.8103,
    menuItems: ['ice cream', 'sundaes', 'floats'],
    menuDescription: 'Hand-scooped ice cream and sundaes',
  },
  // Adventureland
  {
    id: 'food-bengal-bbq',
    name: 'Bengal Barbecue',
    type: 'food',
    area: 'adventureland-dl',
    x: 0.32, y: 0.62,
    lng: -117.9212, lat: 33.8111,
    menuItems: ['skewers', 'chicken', 'beef', 'bacon wrapped asparagus'],
    menuDescription: 'Grilled skewers and kabobs',
  },
  {
    id: 'food-tiki-juice-bar',
    name: 'Tiki Juice Bar',
    type: 'food',
    area: 'adventureland-dl',
    x: 0.34, y: 0.68,
    lng: -117.9210, lat: 33.8106,
    menuItems: ['dole whip', 'pineapple', 'juice', 'floats'],
    menuDescription: 'The famous Dole Whip and tropical drinks',
  },
  // New Orleans Square
  {
    id: 'food-blue-bayou',
    name: 'Blue Bayou Restaurant',
    type: 'food',
    area: 'new-orleans-square',
    x: 0.24, y: 0.50,
    lng: -117.9222, lat: 33.8121,
    menuItems: ['cajun', 'seafood', 'steak', 'monte cristo'],
    menuDescription: 'Fine dining inside Pirates of the Caribbean ride building',
    servesAlcohol: true,
  },
  {
    id: 'food-cafe-orleans',
    name: 'Cafe Orleans',
    type: 'food',
    area: 'new-orleans-square',
    x: 0.26, y: 0.48,
    lng: -117.9219, lat: 33.8123,
    menuItems: ['beignets', 'monte cristo', 'pommes frites', 'crepes'],
    menuDescription: 'French Quarter dining with beignets and Monte Cristo',
  },
  {
    id: 'food-french-market',
    name: 'French Market Restaurant',
    type: 'food',
    area: 'new-orleans-square',
    x: 0.20, y: 0.48,
    lng: -117.9227, lat: 33.8123,
    menuItems: ['jambalaya', 'clam chowder', 'chicken', 'ribs'],
    menuDescription: 'Cajun and Creole quick service dining',
  },
  {
    id: 'food-mint-julep-bar',
    name: 'Mint Julep Bar',
    type: 'food',
    area: 'new-orleans-square',
    x: 0.21, y: 0.46,
    lng: -117.9226, lat: 33.8125,
    menuItems: ['mint julep', 'beignets', 'fritters'],
    menuDescription: 'Beignets and mint juleps in the French Quarter',
  },
  // Frontierland
  {
    id: 'food-golden-horseshoe',
    name: 'The Golden Horseshoe',
    type: 'food',
    area: 'frontierland-dl',
    x: 0.30, y: 0.50,
    lng: -117.9215, lat: 33.8120,
    menuItems: ['chicken tenders', 'fish & chips', 'chili'],
    menuDescription: 'Quick service in a classic Western saloon',
  },
  {
    id: 'food-rancho-del-zocalo',
    name: 'Rancho del Zocalo Restaurante',
    type: 'food',
    area: 'frontierland-dl',
    x: 0.28, y: 0.45,
    lng: -117.9218, lat: 33.8126,
    menuItems: ['tacos', 'burritos', 'enchiladas', 'rice', 'beans'],
    menuDescription: 'Mexican-inspired dining',
  },
  {
    id: 'food-hungry-bear-bbq',
    name: 'Hungry Bear Barbecue Jamboree',
    type: 'food',
    area: 'critter-country',
    x: 0.16, y: 0.40,
    lng: -117.9232, lat: 33.8129,
    menuItems: ['bbq', 'ribs', 'pulled pork', 'coleslaw', 'cornbread'],
    menuDescription: 'Country Bears themed barbecue dining',
  },
  // Galaxy's Edge
  {
    id: 'food-docking-bay-7',
    name: 'Docking Bay 7 Food and Cargo',
    type: 'food',
    area: 'galaxys-edge',
    x: 0.18, y: 0.25,
    lng: -117.9230, lat: 33.8143,
    menuItems: ['ribs', 'chicken', 'pot roast', 'fried chicken'],
    menuDescription: 'Star Wars themed quick service dining',
  },
  {
    id: 'food-ogas-cantina',
    name: "Oga's Cantina",
    type: 'food',
    area: 'galaxys-edge',
    x: 0.22, y: 0.25,
    lng: -117.9224, lat: 33.8143,
    menuItems: ['cocktails', 'beer', 'blue milk', 'snacks'],
    menuDescription: 'Star Wars themed bar with unique drinks',
    servesAlcohol: true,
  },
  {
    id: 'food-milk-stand',
    name: 'Milk Stand',
    type: 'food',
    area: 'galaxys-edge',
    x: 0.20, y: 0.28,
    lng: -117.9228, lat: 33.8140,
    menuItems: ['blue milk', 'green milk'],
    menuDescription: 'Blue and green milk frozen drinks',
  },
  // Fantasyland
  {
    id: 'food-red-rose-taverne',
    name: 'Red Rose Taverne',
    type: 'food',
    area: 'fantasyland-dl',
    x: 0.45, y: 0.52,
    lng: -117.9196, lat: 33.8120,
    menuItems: ['flatbreads', 'burgers', 'sandwiches', 'salad'],
    menuDescription: 'Beauty and the Beast themed quick service',
  },
  {
    id: 'food-edelweiss-snacks',
    name: 'Edelweiss Snacks',
    type: 'food',
    area: 'fantasyland-dl',
    x: 0.58, y: 0.48,
    lng: -117.9178, lat: 33.8122,
    menuItems: ['turkey legs', 'corn dogs', 'chimichanga'],
    menuDescription: 'Snacks near the Matterhorn',
  },
  // Tomorrowland
  {
    id: 'food-galactic-grill',
    name: 'Galactic Grill',
    type: 'food',
    area: 'tomorrowland-dl',
    x: 0.65, y: 0.55,
    lng: -117.9172, lat: 33.8116,
    menuItems: ['burgers', 'chicken sandwiches', 'fries', 'salad'],
    menuDescription: 'Quick service burgers in Tomorrowland',
  },
  {
    id: 'food-alien-pizza-planet',
    name: 'Alien Pizza Planet',
    type: 'food',
    area: 'tomorrowland-dl',
    x: 0.68, y: 0.52,
    lng: -117.9168, lat: 33.8118,
    menuItems: ['pizza', 'pasta', 'breadsticks', 'salad'],
    menuDescription: 'Toy Story themed pizza and pasta',
  },
];

// ============================================
// MERCHANDISE / SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-emporium-dl',
    name: 'Emporium',
    type: 'shop',
    area: 'main-street-usa-dl',
    x: 0.48, y: 0.80,
    lng: -117.9192, lat: 33.8103,
    description: 'Largest shop in the park with Disney merchandise',
  },
  {
    id: 'shop-star-trader',
    name: 'Star Trader',
    type: 'shop',
    area: 'tomorrowland-dl',
    x: 0.66, y: 0.48,
    lng: -117.9170, lat: 33.8122,
    description: 'Star Wars collectibles and Tomorrowland merchandise',
  },
  {
    id: 'shop-savis-workshop',
    name: "Savi's Workshop - Handbuilt Lightsabers",
    type: 'shop',
    area: 'galaxys-edge',
    x: 0.17, y: 0.24,
    lng: -117.9231, lat: 33.8144,
    description: 'Build your own custom lightsaber experience',
  },
  {
    id: 'shop-droid-depot',
    name: 'Droid Depot',
    type: 'shop',
    area: 'galaxys-edge',
    x: 0.19, y: 0.22,
    lng: -117.9229, lat: 33.8146,
    description: 'Build your own custom R2 or BB-series droid',
  },
  {
    id: 'shop-pieces-of-eight',
    name: 'Pieces of Eight',
    type: 'shop',
    area: 'new-orleans-square',
    x: 0.23, y: 0.54,
    lng: -117.9223, lat: 33.8117,
    description: 'Pirate-themed merchandise at the Pirates exit',
  },
  {
    id: 'shop-bibbidi-bobbidi-boutique',
    name: 'Bibbidi Bobbidi Boutique',
    type: 'shop',
    area: 'fantasyland-dl',
    x: 0.47, y: 0.62,
    lng: -117.9194, lat: 33.8111,
    description: 'Princess makeover and costume experience',
  },
  {
    id: 'shop-fantasy-faire-gifts',
    name: 'Fantasy Faire Gifts',
    type: 'shop',
    area: 'fantasyland-dl',
    x: 0.40, y: 0.65,
    lng: -117.9203, lat: 33.8108,
    description: 'Princess and fairytale merchandise',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-dl',
    name: 'Main Entrance',
    type: 'service',
    area: 'main-street-usa-dl',
    x: 0.50, y: 0.95,
    lng: -117.9190, lat: 33.8092,
    description: 'Main park entrance via Esplanade',
  },
  {
    id: 'restroom-main-street-dl',
    name: 'Restrooms (Main Street)',
    type: 'service',
    area: 'main-street-usa-dl',
    x: 0.54, y: 0.88,
    lng: -117.9185, lat: 33.8097,
    approximateLocation: true,
    description: 'Restrooms on Main Street near entrance',
  },
  {
    id: 'restroom-adventureland-dl',
    name: 'Restrooms (Adventureland)',
    type: 'service',
    area: 'adventureland-dl',
    x: 0.30, y: 0.60,
    lng: -117.9215, lat: 33.8112,
    approximateLocation: true,
    description: 'Restrooms in Adventureland',
  },
  {
    id: 'restroom-new-orleans-dl',
    name: 'Restrooms (New Orleans Square)',
    type: 'service',
    area: 'new-orleans-square',
    x: 0.20, y: 0.50,
    lng: -117.9227, lat: 33.8120,
    approximateLocation: true,
    description: 'Restrooms in New Orleans Square',
  },
  {
    id: 'restroom-galaxys-edge-dl',
    name: 'Restrooms (Galaxy\'s Edge)',
    type: 'service',
    area: 'galaxys-edge',
    x: 0.18, y: 0.20,
    lng: -117.9230, lat: 33.8148,
    approximateLocation: true,
    description: 'Restrooms in Star Wars: Galaxy\'s Edge',
  },
  {
    id: 'restroom-fantasyland-dl',
    name: 'Restrooms (Fantasyland)',
    type: 'service',
    area: 'fantasyland-dl',
    x: 0.50, y: 0.50,
    lng: -117.9188, lat: 33.8120,
    approximateLocation: true,
    description: 'Restrooms in Fantasyland',
  },
  {
    id: 'restroom-tomorrowland-dl',
    name: 'Restrooms (Tomorrowland)',
    type: 'service',
    area: 'tomorrowland-dl',
    x: 0.70, y: 0.48,
    lng: -117.9165, lat: 33.8122,
    approximateLocation: true,
    description: 'Restrooms in Tomorrowland',
  },
  {
    id: 'restroom-toontown-dl',
    name: 'Restrooms (Toontown)',
    type: 'service',
    area: 'toontown',
    x: 0.62, y: 0.20,
    lng: -117.9175, lat: 33.8148,
    approximateLocation: true,
    description: 'Restrooms in Toontown',
  },
  {
    id: 'service-first-aid-dl',
    name: 'First Aid',
    type: 'service',
    area: 'main-street-usa-dl',
    x: 0.55, y: 0.85,
    lng: -117.9182, lat: 33.8099,
    description: 'First aid station on Main Street',
  },
  {
    id: 'service-guest-relations-dl',
    name: 'Guest Relations',
    type: 'service',
    area: 'main-street-usa-dl',
    x: 0.48, y: 0.92,
    lng: -117.9192, lat: 33.8094,
    description: 'Guest services, City Hall',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const DISNEYLAND_POI: ParkPOI[] = [
  ...MAIN_STREET,
  ...ADVENTURELAND,
  ...NEW_ORLEANS_SQUARE,
  ...CRITTER_COUNTRY,
  ...GALAXYS_EDGE,
  ...FRONTIERLAND,
  ...FANTASYLAND,
  ...TOONTOWN,
  ...TOMORROWLAND,
  ...SHOWS_AND_ATTRACTIONS,
  ...FOOD,
  ...SHOPS,
  ...SERVICES,
];
