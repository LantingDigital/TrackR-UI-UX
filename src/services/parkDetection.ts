/**
 * Park Detection Service
 *
 * Analyzes QR code data to automatically detect:
 * - Park chain (Disney, Universal, etc.)
 * - Park name
 * - Pass type
 * - Validity dates
 * - Passholder name
 */

import {
  ParkChain,
  PassType,
  DetectionResult,
  Ticket,
} from '../types/wallet';

/**
 * Pattern matching rules for park chains
 * Each chain has multiple patterns to match URLs and identifiers
 */
const PARK_PATTERNS: Record<ParkChain, RegExp[]> = {
  disney: [
    /disney/i,
    /magic\s*kingdom/i,
    /epcot/i,
    /hollywood\s*studios/i,
    /animal\s*kingdom/i,
    /disneyland/i,
    /disneyworld/i,
    /disney\.go\.com/i,
    /mydisneyexperience/i,
  ],
  universal: [
    /universal/i,
    /usf/i,
    /ioa/i,
    /islands\s*of\s*adventure/i,
    /epic\s*universe/i,
    /universalorlando/i,
    /universalhollywood/i,
    /universalstudios/i,
  ],
  cedar_fair: [
    /cedar\s*fair/i,
    /cedar\s*point/i,
    /kings\s*island/i,
    /kings\s*dominion/i,
    /carowinds/i,
    /knott/i,
    /california.*great.*america/i,
    /canada.*wonderland/i,
    /cedarfair/i,
  ],
  six_flags: [
    /six\s*flags/i,
    /sixflags/i,
    /magic\s*mountain/i,
    /great\s*adventure/i,
    /great\s*america/i,
    /fiesta\s*texas/i,
    /over\s*georgia/i,
    /over\s*texas/i,
  ],
  seaworld: [
    /seaworld/i,
    /sea\s*world/i,
    /busch.*gardens/i,
    /sesameplace/i,
    /aquatica/i,
  ],
  busch_gardens: [
    /busch\s*gardens/i,
    /bgw/i,
    /bgt/i,
    /buschgardens/i,
  ],
  other: [],
};

/**
 * Park name extraction patterns
 * More specific patterns to extract full park names
 */
const PARK_NAME_PATTERNS: { pattern: RegExp; name: string; chain: ParkChain }[] = [
  // Disney
  { pattern: /magic\s*kingdom/i, name: 'Magic Kingdom', chain: 'disney' },
  { pattern: /epcot/i, name: 'EPCOT', chain: 'disney' },
  { pattern: /hollywood\s*studios/i, name: 'Hollywood Studios', chain: 'disney' },
  { pattern: /animal\s*kingdom/i, name: 'Animal Kingdom', chain: 'disney' },
  { pattern: /disneyland(?!\s*resort)/i, name: 'Disneyland', chain: 'disney' },
  { pattern: /disney\s*california\s*adventure/i, name: 'Disney California Adventure', chain: 'disney' },

  // Universal
  { pattern: /universal\s*studios\s*florida/i, name: 'Universal Studios Florida', chain: 'universal' },
  { pattern: /islands\s*of\s*adventure/i, name: 'Islands of Adventure', chain: 'universal' },
  { pattern: /epic\s*universe/i, name: 'Epic Universe', chain: 'universal' },
  { pattern: /universal\s*studios\s*hollywood/i, name: 'Universal Studios Hollywood', chain: 'universal' },
  { pattern: /volcano\s*bay/i, name: 'Volcano Bay', chain: 'universal' },

  // Cedar Fair
  { pattern: /cedar\s*point/i, name: 'Cedar Point', chain: 'cedar_fair' },
  { pattern: /kings\s*island/i, name: 'Kings Island', chain: 'cedar_fair' },
  { pattern: /kings\s*dominion/i, name: 'Kings Dominion', chain: 'cedar_fair' },
  { pattern: /carowinds/i, name: 'Carowinds', chain: 'cedar_fair' },
  { pattern: /knott.*berry/i, name: "Knott's Berry Farm", chain: 'cedar_fair' },
  { pattern: /canada.*wonderland/i, name: "Canada's Wonderland", chain: 'cedar_fair' },

  // Six Flags
  { pattern: /magic\s*mountain/i, name: 'Six Flags Magic Mountain', chain: 'six_flags' },
  { pattern: /great\s*adventure/i, name: 'Six Flags Great Adventure', chain: 'six_flags' },
  { pattern: /fiesta\s*texas/i, name: 'Six Flags Fiesta Texas', chain: 'six_flags' },
  { pattern: /over\s*georgia/i, name: 'Six Flags Over Georgia', chain: 'six_flags' },
  { pattern: /over\s*texas/i, name: 'Six Flags Over Texas', chain: 'six_flags' },

  // SeaWorld
  { pattern: /seaworld\s*orlando/i, name: 'SeaWorld Orlando', chain: 'seaworld' },
  { pattern: /seaworld\s*san\s*diego/i, name: 'SeaWorld San Diego', chain: 'seaworld' },
  { pattern: /seaworld\s*san\s*antonio/i, name: 'SeaWorld San Antonio', chain: 'seaworld' },

  // Busch Gardens
  { pattern: /busch\s*gardens\s*tampa/i, name: 'Busch Gardens Tampa Bay', chain: 'busch_gardens' },
  { pattern: /busch\s*gardens\s*williamsburg/i, name: 'Busch Gardens Williamsburg', chain: 'busch_gardens' },
  { pattern: /bgw/i, name: 'Busch Gardens Williamsburg', chain: 'busch_gardens' },
  { pattern: /bgt/i, name: 'Busch Gardens Tampa Bay', chain: 'busch_gardens' },
];

