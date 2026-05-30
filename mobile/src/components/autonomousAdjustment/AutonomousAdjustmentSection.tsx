/**
 * Autonomous Adjustment Section - Phase 17
 * System-generated plan adjustments with user confirmation
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AutonomousAdjustmentIntelligence } from '../../types/autonomousAdjustment';

interface Props {
  adjustments: AutonomousAdjustmentIntelligence;
  onAcceptAdjustment: (adjustmentId: string) => void;
  onDismissAdjustment: (adjustmentId: string) => void;
}

const ADJUSTMENT_ICONS = {
  reduceIntensity: '📉',
  increaseRecovery: '🛌',
  simplifyPlan: '✂️',
  adjustNutrition: '🥗',
  increaseHydration: '💧',
  addRest: '😴',
  modifyTiming: '⏰',
  splitTask: '✂️',
};

const IMPACT_COLORS = {
  minor: '#3B82F6',
  moderate: '#EAB308',
  major: '#F97316',
};

export const AutonomousAdjustmentSection: React.FC<Props> = ({
  adjustments,
  onAcceptAdjustment,
  onDismissAdjustment,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { pendingAdjustments, appliedAdjustments } = adjustments;

  if (pendingAdjustments.length === 0 && appliedAdjustments.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🤖</Text>
        <Text style={styles.emptyText}>No autonomous adjustments needed</Text>
        <Text style={styles.emptySubtext}>Your plan is on track</Text>
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
          <Text style={styles.sectionTitle}>AUTONOMOUS PLAN ADJUSTMENT</Text>
          <Text style={styles.headerSummary}>
            {pendingAdjustments.length} adjustment{pendingAdjustments.length !== 1 ? 's' : ''} recommended
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* Compact Status (Always Visible) */}
      {!expanded && pendingAdjustments.length > 0 && (
        <View style={styles.compactStatus}>
          <Text style={styles.compactIcon}>
            {ADJUSTMENT_ICONS[pendingAdjustments[0].adjustmentType]}
          </Text>
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {pendingAdjustments[0].reason}
            </Text>
            <Text style={styles.compactDomain}>
              {pendingAdjustments[0].domain.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Pending Adjustments */}
          {pendingAdjustments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Recommended Adjustments</Text>
              {pendingAdjustments.map((adjustment) => {
                const icon = ADJUSTMENT_ICONS[adjustment.adjustmentType];
                const impactColor = IMPACT_COLORS[adjustment.impact];

                return (
                  <View key={adjustment.id} style={styles.adjustmentCard}>
                    <View style={styles.adjustmentHeader}>
                      <Text style={styles.adjustmentIcon}>{icon}</Text>
                      <View style={styles.adjustmentTitleSection}>
                        <View style={styles.adjustmentTitleRow}>
                          <Text style={styles.adjustmentDomain}>
                            {adjustment.domain.toUpperCase()}
                          </Text>
                          <View style={[styles.impactBadge, { backgroundColor: impactColor }]}>
                            <Text style={styles.impactText}>
                              {adjustment.impact.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.adjustmentType}>
                          {adjustment.adjustmentType.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.adjustmentReason}>{adjustment.reason}</Text>

                    {(adjustment.originalValue || adjustment.adjustedValue) && (
                      <View style={styles.changeBox}>
                        {adjustment.originalValue && (
                          <View style={styles.changeRow}>
                            <Text style={styles.changeLabel}>Current:</Text>
                            <Text style={styles.changeValue}>{adjustment.originalValue}</Text>
                          </View>
                        )}
                        {adjustment.adjustedValue && (
                          <View style={styles.changeRow}>
                            <Text style={styles.changeLabel}>Adjusted:</Text>
                            <Text style={[styles.changeValue, styles.adjustedValue]}>
                              {adjustment.adjustedValue}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.outcomeBox}>
                      <Text style={styles.outcomeLabel}>Expected Outcome:</Text>
                      <Text style={styles.outcomeText}>{adjustment.expectedOutcome}</Text>
                    </View>

                    <View style={styles.metadataRow}>
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>Confidence:</Text>
                        <Text style={styles.metadataValue}>
                          {Math.round(adjustment.confidence * 100)}%
                        </Text>
                      </View>
                      <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>Reversible:</Text>
                        <Text style={styles.metadataValue}>
                          {adjustment.reversible ? '✓ Yes' : '✗ No'}
                        </Text>
                      </View>
                    </View>

                    {adjustment.triggers.length > 0 && (
                      <View style={styles.triggersSection}>
                        <Text style={styles.triggersLabel}>Triggers:</Text>
                        {adjustment.triggers.map((trigger, idx) => (
                          <Text key={idx} style={styles.triggerItem}>• {trigger}</Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => onAcceptAdjustment(adjustment.id)}
                      >
                        <Text style={styles.acceptButtonText}>✓ Accept Adjustment</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.dismissButton]}
                        onPress={() => onDismissAdjustment(adjustment.id)}
                      >
                        <Text style={styles.dismissButtonText}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Applied Adjustments */}
          {appliedAdjustments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Applied Adjustments</Text>
              {appliedAdjustments.map((adjustment) => (
                <View key={adjustment.id} style={styles.appliedCard}>
                  <View style={styles.appliedHeader}>
                    <Text style={styles.appliedIcon}>✓</Text>
                    <Text style={styles.appliedText}>{adjustment.reason}</Text>
                  </View>
                  {adjustment.appliedAt && (
                    <Text style={styles.appliedTime}>
                      Applied at {new Date(adjustment.appliedAt).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Adjustment Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Adjustments:</Text>
              <Text style={styles.summaryValue}>{adjustments.adjustmentCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Auto-Applied:</Text>
              <Text style={styles.summaryValue}>{adjustments.autoAppliedCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>User Confirmed:</Text>
              <Text style={styles.summaryValue}>{adjustments.userConfirmedCount}</Text>
            </View>
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
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  compactDomain: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
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
  adjustmentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  adjustmentIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  adjustmentTitleSection: {
    flex: 1,
  },
  adjustmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adjustmentDomain: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adjustmentType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    textTransform: 'capitalize',
  },
  adjustmentReason: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 10,
  },
  changeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    width: 70,
  },
  changeValue: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
  },
  adjustedValue: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  outcomeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  outcomeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 4,
  },
  outcomeText: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  triggersSection: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  triggersLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  triggerItem: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 2,
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
  acceptButton: {
    backgroundColor: '#22C55E',
  },
  acceptButtonText: {
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
  appliedCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  appliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appliedIcon: {
    fontSize: 16,
    color: '#22C55E',
    marginRight: 8,
  },
  appliedText: {
    flex: 1,
    fontSize: 12,
    color: '#CBD5E1',
  },
  appliedTime: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 14,
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
