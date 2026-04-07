/**
 * Predictive Intelligence Section
 * Forward-looking health predictions with timeframes
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PredictiveInsight } from '../../types/controlTower';

interface Props {
  insights: PredictiveInsight[];
}

const TIMEFRAME_LABELS = {
  '24h': '24 Hours',
  '3d': '3 Days',
  '7d': '7 Days',
};

const RISK_COLORS = {
  low: '#22C55E',
  moderate: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

const TYPE_ICONS = {
  recovery: '🔋',
  fatigue: '😴',
  performance: '💪',
  cardiovascular: '❤️',
  metabolic: '🔥',
};

export const PredictiveIntelligenceSection: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔮</Text>
        <Text style={styles.emptyText}>No predictions available</Text>
        <Text style={styles.emptySubtext}>More data needed for predictive intelligence</Text>
      </View>
    );
  }

  const groupedByTimeframe = insights.reduce((acc, insight) => {
    if (!acc[insight.timeframe]) {
      acc[insight.timeframe] = [];
    }
    acc[insight.timeframe].push(insight);
    return acc;
  }, {} as Record<string, PredictiveInsight[]>);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PREDICTIVE INTELLIGENCE</Text>
      
      {Object.entries(groupedByTimeframe).map(([timeframe, timeframeInsights]) => (
        <View key={timeframe} style={styles.timeframeGroup}>
          <Text style={styles.timeframeLabel}>
            {TIMEFRAME_LABELS[timeframe as keyof typeof TIMEFRAME_LABELS] || timeframe}
          </Text>
          
          {timeframeInsights.map((insight, index) => {
            const riskColor = RISK_COLORS[insight.riskLevel];
            const icon = TYPE_ICONS[insight.type] || '📊';

            return (
              <View key={index} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightTitleRow}>
                    <Text style={styles.insightIcon}>{icon}</Text>
                    <Text style={styles.insightPrediction}>{insight.prediction}</Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
                    <Text style={styles.riskBadgeText}>{insight.riskLevel.toUpperCase()}</Text>
                  </View>
                </View>

                {insight.confidence && (
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>Confidence: </Text>
                    <Text style={styles.confidenceValue}>{insight.confidence.toUpperCase()}</Text>
                  </View>
                )}

                {insight.preventiveAction && (
                  <View style={styles.actionBox}>
                    <Text style={styles.actionLabel}>Preventive Action:</Text>
                    <Text style={styles.actionText}>{insight.preventiveAction}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
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
  timeframeGroup: {
    marginBottom: 16,
  },
  timeframeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  insightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  insightPrediction: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    lineHeight: 20,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confidenceRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  actionBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
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
