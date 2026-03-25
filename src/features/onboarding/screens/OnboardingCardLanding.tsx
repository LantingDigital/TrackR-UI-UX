import React, { useEffect, useRef, useCallback, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable, Platform, Image } from 'react-native';
import { FadeInImage } from '../../../components/FadeInImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { shadows } from '../../../theme/shadows';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { Player } from 'expo-ahap';

// ── Core Haptics: Card cascade rainfall ──
// Continuous haptic that swells as cards appear, peaks at hero landing, tapers off.
// Matches the visual entrance timing: ~200ms start, peak around 1100ms, tail to 1700ms.
// Card entrance timing: first card ~200ms, last card ~1430ms, last landing ~2030ms.
// AHAP covers 200ms–2100ms to blanket the full appear+land range.
const CARD_CASCADE_PLAYER = Platform.OS === 'ios' ? new Player({ Pattern: [
  // Continuous rumble — covers full entrance + landing window
  {
    Event: { Time: 0.2, EventType: 'HapticContinuous', EventDuration: 1.9, EventParameters: [
      { ParameterID: 'HapticIntensity', ParameterValue: 0.8 },
      { ParameterID: 'HapticSharpness', ParameterValue: 0.2 },
    ]},
  },
  // Intensity curve: build → peak → long gentle taper through landing phase
  {
    ParameterCurve: { ParameterID: 'HapticIntensityControl', Time: 0.2, ParameterCurveControlPoints: [
      { Time: 0, ParameterValue: 0.2 },
      { Time: 0.25, ParameterValue: 0.4 },
      { Time: 0.5, ParameterValue: 0.55 },
      { Time: 0.75, ParameterValue: 0.75 },
      { Time: 0.95, ParameterValue: 1.0 },    // peak — hero cards appearing
      { Time: 1.2, ParameterValue: 0.6 },     // still present during landings
      { Time: 1.5, ParameterValue: 0.3 },
      { Time: 1.7, ParameterValue: 0.12 },
      { Time: 1.9, ParameterValue: 0.0 },
    ]},
  },
  // Sharpness curve: deep → brighter at peak → settles back
  {
    ParameterCurve: { ParameterID: 'HapticSharpnessControl', Time: 0.2, ParameterCurveControlPoints: [
      { Time: 0, ParameterValue: -0.4 },
      { Time: 0.75, ParameterValue: 0.0 },
      { Time: 0.95, ParameterValue: 0.3 },
      { Time: 1.9, ParameterValue: -0.2 },
    ]},
  },
  // Transient raindrop hits
  { Event: { Time: 0.3, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.4 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.35 },
  ]}},
  { Event: { Time: 0.5, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.5 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.4 },
  ]}},
  { Event: { Time: 0.7, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.65 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.45 },
  ]}},
  // Hero landing — big hit
  { Event: { Time: 0.95, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 1.0 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.55 },
  ]}},
  // Settle taps during landing phase
  { Event: { Time: 1.25, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.35 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.3 },
  ]}},
  { Event: { Time: 1.55, EventType: 'HapticTransient', EventParameters: [
    { ParameterID: 'HapticIntensity', ParameterValue: 0.2 },
    { ParameterID: 'HapticSharpness', ParameterValue: 0.25 },
  ]}},
]}) : null;

const { width: SW, height: SH } = Dimensions.get('window');
const ACCENT = colors.accent.primary;

interface CardData {
  id: string; source: any; name: string; park: string;
  heightFt?: number; speedMph?: number; lengthFt?: number;
  inversions?: number; yearOpened?: number; manufacturer?: string;
}

