// Map Coasterpedia country names to ISO codes and continents.
// Coasterpedia uses plain English country names in infobox "country" fields.
// This supplements the existing CONTINENT_MAP in constants.mjs for countries
// that aren't in our Wikipedia pipeline.

export const CP_COUNTRY_MAP = {
  // North America
  'USA': { isoCode: 'US', name: 'United States', continent: 'North America' },
  'United States': { isoCode: 'US', name: 'United States', continent: 'North America' },
  'Canada': { isoCode: 'CA', name: 'Canada', continent: 'North America' },
  'Mexico': { isoCode: 'MX', name: 'Mexico', continent: 'North America' },
  'Costa Rica': { isoCode: 'CR', name: 'Costa Rica', continent: 'North America' },
  'Cuba': { isoCode: 'CU', name: 'Cuba', continent: 'North America' },
  'Dominican Republic': { isoCode: 'DO', name: 'Dominican Republic', continent: 'North America' },
  'Guatemala': { isoCode: 'GT', name: 'Guatemala', continent: 'North America' },
  'Jamaica': { isoCode: 'JM', name: 'Jamaica', continent: 'North America' },

  // South America
  'Argentina': { isoCode: 'AR', name: 'Argentina', continent: 'South America' },
  'Bolivia': { isoCode: 'BO', name: 'Bolivia', continent: 'South America' },
  'Brazil': { isoCode: 'BR', name: 'Brazil', continent: 'South America' },
  'Chile': { isoCode: 'CL', name: 'Chile', continent: 'South America' },
  'Colombia': { isoCode: 'CO', name: 'Colombia', continent: 'South America' },
  'Ecuador': { isoCode: 'EC', name: 'Ecuador', continent: 'South America' },
  'Peru': { isoCode: 'PE', name: 'Peru', continent: 'South America' },
  'Uruguay': { isoCode: 'UY', name: 'Uruguay', continent: 'South America' },
  'Venezuela': { isoCode: 'VE', name: 'Venezuela', continent: 'South America' },

  // Europe
  'Albania': { isoCode: 'AL', name: 'Albania', continent: 'Europe' },
  'Austria': { isoCode: 'AT', name: 'Austria', continent: 'Europe' },
  'Azerbaijan': { isoCode: 'AZ', name: 'Azerbaijan', continent: 'Europe' },
  'Belarus': { isoCode: 'BY', name: 'Belarus', continent: 'Europe' },
  'Belgium': { isoCode: 'BE', name: 'Belgium', continent: 'Europe' },
  'Bulgaria': { isoCode: 'BG', name: 'Bulgaria', continent: 'Europe' },
  'Croatia': { isoCode: 'HR', name: 'Croatia', continent: 'Europe' },
  'Cyprus': { isoCode: 'CY', name: 'Cyprus', continent: 'Europe' },
  'Czech Republic': { isoCode: 'CZ', name: 'Czech Republic', continent: 'Europe' },
  'Denmark': { isoCode: 'DK', name: 'Denmark', continent: 'Europe' },
  'Estonia': { isoCode: 'EE', name: 'Estonia', continent: 'Europe' },
  'Finland': { isoCode: 'FI', name: 'Finland', continent: 'Europe' },
  'France': { isoCode: 'FR', name: 'France', continent: 'Europe' },
  'Georgia': { isoCode: 'GE', name: 'Georgia', continent: 'Europe' },
  'Germany': { isoCode: 'DE', name: 'Germany', continent: 'Europe' },
  'Greece': { isoCode: 'GR', name: 'Greece', continent: 'Europe' },
  'Hungary': { isoCode: 'HU', name: 'Hungary', continent: 'Europe' },
  'Ireland': { isoCode: 'IE', name: 'Ireland', continent: 'Europe' },
  'Italy': { isoCode: 'IT', name: 'Italy', continent: 'Europe' },
  'Lithuania': { isoCode: 'LT', name: 'Lithuania', continent: 'Europe' },
  'Luxembourg': { isoCode: 'LU', name: 'Luxembourg', continent: 'Europe' },
  'Malta': { isoCode: 'MT', name: 'Malta', continent: 'Europe' },
  'Moldova': { isoCode: 'MD', name: 'Moldova', continent: 'Europe' },
  'Netherlands': { isoCode: 'NL', name: 'Netherlands', continent: 'Europe' },
  'Norway': { isoCode: 'NO', name: 'Norway', continent: 'Europe' },
  'Poland': { isoCode: 'PL', name: 'Poland', continent: 'Europe' },
  'Portugal': { isoCode: 'PT', name: 'Portugal', continent: 'Europe' },
  'Russia': { isoCode: 'RU', name: 'Russia', continent: 'Europe' },
  'Serbia': { isoCode: 'RS', name: 'Serbia', continent: 'Europe' },
  'Spain': { isoCode: 'ES', name: 'Spain', continent: 'Europe' },
  'Sweden': { isoCode: 'SE', name: 'Sweden', continent: 'Europe' },
  'Switzerland': { isoCode: 'CH', name: 'Switzerland', continent: 'Europe' },
  'Turkey': { isoCode: 'TR', name: 'Turkey', continent: 'Europe' },
  'Ukraine': { isoCode: 'UA', name: 'Ukraine', continent: 'Europe' },
  'United Kingdom': { isoCode: 'GB', name: 'United Kingdom', continent: 'Europe' },
  'UK': { isoCode: 'GB', name: 'United Kingdom', continent: 'Europe' },
  'England': { isoCode: 'GB', name: 'United Kingdom', continent: 'Europe' },
  'Scotland': { isoCode: 'GB', name: 'United Kingdom', continent: 'Europe' },
  'Wales': { isoCode: 'GB', name: 'United Kingdom', continent: 'Europe' },

  // Asia
  'Bahrain': { isoCode: 'BH', name: 'Bahrain', continent: 'Asia' },
  'Bangladesh': { isoCode: 'BD', name: 'Bangladesh', continent: 'Asia' },
  'China': { isoCode: 'CN', name: 'China', continent: 'Asia' },
  'India': { isoCode: 'IN', name: 'India', continent: 'Asia' },
  'Indonesia': { isoCode: 'ID', name: 'Indonesia', continent: 'Asia' },
  'Iraq': { isoCode: 'IQ', name: 'Iraq', continent: 'Asia' },
  'Israel': { isoCode: 'IL', name: 'Israel', continent: 'Asia' },
  'Japan': { isoCode: 'JP', name: 'Japan', continent: 'Asia' },
  'Jordan': { isoCode: 'JO', name: 'Jordan', continent: 'Asia' },
  'Kazakhstan': { isoCode: 'KZ', name: 'Kazakhstan', continent: 'Asia' },
  'Kuwait': { isoCode: 'KW', name: 'Kuwait', continent: 'Asia' },
  'Kyrgyzstan': { isoCode: 'KG', name: 'Kyrgyzstan', continent: 'Asia' },
  'Malaysia': { isoCode: 'MY', name: 'Malaysia', continent: 'Asia' },
  'Mongolia': { isoCode: 'MN', name: 'Mongolia', continent: 'Asia' },
  'North Korea': { isoCode: 'KP', name: 'North Korea', continent: 'Asia' },
  'Oman': { isoCode: 'OM', name: 'Oman', continent: 'Asia' },
  'Pakistan': { isoCode: 'PK', name: 'Pakistan', continent: 'Asia' },
  'Philippines': { isoCode: 'PH', name: 'Philippines', continent: 'Asia' },
  'Qatar': { isoCode: 'QA', name: 'Qatar', continent: 'Asia' },
  'Saudi Arabia': { isoCode: 'SA', name: 'Saudi Arabia', continent: 'Asia' },
  'Singapore': { isoCode: 'SG', name: 'Singapore', continent: 'Asia' },
  'South Korea': { isoCode: 'KR', name: 'South Korea', continent: 'Asia' },
  'Sri Lanka': { isoCode: 'LK', name: 'Sri Lanka', continent: 'Asia' },
  'Taiwan': { isoCode: 'TW', name: 'Taiwan', continent: 'Asia' },
  'Thailand': { isoCode: 'TH', name: 'Thailand', continent: 'Asia' },
  'Turkmenistan': { isoCode: 'TM', name: 'Turkmenistan', continent: 'Asia' },
  'United Arab Emirates': { isoCode: 'AE', name: 'United Arab Emirates', continent: 'Asia' },
  'UAE': { isoCode: 'AE', name: 'United Arab Emirates', continent: 'Asia' },
  'Uzbekistan': { isoCode: 'UZ', name: 'Uzbekistan', continent: 'Asia' },
  'Vietnam': { isoCode: 'VN', name: 'Vietnam', continent: 'Asia' },
  'Yemen': { isoCode: 'YE', name: 'Yemen', continent: 'Asia' },

  // Africa
  'Algeria': { isoCode: 'DZ', name: 'Algeria', continent: 'Africa' },
  'Angola': { isoCode: 'AO', name: 'Angola', continent: 'Africa' },
  'Egypt': { isoCode: 'EG', name: 'Egypt', continent: 'Africa' },
  'Ethiopia': { isoCode: 'ET', name: 'Ethiopia', continent: 'Africa' },
  'Morocco': { isoCode: 'MA', name: 'Morocco', continent: 'Africa' },
  'South Africa': { isoCode: 'ZA', name: 'South Africa', continent: 'Africa' },
  'Tunisia': { isoCode: 'TN', name: 'Tunisia', continent: 'Africa' },

  // Oceania
  'Australia': { isoCode: 'AU', name: 'Australia', continent: 'Oceania' },
  'New Zealand': { isoCode: 'NZ', name: 'New Zealand', continent: 'Oceania' },
};

/**
 * Look up country info from a Coasterpedia country name.
 * @param {string} countryName - e.g., "USA", "Germany", "United Kingdom"
 * @returns {{ isoCode: string, name: string, continent: string } | null}
 */
export function lookupCpCountry(countryName) {
  if (!countryName) return null;
  const trimmed = countryName.trim();

  // Direct match
  if (CP_COUNTRY_MAP[trimmed]) return CP_COUNTRY_MAP[trimmed];

  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(CP_COUNTRY_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }

  return null;
}
