/**
 * Rankings Sync — Firestore → Zustand
 *
 * Read-only sync for community-aggregated rankings.
 * Rankings are pre-computed by a scheduled Cloud Function.
 * The client only reads — never writes.
 *
 * Collection: rankings/{category}_{timeWindow}
 */

import firestore from '@react-native-firebase/firestore';
import { _rankingsStoreInternal } from '../../features/community/stores/rankingsStore';
import { RankingsDoc } from '../../types/firestore';
import type { RankingCategory, CommunityRankingEntry } from '../../features/community/types/community';

// ============================================
// Collection Ref
// ============================================

const rankingsRef = () => firestore().collection('rankings');

// ============================================
// Category Metadata
// ============================================

const CATEGORY_META: Record<string, { title: string; icon: string; color: string }> = {
  overall: { title: 'Overall', icon: 'trophy', color: '#CF6769' },
  airtime: { title: 'Airtime', icon: 'arrow-up-outline', color: '#4ECDC4' },
  intensity: { title: 'Intensity', icon: 'flash-outline', color: '#FF6B6B' },
  smoothness: { title: 'Smoothness', icon: 'water-outline', color: '#45B7D1' },
  theming: { title: 'Theming', icon: 'color-palette-outline', color: '#96CEB4' },
  pacing: { title: 'Pacing', icon: 'speedometer-outline', color: '#FFEAA7' },
};

// ============================================
// Conversion
// ============================================

function rankingsDocToCategory(doc: RankingsDoc): RankingCategory {
  const meta = CATEGORY_META[doc.category] ?? {
    title: doc.category,
    icon: 'list-outline',
    color: '#999999',
  };

  const entries: CommunityRankingEntry[] = doc.entries.map((e) => ({
    coasterId: e.coasterId,
    coasterName: e.coasterName,
    parkName: e.parkName,
    averageScore: e.averageScore / 10, // Convert 0-100 → 1.0-10.0
    totalRatings: e.totalRatings,
    rankChange: e.rankChange,
  }));

  return {
    id: doc.category,
    title: meta.title,
    criterion: doc.category,
    icon: meta.icon,
    color: meta.color,
    entries,
  };
}

// ============================================
// Listener
// ============================================

/**
 * Start real-time sync for community rankings.
 * Listens to all 'all-time' ranking docs (one per category).
 */
function startRankingsSync(): () => void {
  const unsub = rankingsRef()
    .where('timeWindow', '==', 'all-time')
    .onSnapshot(
      (snapshot) => {
        const categories: RankingCategory[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as RankingsDoc;
          categories.push(rankingsDocToCategory(data));
        });

        // Sort by a consistent order
        const order = ['overall', 'airtime', 'intensity', 'smoothness', 'theming', 'pacing'];
        categories.sort((a, b) => {
          const aIdx = order.indexOf(a.criterion);
          const bIdx = order.indexOf(b.criterion);
          return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });

        _rankingsStoreInternal.getState()._setCategories(categories);
      },
      (error) => {
        console.error('[RankingsSync] Snapshot error:', error);
      },
    );

  return unsub;
}

// ============================================
// Exports
// ============================================

export { startRankingsSync };
