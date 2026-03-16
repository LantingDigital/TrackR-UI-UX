import { ParkPOI } from '../types';

// ============================================
// Universal Epic Universe — Complete Point of Interest Database
// Source: Official 2025 Park Map, Wikipedia, OpenStreetMap
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// These are initial estimates — use the position editor to fine-tune.
//
// Park center: 28.4735, -81.4477
// Hub-and-spoke layout: Celestial Park hub with 4 themed worlds
// Left to right from entrance: Super Nintendo World, Dark Universe,
// Ministry of Magic, Isle of Berk
// ============================================

// ============================================
// CELESTIAL PARK (Hub)
// ============================================

const CELESTIAL_PARK_RIDES: ParkPOI[] = [
  {
    id: 'ride-stardust-racers',
    mapNumber: 1,
    name: 'Stardust Racers',
    type: 'ride',
    area: 'celestial-park',
    x: 0.50, y: 0.55,
    lng: -81.4478, lat: 28.4740,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'stardust-racers',
    description: 'Dual-tracked launched coaster by Mack Rides',
  },
  {
    id: 'ride-constellation-carousel',
    mapNumber: 2,
    name: 'Constellation Carousel',
    type: 'ride',
    area: 'celestial-park',
    x: 0.50, y: 0.65,
    lng: -81.4476, lat: 28.4730,
    heightRequirement: { withCompanion: 48 },
    thrillLevel: 'low',
    description: 'Celestial-themed carousel with rising and falling vehicles',
  },
];

const CELESTIAL_PARK_FOOD: ParkPOI[] = [
  {
    id: 'food-atlantic-eu',
    name: 'Atlantic',
    type: 'food',
    area: 'celestial-park',
    x: 0.55, y: 0.70,
    lng: -81.4470, lat: 28.4725,
    menuItems: ['seafood', 'fish', 'lobster', 'oysters', 'cocktails'],
    menuDescription: 'Underwater-themed seafood restaurant encased in glass',
    servesAlcohol: true,
  },
  {
    id: 'food-blue-dragon',
    name: 'Blue Dragon Pan-Asian Restaurant',
    type: 'food',
    area: 'celestial-park',
    x: 0.45, y: 0.68,
    lng: -81.4484, lat: 28.4727,
    menuItems: ['asian', 'noodles', 'sushi', 'dumplings', 'rice'],
    menuDescription: 'Pan-Asian dining in Celestial Park',
    servesAlcohol: true,
  },
  {
    id: 'food-pizza-moon',
    name: 'Pizza Moon',
    type: 'food',
    area: 'celestial-park',
    x: 0.48, y: 0.60,
    lng: -81.4480, lat: 28.4735,
    menuItems: ['pizza', 'calzones', 'salad'],
    menuDescription: 'Pizza and Italian quick service',
  },
  {
    id: 'food-frosty-moon',
    name: 'Frosty Moon',
    type: 'food',
    area: 'celestial-park',
    x: 0.52, y: 0.62,
    lng: -81.4474, lat: 28.4733,
    menuItems: ['ice cream', 'frozen treats', 'desserts'],
    menuDescription: 'Frozen treats and desserts',
  },
  {
    id: 'food-meteor-astropub',
    name: 'Meteor Astropub',
    type: 'food',
    area: 'celestial-park',
    x: 0.46, y: 0.58,
    lng: -81.4482, lat: 28.4737,
    menuItems: ['beer', 'cocktails', 'pub food', 'drinks'],
    menuDescription: 'Celestial-themed bar and pub',
    servesAlcohol: true,
  },
  {
    id: 'food-oak-and-star',
    name: 'The Oak & Star Tavern',
    type: 'food',
    area: 'celestial-park',
    x: 0.54, y: 0.58,
    lng: -81.4472, lat: 28.4737,
    menuItems: ['tavern', 'sandwiches', 'drinks', 'beer'],
    menuDescription: 'Tavern dining with craft beverages',
    servesAlcohol: true,
  },
];

