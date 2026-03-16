import { ParkPOI } from '../types';

// ============================================
// Disney's Animal Kingdom — Complete Point of Interest Database
// Source: Official Park Map, Wikipedia, OpenStreetMap
//
// Park center: 28.3553, -81.5901
// Located in Walt Disney World, Orlando, FL
// Layout: Tree of Life hub, themed areas radiate outward
// ============================================

// ============================================
// OASIS (Entrance)
// ============================================

const OASIS: ParkPOI[] = [
  {
    id: 'entrance-main-ak',
    name: 'Main Entrance',
    type: 'service',
    area: 'oasis-ak',
    x: 0.50, y: 0.92,
    lng: -81.5901, lat: 28.3520,
  },
];

// ============================================
// DISCOVERY ISLAND (Central Hub)
// ============================================

const DISCOVERY_ISLAND: ParkPOI[] = [
  {
    id: 'attraction-tree-of-life',
    name: 'Tree of Life',
    type: 'attraction',
    area: 'discovery-island-ak',
    x: 0.50, y: 0.60,
    lng: -81.5901, lat: 28.3558,
    description: 'Iconic 145-foot tree with 300+ carved animals — centerpiece of the park',
  },
  {
    id: 'ride-its-tough-to-be-a-bug',
    mapNumber: 1,
    name: "It's Tough to Be a Bug!",
    type: 'ride',
    area: 'discovery-island-ak',
    x: 0.48, y: 0.58,
    lng: -81.5904, lat: 28.3560,
    thrillLevel: 'mild',
    description: '3D show inside the Tree of Life featuring characters from A Bug\'s Life',
  },
  {
    id: 'food-flame-tree-bbq',
    name: 'Flame Tree Barbecue',
    type: 'food',
    area: 'discovery-island-ak',
    x: 0.55, y: 0.62,
    lng: -81.5895, lat: 28.3556,
    menuItems: ['ribs', 'pulled pork', 'chicken', 'bbq', 'mac and cheese'],
    menuDescription: 'Slow-smoked ribs, pulled pork, and BBQ chicken',
  },
  {
    id: 'food-pizzafari',
    name: 'Pizzafari',
    type: 'food',
    area: 'discovery-island-ak',
    x: 0.45, y: 0.63,
    lng: -81.5907, lat: 28.3555,
    menuItems: ['pizza', 'caesar salad', 'pasta'],
    menuDescription: 'Personal pizzas and salads in a colorful animal-themed restaurant',
  },
  {
    id: 'shop-island-mercantile',
    name: 'Island Mercantile',
    type: 'shop',
    area: 'discovery-island-ak',
    x: 0.52, y: 0.65,
    lng: -81.5898, lat: 28.3553,
    description: 'Main park merchandise and souvenirs',
  },
];

// ============================================
// PANDORA — The World of Avatar
// ============================================

const PANDORA: ParkPOI[] = [
  {
    id: 'ride-flight-of-passage',
    mapNumber: 2,
    name: 'Avatar Flight of Passage',
    type: 'ride',
    area: 'pandora-ak',
    x: 0.30, y: 0.45,
    lng: -81.5928, lat: 28.3574,
    heightRequirement: { min: 44 },
    thrillLevel: 'high',
    description: '3D flying simulator — ride a banshee over the world of Pandora',
  },
  {
    id: 'ride-navi-river-journey',
    mapNumber: 3,
    name: "Na'vi River Journey",
    type: 'ride',
    area: 'pandora-ak',
    x: 0.28, y: 0.48,
    lng: -81.5931, lat: 28.3571,
    thrillLevel: 'low',
    description: 'Gentle boat ride through a bioluminescent Pandoran rainforest',
  },
  {
    id: 'food-satuli-canteen',
    name: "Satu'li Canteen",
    type: 'food',
    area: 'pandora-ak',
    x: 0.32, y: 0.50,
    lng: -81.5926, lat: 28.3569,
    menuItems: ['bowls', 'chicken', 'shrimp', 'beef', 'cheeseburger pods'],
    menuDescription: 'Healthy bowls and alien-themed dishes',
  },
  {
    id: 'food-pongu-pongu',
    name: 'Pongu Pongu',
    type: 'food',
    area: 'pandora-ak',
    x: 0.33, y: 0.47,
    lng: -81.5925, lat: 28.3572,
    menuItems: ['frozen drinks', 'night blossom', 'lumpia'],
    menuDescription: 'Frozen drinks including the signature Night Blossom',
    servesAlcohol: true,
  },
];

