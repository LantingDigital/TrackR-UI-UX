// Canonical manufacturer names and alias mapping.
// Pipeline normalizes all manufacturer references to these canonical forms.

export const CANONICAL_MANUFACTURERS = [
  'Bolliger & Mabillard',
  'Intamin',
  'Rocky Mountain Construction',
  'Vekoma',
  'Mack Rides',
  'Gerstlauer',
  'Arrow Dynamics',
  'Great Coasters International',
  'Gravity Group',
  'S&S Worldwide',
  'Premier Rides',
  'Zamperla',
  'Philadelphia Toboggan Coasters',
  'Maurer Rides',
  'Chance Rides',
  'Custom Coasters International',
  'Schwarzkopf',
  'Zierer',
  'Dynamic Attractions',
  'Jinma Rides',
  'Beijing Shibaolai',
  'SBF Visa Group',
  'TOGO',
  'Sansei Technologies',
  'Morgan Manufacturing',
  'E&F Miler Industries',
  'Pinfari',
  'Dinn Corporation',
  'Hopkins Rides',
  'Reverchon',
  'Giovanola',
  'Setpoint',
  'Ride Engineers Switzerland',
  'ART Engineering',
  'Dalian Wanda',
  'Golden Horse',
];

// Map of known aliases/abbreviations/variants → canonical name
const ALIASES = {
  // Bolliger & Mabillard
  'B&M': 'Bolliger & Mabillard',
  'B & M': 'Bolliger & Mabillard',
  'B&M Inc.': 'Bolliger & Mabillard',
  'Bolliger and Mabillard': 'Bolliger & Mabillard',
  'Bolliger&Mabillard': 'Bolliger & Mabillard',

  // Rocky Mountain Construction
  'RMC': 'Rocky Mountain Construction',
  'Rocky Mountain Construction, LLC': 'Rocky Mountain Construction',

  // Great Coasters International
  'GCI': 'Great Coasters International',
  'Great Coasters International, Inc.': 'Great Coasters International',

  // Custom Coasters International
  'CCI': 'Custom Coasters International',
  'Custom Coasters International, Inc.': 'Custom Coasters International',

  // Philadelphia Toboggan Coasters
  'PTC': 'Philadelphia Toboggan Coasters',
  'Philadelphia Toboggan Company': 'Philadelphia Toboggan Coasters',
  'Philadelphia Toboggan Coasters, Inc.': 'Philadelphia Toboggan Coasters',

  // S&S Worldwide
  'S&S': 'S&S Worldwide',
  'S & S': 'S&S Worldwide',
  'S&S Power': 'S&S Worldwide',
  'S&S – Sansei Technologies': 'S&S Worldwide',
  'S&S - Sansei Technologies': 'S&S Worldwide',
  'S&S/Sansei Technologies': 'S&S Worldwide',

  // Intamin
  'Intamin AG': 'Intamin',
  'Intamin Amusement Rides': 'Intamin',
  'Intamin Ltd.': 'Intamin',

  // Mack Rides
  'Mack': 'Mack Rides',
  'MACK Rides': 'Mack Rides',
  'Mack Rides GmbH & Co KG': 'Mack Rides',
  'Heinrich Mack GmbH & Co.': 'Mack Rides',

  // Gerstlauer
  'Gerstlauer Amusement Rides': 'Gerstlauer',
  'Gerstlauer Amusement Rides GmbH': 'Gerstlauer',

  // Arrow Dynamics
  'Arrow Development': 'Arrow Dynamics',
  'Arrow Development Company': 'Arrow Dynamics',
  'Arrow Development Co.': 'Arrow Dynamics',
  'Arrow Huss': 'Arrow Dynamics',

  // Vekoma
  'Vekoma Rides Manufacturing': 'Vekoma',
  'Vekoma Rides Manufacturing B.V.': 'Vekoma',
  'Vekoma International': 'Vekoma',

  // Premier Rides
  'Premier Rides, Inc.': 'Premier Rides',

  // Maurer Rides
  'Maurer Söhne': 'Maurer Rides',
  'Maurer AG': 'Maurer Rides',
  'Maurer Söhne GmbH & Co. KG': 'Maurer Rides',

  // Chance Rides
  'Chance Morgan': 'Chance Rides',
  'Chance Industries': 'Chance Rides',

  // Schwarzkopf
  'Schwarzkopf GmbH': 'Schwarzkopf',
  'Anton Schwarzkopf': 'Schwarzkopf',
  'Schwarzkopf Industries': 'Schwarzkopf',

  // Morgan Manufacturing
  'D. H. Morgan Manufacturing': 'Morgan Manufacturing',
  'D.H. Morgan Manufacturing': 'Morgan Manufacturing',
  'Morgan': 'Morgan Manufacturing',

  // Zamperla
  'Zamperla S.p.A.': 'Zamperla',
  'Antonio Zamperla S.p.A.': 'Zamperla',

  // Zierer
  'Zierer GmbH': 'Zierer',

  // Dynamic Attractions
  'Dynamic Structures': 'Dynamic Attractions',
  'Dynamic Structures Ltd.': 'Dynamic Attractions',

  // Gravity Group
  'The Gravity Group': 'Gravity Group',
  'The Gravity Group, LLC': 'Gravity Group',

  // SBF Visa Group
  'SBF Visa': 'SBF Visa Group',
  'S.B.F. Visa Group': 'SBF Visa Group',

  // Jinma Rides
  'Jinma Rides Entertainment': 'Jinma Rides',
  'Zhongshan Jinma Amusement Equipment': 'Jinma Rides',

  // Beijing Shibaolai
  'Beijing Shibaolai Amusement Equipment': 'Beijing Shibaolai',

  // TOGO
  'Togo': 'TOGO',

  // Sansei Technologies
  'Sansei': 'Sansei Technologies',
  'Sansei Technologies Inc.': 'Sansei Technologies',

  // Ride Engineers Switzerland
  'RES': 'Ride Engineers Switzerland',

  // Giovanola
  'Giovanola Frères': 'Giovanola',

  // Dinn Corporation
  'Dinn': 'Dinn Corporation',
  'Dinn & Summers': 'Dinn Corporation',
};

