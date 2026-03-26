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
import DashboardCard from '../components/DashboardCard';
import api from '../services/api';
import type { DashboardScreenNavigationProp } from '../types/navigation';

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

const formatDate = (value: string | undefined) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get<DashboardSummary>(`/dashboard/${USER_ID}`);
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard(true);
    }, [fetchDashboard]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.checkInButton} onPress={() => navigation.navigate('DailyCheckIn')}>
          <Text style={styles.checkInButtonText}>Daily Check-In</Text>
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
        <View style={[styles.summaryCard, { backgroundColor: statusPalette.background }]}
        >
          <Text style={styles.summaryLabel}>Overall Health Score</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{dashboard?.overallHealthScore ?? '—'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusPalette.accent }]}>
              <Text style={[styles.statusBadgeText, { color: '#FFFFFF' }]}>{dashboard?.status ?? 'No Data'}</Text>
            </View>
          </View>
          <Text style={[styles.summarySubtext, { color: statusPalette.text }]}>Recovery Score: {dashboard?.recoveryScore ?? '—'}</Text>
        </View>

        <DashboardCard title="Daily Recommendation">
          <Text style={styles.cardBodyText}>{dashboard?.dailyRecommendation ?? 'No recommendation yet.'}</Text>
        </DashboardCard>

        <DashboardCard title="Trend Summary" subtitle="Deep dive into seven-day patterns">
          <Text style={styles.cardBodyText}>{dashboard?.trendSummary ?? 'No trend data available.'}</Text>
        </DashboardCard>

        <DashboardCard title="Latest Daily Log" subtitle={dashboard?.latestLog ? formatDate(dashboard.latestLog.date) : undefined}>
          {dashboard?.latestLog ? (
            <View style={styles.logGrid}>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Sleep Hours</Text>
                <Text style={styles.logValue}>{dashboard.latestLog.sleepHours}</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Recovery Feeling</Text>
                <Text style={styles.logValue}>{dashboard.latestLog.recoveryFeeling}</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Stress Level</Text>
                <Text style={styles.logValue}>{dashboard.latestLog.stressLevel}</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Workout Adherence</Text>
                <Text style={styles.logValue}>{dashboard.latestLog.workoutAdherence}%</Text>
              </View>
              {dashboard.latestLog.notes && (
                <View style={styles.logNotesContainer}>
                  <Text style={styles.logLabel}>Notes</Text>
                  <Text style={styles.logNotesText}>{dashboard.latestLog.notes}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.cardBodyText}>No check-ins yet. Log your first entry to unlock insights.</Text>
          )}
        </DashboardCard>

        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderTitle}>Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Future collapsible sections will surface deeper recovery analytics, training readiness, and habit trends.
          </Text>
        </View>
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
  summaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    color: '#1F2937',
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0F172A',
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
  summarySubtext: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardBodyText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  logGrid: {
    gap: 12,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  logValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  logNotesContainer: {
    marginTop: 8,
  },
  logNotesText: {
    marginTop: 6,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  placeholderSection: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
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
