/**
 * Adherence Summary Card - Phase 15
 * Overall adherence metrics by domain
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AdherenceSummary } from '../../types/execution';

interface Props {
  adherence: AdherenceSummary;
}

const DOMAIN_LABELS = {
  workout: 'Workout',
  recovery: 'Recovery',
  nutrition: 'Nutrition',
  supplements: 'Supplements',
};

const DOMAIN_ICONS = {
  workout: '💪',
  recovery: '🛌',
  nutrition: '🥗',
  supplements: '💊',
};

export const AdherenceSummaryCard: React.FC<Props> = ({ adherence }) => {
  const overallColor = 
    adherence.overallScore >= 80 ? '#22C55E' :
    adherence.overallScore >= 60 ? '#EAB308' :
    adherence.overallScore >= 40 ? '#F97316' : '#EF4444';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adherence Intelligence</Text>
        <View style={[styles.overallBadge, { backgroundColor: overallColor }]}>
          <Text style={styles.overallScore}>{adherence.overallScore}%</Text>
        </View>
      </View>

      <View style={styles.domainsContainer}>
        {adherence.domains.map((domain) => {
          const domainColor = 
            domain.score >= 80 ? '#22C55E' :
            domain.score >= 60 ? '#EAB308' :
            domain.score >= 40 ? '#F97316' : '#EF4444';

          const icon = DOMAIN_ICONS[domain.domain];
          const label = DOMAIN_LABELS[domain.domain];

          return (
            <View key={domain.domain} style={styles.domainRow}>
              <View style={styles.domainHeader}>
                <Text style={styles.domainIcon}>{icon}</Text>
                <Text style={styles.domainLabel}>{label}</Text>
              </View>

              <View style={styles.domainStats}>
                <Text style={styles.domainTasks}>
                  {domain.completedTasks}/{domain.totalTasks}
                </Text>
                <View style={styles.domainProgressBar}>
                  <View 
                    style={[
                      styles.domainProgressFill, 
                      { width: `${domain.score}%`, backgroundColor: domainColor }
                    ]} 
                  />
                </View>
                <Text style={[styles.domainScore, { color: domainColor }]}>
                  {domain.score}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {adherence.streak > 0 && (
        <View style={styles.streakBox}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>
            {adherence.streak} day streak
          </Text>
        </View>
      )}

      <View style={styles.averagesRow}>
        <View style={styles.averageItem}>
          <Text style={styles.averageLabel}>Weekly Avg</Text>
          <Text style={styles.averageValue}>{adherence.weeklyAverage}%</Text>
        </View>
        <View style={styles.averageDivider} />
        <View style={styles.averageItem}>
          <Text style={styles.averageLabel}>Monthly Avg</Text>
          <Text style={styles.averageValue}>{adherence.monthlyAverage}%</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  overallBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overallScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  domainsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  domainRow: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  domainIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  domainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  domainStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  domainTasks: {
    fontSize: 12,
    color: '#94A3B8',
    minWidth: 40,
  },
  domainProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  domainProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  domainScore: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  averagesRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
  },
  averageItem: {
    flex: 1,
    alignItems: 'center',
  },
  averageDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  averageLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
});
