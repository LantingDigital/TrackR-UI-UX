// ─── Speed Sorter Types ────────────────────────────────────

export type SortCategory = 'speed' | 'height' | 'length' | 'inversions' | 'year';

export interface SpeedSorterCoaster {
  id: string;
  name: string;
  park: string;
  value: number; // the stat value used for sorting
}

export interface SpeedSorterRound {
  category: SortCategory;
  categoryLabel: string;
  unit: string;
  coasters: SpeedSorterCoaster[];
  correctOrder: string[]; // coaster IDs in correct descending order
}

export interface SpeedSorterGameState {
  status: 'idle' | 'playing' | 'checking' | 'results';
  rounds: SpeedSorterRound[];
  currentRoundIndex: number;
  userOrder: string[]; // coaster IDs in user's current order
  roundScores: number[]; // % accuracy per round
  roundTimes: number[]; // ms per round
  totalScore: number;
  totalTime: number; // total ms across all rounds
  roundStartTime: number; // timestamp when current round started
}

export interface SpeedSorterStats {
  gamesPlayed: number;
  bestScore: number;
  bestTime: number; // best total time in ms (0 = never played)
  totalRounds: number;
  perfectRounds: number;
}