/**
 * Pass type patterns
 */
const PASS_TYPE_PATTERNS: { pattern: RegExp; type: PassType }[] = [
  { pattern: /annual\s*pass/i, type: 'annual_pass' },
  { pattern: /season\s*pass/i, type: 'season_pass' },
  { pattern: /day\s*pass/i, type: 'day_pass' },
  { pattern: /single\s*day/i, type: 'day_pass' },
  { pattern: /multi.?day/i, type: 'multi_day' },
  { pattern: /\d+.?day/i, type: 'multi_day' },
  { pattern: /vip/i, type: 'vip' },
  { pattern: /parking/i, type: 'parking' },
  { pattern: /express/i, type: 'express' },
  { pattern: /lightning\s*lane/i, type: 'express' },
  { pattern: /genie\+/i, type: 'express' },
  { pattern: /fast\s*pass/i, type: 'express' },
];

/**
 * Date extraction patterns
 */
const DATE_PATTERNS = [
  // ISO format: 2024-12-25
  /(\d{4})-(\d{2})-(\d{2})/,
  // US format: 12/25/2024 or 12-25-2024
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
  // Written format: Dec 25, 2024 or December 25, 2024
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{1,2}),?\s*(\d{4})/i,
];

/**
 * Detect park chain from QR data
 */
function detectParkChain(data: string): ParkChain | null {
  for (const [chain, patterns] of Object.entries(PARK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(data)) {
        return chain as ParkChain;
      }
    }
  }
  return null;
}

/**
 * Detect specific park name from QR data
 */
function detectParkName(data: string): { name: string; chain: ParkChain } | null {
  for (const { pattern, name, chain } of PARK_NAME_PATTERNS) {
    if (pattern.test(data)) {
      return { name, chain };
    }
  }
  return null;
}

/**
 * Detect pass type from QR data
 */
function detectPassType(data: string): PassType | null {
  for (const { pattern, type } of PASS_TYPE_PATTERNS) {
    if (pattern.test(data)) {
      return type;
    }
  }
  return null;
}

/**
 * Extract dates from QR data
 */
