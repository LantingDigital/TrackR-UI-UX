import { ParkPOI } from '../types';

// ============================================
// Six Flags Fiesta Texas — Point of Interest Data
//
// Park center: 29.5987, -98.6098
// San Antonio, Texas
//
// Park layout:
// - South: Main entrance, Rockville (Iron Rattler, Poltergeist)
// - Center: Crackaxle Canyon (Superman, Dr. Diabolical's Cliffhanger)
// - West: Spassburg (Rattler area, Boomerang)
// - East: Los Festivales (Wonder Woman, Chupacabra)
// - Northeast: Screampunk District
// - Northwest: DC Universe (Batman)
// - Far south: Lone Star Lil's Kiddie Corral
// - Far east: Bugs' White Water Rapids
// ============================================

// ---- Roller Coasters ----

const ROLLER_COASTERS: ParkPOI[] = [
  {
    id: 'ride-iron-rattler',
    name: 'Iron Rattler',
    type: 'ride',
    area: 'rockville-sfft',
    x: 0.42, y: 0.35,
    lng: -98.6112, lat: 29.5998,
    coasterId: 'iron-rattler',
    thrillLevel: 'aggressive',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-chupacabra',
    name: 'Chupacabra',
    type: 'ride',
    area: 'los-festivales',
    x: 0.65, y: 0.40,
    lng: -98.6060, lat: 29.5993,
    coasterId: 'chupacabra',
    thrillLevel: 'aggressive',
    heightRequirement: { min: 54 },
  },
  {
    id: 'ride-poltergeist',
    name: 'Poltergeist',
    type: 'ride',
    area: 'rockville-sfft',
    x: 0.38, y: 0.42,
    lng: -98.6120, lat: 29.5990,
    coasterId: 'poltergeist',
    thrillLevel: 'aggressive',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-dr-diabolicals',
    name: "Dr. Diabolical's Cliffhanger",
    type: 'ride',
    area: 'crackaxle-canyon',
    x: 0.50, y: 0.30,
    lng: -98.6095, lat: 29.6003,
    coasterId: 'dr-diabolicals-cliffhanger',
    thrillLevel: 'aggressive',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-wonder-woman',
    name: 'Wonder Woman Golden Lasso Coaster',
    type: 'ride',
    area: 'los-festivales',
    x: 0.68, y: 0.35,
    lng: -98.6055, lat: 29.5998,
    coasterId: 'wonder-woman-golden-lasso-coaster',
    thrillLevel: 'high',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-superman-krypton',
    name: 'Superman: Krypton Coaster',
    type: 'ride',
    area: 'crackaxle-canyon',
    x: 0.48, y: 0.22,
    lng: -98.6098, lat: 29.6012,
    coasterId: 'superman-krypton-coaster',
    thrillLevel: 'aggressive',
    heightRequirement: { min: 54 },
  },
  {
    id: 'ride-road-runner-express',
    name: 'Road Runner Express',
    type: 'ride',
    area: 'los-festivales',
    x: 0.62, y: 0.50,
    lng: -98.6065, lat: 29.5983,
    coasterId: 'road-runner-express-six-flags-fiesta-texas',
    thrillLevel: 'moderate',
    heightRequirement: { min: 42 },
  },
  {
    id: 'ride-batgirl-coaster-chase',
    name: 'Batgirl Coaster Chase',
    type: 'ride',
    area: 'dc-universe-sfft',
    x: 0.28, y: 0.25,
    lng: -98.6140, lat: 29.6008,
    coasterId: 'batgirl-coaster-chase',
    thrillLevel: 'mild',
    heightRequirement: { min: 36 },
  },
  {
    id: 'ride-batman-sfft',
    name: 'Batman The Ride',
    type: 'ride',
    area: 'dc-universe-sfft',
    x: 0.25, y: 0.20,
    lng: -98.6145, lat: 29.6014,
    coasterId: 'batman-the-ride-six-flags-fiesta-texas',
    thrillLevel: 'high',
    heightRequirement: { min: 54 },
  },
  {
    id: 'ride-rattler-sfft',
    name: 'Rattler',
    type: 'ride',
    area: 'spassburg',
    x: 0.32, y: 0.38,
    lng: -98.6130, lat: 29.5994,
    coasterId: 'rattler-six-flags-fiesta-texas',
    thrillLevel: 'moderate',
    heightRequirement: { min: 42 },
  },
  {
    id: 'ride-boomerang-sfft',
    name: 'Boomerang',
    type: 'ride',
    area: 'spassburg',
    x: 0.30, y: 0.45,
    lng: -98.6135, lat: 29.5987,
    coasterId: 'boomerang-six-flags-fiesta-texas',
    thrillLevel: 'high',
    heightRequirement: { min: 48 },
  },
];

