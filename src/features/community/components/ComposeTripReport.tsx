/**
 * ComposeTripReport — Trip report compose form
 *
 * Title, park search, ride count stepper, body text, post button.
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
import { createTripReportPost } from '../stores/communityStore';

interface ComposeTripReportProps {
  onComplete: () => void;
}

export function ComposeTripReport({ onComplete }: ComposeTripReportProps) {
  const [title, setTitle] = useState('');
  const [parkId, setParkId] = useState('');
  const [parkName, setParkName] = useState('');
  const [rideCount, setRideCount] = useState(1);
  const [bodyText, setBodyText] = useState('');

  const canPost = title.trim() && parkId && bodyText.trim();

  const handlePost = useCallback(() => {
    if (!canPost) return;
    Keyboard.dismiss();
    haptics.success();
    createTripReportPost({
      title: title.trim(),
      parkId,
      parkName,
      rideCount,
      bodyText: bodyText.trim(),
    });
    onComplete();
  }, [canPost, title, parkId, parkName, rideCount, bodyText, onComplete]);

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
        placeholder="Day at Cedar Point..."
        placeholderTextColor={colors.text.meta}
      />

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Park</Text>
      <ItemSearchInput
        mode="park"
        onSelect={(item) => {
          if (item.type === 'park') {
            setParkId(item.id);
            setParkName(item.name);
          }
        }}
      />
      {parkName ? (
        <Text style={styles.selectedMeta}>{parkName}</Text>
      ) : null}

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Rides</Text>
      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => { haptics.tap(); setRideCount((c) => Math.max(1, c - 1)); }}
        >
          <Ionicons name="remove" size={18} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{rideCount}</Text>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => { haptics.tap(); setRideCount((c) => c + 1); }}
        >
          <Ionicons name="add" size={18} color={colors.text.primary} />
        </Pressable>
      </View>

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Report</Text>
      <TextInput
        style={styles.textArea}
        value={bodyText}
        onChangeText={setBodyText}
        placeholder="Tell us about your visit..."
        placeholderTextColor={colors.text.meta}
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
        onPress={handlePost}
        disabled={!canPost}
      >
        <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>Post Report</Text>
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
  selectedMeta: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    minWidth: 32,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: colors.background.page,
    borderRadius: radius.md,
    padding: spacing.base,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    minHeight: 120,
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
