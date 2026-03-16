import { ParkPOI } from '../types';

// ============================================
// Disney's Hollywood Studios — Complete Point of Interest Database
// Source: Official Park Map, Wikipedia, OpenStreetMap
//
// Park center: 28.3575, -81.5594
// Located in Walt Disney World, Orlando, FL
// Layout: Hollywood Boulevard entrance leads to a hub, with
// themed areas branching off — Galaxy's Edge, Toy Story Land,
// Sunset Boulevard, etc.
// ============================================

// ============================================
// HOLLYWOOD BOULEVARD
// ============================================

const HOLLYWOOD_BLVD: ParkPOI[] = [
  {
    id: 'entrance-main-hs',
    name: 'Main Entrance',
    type: 'service',
    area: 'hollywood-boulevard-hs',
    x: 0.50, y: 0.90,
    lng: -81.5594, lat: 28.3550,
  },
  {
    id: 'shop-celebrity-5-10',
    name: 'Celebrity 5 & 10',
    type: 'shop',
    area: 'hollywood-boulevard-hs',
    x: 0.48, y: 0.82,
    lng: -81.5597, lat: 28.3558,
    description: 'Classic Hollywood memorabilia and Disney merchandise',
  },
  {
    id: 'shop-keystone-clothiers',
    name: 'Keystone Clothiers',
    type: 'shop',
    area: 'hollywood-boulevard-hs',
    x: 0.52, y: 0.80,
    lng: -81.5591, lat: 28.3560,
    description: 'Upscale Disney apparel and accessories',
  },
  {
    id: 'food-hollywoodland-cafe',
    name: 'The Hollywood Brown Derby',
    type: 'food',
    area: 'hollywood-boulevard-hs',
    x: 0.55, y: 0.78,
    lng: -81.5588, lat: 28.3562,
    menuItems: ['cobb salad', 'filet mignon', 'grapefruit cake', 'wine'],
    menuDescription: 'Signature dining with classic Hollywood elegance',
    servesAlcohol: true,
  },
];

// ============================================
// SUNSET BOULEVARD
// ============================================

const SUNSET_BLVD: ParkPOI[] = [
  {
    id: 'ride-tower-of-terror',
    mapNumber: 1,
    name: 'The Twilight Zone Tower of Terror',
    type: 'ride',
    area: 'sunset-boulevard-hs',
    x: 0.28, y: 0.52,
    lng: -81.5625, lat: 28.3580,
    heightRequirement: { min: 40 },
    thrillLevel: 'high',
    description: 'Drop tower dark ride through the haunted Hollywood Tower Hotel',
  },
  {
    id: 'ride-rock-n-roller-coaster',
    mapNumber: 2,
    name: "Rock 'n' Roller Coaster Starring Aerosmith",
    type: 'ride',
    area: 'sunset-boulevard-hs',
    x: 0.25, y: 0.55,
    lng: -81.5628, lat: 28.3577,
    heightRequirement: { min: 48 },
    thrillLevel: 'aggressive',
    coasterId: 'rock-n-roller-coaster-starring-aerosmith',
    description: 'Indoor launched coaster with inversions, 0-57 mph in 2.8 seconds',
  },
  {
    id: 'show-beauty-beast',
    name: 'Beauty and the Beast — Live on Stage',
    type: 'theater',
    area: 'sunset-boulevard-hs',
    x: 0.30, y: 0.58,
    lng: -81.5622, lat: 28.3575,
    description: 'Broadway-style musical at the Theater of the Stars',
  },
  {
    id: 'show-fantasmic',
    name: 'Fantasmic!',
    type: 'theater',
    area: 'sunset-boulevard-hs',
    x: 0.22, y: 0.60,
    lng: -81.5632, lat: 28.3573,
    description: 'Nighttime spectacular with fireworks, water, and projections',
  },
  {
    id: 'food-sunset-ranch-market',
    name: 'Sunset Ranch Market',
    type: 'food',
    area: 'sunset-boulevard-hs',
    x: 0.32, y: 0.62,
    lng: -81.5620, lat: 28.3571,
    menuItems: ['burgers', 'bbq', 'hot dogs', 'ice cream', 'pizza'],
    menuDescription: 'Quick-service food court with multiple counters',
  },
];

// ============================================
// ECHO LAKE
// ============================================

