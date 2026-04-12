import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type { JointHealthRecord } from '../types/jointHealthEngine';
import { getJointHealthHistory, getJointHealthToday } from '../services/jointHealthEngineService';

type Props = NativeStackScreenProps<RootStackParamList, 'JointHealthStatus'>;

const labelForInput = (key: string): string => {
  switch (key) {
    case 'painLevel':
      return 'Pain';
    case 'tightnessLevel':
      return 'Tightness';
    case 'sorenessLevel':
      return 'Soreness';
    case 'affectedArea':
      return 'Affected Area';
    case 'workoutLoad':
      return 'Workout Load';
    case 'recoveryScore':
      return 'Recovery Score';
    case 'verbalNotes':
      return 'Notes';
    default:
      return key;
  }
};

const JointHealthStatusScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<JointHealthRecord | null>(null);
  const [history, setHistory] = useState<JointHealthRecord[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRecord, historyRecords] = await Promise.all([
        getJointHealthToday(userId),
        getJointHealthHistory(userId),
      ]);
      setToday(todayRecord);
      setHistory(historyRecords);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load joint health data');
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
        <Text style={styles.errorText}>{error ?? 'No joint health record found'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Joint / Injury Status</Text>
      <Text style={styles.subtitle}>Area: {today.affectedArea.toUpperCase()}</Text>
      <Text style={styles.subtitle}>Status: {today.jointHealthStatus.toUpperCase()}</Text>
      <Text style={styles.subtitle}>Risk: {today.riskLevel.toUpperCase()}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Modifications</Text>
        <Text style={styles.text}>{today.recommendation.summary}</Text>
        {today.recommendation.modifications?.map((item, index) => (
          <Text key={`mod-${index}`} style={styles.bullet}>{`- ${item}`}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Safety Notes</Text>
        {today.recommendation.safetyNotes?.map((item, index) => (
          <Text key={`safe-${index}`} style={styles.bullet}>{`- ${item}`}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Input Signals</Text>
        {Object.entries(today.inputs).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{labelForInput(key)}</Text>
            <Text style={styles.value}>{value == null ? 'N/A' : String(value)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {history.length === 0 ? <Text style={styles.text}>No history yet.</Text> : null}
        {history.slice(0, 7).map(record => (
          <View key={record.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{record.date}</Text>
            <Text style={styles.historyValue}>{`${record.affectedArea} • ${record.riskLevel}`}</Text>
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

export default JointHealthStatusScreen;
