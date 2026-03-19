"use strict";
/**
 * Apple Wallet PKPass — Park Locations
 *
 * Lat/lng coordinates for theme parks. Used for PKPass geo-fencing.
 * When the device is within ~1km of these coordinates, the pass
 * auto-surfaces on the lock screen.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findParkLocation = findParkLocation;
/**
 * Park locations indexed by normalized park name.
 * Coordinates are approximate park entrance locations.
 */
const PARK_LOCATIONS = {
    // Cedar Fair
    'cedar-point': { latitude: 41.4783, longitude: -82.6812, relevantText: "You're near Cedar Point!" },
    'kings-island': { latitude: 39.3449, longitude: -84.2716, relevantText: "You're near Kings Island!" },
    'knotts-berry-farm': { latitude: 33.8442, longitude: -117.9986, relevantText: "You're near Knott's Berry Farm!" },
    'canadas-wonderland': { latitude: 43.8430, longitude: -79.5390, relevantText: "You're near Canada's Wonderland!" },
    'carowinds': { latitude: 35.1049, longitude: -80.9436, relevantText: "You're near Carowinds!" },
    'kings-dominion': { latitude: 37.8392, longitude: -77.4431, relevantText: "You're near Kings Dominion!" },
    'dorney-park': { latitude: 40.5791, longitude: -75.5348, relevantText: "You're near Dorney Park!" },
    'worlds-of-fun': { latitude: 39.1754, longitude: -94.4866, relevantText: "You're near Worlds of Fun!" },
    'valleyfair': { latitude: 44.7998, longitude: -93.4630, relevantText: "You're near Valleyfair!" },
    'michigan-adventure': { latitude: 43.3342, longitude: -86.2575, relevantText: "You're near Michigan's Adventure!" },
    // Six Flags
    'six-flags-magic-mountain': { latitude: 34.4254, longitude: -118.5972, relevantText: "You're near Six Flags Magic Mountain!" },
    'six-flags-great-adventure': { latitude: 40.1373, longitude: -74.4415, relevantText: "You're near Six Flags Great Adventure!" },
    'six-flags-over-texas': { latitude: 32.7557, longitude: -97.0697, relevantText: "You're near Six Flags Over Texas!" },
    'six-flags-over-georgia': { latitude: 33.7700, longitude: -84.5516, relevantText: "You're near Six Flags Over Georgia!" },
    'six-flags-fiesta-texas': { latitude: 29.5994, longitude: -98.6093, relevantText: "You're near Six Flags Fiesta Texas!" },
    'six-flags-great-america': { latitude: 42.3700, longitude: -87.9358, relevantText: "You're near Six Flags Great America!" },
    'six-flags-new-england': { latitude: 42.0387, longitude: -72.6155, relevantText: "You're near Six Flags New England!" },
    // Disney
    'magic-kingdom': { latitude: 28.4177, longitude: -81.5812, relevantText: "You're near Magic Kingdom!" },
    'epcot': { latitude: 28.3747, longitude: -81.5494, relevantText: "You're near EPCOT!" },
    'hollywood-studios': { latitude: 28.3575, longitude: -81.5583, relevantText: "You're near Hollywood Studios!" },
    'animal-kingdom': { latitude: 28.3553, longitude: -81.5901, relevantText: "You're near Animal Kingdom!" },
    'disneyland': { latitude: 33.8121, longitude: -117.9190, relevantText: "You're near Disneyland!" },
    'disney-california-adventure': { latitude: 33.8059, longitude: -117.9190, relevantText: "You're near Disney California Adventure!" },
    // Universal
    'universal-studios-florida': { latitude: 28.4742, longitude: -81.4687, relevantText: "You're near Universal Studios Florida!" },
    'islands-of-adventure': { latitude: 28.4719, longitude: -81.4713, relevantText: "You're near Islands of Adventure!" },
    'epic-universe': { latitude: 28.4715, longitude: -81.4950, relevantText: "You're near Epic Universe!" },
    'universal-studios-hollywood': { latitude: 34.1381, longitude: -118.3534, relevantText: "You're near Universal Studios Hollywood!" },
    // SeaWorld / Busch Gardens
    'seaworld-orlando': { latitude: 28.4112, longitude: -81.4612, relevantText: "You're near SeaWorld Orlando!" },
    'seaworld-san-diego': { latitude: 32.7642, longitude: -117.2264, relevantText: "You're near SeaWorld San Diego!" },
    'busch-gardens-tampa': { latitude: 28.0372, longitude: -82.4216, relevantText: "You're near Busch Gardens Tampa Bay!" },
    'busch-gardens-williamsburg': { latitude: 37.2343, longitude: -76.6458, relevantText: "You're near Busch Gardens Williamsburg!" },
    // Other Major Parks
    'hersheypark': { latitude: 40.2875, longitude: -76.6556, relevantText: "You're near Hersheypark!" },
    'dollywood': { latitude: 35.7957, longitude: -83.5302, relevantText: "You're near Dollywood!" },
    'silver-dollar-city': { latitude: 36.6683, longitude: -93.3384, relevantText: "You're near Silver Dollar City!" },
    'holiday-world': { latitude: 38.2005, longitude: -86.6270, relevantText: "You're near Holiday World!" },
    'lagoon': { latitude: 40.9270, longitude: -111.8948, relevantText: "You're near Lagoon!" },
    'kennywood': { latitude: 40.3863, longitude: -79.8663, relevantText: "You're near Kennywood!" },
};
// ============================================
// Lookup
// ============================================
/**
 * Normalize a park name for location lookup.
 * Converts to lowercase, replaces non-alphanumeric with hyphens.
 */
function normalizeParkName(parkName) {
    return parkName
        .toLowerCase()
        .replace(/[''\u2018\u2019]/g, '') // Remove apostrophes
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Find the geo-fence location for a park.
 * Returns null if the park isn't in our database.
 */
function findParkLocation(parkName) {
    const normalized = normalizeParkName(parkName);
    // Direct match
    if (PARK_LOCATIONS[normalized]) {
        return PARK_LOCATIONS[normalized];
    }
    // Partial match (park name contains our key or vice versa)
    for (const [key, location] of Object.entries(PARK_LOCATIONS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return location;
        }
    }
    return null;
}
//# sourceMappingURL=parkLocations.js.map