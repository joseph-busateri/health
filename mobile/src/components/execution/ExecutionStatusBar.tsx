/**
 * Execution Status Bar - Phase 15
 * Compact status display for execution progress
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ExecutionScore } from '../../types/execution';

interface Props {
  score: ExecutionScore;
  completedTasks: number;
  totalTasks: number;
  pendingTasks: number;
  missedTasks: number;
}

export const ExecutionStatusBar: React.FC<Props> = ({
  score,
  completedTasks,
  totalTasks,
  pendingTasks,
  missedTasks,
}) => {
  const scoreColor = 
    score.overall >= 80 ? '#22C55E' :
    score.overall >= 60 ? '#EAB308' :
    score.overall >= 40 ? '#F97316' : '#EF4444';

  return (
    <View style={styles.container}>
      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>Execution Score</Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>{score.overall}%</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#94A3B8' }]}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        {missedTasks > 0 && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{missedTasks}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        )}
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(completedTasks / totalTasks) * 100}%`, backgroundColor: scoreColor }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 12,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
