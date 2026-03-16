# Community Games (Play Tab) -- v1 Backend Audit

## Decisions Made (2026-03-11)

- **Game stats persist to Firestore** — confirmed as v1 scope (not optional). High scores, streaks, and games played survive app restarts.
- **Full game history visible.** Users can see their past game results, not just current session.
- **"New Game" button instead of auto-reset.** Games don't auto-restart on completion. User explicitly starts a new game.
- **Server-side daily Coastle.** Same coaster for all users. Cloud Function sets the daily coaster at midnight. Creates shared social experience ("did you get today's Coastle?").
- **Server-driven weekly challenges.** Challenge definitions stored in Firestore. Cloud Function rotates challenges weekly. Manageable from Firebase console or admin dashboard.
- **Scores feed into public leaderboards.** Game scores are system-verified (can't be faked), so game leaderboards are public. Ride stat leaderboards remain friends-only (self-reported).

---

## Screens/Components Covered
- CommunityPlayTab.tsx (L1-832) -- Play hub: featured game, carousel, weekly challenge
- CoastleScreen.tsx (L1-396) -- Wordle-style coaster guessing game
- TriviaScreen.tsx (L1-584) -- 10-question trivia game
- SpeedSorterScreen.tsx (L1-677) -- Drag-to-reorder speed sorting game
- BlindRankingScreen.tsx (L1-674) -- Personal preference ranking game
- BattleScreen.tsx (L1-201) -- Head-to-head coaster comparison game
- data/mockCommunityData.ts -- MOCK_GAMES (5 games), MOCK_COASTLE_STATS

## Current Data Sources
- Game list: `MOCK_GAMES` from `data/mockCommunityData.ts` (5 games: coastle, speed-sorter, blind-ranking, trivia, coaster-clash)
- Coastle stats: `MOCK_COASTLE_STATS` (hardcoded streak/winRate/gamesPlayed)
- Coastle game state: `coastleStore` (in-memory, local only)
- Trivia questions: bundled question bank (local)
- SpeedSorter coaster data: `COASTER_DATABASE` (bundled static)
- BlindRanking categories/items: bundled static data
- Battle coaster pairs: bundled static data
- Weekly challenge: hardcoded in CommunityPlayTab (1/4 progress, static)
- All games are **single-player, offline, no backend needed for core gameplay**

## Interaction Inventory
| # | Element | Location | Current Behavior | Required v1 Behavior | Backend Need |
|---|---------|----------|-----------------|---------------------|--------------|
| 1 | Featured game card press | CommunityPlayTab L195-200 | Navigates to featured game screen | Same | None |
| 2 | Carousel game card press | CommunityPlayTab L271-276 | Navigates to game screen | Same | None |
| 3 | Coaster Clash card press | CommunityPlayTab ~L270 | No-op (placeholder) | Navigate to BattleScreen or "coming soon" | None |
| 4 | Weekly challenge card | CommunityPlayTab ~L350 | Static display (1/4 progress) | Track real progress | Optional: users/{userId}/challenges |
| 5 | Coastle: search/guess input | CoastleScreen L157-173 | Submits guess to coastleStore | Same (local) | None |
| 6 | Coastle: hint button | CoastleScreen L176-179 | Opens hint morph panel | Same | None |
| 7 | Coastle: hint morph open/close | CoastleScreen ~L180 | MorphingPill animation | Same | None |
| 8 | Coastle: result card show | CoastleScreen L105-123 | Shows win/lose card | Same | None |
| 9 | Coastle: result card dismiss | CoastleScreen L105-123 | Dismisses result card | Same | None |
| 10 | Coastle: play again | CoastleScreen L134-155 | Resets game state | Same | None |
| 11 | Coastle: close/back | CoastleScreen L125-128 | Navigates back | Same | None |
| 12 | Coastle: grid carousel swipe | CoastleScreen ~L250 | Swipes between guess rows | Same | None |
| 13 | Coastle: page dots | CoastleScreen ~L280 | Indicates current guess row | Same | None |
| 14 | Trivia: answer button (x4) | TriviaScreen L329-339 | Selects answer, shows correct/wrong | Same | None |
| 15 | Trivia: next button | TriviaScreen L355-361 | Advances to next question | Same | None |
| 16 | Trivia: play again | TriviaScreen L195 | Resets game | Same | None |
| 17 | Trivia: done/close | TriviaScreen L199, L275-279 | Navigates back | Same | None |
| 18 | SpeedSorter: drag card | SpeedSorterScreen L117-141 | Pan gesture reorders cards | Same | None |
| 19 | SpeedSorter: submit button | SpeedSorterScreen L393 | Checks order, scores round | Same | None |
| 20 | SpeedSorter: next round | SpeedSorterScreen L406 | Loads next set of 5 coasters | Same | None |
| 21 | SpeedSorter: play again | SpeedSorterScreen L299 | Resets all 5 rounds | Same | None |
| 22 | SpeedSorter: done | SpeedSorterScreen L302 | Navigates back | Same | None |
| 23 | BlindRanking: category card (x?) | BlindRankingScreen L69-79 | Selects category, loads items | Same | None |
| 24 | BlindRanking: slot tap | BlindRankingScreen L107-128 | Places item in ranking slot | Same | None |
| 25 | BlindRanking: play again | BlindRankingScreen L280 | Resets game | Same | None |
| 26 | BlindRanking: done | BlindRankingScreen L283 | Navigates back | Same | None |
| 27 | Battle: preference selector | BattleScreen L127-131 | Picks winner of pair | Same | None |
| 28 | Battle: play again | BattleScreen L77-79 | Loads new coaster pair | Same | None |
| 29 | Battle: done | BattleScreen L80-83 | Navigates back | Same | None |
| 30 | Battle: close | BattleScreen L90-98 | Navigates back | Same | None |

## Backend Needs (Minimal for v1)
Games are single-player offline. No backend required for core gameplay. However, these optional enhancements would use backend:

### Optional v1 Enhancements
- `users/{userId}/gameStats/{gameId}` -- Persist high scores, streaks, games played per game
- `users/{userId}/challenges/{challengeId}` -- Weekly challenge progress tracking
- `leaderboards/{gameId}` -- Global leaderboards (top scores across all users)

### Cloud Functions (Optional)
- `getWeeklyChallenge` -- Returns current week's challenge definition
- `submitGameScore(gameId, score)` -- Persists score, updates leaderboard
- `getLeaderboard(gameId, limit)` -- Returns top-N scores

## Data Flow: Current vs Required
- **Current:** CommunityPlayTab renders MOCK_GAMES list. Featured game rotates daily (client-side logic). Each game screen is self-contained: loads static data, runs game loop in local state, shows results. No persistence -- scores/streaks reset on app restart.
- **Required (v1 minimum):** Same as current. Games work offline. No backend needed for core gameplay.
- **Required (v1 nice-to-have):** Persist Coastle streak and stats to Firestore so they survive app restart. Weekly challenge progress synced. Game stats visible on profile.

## Games Status Summary
| Game | Screen | Playable | Backend Need | Notes |
|------|--------|----------|-------------|-------|
| Coastle | CoastleScreen | Yes, full game loop | Optional (persist streak) | Daily puzzle, Wordle-style |
| Trivia | TriviaScreen | Yes, full game loop | Optional (persist high score) | 10 questions per round |
| Speed Sorter | SpeedSorterScreen | Yes, full game loop | Optional (persist scores) | 5 rounds x 5 coasters |
| Blind Ranking | BlindRankingScreen | Yes, full game loop | Optional (persist results) | Category-based preference |
| Coaster Clash | BattleScreen | Yes, full game loop | Optional (aggregate preferences) | Head-to-head comparison |

## Open Questions
- Should game stats persist across sessions? (Currently lost on restart)
- Weekly challenge: static definition or server-driven (so it updates weekly)?
- Leaderboards: global, friends-only, or both?
- Should Coastle daily puzzle use a server-side word (consistent for all users) or client-generated?
- Coaster Clash: could aggregate all users' preferences into community rankings -- worth building?
- Any new games planned for v1, or are the current 5 the final roster?
