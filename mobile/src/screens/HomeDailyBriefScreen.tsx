import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DashboardCard from '../components/DashboardCard';
import controlTowerDailyService, {
  type ControlTowerDailyResponse,
} from '../services/controlTowerDailyService';
import type { DashboardScreenNavigationProp } from '../types/navigation';

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

const STATUS_COLORS: Record<
  'optimal' | 'moderate' | 'constrained' | 'high_risk',
  { background: string; accent: string; text: string }
> = {
  optimal: { background: '#DCFCE7', accent: '#22C55E', text: '#166534' },
  moderate: { background: '#FEF9C3', accent: '#EAB308', text: '#92400E' },
  constrained: { background: '#FED7AA', accent: '#F97316', text: '#9A3412' },
  high_risk: { background: '#FEE2E2', accent: '#EF4444', text: '#991B1B' },
};

const STATUS_LABELS: Record<'optimal' | 'moderate' | 'constrained' | 'high_risk', string> = {
  optimal: 'Optimal',
  moderate: 'Moderate',
  constrained: 'Constrained',
  high_risk: 'High Risk',
};

const PRIORITY_COLORS: Record<'critical' | 'important' | 'optimization', string> = {
  critical: '#EF4444',
  important: '#F97316',
  optimization: '#3B82F6',
};

const ALERT_COLORS: Record<'low' | 'moderate' | 'high', string> = {
  low: '#3B82F6',
  moderate: '#F97316',
  high: '#EF4444',
};

