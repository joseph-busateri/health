import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
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

import CollapsibleSection from '../components/CollapsibleSection';
import DashboardCard from '../components/DashboardCard';
import api from '../services/api';
import { fetchMealLogs } from '../services/mealLogs';
import { fetchLatestPhysiqueScan } from '../services/physiqueScans';
import type { DashboardScreenNavigationProp } from '../types/navigation';
import type { MealLog } from '../types/mealLog';
import type { PhysiqueScan } from '../types/physiqueScan';
import type { Reminder, ReminderListResponse } from '../types/reminder';

interface DashboardSummary {
  latestLog: {
    id: string;
    date: string;
    sleepHours: number;
    recoveryFeeling: number;
    stressLevel: number;
    workoutAdherence: number;
    notes?: string;
  } | null;
  recoveryScore: 'low' | 'moderate' | 'high' | null;
  overallHealthScore: number | null;
  status: 'Optimal' | 'Stable' | 'At Risk' | 'No Data';
  dailyRecommendation: string;
  trendSummary: string;
}

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

const STATUS_COLORS: Record<NonNullable<DashboardSummary['status']>, { background: string; accent: string; text: string }> = {
  Optimal: { background: '#DCFCE7', accent: '#22C55E', text: '#166534' },
  Stable: { background: '#FEF9C3', accent: '#EAB308', text: '#92400E' },
  'At Risk': { background: '#FEE2E2', accent: '#EF4444', text: '#991B1B' },
  'No Data': { background: '#E2E8F0', accent: '#94A3B8', text: '#475569' },
};

const formatDate = (value: string | undefined, withTime = false) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return withTime ? parsed.toLocaleString() : parsed.toLocaleDateString();
};