function extractDates(data: string): { validFrom: string | null; validUntil: string | null } {
  const dates: Date[] = [];

  for (const pattern of DATE_PATTERNS) {
    const matches = data.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      let date: Date | null = null;

      if (match[0].includes('-') && match[1].length === 4) {
        // ISO format: 2024-12-25
        date = new Date(match[0]);
      } else if (match[3] && match[3].length === 4) {
        // US format or written format
        const monthNames: Record<string, number> = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };

        const monthStr = match[1].toLowerCase().slice(0, 3);
        if (monthNames[monthStr] !== undefined) {
          // Written format
          date = new Date(parseInt(match[3]), monthNames[monthStr], parseInt(match[2]));
        } else {
          // US format: MM/DD/YYYY
          date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      }

      if (date && !isNaN(date.getTime())) {
        dates.push(date);
      }
    }
  }

  // Sort dates and pick first as validFrom, last as validUntil
  dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    validFrom: dates[0]?.toISOString().split('T')[0] || null,
    validUntil: dates[dates.length - 1]?.toISOString().split('T')[0] || null,
  };
}

/**
 * Extract passholder name (very limited - most tickets don't include this in QR)
 */
function extractPassholder(data: string): string | null {
  // Look for name patterns (Name: John Doe, Guest: Jane Smith, etc.)
  const patterns = [
    /(?:name|guest|passholder)[\s:]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /(?:name|guest|passholder)[\s:]+([A-Z]+\s+[A-Z]+)/i,
  ];

  for (const pattern of patterns) {
    const match = data.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Calculate detection confidence based on how much was found
 */
function calculateConfidence(result: Partial<DetectionResult>): 'high' | 'medium' | 'low' {
  let score = 0;

  if (result.parkChain) score += 2;
  if (result.parkName) score += 2;
  if (result.passType) score += 1;
  if (result.validFrom) score += 1;
  if (result.validUntil) score += 1;
  if (result.passholder) score += 1;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Determine which fields are missing and need manual entry
 */
function getMissingFields(result: Partial<DetectionResult>): (keyof Ticket)[] {
  const missing: (keyof Ticket)[] = [];

  if (!result.parkName) missing.push('parkName');
  if (!result.passType) missing.push('passType');
  if (!result.validFrom) missing.push('validFrom');
  if (!result.validUntil) missing.push('validUntil');

  return missing;
}

/**
 * Main detection function
 * Analyzes QR data and returns detected information
 */
export function detectFromQRData(rawData: string): DetectionResult {
  // Try to detect park name first (more specific)
  const parkNameResult = detectParkName(rawData);

  // Fall back to chain detection
  const parkChain = parkNameResult?.chain || detectParkChain(rawData);

  // Detect other fields
  const passType = detectPassType(rawData);
  const { validFrom, validUntil } = extractDates(rawData);
  const passholder = extractPassholder(rawData);

  const result: DetectionResult = {
    parkName: parkNameResult?.name || null,
    parkChain,
    passType,
    validFrom,
    validUntil,
    passholder,
    confidence: 'low',
    missingFields: [],
  };

  result.confidence = calculateConfidence(result);
  result.missingFields = getMissingFields(result);

  return result;
}

/**
 * Generate a generic park name from chain if specific name not detected
 */
export function getGenericParkName(chain: ParkChain | null): string {
  switch (chain) {
    case 'disney':
      return 'Disney Park';
    case 'universal':
      return 'Universal Park';
    case 'cedar_fair':
      return 'Cedar Fair Park';
    case 'six_flags':
      return 'Six Flags Park';
    case 'seaworld':
      return 'SeaWorld Park';
    case 'busch_gardens':
      return 'Busch Gardens';
    default:
      return 'Theme Park Ticket';
  }
}

/**
 * Get today's date in ISO format
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date one year from now in ISO format (for season passes)
 */
export function getOneYearFromNowISO(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * Create default ticket data from detection result
 * Fills in reasonable defaults for missing fields
 */
export function createDefaultTicketData(
  qrData: string,
  detection: DetectionResult
): Omit<Ticket, 'id' | 'addedAt' | 'isDefault'> {
  const now = getTodayISO();
  const oneYearFromNow = getOneYearFromNowISO();

  return {
    parkName: detection.parkName || getGenericParkName(detection.parkChain),
    parkChain: detection.parkChain || 'other',
    passType: detection.passType || 'unknown',
    passholder: detection.passholder || undefined,
    validFrom: detection.validFrom || now,
    validUntil: detection.validUntil || oneYearFromNow,
    qrData,
    qrFormat: 'QR_CODE',
    status: 'active',
    autoDetected: detection.confidence !== 'low',
    manualOverrides: [],
  };
}
