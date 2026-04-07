/**
 * Predictive Behavior Section - Phase 16
 * Proactive behavior predictions and risk detection
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PredictiveBehaviorIntelligence } from '../../types/predictiveBehavior';

interface Props {
  predictiveBehavior: PredictiveBehaviorIntelligence;
}

const RISK_COLORS = {
  low: '#22C55E',
  moderate: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

const RISK_ICONS = {
  low: '✓',
  moderate: '⚠️',
  high: '⚠️',
  critical: '🚨',
};

export const PredictiveBehaviorSection: React.FC<Props> = ({ predictiveBehavior }) => {
  const [expanded, setExpanded] = useState(false);

  const { risks, predictions, insights, overallRiskLevel, predictedDayScore, confidence } = predictiveBehavior;

  const riskColor = RISK_COLORS[overallRiskLevel];
  const riskIcon = RISK_ICONS[overallRiskLevel];

  if (risks.length === 0 && predictions.length === 0 && insights.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔮</Text>
        <Text style={styles.emptyText}>Building predictive intelligence</Text>
        <Text style={styles.emptySubtext}>More predictions will appear as patterns emerge</Text>
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
          <Text style={styles.sectionTitle}>PREDICTIVE BEHAVIOR INTELLIGENCE</Text>
          <View style={styles.headerSummary}>
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskBadgeText}>
                {riskIcon} {overallRiskLevel.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.predictedScore}>
              Predicted: {predictedDayScore}%
            </Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* Compact Status (Always Visible) */}
      {!expanded && risks.length > 0 && (
        <View style={styles.compactStatus}>
          <Text style={styles.compactText}>
            {risks.length} risk{risks.length !== 1 ? 's' : ''} detected
          </Text>
          {risks[0] && (
            <Text style={styles.compactRisk} numberOfLines={1}>
              {risks[0].predictedFailure}
            </Text>
          )}
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Behavior Risks */}
          {risks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Behavior Risks</Text>
              {risks.map((risk) => (
                <View key={risk.id} style={[styles.riskCard, { borderLeftColor: RISK_COLORS[risk.riskLevel] }]}>
                  <View style={styles.riskHeader}>
                    <View style={styles.riskTitleRow}>
                      <Text style={styles.domainIcon}>
                        {risk.domain === 'workout' ? '💪' :
                         risk.domain === 'recovery' ? '🛌' :
                         risk.domain === 'nutrition' ? '🥗' : '💊'}
                      </Text>
                      <Text style={styles.riskTitle}>{risk.predictedFailure}</Text>
                    </View>
                    <View style={[styles.riskLevelBadge, { backgroundColor: RISK_COLORS[risk.riskLevel] }]}>
                      <Text style={styles.riskLevelText}>{risk.riskLevel.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.probabilityRow}>
                    <Text style={styles.probabilityLabel}>Probability:</Text>
                    <Text style={styles.probabilityValue}>{Math.round(risk.probability * 100)}%</Text>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <Text style={styles.confidenceValue}>{Math.round(risk.confidence * 100)}%</Text>
                  </View>

                  <View style={styles.mitigationBox}>
                    <Text style={styles.mitigationLabel}>💡 Recommended Mitigation:</Text>
                    <Text style={styles.mitigationText}>{risk.recommendedMitigation}</Text>
                  </View>

                  {risk.evidence.length > 0 && (
                    <View style={styles.evidenceSection}>
                      <Text style={styles.evidenceLabel}>Evidence:</Text>
                      {risk.evidence.map((item, idx) => (
                        <Text key={idx} style={styles.evidenceItem}>• {item}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Behavior Predictions */}
          {predictions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Predictions</Text>
              {predictions.slice(0, 3).map((prediction) => (
                <View key={prediction.id} style={styles.predictionCard}>
                  <View style={styles.predictionHeader}>
                    <Text style={styles.predictionType}>
                      {prediction.predictionType === 'adherenceRisk' ? '⚠️ Adherence Risk' :
                       prediction.predictionType === 'executionDrift' ? '⏱️ Execution Drift' :
                       prediction.predictionType === 'completionLikelihood' ? '✓ Completion' :
                       '🎯 Intervention'}
                    </Text>
                    <Text style={styles.predictionProbability}>
                      {Math.round(prediction.probability * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.predictionExplanation}>{prediction.explanation}</Text>
                  {prediction.recommendedAction && (
                    <View style={styles.actionBox}>
                      <Text style={styles.actionText}>→ {prediction.recommendedAction}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Behavior Insights */}
          {insights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Insights</Text>
              {insights.map((insight) => (
                <View key={insight.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>
                      {insight.type === 'pattern' ? '🔍' :
                       insight.type === 'correlation' ? '🔗' :
                       insight.type === 'optimization' ? '⚡' : '⚠️'}
                    </Text>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                  </View>
                  {insight.recommendation && (
                    <View style={styles.recommendationBox}>
                      <Text style={styles.recommendationText}>💡 {insight.recommendation}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Confidence Indicator */}
          <View style={styles.confidenceIndicator}>
            <Text style={styles.confidenceIndicatorLabel}>Prediction Confidence:</Text>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${confidence * 100}%` }]} />
            </View>
            <Text style={styles.confidenceIndicatorValue}>{Math.round(confidence * 100)}%</Text>
          </View>
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
    marginBottom: 8,
  },
  headerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  predictedScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  expandIcon: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 12,
  },
  compactStatus: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  compactRisk: {
    fontSize: 12,
    color: '#94A3B8',
  },
  expandedContent: {
    gap: 4,
  },
  section: {
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
  riskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  riskHeader: {
    marginBottom: 10,
  },
  riskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  domainIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  riskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  riskLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  riskLevelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  probabilityLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  probabilityValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  confidenceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  mitigationBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  mitigationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  mitigationText: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 16,
  },
  evidenceSection: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  evidenceItem: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 2,
  },
  predictionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  predictionProbability: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EAB308',
  },
  predictionExplanation: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 8,
  },
  actionBox: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  insightDescription: {
    flex: 1,
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 16,
  },
  recommendationBox: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  recommendationText: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
  },
  confidenceIndicator: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceIndicatorLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  confidenceIndicatorValue: {
    fontSize: 12,
    fontWeight: '700',
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
