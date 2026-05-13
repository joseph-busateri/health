/**
 * Execution Intelligence Section - Phase 15
 * Main section integrating all execution components
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExecutionStatusBar } from './ExecutionStatusBar';
import { ExecutionTaskCard } from './ExecutionTaskCard';
import { AdherenceSummaryCard } from './AdherenceSummaryCard';
import { InterventionAlertCard } from './InterventionAlertCard';
import { LearningInsightsSection } from './LearningInsightsSection';
import type { ExecutionIntelligence } from '../../types/execution';

interface Props {
  execution: ExecutionIntelligence;
  onCompleteTask: (taskId: string) => void;
  onPartialTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onDismissIntervention: (interventionId: string) => void;
}

export const ExecutionIntelligenceSection: React.FC<Props> = ({
  execution,
  onCompleteTask,
  onPartialTask,
  onSkipTask,
  onDismissIntervention,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showLearning, setShowLearning] = useState(false);

  const { plan, adherence, interventions, learning } = execution;
  
  const completedTasks = plan.tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = plan.tasks.filter(t => t.status === 'pending').length;
  const missedTasks = plan.tasks.filter(t => t.status === 'skipped').length;
  const totalTasks = plan.tasks.length;

  // Calculate execution score
  const executionScore = {
    overall: adherence.overallScore,
    weighted: adherence.overallScore,
    byDomain: adherence.domains.reduce((acc, d) => {
      acc[d.domain] = d.score;
      return acc;
    }, {} as any),
    byPriority: {} as any,
    trend: 'stable' as const,
  };

  // Active interventions (not dismissed)
  const activeInterventions = interventions.filter(i => !i.dismissed);

  if (totalTasks === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No execution tasks today</Text>
        <Text style={styles.emptySubtext}>Complete your daily check-in to generate tasks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Collapsible Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.sectionTitle}>EXECUTION INTELLIGENCE</Text>
          <Text style={styles.headerSummary}>
            {completedTasks} of {totalTasks} tasks complete
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* Compact Status Bar (Always Visible) */}
      {!expanded && (
        <View style={styles.compactStatus}>
          <View style={styles.compactScoreBox}>
            <Text style={styles.compactScoreLabel}>Score</Text>
            <Text style={[styles.compactScoreValue, { 
              color: executionScore.overall >= 80 ? '#22C55E' : 
                     executionScore.overall >= 60 ? '#EAB308' : '#F97316' 
            }]}>
              {executionScore.overall}%
            </Text>
          </View>
          <View style={styles.compactDivider} />
          <View style={styles.compactStats}>
            <Text style={styles.compactStat}>✓ {completedTasks}</Text>
            <Text style={styles.compactStat}>⏳ {pendingTasks}</Text>
            {missedTasks > 0 && (
              <Text style={[styles.compactStat, { color: '#EF4444' }]}>✗ {missedTasks}</Text>
            )}
          </View>
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Status Bar */}
          <ExecutionStatusBar
            score={executionScore}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            pendingTasks={pendingTasks}
            missedTasks={missedTasks}
          />

          {/* Active Interventions */}
          {activeInterventions.length > 0 && (
            <View style={styles.interventionsSection}>
              <Text style={styles.subsectionTitle}>Active Interventions</Text>
              {activeInterventions.map((intervention) => (
                <InterventionAlertCard
                  key={intervention.id}
                  intervention={intervention}
                  onDismiss={onDismissIntervention}
                />
              ))}
            </View>
          )}

          {/* Execution Tasks */}
          <View style={styles.tasksSection}>
            <Text style={styles.subsectionTitle}>Today's Tasks</Text>
            {plan.tasks.map((task) => (
              <ExecutionTaskCard
                key={task.id}
                task={task}
                onComplete={onCompleteTask}
                onPartial={onPartialTask}
                onSkip={onSkipTask}
              />
            ))}
          </View>

          {/* Adherence Summary */}
          <AdherenceSummaryCard adherence={adherence} />

          {/* Learning Insights Toggle */}
          {learning.insights.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.learningToggle}
                onPress={() => setShowLearning(!showLearning)}
              >
                <Text style={styles.learningToggleText}>
                  🧠 Learning Insights ({learning.insights.length})
                </Text>
                <Text style={styles.expandIcon}>{showLearning ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {showLearning && (
                <LearningInsightsSection learning={learning} />
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  headerContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSummary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  expandIcon: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 12,
  },
  compactStatus: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  compactScoreBox: {
    alignItems: 'center',
    paddingRight: 16,
  },
  compactScoreLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  compactScoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  compactDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
    marginRight: 16,
  },
  compactStats: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  compactStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  expandedContent: {
    gap: 4,
  },
  interventionsSection: {
    marginBottom: 12,
  },
  tasksSection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  learningToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  learningToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
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
