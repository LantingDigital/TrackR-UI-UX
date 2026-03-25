import {
  ParklePark,
  CellComparison,
  ComparisonResult,
  Direction,
  GRID_ATTRIBUTES,
  COMPARISON_THRESHOLDS,
  ParkleGuess,
  HintReveal,
} from '../types/parkle';
import { PARK_DATABASE, DAILY_ANSWER_POOL } from './parkleDatabase';

// Region mapping for "close" comparison on Country
const COUNTRY_TO_REGION: Record<string, string> = {};
PARK_DATABASE.forEach((p) => {
  COUNTRY_TO_REGION[p.country] = p.region;
});

/** Compare a single attribute between guess and target */
function compareAttribute(
  key: keyof ParklePark,
  guessValue: any,
  targetValue: any,
): { result: ComparisonResult; direction: Direction } {
  // Exact match
  if (guessValue === targetValue) {
    return { result: 'correct', direction: null };
  }

  // Numeric attributes
  const threshold = COMPARISON_THRESHOLDS[key];
  if (threshold !== undefined) {
    const diff = Math.abs(Number(guessValue) - Number(targetValue));
    const direction: Direction = Number(guessValue) < Number(targetValue) ? 'higher' : 'lower';
    if (diff <= threshold) {
      return { result: 'close', direction };
    }
    return { result: 'wrong', direction };
  }

  // Country — same region = close
  if (key === 'country') {
    const guessRegion = COUNTRY_TO_REGION[guessValue as string] || guessValue;
    const targetRegion = COUNTRY_TO_REGION[targetValue as string] || targetValue;
    if (guessRegion === targetRegion) {
      return { result: 'close', direction: null };
    }
    return { result: 'wrong', direction: null };
  }

  // Region — no "close" for region (exact match only, already handled)
  // City, Owner, Name — exact only
  return { result: 'wrong', direction: null };
}

/** Format display value */
function formatDisplayValue(key: keyof ParklePark, value: any, unit: string): string {
  if (value == null || value === '') return '?';
  if (unit) return `${value} ${unit}`;
  return String(value);
}

/** Compare a guess against the target, returning CellComparisons */
export function compareGuess(guess: ParklePark, target: ParklePark): CellComparison[] {
  return GRID_ATTRIBUTES.map((attr) => {
    const guessValue = guess[attr.key];
    const targetValue = target[attr.key];
    const { result, direction } = compareAttribute(attr.key, guessValue, targetValue);

    return {
      key: attr.key,
      label: attr.label,
      displayValue: formatDisplayValue(attr.key, guessValue, attr.unit),
      result,
      direction,
      row: attr.row,
      col: attr.col,
    };
  });
}

/** Create a full ParkleGuess */
export function createGuess(guess: ParklePark, target: ParklePark): ParkleGuess {
  const cells = compareGuess(guess, target);
  const isCorrect = guess.id === target.id;
  return { park: guess, cells, isCorrect };
}

// Easy pool: major parks with 10+ coasters (well-known)
const EASY_POOL: string[] = PARK_DATABASE
  .filter((p) => p.coasterCount >= 10)
  .map((p) => p.id);

/** Deterministic daily park selection based on date and difficulty */
export function getDailyPark(date?: Date, difficulty: 'easy' | 'hard' = 'easy'): ParklePark {
  const d = date || new Date();
  const dateStr = `parkle-${difficulty}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const pool = difficulty === 'easy' ? EASY_POOL : DAILY_ANSWER_POOL;
  const index = Math.abs(hash) % pool.length;
  const id = pool[index];
  return PARK_DATABASE.find((p) => p.id === id) || PARK_DATABASE[0];
}

/** Get puzzle number since epoch (Jan 1 2025) */
export function getDailyPuzzleNumber(date?: Date): number {
  const d = date || new Date();
  const epoch = new Date(2025, 0, 1);
  const diffTime = d.getTime() - epoch.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/** Get a random park from the database */
export function getRandomPark(excludeId?: string): ParklePark {
  const pool = excludeId
    ? PARK_DATABASE.filter((p) => p.id !== excludeId)
    : PARK_DATABASE;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Generate Parkle-specific hints */
export function generateHint(
  target: ParklePark,
  guesses: ParkleGuess[],
): HintReveal | null {
  const guessCount = guesses.length;

  if (guessCount === 3) {
    // Hint 1: First letter of the park name
    return {
      afterGuess: guessCount,
      hintType: 'first_letter',
      label: 'First letter of the park name',
      value: target.name[0].toUpperCase(),
    };
  }

  if (guessCount === 6) {
    // Hint 2: First letter of country with underscores
    const countryPattern = target.country
      .split(' ')
      .map((word) => word[0].toUpperCase() + '_'.repeat(Math.max(0, word.length - 1)))
      .join(' ');
    return {
      afterGuess: guessCount,
      hintType: 'country_pattern',
      label: 'Country pattern',
      value: countryPattern,
    };
  }

  return null;
}
