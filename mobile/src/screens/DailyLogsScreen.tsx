import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface DailyLog {
  id: string;
  userId: string;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleep_quality: number;
  symptoms: string[];
  notes: string;
  createdAt: string;
}

const DailyLogsScreen: React.FC = () => {
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

  // Form state
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');

  const fetchTodayLog = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/daily-log/${userId}`);
      const data = await response.json();

      if (data.logs && data.logs.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const todaysLog = data.logs.find((log: DailyLog) => log.date === today);
        
        if (todaysLog) {
          setTodayLog(todaysLog);
          setMood(todaysLog.mood);
          setEnergy(todaysLog.energy);
          setStress(todaysLog.stress);
          setSleepQuality(todaysLog.sleep_quality);
          setSymptoms(todaysLog.symptoms?.join(', ') || '');
          setNotes(todaysLog.notes || '');
        }
        
        setRecentLogs(data.logs.slice(0, 7));
      }
    } catch (error) {
      console.error('Failed to fetch daily logs:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTodayLog();
  }, [fetchTodayLog]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayLog();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please set your user ID in Settings');
      return;
    }

    setSubmitting(true);
    try {
      const symptomsArray = symptoms
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await fetch(`${API_BASE_URL}/daily-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          date: new Date().toISOString().slice(0, 10),
          mood,
          energy,
          stress,
          sleep_quality: sleepQuality,
          symptoms: symptomsArray,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save daily log');
      }

      Alert.alert('Success', 'Daily log saved successfully');
      await fetchTodayLog();
    } catch (error) {
      console.error('Failed to save daily log:', error);
      Alert.alert('Error', 'Failed to save daily log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderScaleSelector = (
    label: string,
    value: number,
    setValue: (value: number) => void,
    lowLabel: string,
    highLabel: string
  ) => (
    <View style={styles.scaleContainer}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={styles.scaleButtons}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
          <TouchableOpacity
            key={num}
            style={[
              styles.scaleButton,
              value === num && styles.scaleButtonActive,
            ]}
            onPress={() => setValue(num)}
          >
            <Text
              style={[
                styles.scaleButtonText,
                value === num && styles.scaleButtonTextActive,
              ]}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.scaleLabelContainer}>
        <Text style={styles.scaleLabelText}>{lowLabel}</Text>
        <Text style={styles.scaleLabelText}>{highLabel}</Text>
      </View>
    </View>
  );

  if (!userId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Please set your user ID in Settings</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading daily logs...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Health Log</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.content}>
        {renderScaleSelector('Mood', mood, setMood, 'Terrible', 'Excellent')}
        {renderScaleSelector('Energy Level', energy, setEnergy, 'Exhausted', 'Energized')}
        {renderScaleSelector('Stress Level', stress, setStress, 'Calm', 'Overwhelmed')}
        {renderScaleSelector('Sleep Quality', sleepQuality, setSleepQuality, 'Poor', 'Excellent')}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Symptoms (comma-separated)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., headache, fatigue, sore muscles"
            placeholderTextColor="#94A3B8"
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="How are you feeling today? Any observations?"
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {todayLog ? 'Update Log' : 'Save Log'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {recentLogs.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Logs</Text>
            {recentLogs.map(log => (
              <View key={log.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {new Date(log.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <View style={styles.historyMetrics}>
                    <View style={styles.historyMetric}>
                      <Ionicons name="happy-outline" size={16} color="#64748B" />
                      <Text style={styles.historyMetricText}>{log.mood}/10</Text>
                    </View>
                    <View style={styles.historyMetric}>
                      <Ionicons name="flash-outline" size={16} color="#64748B" />
                      <Text style={styles.historyMetricText}>{log.energy}/10</Text>
                    </View>
                  </View>
                </View>
                {log.notes && (
                  <Text style={styles.historyNotes} numberOfLines={2}>
                    {log.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  scaleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scaleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scaleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scaleButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  scaleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  scaleButtonTextActive: {
    color: '#FFFFFF',
  },
  scaleLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabelText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  historyContainer: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  historyMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  historyMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetricText: {
    fontSize: 13,
    color: '#64748B',
  },
  historyNotes: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});

export default DailyLogsScreen;