// ============================================
// AFRICA
// ============================================

const AFRICA: ParkPOI[] = [
  {
    id: 'ride-kilimanjaro-safaris',
    mapNumber: 4,
    name: 'Kilimanjaro Safaris',
    type: 'ride',
    area: 'africa-ak',
    x: 0.35, y: 0.30,
    lng: -81.5924, lat: 28.3589,
    thrillLevel: 'low',
    description: '18-minute safari through 110 acres with live African animals',
  },
  {
    id: 'ride-gorilla-falls',
    name: 'Gorilla Falls Exploration Trail',
    type: 'attraction',
    area: 'africa-ak',
    x: 0.38, y: 0.35,
    lng: -81.5920, lat: 28.3584,
    description: 'Walking trail featuring gorillas, hippos, exotic birds, and more',
  },
  {
    id: 'attraction-festival-lion-king',
    name: 'Festival of the Lion King',
    type: 'theater',
    area: 'africa-ak',
    x: 0.40, y: 0.38,
    lng: -81.5917, lat: 28.3581,
    description: 'Broadway-style musical celebrating The Lion King with acrobatics and puppetry',
  },
  {
    id: 'food-tusker-house',
    name: 'Tusker House Restaurant',
    type: 'food',
    area: 'africa-ak',
    x: 0.42, y: 0.40,
    lng: -81.5914, lat: 28.3579,
    menuItems: ['african buffet', 'chicken', 'salmon', 'bread service'],
    menuDescription: 'Character dining buffet with African-inspired cuisine',
    servesAlcohol: true,
  },
  {
    id: 'food-harambe-market',
    name: 'Harambe Market',
    type: 'food',
    area: 'africa-ak',
    x: 0.37, y: 0.33,
    lng: -81.5922, lat: 28.3586,
    menuItems: ['ribs', 'sausage', 'chicken', 'corn dogs', 'spring rolls'],
    menuDescription: 'African street food market with multiple counters',
  },
];

// ============================================
// ASIA
// ============================================

const ASIA: ParkPOI[] = [
  {
    id: 'ride-expedition-everest',
    mapNumber: 5,
    name: 'Expedition Everest — Legend of the Forbidden Mountain',
    type: 'ride',
    area: 'asia-ak',
    x: 0.65, y: 0.35,
    lng: -81.5874, lat: 28.3584,
    heightRequirement: { min: 44 },
    thrillLevel: 'high',
    coasterId: 'expedition-everest',
    description: 'High-speed coaster through the Himalayas with a Yeti encounter — speeds up to 50 mph',
  },
  {
    id: 'ride-kali-river-rapids',
    mapNumber: 6,
    name: 'Kali River Rapids',
    type: 'ride',
    area: 'asia-ak',
    x: 0.68, y: 0.40,
    lng: -81.5870, lat: 28.3579,
    heightRequirement: { min: 38 },
    thrillLevel: 'moderate',
    description: 'Whitewater raft ride through Asian rainforests — you will get wet',
  },
  {
    id: 'ride-feathered-friends',
    name: 'Feathered Friends in Flight!',
    type: 'theater',
    area: 'asia-ak',
    x: 0.62, y: 0.38,
    lng: -81.5878, lat: 28.3581,
    description: 'Live bird show with exotic species flying overhead',
  },
  {
    id: 'ride-maharajah-trail',
    name: 'Maharajah Jungle Trek',
    type: 'attraction',
    area: 'asia-ak',
    x: 0.66, y: 0.42,
    lng: -81.5873, lat: 28.3577,
    description: 'Walking trail featuring tigers, bats, and Komodo dragons',
  },
  {
    id: 'food-yak-yeti',
    name: 'Yak & Yeti Restaurant',
    type: 'food',
    area: 'asia-ak',
    x: 0.63, y: 0.40,
    lng: -81.5877, lat: 28.3579,
    menuItems: ['asian fusion', 'lo mein', 'ahi tuna', 'dim sum', 'teriyaki'],
    menuDescription: 'Pan-Asian table-service restaurant',
    servesAlcohol: true,
  },
];