const CELESTIAL_PARK_SHOPS: ParkPOI[] = [
  {
    id: 'shop-other-worlds-mercantile',
    name: 'Other Worlds Mercantile',
    type: 'shop',
    area: 'celestial-park',
    x: 0.50, y: 0.75,
    lng: -81.4478, lat: 28.4720,
    description: 'Main park gift shop with Epic Universe branded merchandise',
  },
  {
    id: 'shop-moonship-chocolates',
    name: 'Moonship Chocolates & Celestial Sweets',
    type: 'shop',
    area: 'celestial-park',
    x: 0.48, y: 0.72,
    lng: -81.4480, lat: 28.4723,
    description: 'Chocolates and confections',
  },
  {
    id: 'shop-nintendo-super-star-store',
    name: 'Nintendo Super Star Store',
    type: 'shop',
    area: 'celestial-park',
    x: 0.38, y: 0.65,
    lng: -81.4492, lat: 28.4730,
    description: 'Nintendo merchandise in Celestial Park',
  },
  {
    id: 'shop-sensorium-emporium',
    name: 'Sensorium Emporium',
    type: 'shop',
    area: 'celestial-park',
    x: 0.52, y: 0.72,
    lng: -81.4474, lat: 28.4723,
    description: 'Unique sensory goods and novelties',
  },
];

// ============================================
// SUPER NINTENDO WORLD
// ============================================

const NINTENDO_RIDES: ParkPOI[] = [
  {
    id: 'ride-mario-kart-eu',
    mapNumber: 3,
    name: "Mario Kart: Bowser's Challenge",
    type: 'ride',
    area: 'super-nintendo-world-eu',
    x: 0.20, y: 0.40,
    lng: -81.4505, lat: 28.4750,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Interactive AR dark ride through Mario Kart courses',
  },
  {
    id: 'ride-yoshis-adventure-eu',
    mapNumber: 4,
    name: "Yoshi's Adventure",
    type: 'ride',
    area: 'super-nintendo-world-eu',
    x: 0.22, y: 0.35,
    lng: -81.4503, lat: 28.4755,
    heightRequirement: { min: 34 },
    thrillLevel: 'low',
    description: 'Gentle ride through the Mushroom Kingdom on Yoshi',
  },
  {
    id: 'ride-dk-mine-cart-madness',
    mapNumber: 5,
    name: "Donkey Kong Country Mine-Cart Madness",
    type: 'ride',
    area: 'super-nintendo-world-eu',
    x: 0.18, y: 0.30,
    lng: -81.4508, lat: 28.4760,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    coasterId: 'mine-cart-madness',
    description: 'Mine cart coaster through Donkey Kong Country',
  },
];

const NINTENDO_FOOD: ParkPOI[] = [
  {
    id: 'food-toadstool-cafe-eu',
    name: 'Toadstool Cafe',
    type: 'food',
    area: 'super-nintendo-world-eu',
    x: 0.24, y: 0.38,
    lng: -81.4500, lat: 28.4752,
    menuItems: ['mushroom soup', 'mario burgers', 'star pasta', 'desserts'],
    menuDescription: 'Nintendo-themed dining in the Mushroom Kingdom',
  },
  {
    id: 'food-yoshis-snack-island-eu',
    name: "Yoshi's Snack Island",
    type: 'food',
    area: 'super-nintendo-world-eu',
    x: 0.22, y: 0.42,
    lng: -81.4503, lat: 28.4748,
    menuItems: ['snacks', 'treats', 'drinks', 'desserts'],
    menuDescription: 'Snacks and treats in Nintendo World',
  },
  {
    id: 'food-turbo-boost-treats',
    name: 'Turbo Boost Treats',
    type: 'food',
    area: 'super-nintendo-world-eu',
    x: 0.20, y: 0.45,
    lng: -81.4505, lat: 28.4745,
    menuItems: ['snacks', 'churros', 'drinks'],
    menuDescription: 'Quick snacks and beverages',
  },
];

const NINTENDO_SHOPS: ParkPOI[] = [
  {
    id: 'shop-1-up-factory-eu',
    name: '1-UP Factory',
    type: 'shop',
    area: 'super-nintendo-world-eu',
    x: 0.25, y: 0.40,
    lng: -81.4498, lat: 28.4750,
    description: 'Mario and Nintendo merchandise',
  },
  {
    id: 'shop-mario-motors-eu',
    name: 'Mario Motors',
    type: 'shop',
    area: 'super-nintendo-world-eu',
    x: 0.23, y: 0.43,
    lng: -81.4501, lat: 28.4747,
    description: 'Mario Kart themed merchandise and character hats',
  },
  {
    id: 'shop-funkys-fly-n-buy',
    name: "Funky's Fly 'n' Buy",
    type: 'shop',
    area: 'super-nintendo-world-eu',
    x: 0.17, y: 0.32,
    lng: -81.4509, lat: 28.4758,
    description: 'Donkey Kong Country merchandise',
  },
];

