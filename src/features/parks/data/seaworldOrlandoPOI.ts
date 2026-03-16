import { ParkPOI } from '../types';

// ============================================
// SeaWorld Orlando — Complete Point of Interest Database
// Source: Official Park Map, Wikipedia, RCDB
//
// Positions (x, y) are 0-1 percentages on the illustrated map.
// Park center: 28.4112, -81.4612
// Layout: Roughly circular around a central lake, entrance at south
// Clockwise: Port of Entry -> Sea of Shallows -> Sea of Legends ->
//   Sea of Mystery -> Sea of Power -> Sea of Ice -> Sesame Street
// ============================================

// ============================================
// ROLLER COASTERS
// ============================================

const COASTERS: ParkPOI[] = [
  {
    id: 'ride-mako-swo',
    mapNumber: 1,
    name: 'Mako',
    type: 'ride',
    area: 'sea-of-power',
    x: 0.72, y: 0.32,
    lng: -81.4591, lat: 28.4096,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'mako',
    description: 'Orlando\'s tallest, fastest, and longest hypercoaster by B&M (200 ft, 73 mph)',
  },
  {
    id: 'ride-kraken-swo',
    mapNumber: 2,
    name: 'Kraken',
    type: 'ride',
    area: 'sea-of-legends',
    x: 0.30, y: 0.42,
    lng: -81.4550, lat: 28.4067,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'kraken',
    description: 'Orlando\'s only floorless roller coaster by B&M with VR-optional experience',
  },
  {
    id: 'ride-manta-swo',
    mapNumber: 3,
    name: 'Manta',
    type: 'ride',
    area: 'sea-of-shallows',
    x: 0.38, y: 0.68,
    lng: -81.4580, lat: 28.4130,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'manta-swo',
    description: 'Flying coaster by B&M — spin, glide, and fly like a giant manta ray',
  },
  {
    id: 'ride-pipeline-swo',
    mapNumber: 4,
    name: 'Pipeline: The Surf Coaster',
    type: 'ride',
    area: 'sea-of-delight',
    x: 0.55, y: 0.25,
    lng: -81.4610, lat: 28.4088,
    heightRequirement: { min: 54 },
    thrillLevel: 'aggressive',
    coasterId: 'pipeline-surf-coaster',
    description: 'World\'s first surf coaster by B&M — stand-up surfing motion (2023)',
  },
  {
    id: 'ride-ice-breaker-swo',
    mapNumber: 5,
    name: 'Ice Breaker',
    type: 'ride',
    area: 'sea-of-ice',
    x: 0.82, y: 0.48,
    lng: -81.4565, lat: 28.4105,
    heightRequirement: { min: 48 },
    thrillLevel: 'high',
    coasterId: 'ice-breaker',
    description: 'Quadruple-launch coaster by Premier Rides with steepest beyond-vertical drop in FL',
  },
  {
    id: 'ride-penguin-trek-swo',
    mapNumber: 6,
    name: 'Penguin Trek',
    type: 'ride',
    area: 'sea-of-ice',
    x: 0.78, y: 0.55,
    lng: -81.4572, lat: 28.4110,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'penguin-trek',
    description: 'Family launched coaster by B&M through Antarctica-themed environments (2024)',
  },
  {
    id: 'ride-journey-to-atlantis-swo',
    mapNumber: 7,
    name: 'Journey to Atlantis',
    type: 'ride',
    area: 'sea-of-mystery',
    x: 0.60, y: 0.38,
    lng: -81.4600, lat: 28.4080,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    coasterId: 'journey-to-atlantis-swo',
    description: 'Combination roller coaster and flume ride through the sunken city of Atlantis',
  },
  {
    id: 'ride-super-grover-swo',
    mapNumber: 8,
    name: "Super Grover's Box Car Derby",
    type: 'ride',
    area: 'sesame-street-swo',
    x: 0.85, y: 0.65,
    lng: -81.4555, lat: 28.4118,
    heightRequirement: { min: 38 },
    thrillLevel: 'mild',
    coasterId: 'super-grover-box-car-derby',
    description: 'Junior family coaster in Sesame Street Land',
  },
];

// ============================================
// OTHER RIDES & ATTRACTIONS
// ============================================