const ALL_CARDS: CardData[] = [
  { id: 'steel-vengeance', source: require('../../../../assets/cards/steel-vengeance.webp'), name: 'Steel Vengeance', park: 'Cedar Point', heightFt: 205, speedMph: 74, lengthFt: 5740, inversions: 4, yearOpened: 2018, manufacturer: 'RMC' },
  { id: 'fury-325', source: require('../../../../assets/cards/fury-325.webp'), name: 'Fury 325', park: 'Carowinds', heightFt: 325, speedMph: 95, lengthFt: 6602, yearOpened: 2015, manufacturer: 'B&M' },
  { id: 'velocicoaster', source: require('../../../../assets/cards/jurassic-world-velocicoaster.webp'), name: 'VelociCoaster', park: 'Universal IOA', heightFt: 155, speedMph: 70, lengthFt: 4700, inversions: 4, yearOpened: 2021, manufacturer: 'Intamin' },
  { id: 'iron-gwazi', source: require('../../../../assets/cards/iron-gwazi.webp'), name: 'Iron Gwazi', park: 'Busch Gardens TB', heightFt: 206, speedMph: 76, lengthFt: 4075, inversions: 2, yearOpened: 2022, manufacturer: 'RMC' },
  { id: 'millennium-force', source: require('../../../../assets/cards/millennium-force.webp'), name: 'Millennium Force', park: 'Cedar Point', heightFt: 310, speedMph: 93, lengthFt: 6595, yearOpened: 2000, manufacturer: 'Intamin' },
  { id: 'el-toro', source: require('../../../../assets/cards/el-toro.webp'), name: 'El Toro', park: 'Six Flags GA', heightFt: 181, speedMph: 70, lengthFt: 4400, yearOpened: 2006, manufacturer: 'Intamin' },
  { id: 'maverick', source: require('../../../../assets/cards/maverick.webp'), name: 'Maverick', park: 'Cedar Point', heightFt: 105, speedMph: 70, lengthFt: 4450, inversions: 2, yearOpened: 2007, manufacturer: 'Intamin' },
  { id: 'lightning-rod', source: require('../../../../assets/cards/lightning-rod.webp'), name: 'Lightning Rod', park: 'Dollywood', heightFt: 80, speedMph: 73, lengthFt: 3800, yearOpened: 2016, manufacturer: 'RMC' },
  { id: 'diamondback', source: require('../../../../assets/cards/diamondback.webp'), name: 'Diamondback', park: 'Kings Island', heightFt: 230, speedMph: 80, lengthFt: 5282, yearOpened: 2009, manufacturer: 'B&M' },
  { id: 'copperhead-strike', source: require('../../../../assets/cards/copperhead-strike.webp'), name: 'Copperhead Strike', park: 'Carowinds', heightFt: 82, speedMph: 50, lengthFt: 3232, inversions: 5, yearOpened: 2019, manufacturer: 'Mack' },
  { id: 'expedition-everest', source: require('../../../../assets/cards/expedition-everest.webp'), name: 'Expedition Everest', park: 'Animal Kingdom', heightFt: 199, speedMph: 50, lengthFt: 4424, yearOpened: 2006, manufacturer: 'Vekoma' },
  { id: 'banshee', source: require('../../../../assets/cards/banshee.webp'), name: 'Banshee', park: 'Kings Island', heightFt: 167, speedMph: 68, lengthFt: 4124, inversions: 7, yearOpened: 2014, manufacturer: 'B&M' },
  { id: 'cheetah-hunt', source: require('../../../../assets/cards/cheetah-hunt.webp'), name: 'Cheetah Hunt', park: 'Busch Gardens TB', heightFt: 102, speedMph: 60, lengthFt: 4429, yearOpened: 2011, manufacturer: 'Intamin' },
  { id: 'candymonium', source: require('../../../../assets/cards/candymonium.webp'), name: 'Candymonium', park: 'Hersheypark', heightFt: 210, speedMph: 76, lengthFt: 4636, yearOpened: 2020, manufacturer: 'B&M' },
  { id: 'emperor', source: require('../../../../assets/cards/emperor.webp'), name: 'Emperor', park: 'SeaWorld SD', heightFt: 153, speedMph: 60, lengthFt: 2500, inversions: 4, yearOpened: 2022, manufacturer: 'B&M' },
  { id: 'apollos-chariot', source: require('../../../../assets/cards/apollos-chariot.webp'), name: "Apollo's Chariot", park: 'Busch Gardens WB', heightFt: 170, speedMph: 73, lengthFt: 4882, yearOpened: 1999, manufacturer: 'B&M' },
  { id: 'behemoth', source: require('../../../../assets/cards/behemoth.webp'), name: 'Behemoth', park: "Canada's Wonderland", heightFt: 230, speedMph: 77, lengthFt: 5318, yearOpened: 2008, manufacturer: 'B&M' },
  { id: 'fahrenheit', source: require('../../../../assets/cards/fahrenheit.webp'), name: 'Fahrenheit', park: 'Hersheypark', heightFt: 121, speedMph: 58, lengthFt: 2700, inversions: 6, yearOpened: 2008, manufacturer: 'Intamin' },
  { id: 'dominator', source: require('../../../../assets/cards/dominator.webp'), name: 'Dominator', park: 'Kings Dominion', heightFt: 157, speedMph: 65, lengthFt: 4210, inversions: 5, yearOpened: 2008, manufacturer: 'B&M' },
  { id: 'afterburn', source: require('../../../../assets/cards/afterburn.webp'), name: 'Afterburn', park: 'Carowinds', heightFt: 113, speedMph: 62, lengthFt: 2780, inversions: 7, yearOpened: 1999, manufacturer: 'B&M' },
  { id: 'alpengeist', source: require('../../../../assets/cards/alpengeist.webp'), name: 'Alpengeist', park: 'Busch Gardens WB', heightFt: 195, speedMph: 67, lengthFt: 3828, inversions: 6, yearOpened: 1997, manufacturer: 'B&M' },
  { id: 'big-bear-mountain', source: require('../../../../assets/cards/big-bear-mountain.webp'), name: 'Big Bear Mountain', park: 'Dollywood', heightFt: 66, speedMph: 48, lengthFt: 3990, yearOpened: 2023, manufacturer: 'Vekoma' },
  { id: 'electric-eel', source: require('../../../../assets/cards/electric-eel.webp'), name: 'Electric Eel', park: 'SeaWorld SD', heightFt: 150, speedMph: 62, lengthFt: 853, inversions: 1, yearOpened: 2018, manufacturer: 'Premier' },
  { id: 'arctic-rescue', source: require('../../../../assets/cards/arctic-rescue.webp'), name: 'Arctic Rescue', park: 'SeaWorld SD', heightFt: 50, speedMph: 40, lengthFt: 2800, yearOpened: 2023, manufacturer: 'Intamin' },
  { id: 'blue-fire-megacoaster', source: require('../../../../assets/cards/blue-fire-megacoaster.webp'), name: 'Blue Fire', park: 'Europa-Park', heightFt: 124, speedMph: 62, lengthFt: 3412, inversions: 4, yearOpened: 2009, manufacturer: 'Mack' },
  { id: 'eejanaika', source: require('../../../../assets/cards/eejanaika.webp'), name: 'Eejanaika', park: 'Fuji-Q Highland', heightFt: 249, speedMph: 78, lengthFt: 3901, inversions: 14, yearOpened: 2006, manufacturer: 'S&S' },
  { id: 'drachen-fire', source: require('../../../../assets/cards/drachen-fire.webp'), name: 'Drachen Fire', park: 'Busch Gardens WB', heightFt: 150, speedMph: 60, lengthFt: 3550, inversions: 5, yearOpened: 1992, manufacturer: 'Arrow' },
  { id: 'escape-from-gringotts', source: require('../../../../assets/cards/escape-from-gringotts.webp'), name: 'Escape from Gringotts', park: 'Universal Studios', heightFt: 40, speedMph: 39, lengthFt: 2000, yearOpened: 2014, manufacturer: 'Intamin' },
  { id: 'big-thunder-mountain-railroad', source: require('../../../../assets/cards/big-thunder-mountain-railroad.webp'), name: 'Big Thunder Mountain', park: 'Magic Kingdom', heightFt: 104, speedMph: 36, lengthFt: 2780, yearOpened: 1980, manufacturer: 'WED' },
  { id: 'do-dodonpa', source: require('../../../../assets/cards/do-dodonpa.webp'), name: 'Do-Dodonpa', park: 'Fuji-Q Highland', heightFt: 161, speedMph: 112, lengthFt: 3901, yearOpened: 2001, manufacturer: 'S&S' },
];