// ---- Thrill Rides ----

const THRILL_RIDES: ParkPOI[] = [
  {
    id: 'ride-scream-sfft',
    name: 'Scream',
    type: 'ride',
    area: 'screampunk-district-sfft',
    x: 0.58, y: 0.22,
    lng: -98.6075, lat: 29.6012,
    thrillLevel: 'high',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-pandemonium-sfft',
    name: 'Pandemonium',
    type: 'ride',
    area: 'screampunk-district-sfft',
    x: 0.60, y: 0.25,
    lng: -98.6070, lat: 29.6008,
    thrillLevel: 'moderate',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-thunder-rapids',
    name: 'Thunder Rapids',
    type: 'ride',
    area: 'bugs-white-water-rapids',
    x: 0.75, y: 0.45,
    lng: -98.6040, lat: 29.5988,
    thrillLevel: 'moderate',
    heightRequirement: { min: 42 },
  },
  {
    id: 'ride-power-surge',
    name: 'Power Surge',
    type: 'ride',
    area: 'crackaxle-canyon',
    x: 0.52, y: 0.28,
    lng: -98.6090, lat: 29.6005,
    thrillLevel: 'high',
    heightRequirement: { min: 48 },
  },
  {
    id: 'ride-super-man-tower',
    name: 'Superman Tower of Power',
    type: 'ride',
    area: 'crackaxle-canyon',
    x: 0.46, y: 0.25,
    lng: -98.6100, lat: 29.6008,
    thrillLevel: 'aggressive',
    heightRequirement: { min: 52 },
  },
  {
    id: 'ride-gully-washer',
    name: 'Gully Washer',
    type: 'ride',
    area: 'crackaxle-canyon',
    x: 0.55, y: 0.35,
    lng: -98.6082, lat: 29.5998,
    thrillLevel: 'moderate',
    heightRequirement: { min: 42 },
  },
];

// ---- Family Rides ----

const FAMILY_RIDES: ParkPOI[] = [
  {
    id: 'ride-wagon-wheel',
    name: 'Wagon Wheel',
    type: 'ride',
    area: 'crackaxle-canyon',
    x: 0.50, y: 0.38,
    lng: -98.6095, lat: 29.5994,
    thrillLevel: 'low',
  },
  {
    id: 'ride-whistle-stop',
    name: 'Whistle Stop',
    type: 'ride',
    area: 'lone-star-lil-kids-area',
    x: 0.42, y: 0.65,
    lng: -98.6112, lat: 29.5968,
    thrillLevel: 'low',
  },
  {
    id: 'ride-daffy-duck-bucket-blasters',
    name: "Daffy Duck's Bucket Blasters",
    type: 'ride',
    area: 'lone-star-lil-kids-area',
    x: 0.40, y: 0.68,
    lng: -98.6115, lat: 29.5965,
    thrillLevel: 'low',
  },
];

// ---- Food ----

