import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { getPOINameMap } from '../data/poiNameMap';

// ============================================
// LinkedText
// Parses plain text and makes POI names
// tappable (accent color, slightly bold).
// ============================================

interface LinkedTextProps {
  text: string;
  onPOIPress: (poiId: string) => void;
}

// Escape special regex chars in POI names (e.g. "Jaguar!" has "!")
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build regex lazily — initialized on first use after all POIs are loaded
let _cachedPattern: RegExp | null = null;

function getNamePattern(): RegExp {
  if (_cachedPattern) return _cachedPattern;
  const nameMap = getPOINameMap();
  const sortedNames = Object.keys(nameMap).sort(
    (a, b) => b.length - a.length,
  );
  if (sortedNames.length === 0) {
    // Fallback: match nothing
    _cachedPattern = /(?!)/g;
    return _cachedPattern;
  }
  _cachedPattern = new RegExp(
    `(${sortedNames.map(escapeRegex).join('|')})`,
    'g',
  );
  return _cachedPattern;
}

interface TextSegment {
  text: string;
  poiId: string | null; // null = plain text
}

export function LinkedText({ text, onPOIPress }: LinkedTextProps) {
  const segments = useMemo<TextSegment[]>(() => {
    const nameMap = getPOINameMap();
    const pattern = getNamePattern();
    // Reset lastIndex for global regex reuse
    pattern.lastIndex = 0;

    const result: TextSegment[] = [];
    let lastIndex = 0;

    text.replace(pattern, (match, _group, offset) => {
      // Plain text before this match
      if (offset > lastIndex) {
        result.push({ text: text.slice(lastIndex, offset), poiId: null });
      }

      const poiId = nameMap[match] || null;
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