// Pre-warm image cache on module load — resolves all card assets so the
// native image decoder has them ready before any card renders. Prevents
// the "blank then pop" issue on cold start.
ALL_CARDS.forEach(card => {
  const resolved = Image.resolveAssetSource(card.source);
  if (resolved?.uri) Image.prefetch(resolved.uri).catch(() => {});
});

// ── Position pool ──
// Each position has a tier (0-4). Cards are locked to their tier permanently.
interface ScatterPos {
  xPct: number; yPct: number; w: number; h: number;
  rotation: number; opacity: number; zIndex: number; flippable: boolean;
  tier: number; // 0=micro, 1=tiny, 2=small, 3=mid, 4=front
}

const MICRO_W = 22; const MICRO_H = 31;
const TINY_W = 32;  const TINY_H = 45;
const SMALL_W = 48; const SMALL_H = 67;
const MED_W = 65;   const MED_H = 91;
const LG_W = 80;    const LG_H = 112;

// Dense position pool with tier tags. Cards are locked to their tier forever.
const P = (xPct: number, yPct: number, w: number, h: number, rotation: number, opacity: number, zIndex: number, flippable: boolean, tier: number): ScatterPos =>
  ({ xPct, yPct, w, h, rotation, opacity, zIndex, flippable, tier });

const POSITION_POOL: ScatterPos[] = [
  // Micro (tier 0, 22px) — 11 positions
  P(0.06, 0.35, MICRO_W, MICRO_H, -8,  0.22, 0, false, 0),
  P(0.94, 0.38, MICRO_W, MICRO_H, 8,   0.22, 0, false, 0),
  P(0.20, 0.82, MICRO_W, MICRO_H, -5,  0.22, 0, false, 0),
  P(0.80, 0.80, MICRO_W, MICRO_H, 5,   0.22, 0, false, 0),
  P(0.45, 0.84, MICRO_W, MICRO_H, -3,  0.20, 0, false, 0),
  P(0.15, 0.48, MICRO_W, MICRO_H, 10,  0.22, 0, false, 0),
  P(0.85, 0.46, MICRO_W, MICRO_H, -10, 0.22, 0, false, 0),
  P(0.65, 0.82, MICRO_W, MICRO_H, 6,   0.22, 0, false, 0),
  P(0.75, 0.32, MICRO_W, MICRO_H, -5,  0.22, 0, false, 0),
  P(0.60, 0.30, MICRO_W, MICRO_H, 3,   0.20, 0, false, 0),
  P(0.38, 0.30, MICRO_W, MICRO_H, -6,  0.22, 0, false, 0),
  // Tiny (tier 1, 32px) — 11 positions
  P(0.10, 0.30, TINY_W, TINY_H, -12, 0.32, 1, false, 1),
  P(0.50, 0.28, TINY_W, TINY_H, -5,  0.30, 1, false, 1),
  P(0.90, 0.31, TINY_W, TINY_H, 12,  0.32, 1, false, 1),
  P(0.30, 0.36, TINY_W, TINY_H, 5,   0.30, 1, false, 1),
  P(0.70, 0.35, TINY_W, TINY_H, -3,  0.32, 1, false, 1),
  P(0.12, 0.72, TINY_W, TINY_H, 8,   0.30, 1, false, 1),
  P(0.58, 0.74, TINY_W, TINY_H, 5,   0.32, 1, false, 1),
  P(0.82, 0.73, TINY_W, TINY_H, -8,  0.30, 1, false, 1),
  P(0.40, 0.78, TINY_W, TINY_H, -5,  0.30, 1, false, 1),
  P(0.65, 0.38, TINY_W, TINY_H, 5,   0.30, 1, false, 1),
  P(0.85, 0.40, TINY_W, TINY_H, -8,  0.32, 1, false, 1),
  // Small (tier 2, 48px) — 9 positions
  P(0.05, 0.52, SMALL_W, SMALL_H, -10, 0.42, 2, false, 2),
  P(0.95, 0.50, SMALL_W, SMALL_H, 10,  0.42, 2, false, 2),
  P(0.35, 0.76, SMALL_W, SMALL_H, -5,  0.42, 2, false, 2),
  P(0.08, 0.68, SMALL_W, SMALL_H, -3,  0.40, 2, false, 2),
  P(0.88, 0.70, SMALL_W, SMALL_H, 5,   0.42, 2, false, 2),
  P(0.50, 0.82, SMALL_W, SMALL_H, -3,  0.40, 2, false, 2),
  P(0.72, 0.78, SMALL_W, SMALL_H, 8,   0.42, 2, false, 2),
  P(0.78, 0.38, SMALL_W, SMALL_H, -5,  0.42, 2, false, 2),
  P(0.55, 0.34, SMALL_W, SMALL_H, 5,   0.40, 2, false, 2),
  // Mid (tier 3, 65px, flippable) — 11 positions
  P(0.02, 0.44, MED_W, MED_H, -5,  0.60, 3, true, 3),
  P(0.98, 0.58, MED_W, MED_H, 5,   0.60, 3, true, 3),
  P(0.26, 0.40, MED_W, MED_H, 5,   0.62, 3, true, 3),
  P(0.74, 0.42, MED_W, MED_H, -5,  0.60, 4, true, 3),
  P(0.15, 0.62, MED_W, MED_H, -12, 0.60, 3, true, 3),
  P(0.84, 0.64, MED_W, MED_H, 12,  0.62, 3, true, 3),
  P(0.40, 0.34, MED_W, MED_H, -3,  0.60, 4, true, 3),
  P(0.60, 0.68, MED_W, MED_H, 3,   0.60, 3, true, 3),
  P(0.25, 0.74, MED_W, MED_H, -8,  0.60, 3, true, 3),
  P(0.70, 0.76, MED_W, MED_H, 8,   0.60, 3, true, 3),
  P(0.62, 0.40, MED_W, MED_H, -3,  0.60, 3, true, 3),
  // Front (tier 4, 80px, heroes) — 6 positions
  P(0.50, 0.50, LG_W, LG_H, 0,  1.00, 8, true, 4),
  P(0.22, 0.51, LG_W, LG_H, -5, 0.90, 6, true, 4),
  P(0.78, 0.53, LG_W, LG_H, 5,  0.90, 6, true, 4),
  P(0.36, 0.60, LG_W, LG_H, -3, 0.90, 7, true, 4),
  P(0.64, 0.43, LG_W, LG_H, 3,  0.90, 7, true, 4),
  P(0.42, 0.42, LG_W, LG_H, -5, 0.90, 7, true, 4),
];

