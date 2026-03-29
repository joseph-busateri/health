import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';
import type { WorkoutTodayRecord } from '../types/workoutToday';
import { getWorkoutToday } from '../services/workoutTodayService';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutToday'>;

const WorkoutTodayScreen: React.FC<Props> = ({ route }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<WorkoutTodayRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWorkoutToday(userId);
      setRecord(response);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load workout today');
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

  if (error || !record) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'No workout record available'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Today&apos;s Workout</Text>
      <Text style={styles.subtitle}>Readiness: {record.readinessStatus.toUpperCase()}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rationale</Text>
        <Text style={styles.text}>{record.rationale}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Baseline Workout</Text>
        {record.baselineWorkout.dayPlan ? <Text style={styles.text}>{record.baselineWorkout.dayPlan}</Text> : null}
        {record.baselineWorkout.exercises.map((exercise, index) => (
          <Text key={`base-${index}`} style={styles.bullet}>{` ${exercise.name}${exercise.setRepLoadNotes ? ` — ${exercise.setRepLoadNotes}` : ''}`}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adjusted Workout</Text>
        {record.adjustedWorkout.dayPlan ? <Text style={styles.text}>{record.adjustedWorkout.dayPlan}</Text> : null}
        {record.adjustedWorkout.exercises.map((exercise, index) => (
          <Text key={`adj-${index}`} style={styles.bullet}>{` ${exercise.name}${exercise.setRepLoadNotes ? ` — ${exercise.setRepLoadNotes}` : ''}`}</Text>
        ))}
        {record.adjustedWorkout.notes.map((note, index) => (
          <Text key={`note-${index}`} style={styles.note}>{`- ${note}`}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adjustments</Text>
        {record.adjustments.length === 0 ? <Text style={styles.text}>None</Text> : null}
        {record.adjustments.map((adjustment, index) => (
          <Text key={`adj-item-${index}`} style={styles.note}>{`- ${adjustment.description}`}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
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
  note: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
});

export default WorkoutTodayScreen;