const OTHER_RIDES: ParkPOI[] = [
  {
    id: 'ride-infinity-falls-swo',
    mapNumber: 9,
    name: 'Infinity Falls',
    type: 'ride',
    area: 'sea-of-mystery',
    x: 0.65, y: 0.45,
    lng: -81.4595, lat: 28.4085,
    heightRequirement: { min: 42 },
    thrillLevel: 'moderate',
    description: 'Whitewater raft ride with record-setting 40-foot drop',
  },
  {
    id: 'ride-expedition-odyssey-swo',
    mapNumber: 10,
    name: 'Expedition Odyssey',
    type: 'ride',
    area: 'sea-of-ice',
    x: 0.75, y: 0.42,
    lng: -81.4578, lat: 28.4098,
    thrillLevel: 'mild',
    description: 'Arctic adventure ride with real-world footage and wildlife encounters',
  },
  {
    id: 'ride-seaquest-swo',
    name: 'SEAQuest: Legends of the Deep',
    type: 'ride',
    area: 'sea-of-mystery',
    x: 0.58, y: 0.42,
    lng: -81.4603, lat: 28.4083,
    thrillLevel: 'mild',
    description: 'Submersible dark ride through ocean ecosystems (2026)',
    underConstruction: true,
  },
  {
    id: 'ride-wild-arctic-swo',
    name: 'Wild Arctic',
    type: 'ride',
    area: 'sea-of-ice',
    x: 0.80, y: 0.50,
    lng: -81.4568, lat: 28.4107,
    thrillLevel: 'mild',
    description: 'Simulated helicopter ride to a remote arctic base',
  },
  {
    id: 'attraction-turtle-trek-swo',
    name: 'TurtleTrek',
    type: 'attraction',
    area: 'sea-of-shallows',
    x: 0.32, y: 0.55,
    lng: -81.4555, lat: 28.4105,
    description: '360-degree 3D film experience from a sea turtle\'s perspective',
  },
  {
    id: 'attraction-shark-encounter-swo',
    name: 'Shark Encounter',
    type: 'attraction',
    area: 'sea-of-mystery',
    x: 0.55, y: 0.35,
    lng: -81.4608, lat: 28.4076,
    description: 'Walk-through underwater tunnel surrounded by sharks',
  },
  {
    id: 'attraction-dolphin-cove-swo',
    name: 'Dolphin Cove',
    type: 'attraction',
    area: 'sea-of-shallows',
    x: 0.35, y: 0.60,
    lng: -81.4565, lat: 28.4115,
    description: 'Interactive dolphin encounter with touch pool',
  },
  {
    id: 'attraction-stingray-lagoon-swo',
    name: 'Stingray Lagoon',
    type: 'attraction',
    area: 'sea-of-shallows',
    x: 0.40, y: 0.62,
    lng: -81.4560, lat: 28.4118,
    description: 'Touch pool with stingrays and skates',
  },
  {
    id: 'attraction-pacific-point-swo',
    name: 'Pacific Point Preserve',
    type: 'attraction',
    area: 'sea-of-power',
    x: 0.68, y: 0.40,
    lng: -81.4588, lat: 28.4092,
    description: 'Sea lion and seal habitat with feeding opportunities',
  },
];

// ============================================
// SHOWS / THEATERS
// ============================================

const SHOWS: ParkPOI[] = [
  {
    id: 'theater-orca-encounter-swo',
    name: 'Orca Encounter',
    type: 'theater',
    area: 'sea-of-power',
    x: 0.70, y: 0.28,
    lng: -81.4592, lat: 28.4090,
    description: 'Educational orca presentation at Shamu Stadium',
  },
  {
    id: 'theater-dolphin-adventures-swo',
    name: 'Dolphin Adventures',
    type: 'theater',
    area: 'sea-of-shallows',
    x: 0.28, y: 0.50,
    lng: -81.4548, lat: 28.4100,
    description: 'Dolphin performance at the Dolphin Theater',
  },
  {
    id: 'theater-sea-lion-high-swo',
    name: 'Sea Lion High',
    type: 'theater',
    area: 'sea-of-mystery',
    x: 0.52, y: 0.40,
    lng: -81.4605, lat: 28.4082,
    description: 'Sea lion and otter comedy show at the Sea Lion & Otter Stadium',
  },
  {
    id: 'theater-nautilus-swo',
    name: 'Nautilus Theater',
    type: 'theater',
    area: 'sea-of-mystery',
    x: 0.50, y: 0.36,
    lng: -81.4608, lat: 28.4078,
    description: 'Indoor theater for seasonal shows and concerts',
  },
];

// ============================================
// FOOD & DINING
// ============================================

