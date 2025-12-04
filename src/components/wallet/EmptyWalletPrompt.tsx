/**
 * EmptyWalletPrompt Component
 *
 * Shown when user has no tickets and opens the wallet.
 * Prompts them to add their first ticket.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

interface EmptyWalletPromptProps {
  /** Called when user wants to add a ticket */
  onAddTicket?: () => void;
  /** Called when user closes the prompt */
  onClose?: () => void;
}

export const EmptyWalletPrompt: React.FC<EmptyWalletPromptProps> = ({
  onAddTicket,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="ticket-outline" size={64} color={colors.accent.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Tickets Yet</Text>

        {/* Description */}
        <Text style={styles.description}>
          Add your first theme park ticket to get started. You can scan a QR code or import from your photos.
        </Text>

        {/* Add button */}
        {onAddTicket && (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={onAddTicket}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Your First Ticket</Text>
          </Pressable>
        )}

        {/* Secondary close option */}
        {onClose && (
          <Pressable style={styles.closeLink} onPress={onClose}>
            <Text style={styles.closeLinkText}>Maybe Later</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...shadows.card,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radius.actionPill,
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeLink: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  closeLinkText: {
    fontSize: 15,
    color: colors.text.meta,
  },
});