const HomeDailyBriefScreen: React.FC<Props> = ({ navigation }) => {
  const [dailyBrief, setDailyBrief] = useState<ControlTowerDailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyBrief = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await controlTowerDailyService.getToday(USER_ID, !initial);
      setDailyBrief(data);
      setError(null);
    } catch (err) {
      setError('Unable to load your daily brief. Please try again.');
      console.error('Failed to fetch daily brief:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDailyBrief(true);
    }, [fetchDailyBrief]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => navigation.navigate('DailyCheckIn')}
        >
          <Text style={styles.checkInButtonText}>Daily Check-In</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your daily brief...</Text>
      </View>
    );
  }

  if (error || !dailyBrief) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDailyBrief(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusPalette = STATUS_COLORS[dailyBrief.overallStatus];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchDailyBrief(false)} />
        }
      >
        {/* Overall Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusPalette.background }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Today's Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusPalette.accent }]}>
              <Text style={styles.statusBadgeText}>
                {STATUS_LABELS[dailyBrief.overallStatus]}
              </Text>
            </View>
          </View>
          <Text style={styles.headline}>{dailyBrief.headline}</Text>
          <Text style={[styles.reasoning, { color: statusPalette.text }]}>
            {dailyBrief.reasoning}
          </Text>
          {dailyBrief.trust && (
            <View style={styles.trustIndicator}>
              <Text style={styles.trustText}>
                Data: {dailyBrief.trust.dataAvailabilityState}
              </Text>
              {dailyBrief.trust.lastUpdated && (
                <Text style={styles.trustText}>
                  Updated: {new Date(dailyBrief.trust.lastUpdated).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Top Priorities */}
        {dailyBrief.priorities && dailyBrief.priorities.length > 0 && (
          <DashboardCard title="Top Priorities">
            <View style={styles.prioritiesContainer}>
              {dailyBrief.priorities.map((priority, index) => (
                <View key={index} style={styles.priorityItem}>
                  <View
                    style={[
                      styles.priorityIndicator,
                      { backgroundColor: PRIORITY_COLORS[priority.priority] },
                    ]}
                  />
                  <View style={styles.priorityContent}>
                    <Text style={styles.priorityTitle}>{priority.title}</Text>
                    <Text style={styles.prioritySource}>Source: {priority.source}</Text>
                    {priority.actions && priority.actions.length > 0 && (
                      <View style={styles.actionsContainer}>
                        {priority.actions.map((action, actionIndex) => (
                          <Text key={actionIndex} style={styles.actionText}>
                            • {action}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </DashboardCard>
        )}

        {/* Predictive Alerts */}
        {dailyBrief.predictiveAlerts && dailyBrief.predictiveAlerts.length > 0 && (
          <DashboardCard title="Predictive Alerts">
            <View style={styles.alertsContainer}>
              {dailyBrief.predictiveAlerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <View
                    style={[styles.alertIndicator, { backgroundColor: ALERT_COLORS[alert.level] }]}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    {alert.rationale && (
                      <Text style={styles.alertRationale}>{alert.rationale}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </DashboardCard>
        )}

        {/* Workout Summary */}
        {dailyBrief.workout && (
          <DashboardCard title={dailyBrief.workout.title}>
            <Text style={styles.cardSummary}>{dailyBrief.workout.summary}</Text>
            {dailyBrief.workout.workoutType && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Type:</Text>
                <Text style={styles.metadataValue}>{dailyBrief.workout.workoutType}</Text>
              </View>
            )}
            {dailyBrief.workout.cycleWeek != null && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Cycle Week:</Text>
                <Text style={styles.metadataValue}>{dailyBrief.workout.cycleWeek}</Text>
              </View>
            )}
            {dailyBrief.workout.cyclePhase && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Phase:</Text>
                <Text style={styles.metadataValue}>{dailyBrief.workout.cyclePhase}</Text>
              </View>
            )}
            {dailyBrief.workout.topAdjustments && dailyBrief.workout.topAdjustments.length > 0 && (
              <View style={styles.adjustmentsContainer}>
                <Text style={styles.adjustmentsLabel}>Adjustments:</Text>
                {dailyBrief.workout.topAdjustments.map((adjustment, index) => (
                  <Text key={index} style={styles.adjustmentText}>
                    • {adjustment}
                  </Text>
                ))}
              </View>
            )}
          </DashboardCard>
        )}

        {/* Nutrition Summary */}
        {dailyBrief.nutrition && (
          <DashboardCard title={dailyBrief.nutrition.title}>
            <Text style={styles.cardSummary}>{dailyBrief.nutrition.summary}</Text>
            <View style={styles.macrosGrid}>
              {dailyBrief.nutrition.calories != null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <Text style={styles.macroValue}>{dailyBrief.nutrition.calories}</Text>
                </View>
              )}
              {dailyBrief.nutrition.protein != null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{dailyBrief.nutrition.protein}g</Text>
                </View>
              )}
              {dailyBrief.nutrition.carbs != null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{dailyBrief.nutrition.carbs}g</Text>
                </View>
              )}
              {dailyBrief.nutrition.fats != null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fats</Text>
                  <Text style={styles.macroValue}>{dailyBrief.nutrition.fats}g</Text>
                </View>
              )}
              {dailyBrief.nutrition.hydrationOz != null && (
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Hydration</Text>
                  <Text style={styles.macroValue}>{dailyBrief.nutrition.hydrationOz}oz</Text>
                </View>
              )}
            </View>
            {dailyBrief.nutrition.topAdjustments &&
              dailyBrief.nutrition.topAdjustments.length > 0 && (
                <View style={styles.adjustmentsContainer}>
                  <Text style={styles.adjustmentsLabel}>Adjustments:</Text>
                  {dailyBrief.nutrition.topAdjustments.map((adjustment, index) => (
                    <Text key={index} style={styles.adjustmentText}>
                      • {adjustment}
                    </Text>
                  ))}
                </View>
              )}
          </DashboardCard>
        )}

        {/* Quick Actions */}
        {dailyBrief.quickActions && (
          <DashboardCard title="Quick Actions">
            <View style={styles.quickActionsGrid}>
              {dailyBrief.quickActions.viewWorkout && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => navigation.navigate('WorkoutToday' as any)}
                >
                  <Text style={styles.quickActionText}>View Workout</Text>
                </TouchableOpacity>
              )}
              {dailyBrief.quickActions.viewNutrition && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => console.log('View Nutrition')}
                >
                  <Text style={styles.quickActionText}>View Nutrition</Text>
                </TouchableOpacity>
              )}
              {dailyBrief.quickActions.viewPriorities && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => console.log('View Priorities')}
                >
                  <Text style={styles.quickActionText}>View Priorities</Text>
                </TouchableOpacity>
              )}
              {dailyBrief.quickActions.askCoach && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => console.log('Ask Coach')}
                >
                  <Text style={styles.quickActionText}>Ask Coach</Text>
                </TouchableOpacity>
              )}
            </View>
          </DashboardCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#475569',
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#1F2937',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 28,
  },
  reasoning: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  trustIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  prioritiesContainer: {
    gap: 16,
  },
  priorityItem: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
  },
  priorityContent: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  prioritySource: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  actionsContainer: {
    marginTop: 6,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  alertsContainer: {
    gap: 16,
  },
  alertItem: {
    flexDirection: 'row',
    gap: 12,
  },
  alertIndicator: {
    width: 4,
    borderRadius: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  alertRationale: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  cardSummary: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  adjustmentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  adjustmentsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adjustmentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  macroItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    minWidth: '30%',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: '47%',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeDailyBriefScreen;