const FOOD: ParkPOI[] = [
  {
    id: 'food-sharks-underwater-grill',
    name: "Sharks Underwater Grill",
    type: 'food',
    area: 'sea-of-mystery',
    x: 0.53, y: 0.33,
    lng: -81.4607, lat: 28.4074,
    menuItems: ['seafood', 'steak', 'pasta', 'cocktails', 'fine dining'],
    menuDescription: 'Upscale dining with views into the shark tank',
    servesAlcohol: true,
  },
  {
    id: 'food-voyagers-smokehouse',
    name: 'Voyager\'s Smokehouse',
    type: 'food',
    area: 'sea-of-delight',
    x: 0.48, y: 0.28,
    lng: -81.4612, lat: 28.4086,
    menuItems: ['bbq', 'ribs', 'brisket', 'chicken', 'cornbread', 'coleslaw'],
    menuDescription: 'Southern-style BBQ smokehouse with outdoor seating',
    servesAlcohol: true,
  },
  {
    id: 'food-expedition-cafe-swo',
    name: 'Expedition Café',
    type: 'food',
    area: 'sea-of-ice',
    x: 0.76, y: 0.48,
    lng: -81.4575, lat: 28.4102,
    menuItems: ['pasta', 'pizza', 'asian', 'sandwiches', 'salad'],
    menuDescription: 'Multi-station food court with global cuisine',
  },
  {
    id: 'food-seafire-grill-swo',
    name: 'Seafire Grill',
    type: 'food',
    area: 'sea-of-power',
    x: 0.68, y: 0.35,
    lng: -81.4590, lat: 28.4088,
    menuItems: ['burgers', 'chicken', 'fries', 'hot dogs'],
    menuDescription: 'Flame-grilled burgers and American fare',
  },
  {
    id: 'food-lakeside-grill-swo',
    name: 'Lakeside Grill',
    type: 'food',
    area: 'sea-of-delight',
    x: 0.50, y: 0.22,
    lng: -81.4615, lat: 28.4082,
    menuItems: ['burgers', 'chicken tenders', 'salad', 'fries'],
    menuDescription: 'Casual dining overlooking the lake',
  },
  {
    id: 'food-altitude-burgers-swo',
    name: 'Altitude Burgers',
    type: 'food',
    area: 'sea-of-power',
    x: 0.74, y: 0.38,
    lng: -81.4585, lat: 28.4093,
    menuItems: ['burgers', 'chicken sandwiches', 'fries', 'milkshakes'],
    menuDescription: 'Quick-service burger joint near Mako',
  },
  {
    id: 'food-waterway-grill-swo',
    name: 'Waterway Grill',
    type: 'food',
    area: 'sea-of-mystery',
    x: 0.62, y: 0.42,
    lng: -81.4598, lat: 28.4084,
    menuItems: ['tacos', 'rice bowls', 'empanadas', 'churros'],
    menuDescription: 'Latin-inspired cuisine near Infinity Falls',
    servesAlcohol: true,
  },
  {
    id: 'food-dockside-pizza-swo',
    name: 'Dockside Pizza Co.',
    type: 'food',
    area: 'sea-of-shallows',
    x: 0.36, y: 0.64,
    lng: -81.4562, lat: 28.4120,
    menuItems: ['pizza', 'salad', 'breadsticks'],
    menuDescription: 'Handcrafted pizza with savory selections',
  },
  {
    id: 'food-coaster-coffee-swo',
    name: 'Coaster Coffee Company',
    type: 'food',
    area: 'port-of-entry-swo',
    x: 0.48, y: 0.85,
    lng: -81.4612, lat: 28.4145,
    menuItems: ['coffee', 'starbucks', 'pastries', 'breakfast'],
    menuDescription: 'Starbucks coffee and pastries near the entrance',
  },
  {
    id: 'food-chick-fil-a-swo',
    name: 'Chick-fil-A',
    type: 'food',
    area: 'sea-of-shallows',
    x: 0.42, y: 0.65,
    lng: -81.4558, lat: 28.4122,
    menuItems: ['chicken sandwiches', 'nuggets', 'waffle fries'],
    menuDescription: 'Classic Chick-fil-A chicken favorites',
  },
  {
    id: 'food-captain-petes-swo',
    name: "Captain Pete's Island Hot Dogs",
    type: 'food',
    area: 'sea-of-shallows',
    x: 0.30, y: 0.58,
    lng: -81.4550, lat: 28.4112,
    menuItems: ['hot dogs', 'pretzels', 'snacks'],
    menuDescription: 'Hot dogs and quick snacks near dolphin area',
  },
  {
    id: 'food-panini-shore-swo',
    name: 'Panini Shore Café',
    type: 'food',
    area: 'sea-of-legends',
    x: 0.28, y: 0.45,
    lng: -81.4545, lat: 28.4072,
    menuItems: ['paninis', 'sandwiches', 'wraps', 'salad'],
    menuDescription: 'Pressed paninis and café fare near Kraken',
  },
  {
    id: 'food-sesame-abc-eats-swo',
    name: 'ABC Eats',
    type: 'food',
    area: 'sesame-street-swo',
    x: 0.83, y: 0.68,
    lng: -81.4558, lat: 28.4122,
    menuItems: ['chicken tenders', 'mac and cheese', 'kids meals', 'pizza'],
    menuDescription: 'Family-friendly dining in Sesame Street Land',
  },
];

