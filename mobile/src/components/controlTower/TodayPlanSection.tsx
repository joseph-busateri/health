/**
 * Today's Plan Section
 * Unified daily execution plan across all health domains
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TodayPlan } from '../../types/controlTower';

interface Props {
  plan: TodayPlan;
}

const DOMAIN_ICONS = {
  workout: '💪',
  recovery: '🛌',
  nutrition: '🥗',
  supplements: '💊',
};

const DOMAIN_COLORS = {
  workout: '#3B82F6',
  recovery: '#8B5CF6',
  nutrition: '#10B981',
  supplements: '#F59E0B',
};

export const TodayPlanSection: React.FC<Props> = ({ plan }) => {
  const planItems = [plan.workout, plan.recovery, plan.nutrition, plan.supplements].filter(Boolean);

  if (planItems.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No plan available</Text>
        <Text style={styles.emptySubtext}>Complete your daily check-in to generate your AI plan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>TODAY'S AI-ORCHESTRATED PLAN</Text>
      {planItems.map((item) => {
        if (!item) return null;
        
        const icon = DOMAIN_ICONS[item.domain];
        const color = DOMAIN_COLORS[item.domain];

        return (
          <View key={item.domain} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleRow}>
                <Text style={styles.planIcon}>{icon}</Text>
                <Text style={styles.planTitle}>{item.title}</Text>
              </View>
              {item.reason && (
                <Text style={styles.planReason}>{item.reason}</Text>
              )}
            </View>

            <Text style={styles.planRecommendation}>{item.recommendation}</Text>

            {item.adjustments && item.adjustments.length > 0 && (
              <View style={styles.adjustmentsBox}>
                <Text style={styles.adjustmentsLabel}>Adjustments:</Text>
                {item.adjustments.map((adjustment, index) => (
                  <View key={index} style={styles.adjustmentRow}>
                    <View style={[styles.adjustmentDot, { backgroundColor: color }]} />
                    <Text style={styles.adjustmentText}>{adjustment}</Text>
                  </View>
                ))}
              </View>
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
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    marginBottom: 12,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  planReason: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 28,
  },
  planRecommendation: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  adjustmentsBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
  },
  adjustmentsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  adjustmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  adjustmentText: {
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