// ============================================
// DARK UNIVERSE
// ============================================

const DARK_UNIVERSE_RIDES: ParkPOI[] = [
  {
    id: 'ride-monsters-unchained',
    mapNumber: 6,
    name: 'Monsters Unchained: The Frankenstein Experiment',
    type: 'ride',
    area: 'dark-universe',
    x: 0.38, y: 0.25,
    lng: -81.4490, lat: 28.4765,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    description: 'KUKA arm dark ride through Classic Monsters world',
  },
  {
    id: 'ride-curse-of-the-werewolf',
    mapNumber: 7,
    name: 'Curse of the Werewolf',
    type: 'ride',
    area: 'dark-universe',
    x: 0.35, y: 0.20,
    lng: -81.4493, lat: 28.4770,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    coasterId: 'curse-of-the-werewolf',
    description: 'Spinning coaster with werewolf theming',
  },
];

const DARK_UNIVERSE_FOOD: ParkPOI[] = [
  {
    id: 'food-das-stakehaus',
    name: 'Das Stakehaus',
    type: 'food',
    area: 'dark-universe',
    x: 0.40, y: 0.22,
    lng: -81.4487, lat: 28.4768,
    menuItems: ['burgers', 'pretzels', 'bratwurst', 'wings', 'garlic stake'],
    menuDescription: 'Monster hunter themed pub with burgers and bratwurst',
    servesAlcohol: true,
  },
  {
    id: 'food-de-laceys-cottage',
    name: "De Lacey's Cottage",
    type: 'food',
    area: 'dark-universe',
    x: 0.36, y: 0.18,
    lng: -81.4492, lat: 28.4772,
    menuItems: ['cinnamon bread', 'pretzels', 'snacks'],
    menuDescription: 'Cozy cottage snack stand near Frankenstein Manor',
  },
];

const DARK_UNIVERSE_SHOPS: ParkPOI[] = [
  {
    id: 'shop-pretorius-oddities',
    name: "Pretorius' Scientific Oddities",
    type: 'shop',
    area: 'dark-universe',
    x: 0.42, y: 0.24,
    lng: -81.4485, lat: 28.4766,
    description: 'Monster cosplay attire and Dark Universe merchandise',
  },
  {
    id: 'shop-darkmoor-makeup',
    name: 'Darkmoor Monster Makeup Experience',
    type: 'shop',
    area: 'dark-universe',
    x: 0.37, y: 0.22,
    lng: -81.4491, lat: 28.4768,
    description: 'Monster face paint and makeup experience',
  },
];

// ============================================
// WIZARDING WORLD — MINISTRY OF MAGIC
// ============================================

const MINISTRY_RIDES: ParkPOI[] = [
  {
    id: 'ride-battle-at-the-ministry',
    mapNumber: 8,
    name: 'Harry Potter and the Battle at the Ministry',
    type: 'ride',
    area: 'wizarding-world-ministry',
    x: 0.65, y: 0.22,
    lng: -81.4460, lat: 28.4770,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    description: 'Dark ride through the Ministry of Magic battle',
  },
];

const MINISTRY_FOOD: ParkPOI[] = [
  {
    id: 'food-cafe-la-sirene',
    name: "Cafe L'Air De La Sirene",
    type: 'food',
    area: 'wizarding-world-ministry',
    x: 0.62, y: 0.25,
    lng: -81.4463, lat: 28.4767,
    menuItems: ['french sandwiches', 'baguettes', 'croissants', 'desserts', 'plats du jour'],
    menuDescription: 'Charming French cafe with sandwiches and baked goods',
  },
  {
    id: 'food-k-rammelle',
    name: 'K. Rammelle',
    type: 'food',
    area: 'wizarding-world-ministry',
    x: 0.68, y: 0.20,
    lng: -81.4457, lat: 28.4772,
    menuItems: ['confections', 'candy', 'chocolate', 'pastries'],
    menuDescription: 'French wizarding confectionery',
  },
];