const workoutRecommendation = (adherence?: number) => {
  if (adherence === undefined || Number.isNaN(adherence)) {
    return 'Log workouts to receive intensity guidance.';
  }
  if (adherence >= 85) {
    return 'Consistency is strong—consider progressive overload.';
  }
  if (adherence >= 60) {
    return 'Maintain current load and focus on recovery quality.';
  }
  return 'Dial intensity to 70% and rebuild consistency this week.';
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [completingReminderId, setCompletingReminderId] = useState<string | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [mealLogsError, setMealLogsError] = useState<string | null>(null);
  const [latestPhysiqueScan, setLatestPhysiqueScan] = useState<PhysiqueScan | null>(null);
  const [physiqueError, setPhysiqueError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const response = await api.get<ReminderListResponse>(`/reminders/${USER_ID}`);
      setReminders(response.data.reminders);
      setDueReminders(response.data.dueReminders);
      setReminderError(null);
    } catch (err) {
      setReminderError('Unable to load reminders.');
    }
  }, []);

  const fetchMeals = useCallback(async () => {
    try {
      const response = await fetchMealLogs();
      setMealLogs(response.mealLogs);
      setMealLogsError(null);
    } catch (err) {
      setMealLogsError('Unable to load meal history.');
    }
  }, []);

  const fetchPhysique = useCallback(async () => {
    try {
      const scan = await fetchLatestPhysiqueScan();
      setLatestPhysiqueScan(scan);
      setPhysiqueError(null);
    } catch (err) {
      setPhysiqueError('Unable to load physique scan.');
    }
  }, []);

  const fetchDashboard = useCallback(
    async (initial = false) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const dashboardPromise = api.get<DashboardSummary>(`/dashboard/${USER_ID}`);
        const remindersPromise = fetchReminders();
        const mealPromise = fetchMeals();
        const physiquePromise = fetchPhysique();

        const [dashboardResponse] = await Promise.allSettled([dashboardPromise, remindersPromise, mealPromise, physiquePromise]);

        if (dashboardResponse.status === 'fulfilled') {
          setDashboard(dashboardResponse.value.data);
          setError(null);
        } else {
          setError('Unable to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchReminders, fetchMeals, fetchPhysique],
  );

  useFocusEffect(
    useCallback(() => {
      fetchDashboard(true);
    }, [fetchDashboard]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('DailyCheckIn')}>
          <Text style={styles.headerButtonText}>Daily Check-In</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const statusPalette = useMemo(() => {
    if (!dashboard?.status) {
      return STATUS_COLORS['No Data'];
    }
    return STATUS_COLORS[dashboard.status];
  }, [dashboard]);

  const latestLog = dashboard?.latestLog;
  const sexualHealthReminder = reminders.find((reminder) => reminder.reminderType === 'weekly_sexual_health');
  const physiqueReminder = reminders.find((reminder) => reminder.reminderType === 'monthly_physique_scan');
  const physiqueReminderDue = dueReminders.some((reminder) => reminder.reminderType === 'monthly_physique_scan');

  const handleCompleteReminder = useCallback(
    async (reminderId: string) => {
      try {
        setCompletingReminderId(reminderId);
        await api.post('/reminders/complete', {
          user_id: USER_ID,
          reminder_id: reminderId,
        });
        await Promise.all([fetchReminders(), fetchMeals(), fetchPhysique()]);
        const dashboardResponse = await api.get<DashboardSummary>(`/dashboard/${USER_ID}`);
        setDashboard(dashboardResponse.data);
      } catch (err) {
        setReminderError('Unable to update reminder.');
      } finally {
        setCompletingReminderId(null);
      }
    },
    [fetchReminders, fetchMeals, fetchPhysique],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboard(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(false)} />}
      >
        <CollapsibleSection
          title="Overall Health"
          subtitle="High-level view of your wellness state"
          rightAccessory={
            <View style={[styles.statusBadge, { backgroundColor: statusPalette.accent }]}> 
              <Text style={[styles.statusBadgeText, { color: '#FFFFFF' }]}>{dashboard?.status ?? 'No Data'}</Text>
            </View>
          }
        >
          <View style={styles.overallRow}>
            <View>
              <Text style={styles.overallLabel}>Score</Text>
              <Text style={styles.overallValue}>{dashboard?.overallHealthScore ?? '—'}</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallTrend}>
              <Text style={styles.overallLabel}>Trend</Text>
              <Text style={styles.cardBodyText}>{dashboard?.trendSummary ?? 'No trend data.'}</Text>
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          title="Recovery"
          subtitle="Sleep, stress, and readiness"
          initiallyExpanded
        >
          {latestLog ? (
            <>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Sleep Hours</Text>
                  <Text style={styles.metricValue}>{latestLog.sleepHours}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Stress Level</Text>
                  <Text style={styles.metricValue}>{latestLog.stressLevel}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Recovery Score</Text>
                  <Text style={styles.metricValue}>{dashboard?.recoveryScore ?? '—'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => navigation.navigate('RecoveryStatus', { userId: USER_ID })}
              >
                <Text style={styles.sectionActionText}>View Recovery Engine</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => navigation.navigate('StressStatus', { userId: USER_ID })}
              >
                <Text style={styles.sectionActionText}>View Stress / CNS Engine</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => navigation.navigate('JointHealthStatus', { userId: USER_ID })}
              >
                <Text style={styles.sectionActionText}>View Joint / Injury Engine</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => navigation.navigate('AdherenceStatus', { userId: USER_ID })}
              >
                <Text style={styles.sectionActionText}>View Adherence Engine</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => navigation.navigate('NotificationSettings')}
              >
                <Text style={styles.sectionActionText}>⏰ Notification Settings</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.placeholderText}>No recovery data yet. Log a daily check-in to unlock insights.</Text>
          )}
          <Text style={styles.recommendationLabel}>Recommendation</Text>
          <Text style={styles.cardBodyText}>{dashboard?.dailyRecommendation ?? 'No recommendation yet.'}</Text>
        </CollapsibleSection>

        <CollapsibleSection
          title="Workout"
          subtitle="Training adherence and guidance"
          initiallyExpanded={false}
        >
          {latestLog ? (
            <View>
              <Text style={styles.metricHighlight}>{latestLog.workoutAdherence}% adherence</Text>
              <Text style={styles.cardBodyText}>{workoutRecommendation(latestLog.workoutAdherence)}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Log workouts to tailor intensity guidance.</Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Bloodwork"
          subtitle="Lab results and AI recommendations"
          initiallyExpanded={false}
        >
          <DashboardCard title="Upload Bloodwork" subtitle="Add your lab results">
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('BloodworkUpload')}
            >
              <Text style={styles.headerButtonText}>Upload Results</Text>
            </TouchableOpacity>
          </DashboardCard>
          
          <DashboardCard title="View Recommendations" subtitle="AI-powered health insights">
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('BloodworkRecommendations', { userId: USER_ID })}
            >
              <Text style={styles.headerButtonText}>View Insights</Text>
            </TouchableOpacity>
          </DashboardCard>
        </CollapsibleSection>

        <CollapsibleSection
          title="Sexual Health"
          subtitle="Placeholder metrics"
          initiallyExpanded={false}
        >
          <DashboardCard title="Weekly Check-In" subtitle="Keeps you accountable">
            <Text style={styles.cardBodyText}>
              Last check-in: {sexualHealthReminder?.lastCompletedAt ? formatDate(sexualHealthReminder.lastCompletedAt, true) : 'Not yet completed'}
            </Text>
            <Text style={styles.cardBodyText}>
              Next due: {sexualHealthReminder ? formatDate(sexualHealthReminder.nextDueAt, true) : 'No reminder configured'}
            </Text>
            <Text style={styles.placeholderText}>Future metrics: libido, performance, and tailored guidance.</Text>
          </DashboardCard>
        </CollapsibleSection>

        <CollapsibleSection
          title="Nutrition"
          subtitle="Meal photos and upcoming analysis"
          initiallyExpanded={false}
          rightAccessory={
            <TouchableOpacity style={styles.miniButton} onPress={() => navigation.navigate('MealPhoto')}>
              <Text style={styles.miniButtonText}>Log Meal</Text>
            </TouchableOpacity>
          }
        >
          <Text style={styles.cardBodyText}>Meals logged (last week): {mealLogs.length}</Text>
          {mealLogsError ? (
            <Text style={styles.errorText}>{mealLogsError}</Text>
          ) : mealLogs.length === 0 ? (
            <Text style={styles.placeholderText}>Capture your first meal photo to see history here.</Text>
          ) : (
            <View style={styles.mealList}>
              {mealLogs.slice(0, 3).map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <View style={styles.mealThumb}>
                    <Text style={styles.mealThumbText}>{meal.mealLabel ? meal.mealLabel.charAt(0).toUpperCase() : 'M'}</Text>
                  </View>
                  <View style={styles.mealTextGroup}>
                    <Text style={styles.mealTitle}>{meal.mealLabel ? meal.mealLabel.toUpperCase() : 'MEAL'}</Text>
                    <Text style={styles.mealMeta}>{formatDate(meal.takenAt, true)}</Text>
                    {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.placeholderText}>Future: macro breakdowns, CGM overlays, and hydration insights.</Text>
        </CollapsibleSection>

        <CollapsibleSection
          title="Physique / Body Scan"
          subtitle={
            physiqueError
              ? physiqueError
              : physiqueReminderDue
                ? 'Monthly scan is due'
                : physiqueReminder?.nextDueAt
                  ? `Next due: ${formatDate(physiqueReminder.nextDueAt, false)}`
                  : 'Capture monthly to track physique changes'
          }
          initiallyExpanded={false}
          rightAccessory={
            <TouchableOpacity style={styles.miniButton} onPress={() => navigation.navigate('PhysiqueScan')}>
              <Text style={styles.miniButtonText}>Start Scan</Text>
            </TouchableOpacity>
          }
        >
          <Text style={styles.cardBodyText}>
            Last scan: {latestPhysiqueScan ? formatDate(latestPhysiqueScan.takenAt, true) : 'No scans recorded'}
          </Text>
          {latestPhysiqueScan?.notes ? (
            <Text style={styles.placeholderText}>Latest notes: {latestPhysiqueScan.notes}</Text>
          ) : (
            <Text style={styles.placeholderText}>Add notes to capture focus areas or observations.</Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Reminders"
          subtitle={reminderError ?? 'Stay on cadence across foundational domains'}
          initiallyExpanded={false}
        >
          {dueReminders.length === 0 ? (
            <Text style={styles.placeholderText}>All reminders are clear for now. Nice work!</Text>
          ) : (
            <View style={styles.reminderList}>
              {dueReminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderRow}>
                  <View style={styles.reminderTextGroup}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>
                    <Text style={styles.reminderMeta}>Due: {formatDate(reminder.nextDueAt, true)}</Text>
                  </View>
                  {reminder.reminderType === 'monthly_physique_scan' ? (
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('PhysiqueScan')}>
                      <Text style={styles.secondaryButtonText}>Start Scan</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.completeButton, completingReminderId === reminder.id && styles.completeButtonDisabled]}
                      onPress={() => handleCompleteReminder(reminder.id)}
                      disabled={completingReminderId === reminder.id}
                    >
                      {completingReminderId === reminder.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.completeButtonText}>Complete</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </CollapsibleSection>
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
  cardBodyText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  headerButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallLabel: {
    fontSize: 13,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  overallValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#0F172A',
  },
  overallDivider: {
    width: 1,
    height: 52,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
  },
  overallTrend: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#64748B',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendationLabel: {
    marginTop: 16,
    fontSize: 13,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metricHighlight: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#475569',
  },
  miniButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  miniButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  mealList: {
    marginTop: 16,
    gap: 12,
  },
  mealRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mealThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealThumbText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 18,
  },
  mealTextGroup: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  mealMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  mealNotes: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  reminderList: {
    gap: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  reminderTextGroup: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  reminderMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  completeButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  completeButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
});

export default DashboardScreen;