// ============================================
// DINOLAND U.S.A.
// ============================================

const DINOLAND: ParkPOI[] = [
  {
    id: 'ride-dinosaur',
    mapNumber: 7,
    name: 'DINOSAUR',
    type: 'ride',
    area: 'dinoland-ak',
    x: 0.62, y: 0.60,
    lng: -81.5878, lat: 28.3558,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Dark ride time-traveling to rescue an Iguanodon before the meteor hits',
  },
  {
    id: 'ride-triceratop-spin',
    mapNumber: 8,
    name: 'TriceraTop Spin',
    type: 'ride',
    area: 'dinoland-ak',
    x: 0.60, y: 0.62,
    lng: -81.5880, lat: 28.3556,
    thrillLevel: 'low',
    description: 'Dumbo-style spinner with triceratops vehicles',
  },
  {
    id: 'show-finding-nemo',
    name: 'Finding Nemo: The Big Blue... and Beyond!',
    type: 'theater',
    area: 'dinoland-ak',
    x: 0.58, y: 0.58,
    lng: -81.5883, lat: 28.3560,
    description: 'Musical show combining puppets, dancers, and the Finding Nemo story',
  },
  {
    id: 'food-restaurantosaurus',
    name: 'Restaurantosaurus',
    type: 'food',
    area: 'dinoland-ak',
    x: 0.61, y: 0.64,
    lng: -81.5879, lat: 28.3554,
    menuItems: ['burgers', 'chicken nuggets', 'hot dogs', 'mac and cheese'],
    menuDescription: 'Quick-service dining in a converted research lab',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'restroom-oasis-ak',
    name: 'Restrooms (Oasis)',
    type: 'service',
    area: 'oasis-ak',
    x: 0.48, y: 0.85,
    lng: -81.5904, lat: 28.3527,
    approximateLocation: true,
  },
  {
    id: 'restroom-discovery-ak',
    name: 'Restrooms (Discovery Island)',
    type: 'service',
    area: 'discovery-island-ak',
    x: 0.53, y: 0.60,
    lng: -81.5897, lat: 28.3558,
    approximateLocation: true,
  },
  {
    id: 'restroom-pandora-ak',
    name: 'Restrooms (Pandora)',
    type: 'service',
    area: 'pandora-ak',
    x: 0.31, y: 0.52,
    lng: -81.5927, lat: 28.3567,
    approximateLocation: true,
  },
  {
    id: 'restroom-africa-ak',
    name: 'Restrooms (Africa)',
    type: 'service',
    area: 'africa-ak',
    x: 0.39, y: 0.36,
    lng: -81.5919, lat: 28.3583,
    approximateLocation: true,
  },
  {
    id: 'restroom-asia-ak',
    name: 'Restrooms (Asia)',
    type: 'service',
    area: 'asia-ak',
    x: 0.64, y: 0.37,
    lng: -81.5876, lat: 28.3582,
    approximateLocation: true,
  },
  {
    id: 'restroom-dinoland-ak',
    name: 'Restrooms (DinoLand)',
    type: 'service',
    area: 'dinoland-ak',
    x: 0.59, y: 0.61,
    lng: -81.5882, lat: 28.3557,
    approximateLocation: true,
  },
  {
    id: 'service-first-aid-ak',
    name: 'First Aid',
    type: 'service',
    area: 'discovery-island-ak',
    x: 0.47, y: 0.68,
    lng: -81.5905, lat: 28.3550,
    description: 'First aid station',
    approximateLocation: true,
  },
  {
    id: 'service-guest-services-ak',
    name: 'Guest Relations',
    type: 'service',
    area: 'oasis-ak',
    x: 0.52, y: 0.90,
    lng: -81.5898, lat: 28.3522,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const ANIMAL_KINGDOM_POI: ParkPOI[] = [
  ...OASIS,
  ...DISCOVERY_ISLAND,
  ...PANDORA,
  ...AFRICA,
  ...ASIA,
  ...DINOLAND,
  ...SERVICES,
];