const MINISTRY_SHOPS: ParkPOI[] = [
  {
    id: 'shop-acajor-baguettes',
    name: 'Acajor Baguettes Magique',
    type: 'shop',
    area: 'wizarding-world-ministry',
    x: 0.64, y: 0.24,
    lng: -81.4462, lat: 28.4768,
    description: 'Interactive wands and wand accessories',
  },
  {
    id: 'shop-les-galeries',
    name: 'Les Galeries Mirifiques',
    type: 'shop',
    area: 'wizarding-world-ministry',
    x: 0.66, y: 0.22,
    lng: -81.4459, lat: 28.4770,
    description: 'Wizarding gear and accessories',
  },
  {
    id: 'shop-tour-en-floo',
    name: 'Tour En Floo',
    type: 'shop',
    area: 'wizarding-world-ministry',
    x: 0.60, y: 0.28,
    lng: -81.4466, lat: 28.4764,
    description: 'Metro-Floo station gift shop',
  },
];

// ============================================
// HOW TO TRAIN YOUR DRAGON — ISLE OF BERK
// ============================================

const BERK_RIDES: ParkPOI[] = [
  {
    id: 'ride-hiccups-wing-gliders',
    mapNumber: 9,
    name: "Hiccup's Wing Gliders",
    type: 'ride',
    area: 'isle-of-berk',
    x: 0.80, y: 0.30,
    lng: -81.4448, lat: 28.4762,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    coasterId: 'hiccups-wing-gliders',
    description: 'Massive steel launch coaster soaring over Isle of Berk',
  },
  {
    id: 'ride-dragon-racers-rally',
    mapNumber: 10,
    name: "Dragon Racer's Rally",
    type: 'ride',
    area: 'isle-of-berk',
    x: 0.82, y: 0.25,
    lng: -81.4445, lat: 28.4767,
    heightRequirement: { min: 48 },
    thrillLevel: 'moderate',
    description: 'Dual Gerstlauer Sky Fly ride where riders control their dragon',
  },
  {
    id: 'ride-fyre-drill',
    mapNumber: 11,
    name: 'Fyre Drill',
    type: 'ride',
    area: 'isle-of-berk',
    x: 0.78, y: 0.35,
    lng: -81.4451, lat: 28.4757,
    heightRequirement: { withCompanion: 48 },
    thrillLevel: 'mild',
    description: 'Interactive boat ride through the Viking world of Berk',
  },
];

const BERK_FOOD: ParkPOI[] = [
  {
    id: 'food-mead-hall',
    name: 'Mead Hall',
    type: 'food',
    area: 'isle-of-berk',
    x: 0.80, y: 0.38,
    lng: -81.4448, lat: 28.4754,
    menuItems: ['viking platter', 'nordic salad', 'rotisserie', 'mead', 'turkey leg'],
    menuDescription: 'Scandinavian-inspired feast hall dining',
    servesAlcohol: true,
  },
  {
    id: 'food-spit-fyre-grill',
    name: 'Spit Fyre Grill',
    type: 'food',
    area: 'isle-of-berk',
    x: 0.82, y: 0.35,
    lng: -81.4445, lat: 28.4757,
    menuItems: ['grilled meats', 'sausages', 'corn', 'drinks'],
    menuDescription: 'Dragon-fired grill with roasted meats',
  },
  {
    id: 'food-hooligans-grog',
    name: "Hooligan's Grog & Gruel",
    type: 'food',
    area: 'isle-of-berk',
    x: 0.78, y: 0.40,
    lng: -81.4451, lat: 28.4752,
    menuItems: ['beer', 'grog', 'drinks', 'snacks'],
    menuDescription: 'Viking-themed beverages and snacks',
    servesAlcohol: true,
  },
];