const FOOD: ParkPOI[] = [
  {
    id: 'food-sangerfest-halle',
    name: 'Sangerfest Halle',
    type: 'food',
    area: 'spassburg',
    x: 0.34, y: 0.40,
    lng: -98.6128, lat: 29.5992,
    menuDescription: 'German-inspired food hall with bratwurst and pretzels',
    menuItems: ['bratwurst', 'pretzels', 'schnitzel', 'beer'],
    servesAlcohol: true,
  },
  {
    id: 'food-crackaxle-grill',
    name: 'Crackaxle Grill',
    type: 'food',
    area: 'crackaxle-canyon',
    x: 0.52, y: 0.34,
    lng: -98.6090, lat: 29.5999,
    menuDescription: 'BBQ and burgers in the heart of the park',
    menuItems: ['bbq', 'burgers', 'fries', 'chicken tenders'],
  },
  {
    id: 'food-los-festivales-cantina',
    name: 'Los Festivales Cantina',
    type: 'food',
    area: 'los-festivales',
    x: 0.64, y: 0.42,
    lng: -98.6062, lat: 29.5990,
    menuDescription: 'Tex-Mex favorites and margaritas',
    menuItems: ['tacos', 'nachos', 'burritos', 'margaritas'],
    servesAlcohol: true,
  },
  {
    id: 'food-jb-smokehouse',
    name: "JB's Smokehouse",
    type: 'food',
    area: 'rockville-sfft',
    x: 0.40, y: 0.48,
    lng: -98.6115, lat: 29.5985,
    menuDescription: 'Texas-style BBQ with brisket and ribs',
    menuItems: ['brisket', 'ribs', 'pulled pork', 'coleslaw'],
  },
  {
    id: 'food-starbucks-sfft',
    name: 'Starbucks',
    type: 'food',
    area: 'rockville-sfft',
    x: 0.44, y: 0.55,
    lng: -98.6108, lat: 29.5978,
    menuDescription: 'Coffee, tea, and pastries',
    menuItems: ['coffee', 'tea', 'pastries', 'frappuccino'],
  },
  {
    id: 'food-dippin-dots-sfft',
    name: "Dippin' Dots",
    type: 'food',
    area: 'crackaxle-canyon',
    x: 0.48, y: 0.32,
    lng: -98.6098, lat: 29.6001,
    menuDescription: 'Flash-frozen ice cream beads',
    menuItems: ['ice cream'],
  },
  {
    id: 'food-funnel-cake-sfft',
    name: 'Funnel Cake Factory',
    type: 'food',
    area: 'los-festivales',
    x: 0.66, y: 0.44,
    lng: -98.6058, lat: 29.5988,
    menuDescription: 'Funnel cakes and fried dough treats',
    menuItems: ['funnel cake', 'churros'],
  },
  {
    id: 'food-dc-diner-sfft',
    name: 'DC Diner',
    type: 'food',
    area: 'dc-universe-sfft',
    x: 0.26, y: 0.28,
    lng: -98.6142, lat: 29.6005,
    menuDescription: 'Burgers, chicken, and fries',
    menuItems: ['burgers', 'chicken strips', 'fries'],
  },
  {
    id: 'food-screampunk-eats',
    name: 'Screampunk Eats',
    type: 'food',
    area: 'screampunk-district-sfft',
    x: 0.56, y: 0.20,
    lng: -98.6080, lat: 29.6014,
    menuDescription: 'Pizza and snacks near thrill rides',
    menuItems: ['pizza', 'pretzels', 'lemonade'],
  },
];

// ---- Shops ----

const SHOPS: ParkPOI[] = [
  {
    id: 'shop-rockville-trading-co',
    name: 'Rockville Trading Co.',
    type: 'shop',
    area: 'rockville-sfft',
    x: 0.44, y: 0.50,
    lng: -98.6108, lat: 29.5982,
    description: 'Park souvenirs and Iron Rattler merchandise',
  },
  {
    id: 'shop-dc-shop-sfft',
    name: 'DC Super Store',
    type: 'shop',
    area: 'dc-universe-sfft',
    x: 0.27, y: 0.22,
    lng: -98.6142, lat: 29.6012,
    description: 'DC Comics merchandise and Batman gear',
  },
  {
    id: 'shop-spassburg-gifts',
    name: 'Spassburg Gifts',
    type: 'shop',
    area: 'spassburg',
    x: 0.32, y: 0.42,
    lng: -98.6130, lat: 29.5990,
    description: 'German-themed souvenirs and apparel',
  },
  {
    id: 'shop-los-festivales-market',
    name: 'Los Festivales Market',
    type: 'shop',
    area: 'los-festivales',
    x: 0.62, y: 0.45,
    lng: -98.6065, lat: 29.5988,
    description: 'Fiesta-themed souvenirs and colorful apparel',
  },
];

