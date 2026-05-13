/**
 * Goal Progress Section
 * Goal-weighted progress tracking for strategic objectives
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GoalProgress } from '../../types/controlTower';

interface Props {
  goals: GoalProgress[];
}

const GOAL_ICONS = {
  bodybuilding: '🏋️',
  a1c_reduction: '🩸',
  recovery: '🔋',
  longevity: '🌱',
};

const STATUS_COLORS = {
  on_track: '#22C55E',
  at_risk: '#EAB308',
  off_track: '#EF4444',
};

const TREND_ICONS = {
  improving: '📈',
  stable: '➡️',
  declining: '📉',
};

export const GoalProgressSection: React.FC<Props> = ({ goals }) => {
  if (goals.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyText}>No active goals</Text>
        <Text style={styles.emptySubtext}>Set goals to track your progress</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>GOAL PROGRESS</Text>
      
      {goals.map((goal, index) => {
        const icon = GOAL_ICONS[goal.goalType] || '🎯';
        const statusColor = STATUS_COLORS[goal.status];
        const trendIcon = TREND_ICONS[goal.trend];

        return (
          <View key={index} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleRow}>
                <Text style={styles.goalIcon}>{icon}</Text>
                <Text style={styles.goalName}>{goal.goalName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{goal.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: statusColor }]} />
              </View>
              <Text style={styles.progressText}>{goal.progress}%</Text>
            </View>

            <View style={styles.trendRow}>
              <Text style={styles.trendIcon}>{trendIcon}</Text>
              <Text style={styles.trendText}>Trend: {goal.trend}</Text>
            </View>

            {goal.explanation && (
              <Text style={styles.explanation}>{goal.explanation}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  goalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    minWidth: 40,
    textAlign: 'right',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  trendText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  explanation: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