const ECHO_LAKE: ParkPOI[] = [
  {
    id: 'ride-star-tours',
    mapNumber: 3,
    name: 'Star Tours — The Adventures Continue',
    type: 'ride',
    area: 'echo-lake-hs',
    x: 0.55, y: 0.60,
    lng: -81.5588, lat: 28.3573,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: '3D motion simulator through Star Wars destinations',
  },
  {
    id: 'show-indiana-jones',
    name: 'Indiana Jones Epic Stunt Spectacular!',
    type: 'theater',
    area: 'echo-lake-hs',
    x: 0.58, y: 0.55,
    lng: -81.5585, lat: 28.3578,
    description: 'Live-action stunt show recreating movie scenes',
  },
  {
    id: 'food-backlot-express-hs',
    name: 'Backlot Express',
    type: 'food',
    area: 'echo-lake-hs',
    x: 0.60, y: 0.58,
    lng: -81.5583, lat: 28.3575,
    menuItems: ['burgers', 'chicken tenders', 'salads', 'mac and cheese'],
    menuDescription: 'Quick-service restaurant in a movie prop warehouse',
  },
  {
    id: 'food-50s-prime-time',
    name: "50's Prime Time Cafe",
    type: 'food',
    area: 'echo-lake-hs',
    x: 0.52, y: 0.62,
    lng: -81.5592, lat: 28.3571,
    menuItems: ['meatloaf', 'pot roast', 'fried chicken', 'milkshakes'],
    menuDescription: '1950s themed table-service restaurant',
    servesAlcohol: true,
  },
];

// ============================================
// STAR WARS: GALAXY'S EDGE
// ============================================

const GALAXYS_EDGE: ParkPOI[] = [
  {
    id: 'ride-millennium-falcon',
    mapNumber: 4,
    name: 'Millennium Falcon: Smugglers Run',
    type: 'ride',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.72, y: 0.38,
    lng: -81.5572, lat: 28.3595,
    heightRequirement: { min: 38 },
    thrillLevel: 'moderate',
    description: 'Interactive flight simulator — pilot the Millennium Falcon on a smuggling mission',
  },
  {
    id: 'ride-rise-of-resistance',
    mapNumber: 5,
    name: 'Star Wars: Rise of the Resistance',
    type: 'ride',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.75, y: 0.32,
    lng: -81.5568, lat: 28.3601,
    heightRequirement: { min: 40 },
    thrillLevel: 'moderate',
    description: 'Multi-system dark ride with trackless vehicles — battle the First Order',
  },
  {
    id: 'attraction-savis-workshop',
    name: "Savi's Workshop — Handbuilt Lightsabers",
    type: 'attraction',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.70, y: 0.35,
    lng: -81.5575, lat: 28.3598,
    description: 'Build your own custom lightsaber',
  },
  {
    id: 'attraction-droid-depot',
    name: 'Droid Depot',
    type: 'attraction',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.73, y: 0.40,
    lng: -81.5570, lat: 28.3593,
    description: 'Build and customize your own droid',
  },
  {
    id: 'food-ogas-cantina',
    name: "Oga's Cantina",
    type: 'food',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.71, y: 0.36,
    lng: -81.5573, lat: 28.3597,
    menuItems: ['cocktails', 'blue milk', 'snacks'],
    menuDescription: 'Exotic cantina with themed cocktails and non-alcoholic concoctions',
    servesAlcohol: true,
  },
  {
    id: 'food-docking-bay-7',
    name: 'Docking Bay 7 Food and Cargo',
    type: 'food',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.74, y: 0.42,
    lng: -81.5569, lat: 28.3591,
    menuItems: ['pot roast', 'shrimp', 'chicken', 'burgers'],
    menuDescription: 'Quick-service meals in a converted hangar bay',
  },
];

// ============================================
// TOY STORY LAND
// ============================================

const TOY_STORY_LAND: ParkPOI[] = [
  {
    id: 'ride-slinky-dog-dash',
    mapNumber: 6,
    name: 'Slinky Dog Dash',
    type: 'ride',
    area: 'toy-story-land-hs',
    x: 0.65, y: 0.55,
    lng: -81.5578, lat: 28.3578,
    heightRequirement: { min: 38 },
    thrillLevel: 'moderate',
    coasterId: 'slinky-dog-dash',
    description: 'Family launched coaster themed to Slinky Dog from Toy Story',
  },
  {
    id: 'ride-toy-story-mania',
    mapNumber: 7,
    name: 'Toy Story Mania!',
    type: 'ride',
    area: 'toy-story-land-hs',
    x: 0.62, y: 0.60,
    lng: -81.5581, lat: 28.3573,
    thrillLevel: 'mild',
    description: 'Interactive 4D shooting gallery ride through Toy Story carnival games',
  },
  {
    id: 'ride-alien-swirling-saucers',
    mapNumber: 8,
    name: 'Alien Swirling Saucers',
    type: 'ride',
    area: 'toy-story-land-hs',
    x: 0.68, y: 0.52,
    lng: -81.5575, lat: 28.3581,
    heightRequirement: { min: 32 },
    thrillLevel: 'mild',
    description: 'Spinning saucer ride themed to the Little Green Aliens',
  },
  {
    id: 'food-woody-lunch-box',
    name: "Woody's Lunch Box",
    type: 'food',
    area: 'toy-story-land-hs',
    x: 0.64, y: 0.57,
    lng: -81.5579, lat: 28.3576,
    menuItems: ['grilled cheese', 'bbq brisket', 'totchos', 'lunch box tarts'],
    menuDescription: 'Quick-service with nostalgic lunch box themed comfort food',
  },
];

