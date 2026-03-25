// ============================================
// Parkle — Types & Constants
// ============================================

export interface ParklePark {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  coasterCount: number;
  owner?: string;
}

export type ComparisonResult = 'correct' | 'close' | 'wrong';
export type Direction = 'higher' | 'lower' | null;

export interface GridAttributeDefinition {
  key: keyof ParklePark;
  label: string;
  row: number;
  col: number;
  numeric: boolean;
  unit: string;
}

export const GRID_ATTRIBUTES: GridAttributeDefinition[] = [
  { key: 'coasterCount', label: 'Coasters', row: 0, col: 0, numeric: true, unit: '' },
  { key: 'country', label: 'Country', row: 0, col: 1, numeric: false, unit: '' },
  { key: 'region', label: 'Region', row: 0, col: 2, numeric: false, unit: '' },
  { key: 'city', label: 'City', row: 1, col: 0, numeric: false, unit: '' },
  { key: 'owner', label: 'Owner', row: 1, col: 1, numeric: false, unit: '' },
  { key: 'name', label: 'Name', row: 1, col: 2, numeric: false, unit: '' },
];

export interface CellComparison {
  key: keyof ParklePark;
  label: string;
  displayValue: string;
  result: ComparisonResult;
  direction: Direction;
  row: number;
  col: number;
}

export interface ParkleGuess {
  park: ParklePark;
  cells: CellComparison[];
  isCorrect: boolean;
}

export type HintType = 'first_letter' | 'country_pattern' | 'coaster_count' | 'owner' | 'region' | 'notable_ride';

export interface HintReveal {
  afterGuess: number;
  hintType: HintType;
  label: string;
  value: string;
}

export type GameMode = 'daily' | 'practice';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface ParkleGameState {
  mode: GameMode;
  target: ParklePark;
  guesses: ParkleGuess[];
  hints: HintReveal[];
  status: GameStatus;
  dailyPuzzleNumber?: number;
  dailyDate?: string;
}

export interface ParkleStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  recentGames: { won: boolean; guesses: number }[];
}

export const MAX_GUESSES = 7;
export const HINT_GUESSES = [3, 6];

export const COMPARISON_THRESHOLDS: Record<string, number> = {
  coasterCount: 5,
};