// ---- Shows ----

const SHOWS: ParkPOI[] = [
  {
    id: 'show-lone-star-amphitheater',
    name: 'Lone Star Amphitheater',
    type: 'theater',
    area: 'rockville-sfft',
    x: 0.38, y: 0.55,
    lng: -98.6120, lat: 29.5978,
    description: 'Live music and seasonal shows',
  },
  {
    id: 'show-rockville-stage',
    name: 'Rockville Stage',
    type: 'theater',
    area: 'rockville-sfft',
    x: 0.46, y: 0.45,
    lng: -98.6105, lat: 29.5987,
    description: 'Live performances and character meet-and-greets',
  },
];

// ---- Services ----

const SERVICES: ParkPOI[] = [
  {
    id: 'entrance-main-sfft',
    name: 'Main Entrance',
    type: 'service',
    area: 'rockville-sfft',
    x: 0.45, y: 0.82,
    lng: -98.6105, lat: 29.5955,
    description: 'Park main entrance and ticket booths',
  },
  {
    id: 'restroom-entrance-sfft',
    name: 'Restrooms',
    type: 'service',
    area: 'rockville-sfft',
    x: 0.43, y: 0.78,
    lng: -98.6110, lat: 29.5959,
  },
  {
    id: 'restroom-crackaxle',
    name: 'Restrooms',
    type: 'service',
    area: 'crackaxle-canyon',
    x: 0.54, y: 0.32,
    lng: -98.6085, lat: 29.6001,
  },
  {
    id: 'restroom-spassburg',
    name: 'Restrooms',
    type: 'service',
    area: 'spassburg',
    x: 0.33, y: 0.44,
    lng: -98.6128, lat: 29.5988,
  },
  {
    id: 'restroom-los-festivales',
    name: 'Restrooms',
    type: 'service',
    area: 'los-festivales',
    x: 0.63, y: 0.48,
    lng: -98.6063, lat: 29.5985,
  },
  {
    id: 'restroom-dc-universe-sfft',
    name: 'Restrooms',
    type: 'service',
    area: 'dc-universe-sfft',
    x: 0.24, y: 0.26,
    lng: -98.6148, lat: 29.6007,
  },
  {
    id: 'restroom-screampunk-sfft',
    name: 'Restrooms',
    type: 'service',
    area: 'screampunk-district-sfft',
    x: 0.57, y: 0.18,
    lng: -98.6078, lat: 29.6016,
  },
  {
    id: 'restroom-kiddie-sfft',
    name: 'Restrooms',
    type: 'service',
    area: 'lone-star-lil-kids-area',
    x: 0.44, y: 0.66,
    lng: -98.6108, lat: 29.5967,
  },
  {
    id: 'service-first-aid-sfft',
    name: 'First Aid',
    type: 'service',
    area: 'rockville-sfft',
    x: 0.46, y: 0.70,
    lng: -98.6105, lat: 29.5963,
    description: 'First aid and medical assistance',
  },
  {
    id: 'service-guest-relations-sfft',
    name: 'Guest Relations',
    type: 'service',
    area: 'rockville-sfft',
    x: 0.44, y: 0.75,
    lng: -98.6108, lat: 29.5960,
    description: 'Guest services, lost and found, accessibility',
  },
  {
    id: 'service-lockers-sfft',
    name: 'Lockers',
    type: 'service',
    area: 'rockville-sfft',
    x: 0.48, y: 0.76,
    lng: -98.6100, lat: 29.5959,
    description: 'Rental lockers near park entrance',
  },
  {
    id: 'service-stroller-sfft',
    name: 'Stroller & Wheelchair Rental',
    type: 'service',
    area: 'rockville-sfft',
    x: 0.42, y: 0.77,
    lng: -98.6112, lat: 29.5958,
    description: 'Stroller and wheelchair rentals',
  },
];

// ---- Combined Export ----

export const SIX_FLAGS_FIESTA_TEXAS_POI: ParkPOI[] = [
  ...ROLLER_COASTERS,
  ...THRILL_RIDES,
  ...FAMILY_RIDES,
  ...FOOD,
  ...SHOPS,
  ...SHOWS,
  ...SERVICES,
];
