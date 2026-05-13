import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type { StressRecord } from '../types/stressEngine';
import { getStressHistory, getStressToday } from '../services/stressEngineService';

type Props = NativeStackScreenProps<RootStackParamList, 'StressStatus'>;

const labelForInput = (key: string): string => {
  switch (key) {
    case 'interviewStressLevel':
      return 'Interview Stress';
    case 'hrv':
      return 'HRV';
    case 'sleepDurationHours':
      return 'Sleep Duration';
    case 'workoutLoad':
      return 'Workout Load';
    case 'recoveryScore':
      return 'Recovery Score';
    default:
      return key;
  }
};

const StressStatusScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<StressRecord | null>(null);
  const [history, setHistory] = useState<StressRecord[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRecord, historyRecords] = await Promise.all([
        getStressToday(userId),
        getStressHistory(userId),
      ]);
      setToday(todayRecord);
      setHistory(historyRecords);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load stress data');
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
        <Text style={styles.errorText}>{error ?? 'No stress record found'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stress / CNS Status</Text>
      <Text style={styles.score}>{today.stressScore}/100</Text>
      <Text style={styles.subtitle}>Stress: {today.stressStatus.toUpperCase()}</Text>
      <Text style={styles.subtitle}>CNS Load: {today.cnsLoadStatus.toUpperCase()}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendation</Text>
        <Text style={styles.text}>{today.recommendation.summary}</Text>
        {today.recommendation.actions.map((action, index) => (
          <Text key={`action-${index}`} style={styles.bullet}>{`- ${action}`}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contributing Inputs</Text>
        {Object.entries(today.sourceInputs).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{labelForInput(key)}</Text>
            <Text style={styles.value}>{value ?? 'N/A'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {history.length === 0 ? <Text style={styles.text}>No history yet.</Text> : null}
        {history.slice(0, 7).map(record => (
          <View key={record.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{record.date}</Text>
            <Text style={styles.historyValue}>{record.stressScore} ({record.stressStatus}/{record.cnsLoadStatus})</Text>
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
    color: '#DC2626',
  },
  subtitle: {
    fontSize: 14,
    color: '#1F2937',
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
});

export default StressStatusScreen;