// Fixed card count per tier: micro=5, tiny=6, small=6, mid=7, front=5 = 29
const TIER_COUNTS = [5, 6, 6, 7, 5];
const NUM_CARDS = TIER_COUNTS.reduce((a, b) => a + b, 0); // 29

// Distance check using actual card dimensions (prevents visual overlap)
const cardDist = (a: ScatterPos, b: ScatterPos): number => {
  const dx = (a.xPct - b.xPct) * SW;
  const dy = (a.yPct - b.yPct) * SH;
  return Math.sqrt(dx * dx + dy * dy);
};
const wouldOverlap = (a: ScatterPos, b: ScatterPos): boolean => {
  const minDist = Math.max(a.h, a.w) / 2 + Math.max(b.h, b.w) / 2 + 4;
  return cardDist(a, b) < minDist;
};

// ── Grid-aware interleaved placement + gap repair ──
// Phase 1: Round-robin picks (most visible first) with grid coverage tracking.
// Phase 2: Scan for remaining white-space gaps and swap cards to fill them.
const pickInitialPositions = (): number[] => {
  const GRID_COLS = 6;
  const GRID_ROWS = 8;
  const cellOccupancy = new Array(GRID_COLS * GRID_ROWS).fill(0);
  const getCell = (xPct: number, yPct: number): number => {
    const col = Math.min(Math.floor(xPct * GRID_COLS), GRID_COLS - 1);
    const row = Math.min(Math.floor(yPct * GRID_ROWS), GRID_ROWS - 1);
    return row * GRID_COLS + col;
  };

  // Mutable position lists per tier
  const available: { p: ScatterPos; i: number }[][] = [];
  for (let t = 0; t < TIER_COUNTS.length; t++) {
    available[t] = POSITION_POOL.map((p, i) => ({ p, i })).filter(x => x.p.tier === t);
  }

  const tierResults: number[][] = Array.from({ length: TIER_COUNTS.length }, () => []);
  const remaining = [...TIER_COUNTS];
  const allPicked: number[] = [];

  // Hero cards first → background last (most visible get best spread)
  const TIER_ORDER = [4, 3, 2, 1, 0];

  // ── Phase 1: Interleaved greedy placement ──
  while (remaining.some(r => r > 0)) {
    for (const t of TIER_ORDER) {
      if (remaining[t] <= 0 || available[t].length === 0) continue;

      let bestIdx = -1;
      let bestScore = -Infinity;
      let bestAvailIdx = -1;

      for (let ai = 0; ai < available[t].length; ai++) {
        const candidate = available[t][ai];
        let overlaps = false;
        let minDist = Infinity;
        for (const r of allPicked) {
          const other = POSITION_POOL[r];
          if (wouldOverlap(candidate.p, other)) { overlaps = true; break; }
          minDist = Math.min(minDist, cardDist(candidate.p, other));
        }
        if (overlaps) continue;

        const cell = getCell(candidate.p.xPct, candidate.p.yPct);
        const cellBonus = cellOccupancy[cell] === 0 ? 50 : 0;
        const distScore = allPicked.length === 0 ? 0 : minDist;
        // ±5% jitter — enough variety, tight enough to prevent gaps
        const jitter = 1.0 + (Math.random() - 0.5) * 0.1;
        const score = (distScore + cellBonus) * jitter;

        if (score > bestScore) {
          bestScore = score;
          bestIdx = candidate.i;
          bestAvailIdx = ai;
        }
      }

      if (bestIdx < 0) {
        let fbDist = -1;
        for (let ai = 0; ai < available[t].length; ai++) {
          const c = available[t][ai];
          let minD = Infinity;
          for (const r of allPicked) {
            minD = Math.min(minD, cardDist(c.p, POSITION_POOL[r]));
          }
          if (allPicked.length === 0 || minD > fbDist) {
            fbDist = minD;
            bestIdx = c.i;
            bestAvailIdx = ai;
          }
        }
      }

      if (bestIdx >= 0 && bestAvailIdx >= 0) {
        const pos = POSITION_POOL[bestIdx];
        cellOccupancy[getCell(pos.xPct, pos.yPct)]++;
        tierResults[t].push(bestIdx);
        allPicked.push(bestIdx);
        available[t].splice(bestAvailIdx, 1);
        remaining[t]--;
      }
    }
  }

  // ── Phase 2: Gap repair ──
  // Scan the screen for white-space gaps and swap crowded cards into them.
  const usedSet = new Set(allPicked);
  const GAP_THRESHOLD = 115; // px — gaps larger than this get patched
  const MAX_REPAIRS = 4;

  for (let rep = 0; rep < MAX_REPAIRS; rep++) {
    // Sample a dense grid of points, find the one farthest from any card
    let worstX = 0, worstY = 0, worstDist = 0;
    for (let gx = 0.04; gx <= 0.96; gx += 0.04) {
      for (let gy = 0.28; gy <= 0.84; gy += 0.03) {
        let minD = Infinity;
        for (const pidx of allPicked) {
          const p = POSITION_POOL[pidx];
          const dx = (gx - p.xPct) * SW;
          const dy = (gy - p.yPct) * SH;
          minD = Math.min(minD, Math.sqrt(dx * dx + dy * dy));
        }
        if (minD > worstDist) { worstDist = minD; worstX = gx; worstY = gy; }
      }
    }
    if (worstDist < GAP_THRESHOLD) break; // no more bad gaps

    // Find the unused position closest to the gap
    let targetIdx = -1, targetDist = Infinity;
    for (let pi = 0; pi < POSITION_POOL.length; pi++) {
      if (usedSet.has(pi)) continue;
      const p = POSITION_POOL[pi];
      const dx = (worstX - p.xPct) * SW;
      const dy = (worstY - p.yPct) * SH;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < targetDist) { targetDist = d; targetIdx = pi; }
    }
    if (targetIdx < 0) break;

    // Find the most crowded card across ALL tiers — any card can fill any gap.
    // A micro card next to 3 other micros is a better donor than an isolated hero.
    let donorCard = -1, donorCrowd = Infinity;
    let donorTierArr = -1, donorTierPos = -1;
    for (let ta = 0; ta < TIER_COUNTS.length; ta++) {
      for (let ti = 0; ti < tierResults[ta].length; ti++) {
        const posIdx = tierResults[ta][ti];
        const myPos = POSITION_POOL[posIdx];
        let nearestNeighbor = Infinity;
        for (const other of allPicked) {
          if (other === posIdx) continue;
          nearestNeighbor = Math.min(nearestNeighbor, cardDist(myPos, POSITION_POOL[other]));
        }
        // Lower = more crowded = best donor candidate
        if (nearestNeighbor < donorCrowd) {
          donorCrowd = nearestNeighbor;
          donorCard = posIdx;
          donorTierArr = ta;
          donorTierPos = ti;
        }
      }
    }
    if (donorCard < 0) break;

    // Swap: donor leaves its crowded position → moves to fill the gap.
    // Card takes on the target position's tier (size/opacity/z-index).
    const oldPos = donorCard;
    usedSet.delete(oldPos);
    usedSet.add(targetIdx);
    tierResults[donorTierArr][donorTierPos] = targetIdx;
    const apIdx = allPicked.indexOf(oldPos);
    if (apIdx >= 0) allPicked[apIdx] = targetIdx;
  }

  // Return grouped by tier so card slot ↔ tier mapping is preserved
  return [
    ...tierResults[0], ...tierResults[1], ...tierResults[2],
    ...tierResults[3], ...tierResults[4],
  ];
};

