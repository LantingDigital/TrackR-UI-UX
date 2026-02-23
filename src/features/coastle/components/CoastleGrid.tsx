import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { CoastleGuess, GRID_ATTRIBUTES } from '../types/coastle';
import { CoastleCell } from './CoastleCell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = spacing.lg;
const CELL_GAP = spacing.xs;
const GRID_CARD_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const CELL_SIZE = Math.floor((GRID_CARD_WIDTH - GRID_PADDING * 2 - CELL_GAP * 2) / 3);

interface CoastleGridProps {
  guess?: CoastleGuess;
  guessNumber: number;
  shouldReveal: boolean;
  isEmpty?: boolean; // show question-mark placeholder grid
}

export const CoastleGrid: React.FC<CoastleGridProps> = ({
  guess,
  guessNumber,
  shouldReveal,
  isEmpty,
}) => {
  if (isEmpty || !guess) {
    // Empty grid with question marks
    return (
      <View style={styles.card}>
        <Text style={styles.headerEmpty}>Guess {guessNumber}</Text>
        <View style={styles.grid}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.row}>
              {GRID_ATTRIBUTES
                .filter((a) => a.row === row)
                .sort((a, b) => a.col - b.col)
                .map((attr) => (
                  <View
                    key={attr.key}
                    style={[styles.emptyCell, { width: CELL_SIZE, height: CELL_SIZE }]}
                  >
                    <Text style={styles.emptyCellLabel}>{attr.label}</Text>
                    <Text style={styles.emptyCellQuestion}>?</Text>
                  </View>
                ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  const sortedCells = [...guess.cells].sort(
    (a, b) => a.row * 3 + a.col - (b.row * 3 + b.col),
  );

  return (
    <View style={styles.card}>
      <Text style={styles.header} numberOfLines={1}>
        {guess.coaster.name}
      </Text>
      <View style={styles.grid}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.row}>
            {sortedCells
              .filter((c) => c.row === row)
              .map((cell, colIdx) => (
                <CoastleCell
                  key={cell.key}
                  cell={cell}
                  cellIndex={row * 3 + colIdx}
                  size={CELL_SIZE}
                  shouldReveal={shouldReveal}
                />
              ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export { GRID_CARD_WIDTH, CELL_SIZE };

const styles = StyleSheet.create({
  card: {
    width: GRID_CARD_WIDTH,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: GRID_PADDING,
    ...shadows.card,
  },
  header: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  headerEmpty: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  grid: {
    gap: CELL_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CELL_GAP,
    justifyContent: 'center',
  },
  emptyCell: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coastle.empty,
    borderWidth: 1,
    borderColor: colors.coastle.cellBorder,
  },
  emptyCellLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.coastle.emptyText,
    marginBottom: 2,
  },
  emptyCellQuestion: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.coastle.emptyText,
  },
});
