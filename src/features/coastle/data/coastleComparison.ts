import {
  CoastleCoaster,
  CellComparison,
  ComparisonResult,
  Direction,
  GRID_ATTRIBUTES,
  COMPARISON_THRESHOLDS,
  CoastleGuess,
  HintReveal,
} from '../types/coastle';
import { COASTER_DATABASE, DAILY_ANSWER_POOL } from './coastleDatabase';

// Continent mapping for "close" comparison on Country
const COUNTRY_TO_CONTINENT: Record<string, string> = {};
COASTER_DATABASE.forEach((c) => {
  COUNTRY_TO_CONTINENT[c.country] = c.continent;
});

/** Compare a single attribute between guess and target */
function compareAttribute(
  key: keyof CoastleCoaster,
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

  // Country — same continent = close
  if (key === 'country') {
    const guessCont = COUNTRY_TO_CONTINENT[guessValue as string] || guessValue;
    const targetCont = COUNTRY_TO_CONTINENT[targetValue as string] || targetValue;
    if (guessCont === targetCont) {
      return { result: 'close', direction: null };
    }
    return { result: 'wrong', direction: null };
  }

  // Manufacturer, Material, Type — exact only
  return { result: 'wrong', direction: null };
}

/** Format display value with unit */
function formatDisplayValue(key: keyof CoastleCoaster, value: any, unit: string): string {
  if (key === 'inversions' && value === 0) return '0';
  if (unit) return `${value} ${unit}`;
  return String(value);
}

/** Compare a guess against the target, returning 9 CellComparisons */
export function compareGuess(guess: CoastleCoaster, target: CoastleCoaster): CellComparison[] {
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

/** Create a full CoastleGuess from a coaster guess against target */
export function createGuess(guess: CoastleCoaster, target: CoastleCoaster): CoastleGuess {
  const cells = compareGuess(guess, target);
  const isCorrect = cells.every((c) => c.result === 'correct');
  return { coaster: guess, cells, isCorrect };
}

/** Deterministic daily coaster selection based on date */
export function getDailyCoaster(date?: Date): CoastleCoaster {
  const d = date || new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % DAILY_ANSWER_POOL.length;
  const id = DAILY_ANSWER_POOL[index];
  return COASTER_DATABASE.find((c) => c.id === id) || COASTER_DATABASE[0];
}

/** Get puzzle number since epoch (Jan 1 2025) */
export function getDailyPuzzleNumber(date?: Date): number {
  const d = date || new Date();
  const epoch = new Date(2025, 0, 1);
  const diffTime = d.getTime() - epoch.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/** Get a random coaster from the full database */
export function getRandomCoaster(excludeId?: string): CoastleCoaster {
  const pool = excludeId
    ? COASTER_DATABASE.filter((c) => c.id !== excludeId)
    : COASTER_DATABASE;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Generate a hint — reveals one correct attribute the player hasn't found yet */
export function generateHint(
  target: CoastleCoaster,
  guesses: CoastleGuess[],
): HintReveal | null {
  // Collect all attributes already correct in any guess
  const correctKeys = new Set<string>();
  guesses.forEach((g) => {
    g.cells.forEach((c) => {
      if (c.result === 'correct') correctKeys.add(c.key);
    });
  });

  // Find attributes not yet correct
  const uncorrect = GRID_ATTRIBUTES.filter((attr) => !correctKeys.has(attr.key));
  if (uncorrect.length === 0) return null;

  // Pick a random un-guessed attribute
  const attr = uncorrect[Math.floor(Math.random() * uncorrect.length)];
  const value = target[attr.key];

  return {
    afterGuess: guesses.length,
    attributeKey: attr.key,
    label: attr.label,
    value: formatDisplayValue(attr.key, value, attr.unit),
  };
}
