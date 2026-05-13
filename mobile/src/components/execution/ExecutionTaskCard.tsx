/**
 * Execution Task Card - Phase 15
 * Individual task with completion actions
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ExecutionTask } from '../../types/execution';

interface Props {
  task: ExecutionTask;
  onComplete: (taskId: string) => void;
  onPartial: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onModify?: (taskId: string) => void;
}

const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  moderate: '#EAB308',
  low: '#64748B',
};

const STATUS_COLORS = {
  pending: '#64748B',
  completed: '#22C55E',
  partial: '#EAB308',
  skipped: '#94A3B8',
};

const DOMAIN_ICONS = {
  workout: '💪',
  recovery: '🛌',
  nutrition: '🥗',
  supplements: '💊',
};

export const ExecutionTaskCard: React.FC<Props> = ({
  task,
  onComplete,
  onPartial,
  onSkip,
  onModify,
}) => {
  const priorityColor = PRIORITY_COLORS[task.priority];
  const statusColor = STATUS_COLORS[task.status];
  const icon = DOMAIN_ICONS[task.domain];
  const isCompleted = task.status === 'completed';
  const isSkipped = task.status === 'skipped';

  return (
    <View style={[styles.container, isCompleted && styles.completedContainer]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.titleContent}>
            <Text style={[styles.title, isCompleted && styles.completedText]}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.description} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{task.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {task.targetValue && (
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Target:</Text>
          <Text style={styles.targetValue}>
            {task.targetValue} {task.targetUnit}
          </Text>
        </View>
      )}

      {task.expectedImpact && (
        <View style={styles.impactBox}>
          <Text style={styles.impactLabel}>Expected Impact:</Text>
          <Text style={styles.impactText}>{task.expectedImpact}</Text>
        </View>
      )}

      {!isCompleted && !isSkipped && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => onComplete(task.id)}
          >
            <Text style={styles.completeButtonText}>✓ Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.partialButton]}
            onPress={() => onPartial(task.id)}
          >
            <Text style={styles.partialButtonText}>~ Partial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => onSkip(task.id)}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && task.completedAt && (
        <Text style={styles.completedTime}>
          Completed at {new Date(task.completedAt).toLocaleTimeString()}
        </Text>
      )}
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
    borderLeftColor: '#3B82F6',
  },
  completedContainer: {
    opacity: 0.7,
    borderLeftColor: '#22C55E',
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  description: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  impactBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  impactText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
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
  completeButton: {
    backgroundColor: '#22C55E',
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  partialButton: {
    backgroundColor: '#334155',
  },
  partialButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  skipButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  completedTime: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