// Track each card's tier (set once on init, never changes)
const getCardTier = (positions: number[]): number[] =>
  positions.map(posIdx => POSITION_POOL[posIdx].tier);

// ── Edge spheres ──
const SPHERE_SIZE = 280;
const EDGE_SPHERES = [
  { top: SH * 0.30 - SPHERE_SIZE / 2, left: -SPHERE_SIZE * 0.45 },
  { top: SH * 0.42 - SPHERE_SIZE / 2, left: SW - SPHERE_SIZE * 0.55 },
  { top: SH * 0.72 - SPHERE_SIZE / 2, left: -SPHERE_SIZE * 0.40 },
];

// ── Mini stat card back (proportional, native rendering) ──
const REF_W = 80;
const MiniStatsBack = ({ card, w, h }: { card: CardData; w: number; h: number }) => {
  const s = w / REF_W;
  const pills: { value: string; unit: string; label: string }[] = [];
  if (card.heightFt) pills.push({ value: String(card.heightFt), unit: 'ft', label: 'Height' });
  if (card.speedMph) pills.push({ value: String(card.speedMph), unit: 'mph', label: 'Speed' });
  if (card.lengthFt) pills.push({ value: card.lengthFt.toLocaleString(), unit: 'ft', label: 'Length' });
  if (card.inversions && card.inversions > 0) pills.push({ value: String(card.inversions), unit: '', label: 'Inv.' });
  if (card.yearOpened) pills.push({ value: String(card.yearOpened), unit: '', label: 'Opened' });
  const displayPills = pills.slice(0, 3);
  const details: { label: string; value: string }[] = [];
  if (card.manufacturer) details.push({ label: 'Builder', value: card.manufacturer });
  if (card.yearOpened) details.push({ label: 'Opened', value: String(card.yearOpened) });
  const metaParts: string[] = [];
  if (card.manufacturer) metaParts.push(card.manufacturer);
  if (card.yearOpened) metaParts.push(String(card.yearOpened));

  return (
    <View style={{ width: w, height: h, borderRadius: 8 * s, backgroundColor: colors.background.card, padding: 5 * s, justifyContent: 'space-between', ...shadows.small }}>
      <View>
        <Text style={{ fontSize: 10 * s, fontWeight: typography.weights.bold, color: colors.text.primary }} adjustsFontSizeToFit numberOfLines={1}>{card.name}</Text>
        <Text style={{ fontSize: 7 * s, color: colors.text.secondary, marginTop: 1 * s }} adjustsFontSizeToFit numberOfLines={1}>{card.park}</Text>
        {metaParts.length > 0 && <Text style={{ fontSize: 6 * s, color: colors.text.meta, marginTop: 1 * s }} adjustsFontSizeToFit numberOfLines={1}>{metaParts.join(' \u00B7 ')}</Text>}
      </View>
      <View style={{ flexDirection: 'row', gap: 2 * s }}>
        {displayPills.map((p, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.background.page, borderRadius: 4 * s, paddingVertical: 3 * s, paddingHorizontal: 2 * s, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 9 * s, fontWeight: typography.weights.bold, color: colors.text.primary, textAlign: 'center' }} adjustsFontSizeToFit numberOfLines={1}>
              {p.value}<Text style={{ fontSize: 6 * s, fontWeight: typography.weights.medium, color: colors.text.meta }}>{p.unit}</Text>
            </Text>
            <Text style={{ fontSize: 5 * s, fontWeight: typography.weights.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center', marginTop: 0.5 * s }} adjustsFontSizeToFit numberOfLines={1}>{p.label}</Text>
          </View>
        ))}
      </View>
      {details.length > 0 && (
        <View style={{ backgroundColor: colors.background.page, borderRadius: 4 * s, paddingHorizontal: 4 * s }}>
          {details.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2.5 * s, ...(i < details.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle } : {}) }}>
              <Text style={{ fontSize: 6 * s, color: colors.text.secondary }} adjustsFontSizeToFit numberOfLines={1}>{d.label}</Text>
              <Text style={{ fontSize: 6 * s, fontWeight: typography.weights.semibold, color: colors.text.primary }} adjustsFontSizeToFit numberOfLines={1}>{d.value}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 7 * s, fontWeight: typography.weights.bold, color: colors.text.meta, letterSpacing: -0.3 }} adjustsFontSizeToFit numberOfLines={1}>
          Track<Text style={{ color: ACCENT }}>R</Text>
        </Text>
      </View>
    </View>
  );
};