// ============================================
// ANIMATION COURTYARD
// ============================================

const ANIMATION_COURTYARD: ParkPOI[] = [
  {
    id: 'ride-mickey-runaway-railway',
    mapNumber: 9,
    name: "Mickey & Minnie's Runaway Railway",
    type: 'ride',
    area: 'animation-courtyard-hs',
    x: 0.48, y: 0.65,
    lng: -81.5596, lat: 28.3568,
    thrillLevel: 'mild',
    description: 'Trackless dark ride through a Mickey Mouse cartoon short',
  },
  {
    id: 'attraction-disney-jr-live',
    name: 'Disney Junior Play and Dance!',
    type: 'theater',
    area: 'animation-courtyard-hs',
    x: 0.45, y: 0.62,
    lng: -81.5600, lat: 28.3571,
    description: 'Interactive live character show for young kids',
  },
  {
    id: 'attraction-voyage-mermaid',
    name: 'Voyage of the Little Mermaid',
    type: 'theater',
    area: 'animation-courtyard-hs',
    x: 0.42, y: 0.60,
    lng: -81.5603, lat: 28.3573,
    description: 'Musical show combining live performers, animation, and puppets',
  },
];

// ============================================
// GRAND AVENUE
// ============================================

const GRAND_AVENUE: ParkPOI[] = [
  {
    id: 'ride-muppet-vision-3d',
    name: 'MuppetVision 3D',
    type: 'ride',
    area: 'grand-avenue-hs',
    x: 0.55, y: 0.50,
    lng: -81.5588, lat: 28.3583,
    thrillLevel: 'low',
    description: '3D movie with in-theater effects featuring the Muppets',
  },
  {
    id: 'food-baseline-taphouse',
    name: 'BaseLine Tap House',
    type: 'food',
    area: 'grand-avenue-hs',
    x: 0.53, y: 0.52,
    lng: -81.5590, lat: 28.3581,
    menuItems: ['craft beer', 'wine', 'pretzels', 'cheese boards'],
    menuDescription: 'California craft beers and small plates',
    servesAlcohol: true,
  },
];

// ============================================
// SERVICES
// ============================================

const SERVICES: ParkPOI[] = [
  {
    id: 'restroom-entrance-hs',
    name: 'Restrooms (Entrance)',
    type: 'service',
    area: 'hollywood-boulevard-hs',
    x: 0.46, y: 0.85,
    lng: -81.5599, lat: 28.3555,
    approximateLocation: true,
  },
  {
    id: 'restroom-sunset-hs',
    name: 'Restrooms (Sunset Boulevard)',
    type: 'service',
    area: 'sunset-boulevard-hs',
    x: 0.26, y: 0.56,
    lng: -81.5627, lat: 28.3577,
    approximateLocation: true,
  },
  {
    id: 'restroom-echo-lake-hs',
    name: 'Restrooms (Echo Lake)',
    type: 'service',
    area: 'echo-lake-hs',
    x: 0.57, y: 0.57,
    lng: -81.5586, lat: 28.3576,
    approximateLocation: true,
  },
  {
    id: 'restroom-galaxys-edge-hs',
    name: "Restrooms (Galaxy's Edge)",
    type: 'service',
    area: 'star-wars-galaxys-edge-hs',
    x: 0.76, y: 0.34,
    lng: -81.5567, lat: 28.3599,
    approximateLocation: true,
  },
  {
    id: 'restroom-toy-story-hs',
    name: 'Restrooms (Toy Story Land)',
    type: 'service',
    area: 'toy-story-land-hs',
    x: 0.66, y: 0.58,
    lng: -81.5577, lat: 28.3575,
    approximateLocation: true,
  },
  {
    id: 'service-first-aid-hs',
    name: 'First Aid',
    type: 'service',
    area: 'hollywood-boulevard-hs',
    x: 0.44, y: 0.75,
    lng: -81.5601, lat: 28.3563,
    description: 'First aid station',
    approximateLocation: true,
  },
  {
    id: 'service-guest-services-hs',
    name: 'Guest Relations',
    type: 'service',
    area: 'hollywood-boulevard-hs',
    x: 0.52, y: 0.88,
    lng: -81.5591, lat: 28.3552,
    description: 'Guest services and information',
  },
];

// ============================================
// COMBINED EXPORT
// ============================================

export const HOLLYWOOD_STUDIOS_POI: ParkPOI[] = [
  ...HOLLYWOOD_BLVD,
  ...SUNSET_BLVD,
  ...ECHO_LAKE,
  ...GALAXYS_EDGE,
  ...TOY_STORY_LAND,
  ...ANIMATION_COURTYARD,
  ...GRAND_AVENUE,
  ...SERVICES,
];
