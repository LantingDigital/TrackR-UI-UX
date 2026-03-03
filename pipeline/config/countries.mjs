// Country definitions for Wikipedia category traversal.
// Each entry maps to a Wikipedia category tree for roller coaster discovery.

export const COUNTRIES = [
  // ── Wave 1: Major Markets ────────────────────────────────
  {
    isoCode: 'US',
    name: 'United States',
    continent: 'North America',
    category: 'Category:Roller coasters in the United States',
    hasRegions: true,
    regionCategory: 'Category:Roller coasters in the United States by state',
    regionExtractor: (catTitle) =>
      catTitle
        .replace('Category:Roller coasters in ', '')
        .replace(' (U.S. state)', '')
        .replace(' (state)', ''),
    formerCategory: 'Category:Former roller coasters in the United States',
    formerRegionCategory: 'Category:Former roller coasters in the United States',
  },
  {
    isoCode: 'CA',
    name: 'Canada',
    continent: 'North America',
    category: 'Category:Roller coasters in Canada',
    hasRegions: true,
    // Province subcategories are direct children of the country category
    regionCategory: 'Category:Roller coasters in Canada',
    regionExtractor: (catTitle) =>
      catTitle.replace('Category:Roller coasters in ', ''),
  },
  {
    isoCode: 'GB',
    name: 'United Kingdom',
    continent: 'Europe',
    category: 'Category:Roller coasters in the United Kingdom',
    hasRegions: false,
    defaultRegion: 'United Kingdom',
  },
  {
    isoCode: 'DE',
    name: 'Germany',
    continent: 'Europe',
    category: 'Category:Roller coasters in Germany',
    hasRegions: false,
    defaultRegion: 'Germany',
  },
  {
    isoCode: 'JP',
    name: 'Japan',
    continent: 'Asia',
    category: 'Category:Roller coasters in Japan',
    hasRegions: false,
    defaultRegion: 'Japan',
  },
  {
    isoCode: 'CN',
    name: 'China',
    continent: 'Asia',
    category: 'Category:Roller coasters in China',
    hasRegions: false,
    defaultRegion: 'China',
  },

  // ── Wave 2: Europe + Asia Expansion ──────────────────────
  {
    isoCode: 'ES',
    name: 'Spain',
    continent: 'Europe',
    category: 'Category:Roller coasters in Spain',
    hasRegions: false,
    defaultRegion: 'Spain',
  },
  {
    isoCode: 'FR',
    name: 'France',
    continent: 'Europe',
    category: 'Category:Roller coasters in France',
    hasRegions: false,
    defaultRegion: 'France',
  },
  {
    isoCode: 'NL',
    name: 'Netherlands',
    continent: 'Europe',
    category: 'Category:Roller coasters in the Netherlands',
    hasRegions: false,
    defaultRegion: 'Netherlands',
  },
  {
    isoCode: 'SE',
    name: 'Sweden',
    continent: 'Europe',
    category: 'Category:Roller coasters in Sweden',
    hasRegions: false,
    defaultRegion: 'Sweden',
  },
  {
    isoCode: 'DK',
    name: 'Denmark',
    continent: 'Europe',
    category: 'Category:Roller coasters in Denmark',
    hasRegions: false,
    defaultRegion: 'Denmark',
  },
  {
    isoCode: 'IT',
    name: 'Italy',
    continent: 'Europe',
    category: 'Category:Roller coasters in Italy',
    hasRegions: false,
    defaultRegion: 'Italy',
  },
  {
    isoCode: 'AU',
    name: 'Australia',
    continent: 'Oceania',
    category: 'Category:Roller coasters in Australia',
    hasRegions: false,
    defaultRegion: 'Australia',
  },
  {
    isoCode: 'KR',
    name: 'South Korea',
    continent: 'Asia',
    category: 'Category:Roller coasters in South Korea',
    hasRegions: false,
    defaultRegion: 'South Korea',
  },
  {
    isoCode: 'AE',
    name: 'United Arab Emirates',
    continent: 'Asia',
    category: 'Category:Roller coasters in the United Arab Emirates',
    hasRegions: false,
    defaultRegion: 'United Arab Emirates',
  },
  {
    isoCode: 'SG',
    name: 'Singapore',
    continent: 'Asia',
    category: 'Category:Roller coasters in Singapore',
    hasRegions: false,
    defaultRegion: 'Singapore',
  },
  {
    isoCode: 'MY',
    name: 'Malaysia',
    continent: 'Asia',
    category: 'Category:Roller coasters in Malaysia',
    hasRegions: false,
    defaultRegion: 'Malaysia',
  },
  {
    isoCode: 'MX',
    name: 'Mexico',
    continent: 'North America',
    category: 'Category:Roller coasters in Mexico',
    hasRegions: false,
    defaultRegion: 'Mexico',
  },
  {
    isoCode: 'BR',
    name: 'Brazil',
    continent: 'South America',
    category: 'Category:Roller coasters in Brazil',
    hasRegions: false,
    defaultRegion: 'Brazil',
  },
  {
    isoCode: 'FI',
    name: 'Finland',
    continent: 'Europe',
    category: 'Category:Roller coasters in Finland',
    hasRegions: false,
    defaultRegion: 'Finland',
  },
  {
    isoCode: 'PL',
    name: 'Poland',
    continent: 'Europe',
    category: 'Category:Roller coasters in Poland',
    hasRegions: false,
    defaultRegion: 'Poland',
  },
  {
    isoCode: 'AT',
    name: 'Austria',
    continent: 'Europe',
    category: 'Category:Roller coasters in Austria',
    hasRegions: false,
    defaultRegion: 'Austria',
  },
  {
    isoCode: 'BE',
    name: 'Belgium',
    continent: 'Europe',
    category: 'Category:Roller coasters in Belgium',
    hasRegions: false,
    defaultRegion: 'Belgium',
  },
  {
    isoCode: 'TW',
    name: 'Taiwan',
    continent: 'Asia',
    category: 'Category:Roller coasters in Taiwan',
    hasRegions: false,
    defaultRegion: 'Taiwan',
  },
  {
    isoCode: 'IN',
    name: 'India',
    continent: 'Asia',
    category: 'Category:Roller coasters in India',
    hasRegions: false,
    defaultRegion: 'India',
  },
];

// Lookup helpers
const byCode = new Map(COUNTRIES.map((c) => [c.isoCode, c]));
export function getCountry(isoCode) {
  return byCode.get(isoCode) || null;
}

export function getContinent(isoCode) {
  return byCode.get(isoCode)?.continent || null;
}
