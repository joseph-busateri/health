import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../services/api';
import type { DailyCheckInScreenNavigationProp } from '../types/navigation';

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

type WorkoutOption = 'yes' | 'partial' | 'no';

type Props = {
  navigation: DailyCheckInScreenNavigationProp;
};

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

const recoveryScale = [1, 2, 3, 4, 5];
const stressScale = [1, 2, 3, 4, 5];

const workoutOptions: { label: string; value: WorkoutOption }[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'Partial', value: 'partial' },
  { label: 'No', value: 'no' },
];

const workoutValueMap: Record<WorkoutOption, number> = {
  yes: 100,
  partial: 60,
  no: 0,
};

const DailyCheckInScreen: React.FC<Props> = ({ navigation }) => {
  const [sleepHours, setSleepHours] = useState('');
  const [recoveryFeeling, setRecoveryFeeling] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [workoutAdherence, setWorkoutAdherence] = useState<WorkoutOption | null>(null);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  const isFormValid = useMemo(() => {
    return (
      sleepHours.trim().length > 0 &&
      !Number.isNaN(Number(sleepHours)) &&
      recoveryFeeling !== null &&
      stressLevel !== null &&
      workoutAdherence !== null
    );
  }, [sleepHours, recoveryFeeling, stressLevel, workoutAdherence]);

  const resetForm = () => {
    setSleepHours('');
    setRecoveryFeeling(null);
    setStressLevel(null);
    setWorkoutAdherence(null);
    setNotes('');
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get<DashboardSummary>(`/dashboard/${USER_ID}`);
      setDashboard(response.data);
    } catch (err) {
      console.warn('Failed to refresh dashboard summary', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!isFormValid) {
      setError('Please complete all required fields.');
      return;
    }

    const parsedSleepHours = Number(sleepHours);

    if (Number.isNaN(parsedSleepHours)) {
      setError('Sleep hours must be a valid number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: USER_ID,
        date: new Date().toISOString().slice(0, 10),
        sleep_hours: parsedSleepHours,
        recovery_feeling: recoveryFeeling as number,
        stress_level: stressLevel as number,
        workout_adherence: workoutAdherence ? workoutValueMap[workoutAdherence] : 0,
        notes: notes.trim().length > 0 ? notes.trim() : undefined,
      };

      const response = await api.post('/daily-log', payload);

      if (response.data?.success) {
        setSuccessMessage('Daily check-in saved successfully!');
        await fetchDashboard();
        resetForm();
        setTimeout(() => {
          navigation.goBack();
        }, 800);
      } else {
        setError('Unexpected response from the server.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.warning || err?.message || 'Failed to submit daily log.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Daily Check-In</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How did you recover?</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sleep Hours</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 7.5"
              keyboardType="numeric"
              value={sleepHours}
              onChangeText={setSleepHours}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Recovery Feeling</Text>
            <View style={styles.scaleContainer}>
              {recoveryScale.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.scaleButton, recoveryFeeling === value && styles.scaleButtonActive]}
                  onPress={() => setRecoveryFeeling(value)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.scaleButtonText,
                      recoveryFeeling === value && styles.scaleButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>1 = depleted, 5 = fully recharged</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Stress Level</Text>
            <View style={styles.scaleContainer}>
              {stressScale.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.scaleButton, stressLevel === value && styles.scaleButtonActive]}
                  onPress={() => setStressLevel(value)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.scaleButtonText,
                      stressLevel === value && styles.scaleButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>1 = calm, 5 = extremely stressed</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Workout Adherence</Text>
            <View style={styles.workoutContainer}>
              {workoutOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.workoutButton,
                    workoutAdherence === option.value && styles.workoutButtonActive,
                  ]}
                  onPress={() => setWorkoutAdherence(option.value)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.workoutButtonText,
                      workoutAdherence === option.value && styles.workoutButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Anything notable about today?"
              multiline
              value={notes}
              onChangeText={setNotes}
              editable={!isSubmitting}
            />
          </View>
        </View>

        {dashboard && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Latest Dashboard Summary</Text>
            <Text style={styles.summaryItem}>Recovery Score: {dashboard.recoveryScore ?? '—'}</Text>
            <Text style={styles.summaryItem}>
              Overall Health Score: {dashboard.overallHealthScore ?? '—'}
            </Text>
            <Text style={styles.summaryItem}>Status: {dashboard.status}</Text>
            <Text style={styles.summaryItem}>Recommendation: {dashboard.dailyRecommendation}</Text>
            <Text style={styles.summaryItem}>Trend: {dashboard.trendSummary}</Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Save Check-In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1F2933',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#102A43',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D4852',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#102A43',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E3E8F0',
    alignItems: 'center',
  },
  scaleButtonActive: {
    backgroundColor: '#2563EB',
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  scaleButtonTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  workoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  workoutButtonActive: {
    backgroundColor: '#22C55E',
  },
  workoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  workoutButtonTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    color: '#16A34A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DailyCheckInScreen;
