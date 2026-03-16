import { COASTER_DATABASE } from '../../coastle/data/coastleDatabase';
import { CoastleCoaster } from '../../coastle/types/coastle';
import { ParkData } from '../types';


// ============================================
// Park Location Lookup
// ============================================

/** City/State for known parks. Falls back to country-only. */
const PARK_LOCATIONS: Record<string, string> = {
  // USA
  "Knott's Berry Farm": 'Buena Park, California, USA',
  'Cedar Point': 'Sandusky, Ohio, USA',
  'Six Flags Magic Mountain': 'Valencia, California, USA',
  'Six Flags Great Adventure': 'Jackson, New Jersey, USA',
  'Six Flags Great America': 'Gurnee, Illinois, USA',
  'Six Flags Over Texas': 'Arlington, Texas, USA',
  'Six Flags Over Georgia': 'Austell, Georgia, USA',
  'Six Flags Fiesta Texas': 'San Antonio, Texas, USA',
  'Six Flags New England': 'Agawam, Massachusetts, USA',
  'Six Flags St. Louis': 'Eureka, Missouri, USA',
  'Hersheypark': 'Hershey, Pennsylvania, USA',
  'Kings Island': 'Mason, Ohio, USA',
  'Kings Dominion': 'Doswell, Virginia, USA',
  'Carowinds': 'Charlotte, North Carolina, USA',
  'Busch Gardens Tampa Bay': 'Tampa, Florida, USA',
  'Busch Gardens Williamsburg': 'Williamsburg, Virginia, USA',
  'SeaWorld Orlando': 'Orlando, Florida, USA',
  'SeaWorld San Diego': 'San Diego, California, USA',
  'Dollywood': 'Pigeon Forge, Tennessee, USA',
  'Holiday World': 'Santa Claus, Indiana, USA',
  'Silver Dollar City': 'Branson, Missouri, USA',
  "Dorney Park & Wildwater Kingdom": 'Allentown, Pennsylvania, USA',
  "Valleyfair": 'Shakopee, Minnesota, USA',
  "Worlds of Fun": 'Kansas City, Missouri, USA',
  "Michigan's Adventure": 'Muskegon, Michigan, USA',
  'Kennywood': 'West Mifflin, Pennsylvania, USA',
  'Universal Epic Universe': 'Orlando, Florida, USA',
  'Universal Studios Florida': 'Orlando, Florida, USA',
  'Universal Studios Hollywood': 'Universal City, California, USA',
  'Islands of Adventure': 'Orlando, Florida, USA',
  'Magic Kingdom': 'Lake Buena Vista, Florida, USA',
  'Disneyland': 'Anaheim, California, USA',
  'Epcot': 'Lake Buena Vista, Florida, USA',
  "Disney's Hollywood Studios": 'Lake Buena Vista, Florida, USA',
  "Disney's Animal Kingdom": 'Lake Buena Vista, Florida, USA',
  'LEGOLAND California': 'Carlsbad, California, USA',
  'LEGOLAND Florida': 'Winter Haven, Florida, USA',

  // International
  'Alton Towers': 'Staffordshire, England, UK',
  'Thorpe Park': 'Surrey, England, UK',
  'Europa-Park': 'Rust, Baden-Württemberg, Germany',
  'Phantasialand': 'Brühl, North Rhine-Westphalia, Germany',
  'PortAventura': 'Salou, Catalonia, Spain',
  'Efteling': 'Kaatsheuvel, North Brabant, Netherlands',
  'Tivoli Gardens': 'Copenhagen, Denmark',
  'Liseberg': 'Gothenburg, Sweden',
  'Fuji-Q Highland': 'Fujiyoshida, Yamanashi, Japan',
  'Nagashima Spa Land': 'Kuwana, Mie, Japan',
  'Everland': 'Yongin, Gyeonggi, South Korea',
  'Lotte World': 'Seoul, South Korea',
  'Ocean Park': 'Aberdeen, Hong Kong',
  'Dreamworld': 'Coomera, Queensland, Australia',
  'Canada\'s Wonderland': 'Vaughan, Ontario, Canada',
  'La Ronde': 'Montreal, Quebec, Canada',
};

// ============================================
// Park Data Utilities
// ============================================

/** Group coasters by park and compute aggregate stats. Also includes map-only parks. */
export function buildParkList(): ParkData[] {
  const grouped: Record<string, CoastleCoaster[]> = {};
  for (const c of COASTER_DATABASE) {
    if (!grouped[c.park]) grouped[c.park] = [];
    grouped[c.park].push(c);
  }

  const parkList: ParkData[] = Object.entries(grouped)
    .map(([name, coasters]) => ({
      name,
      coasters,
      count: coasters.length,
      country: coasters[0].country,
      location: PARK_LOCATIONS[name] ?? coasters[0].country,
      continent: coasters[0].continent,
      sortedCoasters: [...coasters].sort((a, b) => b.heightFt - a.heightFt),
      topStats: {
        tallest: Math.max(...coasters.map((c) => c.heightFt)),
        fastest: Math.max(...coasters.map((c) => c.speedMph)),
        mostInversions: Math.max(...coasters.map((c) => c.inversions)),
      },
    }));

  return parkList.sort((a, b) => b.count - a.count);
}
