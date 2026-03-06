// ─── Blind Ranking Types ───────────────────────────────────
//
// Personal preference ranking game. You see items one at a time
// and place them 1-10 in YOUR order — no right/wrong answers.
// At the end, see how your ranking compares to the community's.

export interface BlindRankingCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface BlindRankingItem {
  id: string;
  name: string;
  subtitle: string;
  communityRank?: number; // optional — shown at results for comparison
}

export interface BlindRankingGameState {
  status: 'category_select' | 'playing' | 'results';
  category: BlindRankingCategory | null;
  items: BlindRankingItem[]; // shuffled reveal order
  currentItemIndex: number;
  slots: (BlindRankingItem | null)[]; // 10 slots, user's ranking
  revealedItem: BlindRankingItem | null;
}

export interface BlindRankingStats {
  gamesPlayed: number;
  categoryPlays: Record<string, number>;
}