// ── Card component ──
// Non-flippable (tiers 0-2): no shadow (too small for visible lift — saves GPU)
// Flippable (tiers 3-4): shadow on OUTER wrapper, overflow:hidden on INNER (prevents clipping)
const CardView = ({ card, w, h, canFlip }: { card: CardData; w: number; h: number; canFlip: boolean }) => {
  const flipProgress = useSharedValue(0);
  const isFlipped = useRef(false);
  const prevId = useRef(card.id);
  useEffect(() => { if (prevId.current !== card.id) { prevId.current = card.id; isFlipped.current = false; flipProgress.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }); } }, [card.id]);
  const handlePress = useCallback(() => { if (!canFlip) return; haptics.select(); isFlipped.current = !isFlipped.current; flipProgress.value = withTiming(isFlipped.current ? 1 : 0, { duration: 500, easing: Easing.out(Easing.cubic) }); }, [canFlip]);
  const frontStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` }], opacity: interpolate(flipProgress.value, [0, 0.45, 0.5, 1], [1, 1, 0, 0]) }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` }], opacity: interpolate(flipProgress.value, [0, 0.5, 0.55, 1], [0, 0, 1, 1]) }));

  if (!canFlip) {
    // Tiers 0-2: no shadow, just clipped image
    return (<View style={{ width: w, height: h, borderRadius: w * 0.12, overflow: 'hidden' }}><FadeInImage source={card.source} style={{ width: w, height: h }} resizeMode="cover" skipFade /></View>);
  }
  // Tiers 3-4: shadow wrapper (no overflow:hidden) → inner clip (overflow:hidden, no shadow)
  return (
    <Pressable onPress={handlePress} style={{ width: w, height: h }}>
      <Animated.View style={[{ width: w, height: h, position: 'absolute' }, frontStyle]}>
        <View style={{ flex: 1, borderRadius: w * 0.12, ...shadows.small }}>
          <View style={{ flex: 1, borderRadius: w * 0.12, overflow: 'hidden' }}>
            <FadeInImage source={card.source} style={{ width: w, height: h }} resizeMode="cover" skipFade />
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[{ width: w, height: h, position: 'absolute' }, backStyle]} pointerEvents="none"><MiniStatsBack card={card} w={w} h={h} /></Animated.View>
    </Pressable>
  );
};

// ── Main screen ──
interface OnboardingScreenProps { isActive: boolean; }

