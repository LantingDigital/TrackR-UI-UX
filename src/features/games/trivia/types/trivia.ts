// ─── Trivia Types ──────────────────────────────────────────

export type TriviaCategory = 'parks' | 'coasters' | 'manufacturers' | 'history';

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  question: string;
  answers: string[]; // 4 options, index 0 is correct (shuffled at runtime)
  correctIndex: number; // index after shuffling (set at runtime)
}

export interface TriviaGameState {
  status: 'idle' | 'playing' | 'results';
  questions: TriviaQuestion[];
  currentIndex: number;
  selectedAnswer: number | null; // index of selected answer
  isRevealed: boolean;
  score: number;
  streak: number;
  answers: { questionId: string; correct: boolean }[];
}

export interface TriviaStats {
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  categoryBreakdown: Record<TriviaCategory, { correct: number; total: number }>;
}
