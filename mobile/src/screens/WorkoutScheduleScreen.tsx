import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getWorkoutSchedule, uploadWorkoutSchedule } from '../services/healthDataHubService';
import type { WorkoutScheduleData } from '../types/healthDataHub';

export default function WorkoutScheduleScreen() {
  const [schedule, setSchedule] = useState<WorkoutScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await getWorkoutSchedule();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to load workout schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    Alert.alert(
      'Upload Workout Schedule',
      'Select a document or spreadsheet containing your workout plan',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose File', onPress: () => console.log('File picker not implemented') },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Schedule</Text>
        <Text style={styles.subtitle}>
          Your foundational workout baseline
        </Text>
      </View>

      {!schedule?.uploaded ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💪</Text>
          <Text style={styles.emptyTitle}>No Workout Schedule Uploaded</Text>
          <Text style={styles.emptyText}>
            Upload your workout plan document or spreadsheet to establish your baseline training schedule.
          </Text>
          <Text style={styles.emptyText}>
            This helps the system understand your training context and provide personalized recommendations.
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload Schedule</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Current Schedule</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Document:</Text>
              <Text style={styles.summaryValue}>{schedule.documentName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Uploaded:</Text>
              <Text style={styles.summaryValue}>
                {schedule.uploadDate ? new Date(schedule.uploadDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            {schedule.weeklySessionCount && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Weekly Sessions:</Text>
                <Text style={styles.summaryValue}>{schedule.weeklySessionCount}</Text>
              </View>
            )}
            {schedule.primaryFocus && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Primary Focus:</Text>
                <Text style={styles.summaryValue}>{schedule.primaryFocus}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Alert.alert('View Details', 'Detail view not implemented')}
            >
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleUpload}
            >
              <Text style={styles.secondaryButtonText}>Upload New Schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 How This Helps</Text>
            <Text style={styles.infoText}>
              Your workout schedule baseline is used by the system to:
            </Text>
            <Text style={styles.infoText}>• Track adherence to your plan</Text>
            <Text style={styles.infoText}>• Adjust recommendations based on training load</Text>
            <Text style={styles.infoText}>• Identify recovery needs</Text>
            <Text style={styles.infoText}>• Optimize supplement timing</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  actions: {
    padding: 16,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 6,
    lineHeight: 20,
  },
});
