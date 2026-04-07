/**
 * Learning Insights Section - Phase 15
 * AI-discovered patterns and optimizations
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LearningSignal } from '../../types/execution';

interface Props {
  learning: LearningSignal;
}

const TYPE_ICONS = {
  pattern: '🔍',
  correlation: '🔗',
  optimization: '⚡',
  warning: '⚠️',
};

const TYPE_COLORS = {
  pattern: '#3B82F6',
  correlation: '#8B5CF6',
  optimization: '#22C55E',
  warning: '#F97316',
};

export const LearningInsightsSection: React.FC<Props> = ({ learning }) => {
  if (learning.insights.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🧠</Text>
        <Text style={styles.emptyText}>Building learning intelligence</Text>
        <Text style={styles.emptySubtext}>More insights will appear as patterns emerge</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>LEARNING INTELLIGENCE</Text>
      
      {learning.insights.map((insight) => {
        const icon = TYPE_ICONS[insight.type];
        const color = TYPE_COLORS[insight.type];
        const confidencePercent = Math.round(insight.confidence * 100);

        return (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>{icon}</Text>
              <View style={styles.insightTitleRow}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: color }]}>
                  <Text style={styles.confidenceText}>{confidencePercent}%</Text>
                </View>
              </View>
            </View>

            <Text style={styles.insightDescription}>{insight.description}</Text>

            {insight.evidence.length > 0 && (
              <View style={styles.evidenceSection}>
                <Text style={styles.evidenceLabel}>Evidence:</Text>
                {insight.evidence.map((item, idx) => (
                  <Text key={idx} style={styles.evidenceItem}>• {item}</Text>
                ))}
              </View>
            )}

            {insight.actionable && insight.recommendation && (
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationLabel}>💡 Recommendation:</Text>
                <Text style={styles.recommendationText}>{insight.recommendation}</Text>
              </View>
            )}
          </View>
        );
      })}

      {learning.adaptations.length > 0 && (
        <View style={styles.adaptationsSection}>
          <Text style={styles.adaptationsTitle}>AI Adaptations</Text>
          {learning.adaptations.map((adaptation, idx) => (
            <View key={idx} style={styles.adaptationItem}>
              <Text style={styles.adaptationBullet}>→</Text>
              <Text style={styles.adaptationText}>{adaptation}</Text>
            </View>
          ))}
        </View>
      )}
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
  insightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  insightTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  insightDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 10,
  },
  evidenceSection: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  evidenceItem: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 2,
  },
  recommendationBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#F1F5F9',
    lineHeight: 18,
  },
  adaptationsSection: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  adaptationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 10,
  },
  adaptationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  adaptationBullet: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 8,
    marginTop: 2,
  },
  adaptationText: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
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
