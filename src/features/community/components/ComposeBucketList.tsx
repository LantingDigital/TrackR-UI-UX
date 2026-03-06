/**
 * ComposeBucketList — Bucket list compose form
 *
 * Title, mixed coaster/park search to add items, checkable rows, post button.
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
import { createBucketListPost } from '../stores/communityStore';

interface BucketItem {
  name: string;
  itemType: 'coaster' | 'park';
  refId: string;
}

interface ComposeBucketListProps {
  onComplete: () => void;
}

export function ComposeBucketList({ onComplete }: ComposeBucketListProps) {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<BucketItem[]>([]);

  const canPost = title.trim() && items.length >= 1;

  const handleAddItem = useCallback((result: any) => {
    const existing = items.find((i) => i.refId === result.id && i.itemType === result.type);
    if (existing) return;
    haptics.tap();
    setItems((prev) => [...prev, {
      name: result.name,
      itemType: result.type,
      refId: result.id,
    }]);
  }, [items]);

  const handleRemoveItem = useCallback((refId: string) => {
    haptics.tap();
    setItems((prev) => prev.filter((i) => i.refId !== refId));
  }, []);

  const handlePost = useCallback(() => {
    if (!canPost) return;
    Keyboard.dismiss();
    haptics.success();
    createBucketListPost({
      title: title.trim(),
      items,
    });
    onComplete();
  }, [canPost, title, items, onComplete]);

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
        placeholder="Must-Ride Bucket List"
        placeholderTextColor={colors.text.meta}
      />

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Add Items</Text>
      <ItemSearchInput
        mode="both"
        placeholder="Search coasters or parks..."
        onSelect={handleAddItem}
      />

      {items.length > 0 && (
        <View style={styles.listPreview}>
          {items.map((item) => (
            <View key={`${item.itemType}-${item.refId}`} style={styles.listItem}>
              <Ionicons
                name="ellipse-outline"
                size={16}
                color={colors.text.meta}
              />
              <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {item.itemType === 'park' ? 'Park' : 'Ride'}
                </Text>
              </View>
              <Pressable onPress={() => handleRemoveItem(item.refId)} hitSlop={6}>
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
          Post Bucket List ({items.length} items)
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
    gap: spacing.sm,
  },
  listName: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
  },
  typeBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
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
