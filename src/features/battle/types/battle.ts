// ============================================
// Battle Mode — Types
// ============================================

export type BattlePreference =
  | 'strong_a'
  | 'slight_a'
  | 'tie'
  | 'slight_b'
  | 'strong_b'
  | 'skip';

export interface BattleResult {
  coasterA: string; // coaster ID
  coasterB: string;
  preference: BattlePreference;
  timestamp: number;
}

export interface BattleState {
  currentRound: number;
  totalRounds: number;
  results: BattleResult[];
  matchups: [string, string][]; // pre-generated pairs
  isComplete: boolean;
}

export interface BattleCoasterStats {
  id: string;
  name: string;
  park: string;
  wins: number;
  losses: number;
  ties: number;
  battles: number;
  winRate: number;
}

export interface BattleInsight {
  label: string;
  value: string;
}