const BERK_SHOPS: ParkPOI[] = [
  {
    id: 'shop-toothless-treasures',
    name: "Toothless' Treasures",
    type: 'shop',
    area: 'isle-of-berk',
    x: 0.79, y: 0.32,
    lng: -81.4450, lat: 28.4760,
    description: 'How to Train Your Dragon toys and apparel',
  },
  {
    id: 'shop-viking-traders',
    name: 'Viking Traders',
    type: 'shop',
    area: 'isle-of-berk',
    x: 0.83, y: 0.28,
    lng: -81.4443, lat: 28.4764,
    description: 'Viking helmets, masks, shields, and swords',
  },
  {
    id: 'shop-hiccups-workshop',
    name: "Hiccup's Work Shop",
    type: 'shop',
    area: 'isle-of-berk',
    x: 0.81, y: 0.33,
    lng: -81.4447, lat: 28.4759,
    description: 'Dragon rider gear and Viking crafts',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-eu',
    name: 'Main Entrance',
    type: 'service',
    area: 'celestial-park',
    x: 0.50, y: 0.90,
    lng: -81.4478, lat: 28.4710,
    description: 'Main park entrance via Helios Grand Hotel',
  },
  {
    id: 'restroom-celestial-park-entrance',
    name: 'Restrooms (Celestial Park Entrance)',
    type: 'service',
    area: 'celestial-park',
    x: 0.48, y: 0.85,
    lng: -81.4480, lat: 28.4714,
    approximateLocation: true,
    description: 'Restrooms near park entrance',
  },
  {
    id: 'restroom-celestial-park-center',
    name: 'Restrooms (Celestial Park Center)',
    type: 'service',
    area: 'celestial-park',
    x: 0.50, y: 0.60,
    lng: -81.4478, lat: 28.4735,
    approximateLocation: true,
    description: 'Restrooms in the center of Celestial Park',
  },
  {
    id: 'restroom-nintendo-eu',
    name: 'Restrooms (Super Nintendo World)',
    type: 'service',
    area: 'super-nintendo-world-eu',
    x: 0.22, y: 0.44,
    lng: -81.4503, lat: 28.4746,
    approximateLocation: true,
    description: 'Restrooms in Super Nintendo World',
  },
  {
    id: 'restroom-dark-universe',
    name: 'Restrooms (Dark Universe)',
    type: 'service',
    area: 'dark-universe',
    x: 0.38, y: 0.28,
    lng: -81.4490, lat: 28.4762,
    approximateLocation: true,
    description: 'Restrooms in Dark Universe',
  },
  {
    id: 'restroom-ministry',
    name: 'Restrooms (Ministry of Magic)',
    type: 'service',
    area: 'wizarding-world-ministry',
    x: 0.62, y: 0.28,
    lng: -81.4463, lat: 28.4764,
    approximateLocation: true,
    description: 'Restrooms in Wizarding World',
  },
  {
    id: 'restroom-isle-of-berk',
    name: 'Restrooms (Isle of Berk)',
    type: 'service',
    area: 'isle-of-berk',
    x: 0.78, y: 0.42,
    lng: -81.4451, lat: 28.4750,
    approximateLocation: true,
    description: 'Restrooms in Isle of Berk',
  },
  {
    id: 'service-first-aid-eu',
    name: 'First Aid',
    type: 'service',
    area: 'celestial-park',
    x: 0.46, y: 0.80,
    lng: -81.4482, lat: 28.4718,
    description: 'First aid station near entrance',
  },
  {
    id: 'service-guest-services-eu',
    name: 'Guest Services',
    type: 'service',
    area: 'celestial-park',
    x: 0.52, y: 0.88,
    lng: -81.4475, lat: 28.4712,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const EPIC_UNIVERSE_POI: ParkPOI[] = [
  ...CELESTIAL_PARK_RIDES,
  ...CELESTIAL_PARK_FOOD,
  ...CELESTIAL_PARK_SHOPS,
  ...NINTENDO_RIDES,
  ...NINTENDO_FOOD,
  ...NINTENDO_SHOPS,
  ...DARK_UNIVERSE_RIDES,
  ...DARK_UNIVERSE_FOOD,
  ...DARK_UNIVERSE_SHOPS,
  ...MINISTRY_RIDES,
  ...MINISTRY_FOOD,
  ...MINISTRY_SHOPS,
  ...BERK_RIDES,
  ...BERK_FOOD,
  ...BERK_SHOPS,
  ...SERVICES,
];
