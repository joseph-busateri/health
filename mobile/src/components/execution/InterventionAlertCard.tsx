/**
 * Intervention Alert Card - Phase 15
 * Smart interventions for off-track execution
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Intervention } from '../../types/execution';

interface Props {
  intervention: Intervention;
  onDismiss: (interventionId: string) => void;
  onAction?: (interventionId: string) => void;
}

const URGENCY_COLORS = {
  low: '#3B82F6',
  medium: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

const TYPE_ICONS = {
  reminder: '⏰',
  adjustment: '⚙️',
  warning: '⚠️',
  opportunity: '💡',
};

export const InterventionAlertCard: React.FC<Props> = ({
  intervention,
  onDismiss,
  onAction,
}) => {
  const urgencyColor = URGENCY_COLORS[intervention.urgency];
  const icon = TYPE_ICONS[intervention.type];

  return (
    <View style={[styles.container, { borderLeftColor: urgencyColor }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.titleContent}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.title}>{intervention.title}</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
                <Text style={styles.urgencyText}>{intervention.urgency.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.timing}>Timing: {intervention.timing}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{intervention.description}</Text>

      <View style={styles.actionBox}>
        <Text style={styles.actionLabel}>Suggested Action:</Text>
        <Text style={styles.actionText}>{intervention.suggestedAction}</Text>
      </View>

      <View style={styles.actions}>
        {onAction && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => onAction(intervention.id)}
          >
            <Text style={styles.primaryButtonText}>Take Action</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.dismissButton]}
          onPress={() => onDismiss(intervention.id)}
        >
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  titleContent: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    marginRight: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timing: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  description: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#F1F5F9',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    backgroundColor: '#334155',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
