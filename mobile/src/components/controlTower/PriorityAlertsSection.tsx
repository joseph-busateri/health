/**
 * Priority Alerts Section
 * Displays ranked alerts requiring user attention
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PriorityAlert } from '../../types/controlTower';

interface Props {
  alerts: PriorityAlert[];
}

const PRIORITY_COLORS = {
  critical: '#EF4444',
  important: '#F97316',
  optimization: '#3B82F6',
};

const PRIORITY_LABELS = {
  critical: '🚨 CRITICAL',
  important: '⚠️ HIGH PRIORITY',
  optimization: '💡 OPTIMIZATION',
};

export const PriorityAlertsSection: React.FC<Props> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>✅</Text>
        <Text style={styles.emptyText}>No priority alerts today</Text>
        <Text style={styles.emptySubtext}>All systems optimal</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PRIORITY ALERTS</Text>
      {alerts.map((alert) => (
        <View key={alert.id} style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[alert.priority] }]}>
              <Text style={styles.priorityBadgeText}>{PRIORITY_LABELS[alert.priority]}</Text>
            </View>
            <Text style={styles.sourceLabel}>{alert.source}</Text>
          </View>

          <Text style={styles.alertTitle}>{alert.title}</Text>
          
          {alert.description && (
            <Text style={styles.alertDescription}>{alert.description}</Text>
          )}

          {alert.evidence && alert.evidence.length > 0 && (
            <View style={styles.evidenceSection}>
              <Text style={styles.evidenceLabel}>Evidence:</Text>
              {alert.evidence.map((item, index) => (
                <Text key={index} style={styles.evidenceItem}>• {item}</Text>
              ))}
            </View>
          )}

          {alert.action && (
            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>Recommended Action:</Text>
              <Text style={styles.actionText}>{alert.action}</Text>
            </View>
          )}
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
  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sourceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
    lineHeight: 22,
  },
  alertDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  evidenceSection: {
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  evidenceItem: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginLeft: 8,
  },
  actionBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
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
    fontSize: 14,
    color: '#F1F5F9',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