export const OnboardingCardLanding: React.FC<OnboardingScreenProps> = ({ isActive }) => {
  const insets = useSafeAreaInsets();
  const isActiveRef = useRef(false);
  const hasPlayedOnce = useRef(false);
  const entranceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [positions, setPositions] = useState<number[]>(() => pickInitialPositions());
  const [images, setImages] = useState<number[]>(() => Array.from({ length: NUM_CARDS }, (_, i) => i));
  const positionsRef = useRef(positions);
  const imagesRef = useRef(images);
  const cardTiers = useRef<number[]>(getCardTier(positions)); // locked tier per card
  const nextImageIdx = useRef(NUM_CARDS);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { imagesRef.current = images; }, [images]);
  // Two independent queues: background (tiers 0,1,2) and foreground (tiers 3,4)
  const bgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCycled = useRef<number[]>(Array.from({ length: NUM_CARDS }, () => 0));
  const bgAnimating = useRef(false);
  const fgAnimating = useRef(false);
  const BG_TIERS = new Set([0, 1, 2]);
  const FG_TIERS = new Set([3, 4]);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(12);
  const cardAnims = useRef(Array.from({ length: NUM_CARDS }, () => ({ opacity: useSharedValue(0), scale: useSharedValue(0), cycleY: useSharedValue(0), floatX: useSharedValue(0), floatY: useSharedValue(0), floatRotate: useSharedValue(0) }))).current;
  const sphereOpacities = useRef(EDGE_SPHERES.map(() => useSharedValue(0))).current;
  const sphereAnims = useRef(EDGE_SPHERES.map(() => ({ driftX: useSharedValue(0), driftY: useSharedValue(0), pulse: useSharedValue(1) }))).current;

  // ── Shared gap-finding + card-picking logic for both queues ──
  const findBestSwap = useCallback((tierSet: Set<number>, now: number): { card: number; pos: number } | null => {
    const occupied = new Set(positionsRef.current);
    const gapCandidates: { posIdx: number; tier: number; score: number }[] = [];

    for (let pi = 0; pi < POSITION_POOL.length; pi++) {
      if (occupied.has(pi)) continue;
      const p = POSITION_POOL[pi];
      if (!tierSet.has(p.tier)) continue; // only positions in this queue's tiers
      let minD = Infinity;
      for (let ci = 0; ci < NUM_CARDS; ci++) {
        minD = Math.min(minD, cardDist(p, POSITION_POOL[positionsRef.current[ci]]));
      }
      const cx = Math.abs(p.xPct - 0.50), cy = Math.abs(p.yPct - 0.52);
      const centerWeight = Math.max(1.0 - Math.sqrt(cx * cx + cy * cy) * 1.2, 0.3);
      gapCandidates.push({ posIdx: pi, tier: p.tier, score: minD * centerWeight });
    }
    if (gapCandidates.length === 0) return null;
    gapCandidates.sort((a, b) => b.score - a.score);

    // Find a gap with a ready card in its tier.
    // Card selection: pick the card whose removal causes the LEAST white space.
    // = the card with the smallest distance to its nearest neighbor (ANY tier).
    // If it's surrounded by other cards (any size), removing it barely matters.
    for (const gap of gapCandidates) {
      let bestCard = -1, bestCrowd = Infinity;
      for (let ci = 0; ci < NUM_CARDS; ci++) {
        if (cardTiers.current[ci] !== gap.tier) continue;
        if (now - lastCycled.current[ci] < 6000) continue;
        const myPos = POSITION_POOL[positionsRef.current[ci]];
        // Distance to nearest ANY card (not just same tier)
        let nearestAny = Infinity;
        for (let oi = 0; oi < NUM_CARDS; oi++) {
          if (oi === ci) continue;
          nearestAny = Math.min(nearestAny, cardDist(myPos, POSITION_POOL[positionsRef.current[oi]]));
        }
        // Lower = more surrounded = safest to remove
        if (nearestAny < bestCrowd) { bestCrowd = nearestAny; bestCard = ci; }
      }
      if (bestCard >= 0) return { card: bestCard, pos: gap.posIdx };
    }
    return null;
  }, []);

  const doSwap = useCallback((ci: number, newPosIdx: number, now: number, animLock: React.MutableRefObject<boolean>) => {
    lastCycled.current[ci] = now;
    animLock.current = true;
    const newPos = POSITION_POOL[newPosIdx];

    // Fade out (350ms) + sink. Wait 500ms before swapping content = 150ms fully invisible buffer.
    cardAnims[ci].opacity.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) });
    cardAnims[ci].cycleY.value = withTiming(14, { duration: 350, easing: Easing.in(Easing.cubic) });

    setTimeout(() => {
      if (!isActiveRef.current) { animLock.current = false; return; }
      // Force opacity to 0 on UI thread before React re-render (prevents flash)
      cardAnims[ci].opacity.value = 0;
      // Set cycleY to rise-up start position BEFORE content swap
      cardAnims[ci].cycleY.value = 14;

      // Pick a card image not currently on screen
      const onScreen = new Set(imagesRef.current.map(idx => idx % ALL_CARDS.length));
      let newImgIdx = nextImageIdx.current % ALL_CARDS.length;
      let attempts = 0;
      while (onScreen.has(newImgIdx) && attempts < ALL_CARDS.length) {
        nextImageIdx.current++;
        newImgIdx = nextImageIdx.current % ALL_CARDS.length;
        attempts++;
      }
      nextImageIdx.current++;

      // Swap content (React re-render) — card is fully invisible (opacity=0)
      positionsRef.current = positionsRef.current.map((p, i) => i === ci ? newPosIdx : p);
      imagesRef.current = imagesRef.current.map((img, i) => i === ci ? newImgIdx : img);
      setPositions(prev => prev.map((p, i) => i === ci ? newPosIdx : p));
      setImages(prev => prev.map((img, i) => i === ci ? newImgIdx : img));

      // Wait for React to commit the new content, then fade in
      setTimeout(() => {
        if (!isActiveRef.current) { animLock.current = false; return; }
        cardAnims[ci].opacity.value = withTiming(newPos.opacity, { duration: 500, easing: Easing.out(Easing.cubic) });
        cardAnims[ci].cycleY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
        setTimeout(() => { animLock.current = false; }, 550);
      }, 80); // 80ms for React to render the new card at opacity 0
    }, 500); // 500ms wait > 350ms fade = 150ms buffer of guaranteed invisibility
  }, []);

  // ── Background queue (micro/tiny/small — tiers 0,1,2) ──
  const scheduleBg = useCallback(() => {
    const delay = 1500 + Math.random() * 1000;
    bgTimer.current = setTimeout(() => {
      if (!isActiveRef.current) return;
      if (bgAnimating.current) { scheduleBg(); return; }
      const swap = findBestSwap(BG_TIERS, Date.now());
      if (swap) doSwap(swap.card, swap.pos, Date.now(), bgAnimating);
      scheduleBg();
    }, delay);
  }, []);

  // ── Foreground queue (mid/front — tiers 3,4) ──
  const scheduleFg = useCallback(() => {
    const delay = 2000 + Math.random() * 1500; // slightly slower for bigger cards
    fgTimer.current = setTimeout(() => {
      if (!isActiveRef.current) return;
      if (fgAnimating.current) { scheduleFg(); return; }
      const swap = findBestSwap(FG_TIERS, Date.now());
      if (swap) doSwap(swap.card, swap.pos, Date.now(), fgAnimating);
      scheduleFg();
    }, delay);
  }, []);

  const startFloat = useCallback((i: number) => {
    const a = cardAnims[i];
    const xA = 2 + (i % 3) * 1.2, yA = 2.5 + ((i+1)%4), rA = 0.8 + (i%2) * 0.5;
    const xD = 3000 + i*400, yD = 2800 + ((i+2)%5)*350, rD = 3500 + i*300;
    const xDir = i%2===0?1:-1, yDir = (i+1)%2===0?1:-1, rDir = i%3===0?1:-1;
    a.floatX.value = withRepeat(withTiming(xA*xDir, { duration: xD, easing: Easing.inOut(Easing.ease) }), -1, true);
    a.floatY.value = withRepeat(withTiming(yA*yDir, { duration: yD, easing: Easing.inOut(Easing.ease) }), -1, true);
    a.floatRotate.value = withRepeat(withTiming(rA*rDir, { duration: rD, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  useEffect(() => {
    if (!isActive) {
      // ── Tear down: reset CARDS only (title, tagline, spheres persist) ──
      isActiveRef.current = false;
      if (entranceDebounce.current) { clearTimeout(entranceDebounce.current); entranceDebounce.current = null; }
      if (bgTimer.current) { clearTimeout(bgTimer.current); bgTimer.current = null; }
      if (fgTimer.current) { clearTimeout(fgTimer.current); fgTimer.current = null; }
      bgAnimating.current = false;
      fgAnimating.current = false;

      cardAnims.forEach(a => {
        cancelAnimation(a.opacity); cancelAnimation(a.scale);
        cancelAnimation(a.floatX); cancelAnimation(a.floatY); cancelAnimation(a.floatRotate);
        cancelAnimation(a.cycleY);
        a.opacity.value = 0; a.scale.value = 0; a.cycleY.value = 0;
        a.floatX.value = 0; a.floatY.value = 0; a.floatRotate.value = 0;
      });
      return;
    }

    // ── Activate: debounce 300ms to prevent rapid-scroll spam ──
    isActiveRef.current = true;
    entranceDebounce.current = setTimeout(() => {
      if (!isActiveRef.current) return;

      // Fresh layout + shuffled card images each visit
      const newPositions = pickInitialPositions();
      setPositions(newPositions);
      positionsRef.current = newPositions;
      cardTiers.current = getCardTier(newPositions);

      const shuffled = Array.from({ length: NUM_CARDS }, (_, i) =>
        (nextImageIdx.current + i) % ALL_CARDS.length
      );
      nextImageIdx.current += NUM_CARDS;
      setImages(shuffled);
      imagesRef.current = shuffled;

      // Title, tagline, and spheres only animate on the very first visit
      if (!hasPlayedOnce.current) {
        hasPlayedOnce.current = true;

        EDGE_SPHERES.forEach((_, i) => {
          sphereOpacities[i].value = withDelay(100 + i * 200,
            withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }));
          setTimeout(() => {
            if (!isActiveRef.current) return;
            sphereAnims[i].driftX.value = withRepeat(withTiming((8 + i * 3) * (i % 2 === 0 ? 1 : -1), { duration: 8000 + i * 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
            sphereAnims[i].driftY.value = withRepeat(withTiming((6 + i * 4) * (i === 1 ? -1 : 1), { duration: 9000 + i * 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
            sphereAnims[i].pulse.value = withRepeat(withTiming(0.85 + (i % 2) * 0.3, { duration: 10000 + i * 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
          }, 1500 + i * 500);
        });

        titleOpacity.value = withDelay(700, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
        titleY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
        taglineOpacity.value = withDelay(950, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
        taglineY.value = withDelay(950, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
      }

      // Card entrance (staggered reveal) — replays every visit
      // Per-card tick synced to each card's appearance (layered on AHAP base)
      for (let ci = 0; ci < NUM_CARDS; ci++) {
        const pos = POSITION_POOL[newPositions[ci]];
        const delay = 200 + ci * 50 + Math.random() * 80;
        cardAnims[ci].opacity.value = withDelay(delay, withTiming(pos.opacity, { duration: 600, easing: Easing.out(Easing.ease) }));
        cardAnims[ci].scale.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
        setTimeout(() => {
          if (!isActiveRef.current) return;
          haptics.tick();
        }, delay);
        setTimeout(() => {
          if (!isActiveRef.current) return;
          startFloat(ci);
        }, delay + 700);
        lastCycled.current[ci] = Date.now() - Math.random() * 4000;
      }

      // Core Haptics cascade — continuous swell underneath the per-card ticks
      if (CARD_CASCADE_PLAYER) {
        CARD_CASCADE_PLAYER.start();
      }

      // Start cycling after entrance settles
      setTimeout(() => {
        if (!isActiveRef.current) return;
        scheduleBg(); scheduleFg();
      }, 3000);
    }, 300);

    return () => {
      if (entranceDebounce.current) { clearTimeout(entranceDebounce.current); entranceDebounce.current = null; }
    };
  }, [isActive]);

  // Safety net: clear cycling timers on unmount
  useEffect(() => () => {
    if (bgTimer.current) clearTimeout(bgTimer.current);
    if (fgTimer.current) clearTimeout(fgTimer.current);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value, transform: [{ translateY: taglineY.value }] }));

  return (
    <View style={styles.container}>
      {EDGE_SPHERES.map((pos, i) => {
        const sStyle = useAnimatedStyle(() => ({ opacity: sphereOpacities[i].value, transform: [{ translateX: sphereAnims[i].driftX.value }, { translateY: sphereAnims[i].driftY.value }, { scale: sphereAnims[i].pulse.value }] }));
        return <Animated.View key={`sphere-${i}`} style={[styles.sphere, { top: pos.top, left: pos.left }, sStyle]} />;
      })}

      {Array.from({ length: NUM_CARDS }).map((_, ci) => {
        const posIdx = positions[ci];
        const pos = POSITION_POOL[posIdx];
        const card = ALL_CARDS[images[ci] % ALL_CARDS.length];
        const left = pos.xPct * SW - pos.w / 2;
        const top = pos.yPct * SH - pos.h / 2;

        const slotStyle = useAnimatedStyle(() => ({
          opacity: cardAnims[ci].opacity.value,
          transform: [
            { translateX: cardAnims[ci].floatX.value },
            { translateY: cardAnims[ci].floatY.value + cardAnims[ci].cycleY.value },
            { scale: cardAnims[ci].scale.value },
            { rotate: `${pos.rotation + cardAnims[ci].floatRotate.value}deg` },
          ],
        }));

        return (
          <Animated.View key={`card-${ci}`} style={[styles.cardSlot, { left, top, width: pos.w, height: pos.h, zIndex: pos.zIndex }, slotStyle]}>
            <CardView card={card} w={pos.w} h={pos.h} canFlip={pos.flippable} />
          </Animated.View>
        );
      })}

      <View style={[styles.titleRegion, { paddingTop: insets.top + spacing.xxxl + spacing.xl }]}>
        <Animated.View style={titleStyle}><Text style={styles.title}>Track<Text style={styles.titleAccent}>R</Text></Text></Animated.View>
        <Animated.View style={[taglineStyle, { marginTop: spacing.md }]}><Text style={styles.tagline}>The premium home for your coaster life.</Text></Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  sphere: { position: 'absolute', width: SPHERE_SIZE, height: SPHERE_SIZE, borderRadius: SPHERE_SIZE / 2, backgroundColor: 'rgba(207, 103, 105, 0.04)', shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.18, shadowRadius: 90, zIndex: 0 },
  cardSlot: { position: 'absolute' },
  titleRegion: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  title: { fontSize: 56, fontWeight: typography.weights.bold, color: colors.text.primary, letterSpacing: -2 },
  titleAccent: { color: ACCENT },
  tagline: { fontSize: typography.sizes.body, fontWeight: typography.weights.regular, color: colors.text.secondary, letterSpacing: 0.3, textAlign: 'center' },
});
