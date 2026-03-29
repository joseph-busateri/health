import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type { AdherenceRecord } from '../types/adherenceEngine';
import { getAdherenceHistory, getAdherenceToday } from '../services/adherenceEngineService';

type Props = NativeStackScreenProps<RootStackParamList, 'AdherenceStatus'>;

const AdherenceStatusScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<AdherenceRecord | null>(null);
  const [history, setHistory] = useState<AdherenceRecord[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRecord, historyRecords] = await Promise.all([
        getAdherenceToday(userId),
        getAdherenceHistory(userId),
      ]);
      setToday(todayRecord);
      setHistory(historyRecords);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load adherence data');
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
        <Text style={styles.errorText}>{error ?? 'No adherence record found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Adherence Status</Text>
      <Text style={styles.score}>{today.adherenceScore}/100</Text>
      <Text style={styles.subtitle}>Status: {today.status.toUpperCase()}</Text>
      <Text style={styles.subtitle}>Trend: {today.trend.toUpperCase()}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Domain Breakdown</Text>
        <View style={styles.row}><Text style={styles.label}>Workout</Text><Text style={styles.value}>{today.breakdown.workout}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Nutrition</Text><Text style={styles.value}>{today.breakdown.nutrition}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Sleep</Text><Text style={styles.value}>{today.breakdown.sleep}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Supplement</Text><Text style={styles.value}>{today.breakdown.supplement}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendation</Text>
        <Text style={styles.text}>{today.recommendation.summary}</Text>
        <Text style={styles.note}>{today.recommendation.note}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        {history.slice(0, 7).map(item => (
          <View key={item.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyValue}>{item.adherenceScore} ({item.status})</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  score: { fontSize: 36, fontWeight: '800', color: '#2563EB' },
  subtitle: { fontSize: 14, color: '#1F2937' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: '#4B5563' },
  value: { fontSize: 13, color: '#111827', fontWeight: '600' },
  text: { fontSize: 14, color: '#1F2937', marginBottom: 6 },
  note: { fontSize: 13, color: '#4B5563' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyDate: { fontSize: 12, color: '#6B7280' },
  historyValue: { fontSize: 12, color: '#111827' },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center' },
});

export default AdherenceStatusScreen;