// ============================================
// SHOPS
// ============================================

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-shamu-emporium-swo',
    name: 'Shamu Emporium',
    type: 'shop',
    area: 'port-of-entry-swo',
    x: 0.52, y: 0.82,
    lng: -81.4608, lat: 28.4143,
    description: 'Main park gift shop with Shamu merchandise',
  },
  {
    id: 'shop-mako-shark-swo',
    name: 'Shark\'s Tooth Gifts',
    type: 'shop',
    area: 'sea-of-power',
    x: 0.70, y: 0.35,
    lng: -81.4592, lat: 28.4090,
    description: 'Shark and Mako themed merchandise',
  },
  {
    id: 'shop-sesame-store-swo',
    name: 'Sesame Street Store',
    type: 'shop',
    area: 'sesame-street-swo',
    x: 0.84, y: 0.70,
    lng: -81.4556, lat: 28.4125,
    description: 'Sesame Street character merchandise',
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-swo',
    name: 'Main Entrance',
    type: 'service',
    area: 'port-of-entry-swo',
    x: 0.50, y: 0.92,
    lng: -81.4612, lat: 28.4150,
    description: 'SeaWorld Orlando main entrance and ticket booths',
  },
  {
    id: 'restroom-entrance-swo',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'port-of-entry-swo',
    x: 0.46, y: 0.88,
    lng: -81.4616, lat: 28.4148,
  },
  {
    id: 'restroom-sea-of-shallows',
    name: 'Restrooms (Sea of Shallows)',
    type: 'service',
    area: 'sea-of-shallows',
    x: 0.34, y: 0.58,
    lng: -81.4558, lat: 28.4110,
  },
  {
    id: 'restroom-sea-of-mystery',
    name: 'Restrooms (Sea of Mystery)',
    type: 'service',
    area: 'sea-of-mystery',
    x: 0.56, y: 0.40,
    lng: -81.4604, lat: 28.4082,
  },
  {
    id: 'restroom-sea-of-power',
    name: 'Restrooms (Sea of Power)',
    type: 'service',
    area: 'sea-of-power',
    x: 0.72, y: 0.36,
    lng: -81.4590, lat: 28.4090,
  },
  {
    id: 'restroom-sea-of-ice',
    name: 'Restrooms (Sea of Ice)',
    type: 'service',
    area: 'sea-of-ice',
    x: 0.80, y: 0.52,
    lng: -81.4568, lat: 28.4108,
  },
  {
    id: 'restroom-sesame-swo',
    name: 'Restrooms (Sesame Street)',
    type: 'service',
    area: 'sesame-street-swo',
    x: 0.86, y: 0.66,
    lng: -81.4554, lat: 28.4120,
  },
  {
    id: 'service-first-aid-swo',
    name: 'First Aid',
    type: 'service',
    area: 'port-of-entry-swo',
    x: 0.44, y: 0.85,
    lng: -81.4618, lat: 28.4146,
  },
  {
    id: 'service-guest-services-swo',
    name: 'Guest Services',
    type: 'service',
    area: 'port-of-entry-swo',
    x: 0.54, y: 0.88,
    lng: -81.4606, lat: 28.4148,
  },
];

// ============================================
// Combined Export
// ============================================

export const SEAWORLD_ORLANDO_POI: ParkPOI[] = [
  ...COASTERS,
  ...OTHER_RIDES,
  ...SHOWS,
  ...FOOD,
  ...SHOPS,
  ...SERVICES,
];