// Build case-insensitive lookup map
const aliasLookup = new Map();
for (const [alias, canonical] of Object.entries(ALIASES)) {
  aliasLookup.set(alias.toLowerCase(), canonical);
}
const canonicalSet = new Set(
  CANONICAL_MANUFACTURERS.map((m) => m.toLowerCase())
);

/**
 * Normalize a manufacturer name to its canonical form.
 * Returns { name, matched } where matched=false means the name wasn't in our list.
 */
export function normalizeManufacturer(raw) {
  if (!raw || !raw.trim()) return { name: 'Unknown', matched: false };
  const trimmed = raw.trim();

  // Direct canonical match
  if (canonicalSet.has(trimmed.toLowerCase())) {
    return {
      name: CANONICAL_MANUFACTURERS.find(
        (m) => m.toLowerCase() === trimmed.toLowerCase()
      ),
      matched: true,
    };
  }

  // Alias match
  const aliasMatch = aliasLookup.get(trimmed.toLowerCase());
  if (aliasMatch) return { name: aliasMatch, matched: true };

  // Partial match: raw contains or is contained by a canonical name
  const lower = trimmed.toLowerCase();
  for (const canonical of CANONICAL_MANUFACTURERS) {
    const cl = canonical.toLowerCase();
    if (cl.includes(lower) || lower.includes(cl)) {
      return { name: canonical, matched: true };
    }
  }

  // No match — return as-is, flag for review
  return { name: trimmed, matched: false };
}

// Reverse lookup: get common abbreviations for a canonical name
const ABBREVIATIONS = {
  'Bolliger & Mabillard': ['b&m'],
  'Rocky Mountain Construction': ['rmc'],
  'Great Coasters International': ['gci'],
  'Custom Coasters International': ['cci'],
  'Philadelphia Toboggan Coasters': ['ptc'],
  'S&S Worldwide': ['s&s'],
};

export function getManufacturerAbbreviations(canonicalName) {
  return ABBREVIATIONS[canonicalName] || [];
}
