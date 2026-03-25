/**
 * Import Store — Zustand
 *
 * Manages the multi-step import flow state:
 * Step 1: File upload → parsing
 * Step 2: Field mapping review
 * Step 3: Coaster matching
 * Step 4: Preview + duplicate detection
 * Step 5: Import progress
 *
 * Persists across navigation during active import.
 */

import { create } from 'zustand';
import type {
  ImportedRide,
  ImportParseResult,
  CoasterMatchResult,
} from '../services/firebase/functions';
import type {
  ResolvedImportRide,
  ImportProgress,
} from '../services/firebase/importService';

// ============================================
// Types
// ============================================

type ImportStep =
  | 'upload'
  | 'field-mapping'
  | 'coaster-matching'
  | 'preview'
  | 'importing'
  | 'complete';

interface ImportState {
  /** Current step in the import flow */
  step: ImportStep;

  /** Step 1: File info */
  fileName: string | null;
  fileExtension: string | null;

  /** Step 1 result: Parsed rides from CF */
  parseResult: ImportParseResult | null;

  /** Step 2: Field mapping (user can override) */
  fieldMapping: Record<string, string>;

  /** Step 3: Match results from CF */
  matchResults: CoasterMatchResult[];
  /** Step 3: User-confirmed matches (rawName → confirmed coaster) */
  confirmedMatches: Map<
    string,
    { coasterId: string; coasterName: string; parkName: string }
  >;
  /** Step 3: Names the user chose to skip */
  skippedNames: Set<string>;

  /** Step 4: Resolved rides ready for import */
  resolvedRides: ResolvedImportRide[];

  /** Step 5: Import progress */
  progress: ImportProgress;

  /** Loading state for async operations */
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

interface ImportActions {
  /** Step 1: Set file info after selection */
  setFile: (fileName: string, fileExtension: string) => void;

  /** Step 1: Set parse result from CF */
  setParseResult: (result: ImportParseResult) => void;

  /** Step 2: Update a field mapping */
  updateFieldMapping: (sourceColumn: string, targetField: string) => void;

  /** Step 2: Confirm field mapping and advance */
  confirmFieldMapping: () => void;

  /** Step 3: Set match results from CF */
  setMatchResults: (results: CoasterMatchResult[]) => void;

  /** Step 3: Confirm a coaster match */
  confirmMatch: (
    rawName: string,
    match: { coasterId: string; coasterName: string; parkName: string },
  ) => void;

  /** Step 3: Skip a coaster (don't import rides for it) */
  skipName: (rawName: string) => void;

  /** Step 3: Advance to preview */
  advanceToPreview: () => void;

  /** Step 4: Set resolved rides (after duplicate detection) */
  setResolvedRides: (rides: ResolvedImportRide[]) => void;

  /** Step 4: Toggle a ride's selected state */
  toggleRideSelected: (rowIndex: number) => void;

  /** Step 4: Select/deselect all */
  setAllSelected: (selected: boolean) => void;

  /** Step 5: Update progress */
  setProgress: (progress: ImportProgress) => void;

  /** Set loading state */
  setLoading: (isLoading: boolean, message?: string) => void;

  /** Set error */
  setError: (error: string | null) => void;

  /** Set step directly */
  setStep: (step: ImportStep) => void;

