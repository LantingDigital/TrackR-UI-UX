/**
 * ComposeRankedList — Ranked list compose form
 *
 * Title, emoji picker, coaster search to add items, reorderable list, post button.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { ItemSearchInput } from './ItemSearchInput';
import { createRankedListPost } from '../stores/communityStore';

const EMOJI_PRESETS = ['🎢', '🏆', '⭐', '🔥', '💎', '🎯', '🌟', '👑', '🎪', '🎡', '🗺️', '🌎', '🎠', '💨', '⚡', '🏅'];

interface ComposeRankedListProps {
  onComplete: () => void;
}

export function ComposeRankedList({ onComplete }: ComposeRankedListProps) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎢');
  const [items, setItems] = useState<{ coasterId: string; name: string }[]>([]);

  const canPost = title.trim() && items.length >= 2;

  const handleAddItem = useCallback((item: any) => {
    if (item.type === 'coaster' && !items.find((i) => i.coasterId === item.id)) {
      haptics.tap();
      setItems((prev) => [...prev, { coasterId: item.id, name: item.name }]);
    }
  }, [items]);

  const handleRemoveItem = useCallback((coasterId: string) => {
    haptics.tap();
    setItems((prev) => prev.filter((i) => i.coasterId !== coasterId));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    haptics.tap();
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handlePost = useCallback(() => {
    if (!canPost) return;
    Keyboard.dismiss();
    haptics.success();
    createRankedListPost({
      title: title.trim(),
      emoji,
      items,
    });
    onComplete();
  }, [canPost, title, emoji, items, onComplete]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="My Top 10 Steel Coasters"
        placeholderTextColor={colors.text.meta}
      />

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Emoji</Text>
      <View style={styles.emojiGrid}>
        {EMOJI_PRESETS.map((e) => (
          <Pressable
            key={e}
            style={[styles.emojiBtn, emoji === e && styles.emojiBtnSelected]}
            onPress={() => { haptics.tap(); setEmoji(e); }}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Add Coasters</Text>
      <ItemSearchInput
        mode="coaster"
        placeholder="Search to add..."
        onSelect={handleAddItem}
      />

      {items.length > 0 && (
        <View style={styles.listPreview}>
          {items.map((item, i) => (
            <View key={item.coasterId} style={styles.listItem}>
              <Text style={styles.listRank}>{i + 1}</Text>
              {i > 0 && (
                <Pressable onPress={() => handleMoveUp(i)} hitSlop={6} style={styles.moveBtn}>
                  <Ionicons name="chevron-up" size={16} color={colors.text.meta} />
                </Pressable>
              )}
              <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
              <Pressable onPress={() => handleRemoveItem(item.coasterId)} hitSlop={6}>
                <Ionicons name="close-circle" size={18} color={colors.text.meta} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
        onPress={handlePost}
        disabled={!canPost}
      >
        <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>
          Post List ({items.length} items)
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnSelected: {
    backgroundColor: colors.accent.primaryLight,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  emojiText: {
    fontSize: 20,
  },
  listPreview: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  listRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    width: 20,
  },
  moveBtn: {
    marginRight: spacing.xs,
  },
  listName: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  postBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  postBtnDisabled: {
    backgroundColor: colors.border.subtle,
  },
  postBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  postBtnTextDisabled: {
    color: colors.text.meta,
  },
});
