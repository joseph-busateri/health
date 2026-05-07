import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type { RecoveryRecord } from '../types/recoveryEngine';
import { getRecoveryHistory, getRecoveryToday } from '../services/recoveryEngineService';
import { InputDetailsPanel } from '../components/InputDetailsPanel';

type Props = NativeStackScreenProps<RootStackParamList, 'RecoveryStatus'>;

const metricLabel = (key: string): string => {
  switch (key) {
    case 'hrv':
      return 'HRV';
    case 'sleepDurationHours':
      return 'Sleep Duration';
    case 'sleepQuality':
      return 'Sleep Quality';
    case 'restingHr':
      return 'Resting HR';
    case 'stressLevel':
      return 'Stress';
    case 'workoutLoad':
      return 'Workout Load';
    case 'verbalRecoveryFeeling':
      return 'Verbal Recovery';
    case 'adherenceScore':
      return 'Adherence';
    default:
      return key;
  }
};

const metricInterpretation = (key: string, value: number | null): string => {
  if (value === null) return 'No data';
  
  switch (key) {
    case 'hrv':
      if (value >= 60) return 'Excellent HRV';
      if (value >= 45) return 'Good HRV';
      if (value >= 30) return 'Moderate HRV';
      return 'Low HRV';
    case 'sleepDurationHours':
      if (value >= 8) return 'Optimal sleep';
      if (value >= 7) return 'Good sleep';
      if (value >= 6) return 'Adequate sleep';
      return 'Insufficient sleep';
    case 'sleepQuality':
      if (value >= 80) return 'Excellent sleep quality';
      if (value >= 60) return 'Good sleep quality';
      if (value >= 40) return 'Moderate sleep quality';
      return 'Poor sleep quality';
    case 'restingHr':
      if (value < 60) return 'Excellent resting HR';
      if (value < 70) return 'Good resting HR';
      if (value < 80) return 'Average resting HR';
      return 'Elevated resting HR';
    case 'stressLevel':
      if (value <= 2) return 'Low stress';
      if (value <= 3) return 'Moderate stress';
      return 'High stress';
    case 'workoutLoad':
      if (value >= 80) return 'High workout load';
      if (value >= 50) return 'Moderate workout load';
      return 'Light workout load';
    case 'verbalRecoveryFeeling':
      if (value >= 8) return 'Feeling great';
      if (value >= 6) return 'Feeling good';
      if (value >= 4) return 'Feeling okay';
      return 'Feeling poor';
    case 'adherenceScore':
      if (value >= 80) return 'Excellent adherence';
      if (value >= 60) return 'Good adherence';
      if (value >= 40) return 'Moderate adherence';
      return 'Poor adherence';
    default:
      return '';
  }
};

const formatMetricValue = (key: string, value: number | null): string => {
  if (value === null) return 'N/A';
  
  switch (key) {
    case 'sleepDurationHours':
      return `${value} hrs`;
    case 'stressLevel':
    case 'verbalRecoveryFeeling':
      return `${value}/10`;
    case 'adherenceScore':
    case 'sleepQuality':
    case 'workoutLoad':
      return `${value}%`;
    case 'restingHr':
      return `${value} bpm`;
    case 'hrv':
      return `${value} ms`;
    default:
      return String(value);
  }
};

const RecoveryStatusScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<RecoveryRecord | null>(null);
  const [history, setHistory] = useState<RecoveryRecord[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayResponse, historyResponse] = await Promise.all([
        getRecoveryToday(userId),
        getRecoveryHistory(userId),
      ]);
      setToday(todayResponse);
      setHistory(historyResponse);
      console.log('Recovery data loaded:', { todayResponse, sourceInputs: todayResponse?.sourceInputs });
      console.log('Recovery detailedInputs:', todayResponse?.detailedInputs);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load recovery data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !today) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'No recovery record found'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Recovery Status</Text>
      <Text style={styles.score}>{today.recoveryScore}/100</Text>
      <Text style={styles.subtitle}>{today.recoveryStatus.replace('_', ' ').toUpperCase()}</Text>
      <Text style={styles.readiness}>Readiness: {today.readinessClassification.replace('_', ' ')}</Text>

      {today.detailedInputs && today.detailedInputs.length > 0 && (
        <InputDetailsPanel
          inputs={today.detailedInputs}
          title="Recovery Inputs"
        />
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendation</Text>
        <Text style={styles.text}>{today.recommendation.summary}</Text>
        {today.recommendation.actions.map((action, index) => (
          <Text key={`action-${index}`} style={styles.bullet}>{`- ${action}`}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Signals</Text>
        {!today.sourceInputs || Object.keys(today.sourceInputs).length === 0 ? (
          <Text style={styles.text}>No health signals available.</Text>
        ) : (
          Object.entries(today.sourceInputs).map(([key, value]) => (
            <View key={key} style={styles.signalRow}>
              <View style={styles.signalHeader}>
                <Text style={styles.signalLabel}>{metricLabel(key)}</Text>
              </View>
              <Text style={styles.signalValue}>
                {formatMetricValue(key, value)}
              </Text>
              <Text style={styles.signalNote}>{metricInterpretation(key, value)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {history.length === 0 ? <Text style={styles.text}>No history yet.</Text> : null}
        {history.slice(0, 7).map(record => (
          <View key={record.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{record.date}</Text>
            <Text style={styles.historyValue}>{record.recoveryScore} ({record.recoveryStatus.replace('_', ' ')})</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for tab bar
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#1F2937',
  },
  readiness: {
    fontSize: 13,
    color: '#4B5563',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  text: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyValue: {
    fontSize: 12,
    color: '#111827',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  signalRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  signalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 2,
  },
  signalNote: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default RecoveryStatusScreen;
