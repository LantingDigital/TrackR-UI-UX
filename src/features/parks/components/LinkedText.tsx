import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { POI_NAME_MAP } from '../data/poiNameMap';

// ============================================
// LinkedText
// Parses plain text and makes POI names
// tappable (accent color, slightly bold).
// ============================================

interface LinkedTextProps {
  text: string;
  onPOIPress: (poiId: string) => void;
}

// Build regex once — sort names by length desc so longest match wins
const SORTED_NAMES = Object.keys(POI_NAME_MAP).sort(
  (a, b) => b.length - a.length,
);

// Escape special regex chars in POI names (e.g. "Jaguar!" has "!")
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NAME_PATTERN = new RegExp(
  `(${SORTED_NAMES.map(escapeRegex).join('|')})`,
  'g',
);

interface TextSegment {
  text: string;
  poiId: string | null; // null = plain text
}

export function LinkedText({ text, onPOIPress }: LinkedTextProps) {
  const segments = useMemo<TextSegment[]>(() => {
    const result: TextSegment[] = [];
    let lastIndex = 0;

    text.replace(NAME_PATTERN, (match, _group, offset) => {
      // Plain text before this match
      if (offset > lastIndex) {
        result.push({ text: text.slice(lastIndex, offset), poiId: null });
      }

      const poiId = POI_NAME_MAP[match] || null;
      result.push({ text: match, poiId });
      lastIndex = offset + match.length;
      return match;
    });

    // Remaining text after last match
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), poiId: null });
    }

    return result;
  }, [text]);

  return (
    <Text style={styles.body}>
      {segments.map((seg, i) => {
        if (seg.poiId) {
          return (
            <Text
              key={i}
              style={styles.linked}
              onPress={() => onPOIPress(seg.poiId!)}
            >
              {seg.text}
            </Text>
          );
        }
        return seg.text;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  linked: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },
});
