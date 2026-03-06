/**
 * ComposeReview — Review compose form
 *
 * Coaster search, star rating, review text, post button.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { StarRatingInput } from './StarRatingInput';
import { ItemSearchInput } from './ItemSearchInput';
import { createReviewPost } from '../stores/communityStore';

interface ComposeReviewProps {
  onComplete: () => void;
}

export function ComposeReview({ onComplete }: ComposeReviewProps) {
  const [coasterId, setCoasterId] = useState('');
  const [coasterName, setCoasterName] = useState('');
  const [parkName, setParkName] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const canPost = coasterId && rating > 0 && reviewText.trim().length > 0;

  const handlePost = useCallback(() => {
    if (!canPost) return;
    Keyboard.dismiss();
    haptics.success();
    createReviewPost({
      coasterId,
      coasterName,
      parkName,
      rating,
      reviewText: reviewText.trim(),
    });
    onComplete();
  }, [canPost, coasterId, coasterName, parkName, rating, reviewText, onComplete]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.label}>Coaster</Text>
      <ItemSearchInput
        mode="coaster"
        onSelect={(item) => {
          if (item.type === 'coaster') {
            setCoasterId(item.id);
            setCoasterName(item.name);
            setParkName(item.park);
          }
        }}
      />
      {coasterName ? (
        <Text style={styles.selectedMeta}>{coasterName} at {parkName}</Text>
      ) : null}

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Rating</Text>
      <StarRatingInput rating={rating} onRate={setRating} />

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Review</Text>
      <TextInput
        style={styles.textArea}
        value={reviewText}
        onChangeText={setReviewText}
        placeholder="Share your thoughts..."
        placeholderTextColor={colors.text.meta}
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
        onPress={handlePost}
        disabled={!canPost}
      >
        <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>Post Review</Text>
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
  selectedMeta: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    padding: spacing.base,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    minHeight: 100,
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
