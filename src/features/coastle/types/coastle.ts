// ============================================
// Coastle — Types & Constants
// ============================================

export interface CoastleCoaster {
  id: string;
  name: string;
  park: string;
  country: string;
  continent: string;
  manufacturer: string;
  material: 'Wood' | 'Steel' | 'Hybrid';
  type: string;
  heightFt: number;
  speedMph: number;
  lengthFt: number;
  inversions: number;
  yearOpened: number;
}

export type ComparisonResult = 'correct' | 'close' | 'wrong';
export type Direction = 'higher' | 'lower' | null;

export interface GridAttributeDefinition {
  key: keyof CoastleCoaster;
  label: string;
  row: number;
  col: number;
  numeric: boolean;
  unit: string;
}

export const GRID_ATTRIBUTES: GridAttributeDefinition[] = [
  { key: 'heightFt', label: 'Height', row: 0, col: 0, numeric: true, unit: 'ft' },
  { key: 'speedMph', label: 'Speed', row: 0, col: 1, numeric: true, unit: 'mph' },
  { key: 'lengthFt', label: 'Length', row: 0, col: 2, numeric: true, unit: 'ft' },
  { key: 'inversions', label: 'Inversions', row: 1, col: 0, numeric: true, unit: '' },
  { key: 'yearOpened', label: 'Year', row: 1, col: 1, numeric: true, unit: '' },
  { key: 'country', label: 'Country', row: 1, col: 2, numeric: false, unit: '' },
  { key: 'manufacturer', label: 'Maker', row: 2, col: 0, numeric: false, unit: '' },
  { key: 'material', label: 'Material', row: 2, col: 1, numeric: false, unit: '' },
  { key: 'type', label: 'Type', row: 2, col: 2, numeric: false, unit: '' },
];

export interface CellComparison {
  key: keyof CoastleCoaster;
  label: string;
  displayValue: string;
  result: ComparisonResult;
  direction: Direction;
  row: number;
  col: number;
}

export interface CoastleGuess {
  coaster: CoastleCoaster;
  cells: CellComparison[];
  isCorrect: boolean;
}

export interface HintReveal {
  afterGuess: number;
  attributeKey: keyof CoastleCoaster;
  label: string;
  value: string;
}

export type GameMode = 'daily' | 'practice';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface CoastleGameState {
  mode: GameMode;
  target: CoastleCoaster;
  guesses: CoastleGuess[];
  hints: HintReveal[];
  status: GameStatus;
  dailyPuzzleNumber?: number;
  dailyDate?: string;
}

export interface CoastleStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}

export const MAX_GUESSES = 7;
export const HINT_GUESSES = [3, 6];

export const COMPARISON_THRESHOLDS: Record<string, number> = {
  heightFt: 50,
  speedMph: 10,
  lengthFt: 500,
  inversions: 1,
  yearOpened: 5,
};