  /** Reset the entire import flow */
  reset: () => void;
}

type ImportStore = ImportState & ImportActions;

// ============================================
// Default State
// ============================================

const DEFAULT_STATE: ImportState = {
  step: 'upload',
  fileName: null,
  fileExtension: null,
  parseResult: null,
  fieldMapping: {},
  matchResults: [],
  confirmedMatches: new Map(),
  skippedNames: new Set(),
  resolvedRides: [],
  progress: { total: 0, completed: 0, status: 'idle' },
  isLoading: false,
  loadingMessage: '',
  error: null,
};

// ============================================
// Store
// ============================================

export const useImportStore = create<ImportStore>((set, get) => ({
  ...DEFAULT_STATE,

  setFile: (fileName, fileExtension) => {
    set({ fileName, fileExtension, error: null });
  },

  setParseResult: (result) => {
    set({
      parseResult: result,
      fieldMapping: result.fieldMapping,
      step: 'field-mapping',
      isLoading: false,
    });
  },

  updateFieldMapping: (sourceColumn, targetField) => {
    const { fieldMapping } = get();
    set({
      fieldMapping: { ...fieldMapping, [sourceColumn]: targetField },
    });
  },

  confirmFieldMapping: () => {
    set({ step: 'coaster-matching' });
  },

  setMatchResults: (results) => {
    // Auto-confirm high-confidence matches (>= 0.85)
    const confirmed = new Map<
      string,
      { coasterId: string; coasterName: string; parkName: string }
    >();

    for (const result of results) {
      if (result.bestMatch && result.bestMatch.confidence >= 0.85) {
        confirmed.set(result.rawName, {
          coasterId: result.bestMatch.coasterId,
          coasterName: result.bestMatch.coasterName,
          parkName: result.bestMatch.parkName,
        });
      }
    }

    set({
      matchResults: results,
      confirmedMatches: confirmed,
      isLoading: false,
    });
  },

  confirmMatch: (rawName, match) => {
    const { confirmedMatches, skippedNames } = get();
    const newConfirmed = new Map(confirmedMatches);
    newConfirmed.set(rawName, match);
    const newSkipped = new Set(skippedNames);
    newSkipped.delete(rawName);
    set({ confirmedMatches: newConfirmed, skippedNames: newSkipped });
  },

  skipName: (rawName) => {
    const { confirmedMatches, skippedNames } = get();
    const newConfirmed = new Map(confirmedMatches);
    newConfirmed.delete(rawName);
    const newSkipped = new Set(skippedNames);
    newSkipped.add(rawName);
    set({ confirmedMatches: newConfirmed, skippedNames: newSkipped });
  },

  advanceToPreview: () => {
    set({ step: 'preview' });
  },

  setResolvedRides: (rides) => {
    set({ resolvedRides: rides });
  },

  toggleRideSelected: (rowIndex) => {
    const { resolvedRides } = get();
    set({
      resolvedRides: resolvedRides.map((r) =>
        r.parsedRide.rowIndex === rowIndex
          ? { ...r, selected: !r.selected }
          : r,
      ),
    });
  },

  setAllSelected: (selected) => {
    const { resolvedRides } = get();
    set({
      resolvedRides: resolvedRides.map((r) => ({ ...r, selected })),
    });
  },

  setProgress: (progress) => {
    set({
      progress,
      step: progress.status === 'complete' ? 'complete' : 'importing',
    });
  },

  setLoading: (isLoading, message) => {
    set({
      isLoading,
      loadingMessage: message ?? '',
      error: isLoading ? null : get().error,
    });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  setStep: (step) => {
    set({ step });
  },

  reset: () => {
    set({ ...DEFAULT_STATE });
  },
}));

// ============================================
// Selectors
// ============================================

/** Count of rides selected for import in the preview step */
export function getSelectedRideCount(): number {
  return useImportStore.getState().resolvedRides.filter((r) => r.selected)
    .length;
}

/** Count of total resolved rides */
export function getTotalResolvedRideCount(): number {
  return useImportStore.getState().resolvedRides.length;
}

/** Count of unresolved coaster names (not confirmed and not skipped) */
export function getUnresolvedCount(): number {
  const { matchResults, confirmedMatches, skippedNames } =
    useImportStore.getState();
  return matchResults.filter(
    (r) => !confirmedMatches.has(r.rawName) && !skippedNames.has(r.rawName),
  ).length;
}

/** Whether all coasters are resolved (confirmed or skipped) */
export function allCoastersResolved(): boolean {
  return getUnresolvedCount() === 0;
}
