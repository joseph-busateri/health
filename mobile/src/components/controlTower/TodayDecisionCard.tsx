/**
 * Today's Decision Card - Hero Section
 * 
 * Purpose: Display the AI's primary decision for today
 * This is the most prominent section in the Control Tower
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TodayDecision } from '../../types/controlTower';

interface Props {
  decision: TodayDecision;
  onAccept?: () => void;
  onModify?: () => void;
  onViewDetails?: () => void;
}

const DECISION_ICONS: Record<string, string> = {
  train_normal: '💪',
  train_reduced: '⚡',
  recovery_focus: '🛌',
  maintain_plan: '✅',
  reduce_intensity: '⬇️',
  rest_day: '🌙',
};

const CONFIDENCE_COLORS = {
  high: '#22C55E',
  medium: '#EAB308',
  low: '#F97316',
};

const RISK_COLORS = {
  low: '#22C55E',
  moderate: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

export const TodayDecisionCard: React.FC<Props> = ({
  decision,
  onAccept,
  onModify,
  onViewDetails,
}) => {
  const icon = DECISION_ICONS[decision.decisionType] || '📋';
  const confidenceColor = CONFIDENCE_COLORS[decision.confidence];
  const riskColor = RISK_COLORS[decision.fatigueRisk];

  return (
    <View style={styles.heroCard}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>TODAY'S AI DECISION</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
          <Text style={styles.confidenceBadgeText}>
            {decision.confidence.toUpperCase()} CONFIDENCE
          </Text>
        </View>
      </View>

      {/* Decision Title */}
      <View style={styles.titleRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{decision.title}</Text>
      </View>

      {/* Summary */}
      <Text style={styles.summary}>{decision.summary}</Text>

      {/* Status Grid */}
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Recovery</Text>
          <Text style={styles.statusValue}>{decision.recoveryStatus.score}</Text>
          <Text style={styles.statusSubtext}>{decision.recoveryStatus.label}</Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Fatigue Risk</Text>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Text style={styles.riskBadgeText}>{decision.fatigueRisk.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Rationale */}
      <View style={styles.rationaleSection}>
        <Text style={styles.rationaleLabel}>AI RATIONALE</Text>
        <Text style={styles.rationaleText}>{decision.rationale}</Text>
      </View>

      {/* Adjustments */}
      {decision.adjustments.length > 0 && (
        <View style={styles.adjustmentsSection}>
          <Text style={styles.adjustmentsLabel}>KEY ADJUSTMENTS</Text>
          {decision.adjustments.map((adjustment, index) => (
            <View key={index} style={styles.adjustmentRow}>
              <Text style={styles.adjustmentBullet}>•</Text>
              <Text style={styles.adjustmentText}>{adjustment}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {decision.canAccept && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onAccept}
          >
            <Text style={styles.primaryButtonText}>✓ Accept Plan</Text>
          </TouchableOpacity>
        )}

        {decision.canModify && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onModify}
          >
            <Text style={styles.secondaryButtonText}>⚙️ Modify</Text>
          </TouchableOpacity>
        )}
      </View>

      {onViewDetails && (
        <TouchableOpacity style={styles.detailsLink} onPress={onViewDetails}>
          <Text style={styles.detailsLinkText}>View Full Analysis →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    lineHeight: 32,
  },
  summary: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 13,
    color: '#94A3B8',
  },
  statusDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rationaleSection: {
    marginBottom: 16,
  },
  rationaleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rationaleText: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  adjustmentsSection: {
    marginBottom: 20,
  },
  adjustmentsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  adjustmentRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  adjustmentBullet: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 8,
    marginTop: 2,
  },
  adjustmentText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#334155',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  detailsLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
