import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

export default function StrengthTrackingScreen() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRPE] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [recentPRs, setRecentPRs] = useState<any[]>([]);

  const popularExercises: Exercise[] = [
    { id: '1', name: 'Barbell Bench Press', muscleGroup: 'Chest' },
    { id: '2', name: 'Barbell Squat', muscleGroup: 'Legs' },
    { id: '3', name: 'Barbell Deadlift', muscleGroup: 'Back' },
    { id: '4', name: 'Barbell Overhead Press', muscleGroup: 'Shoulders' },
    { id: '5', name: 'Barbell Row', muscleGroup: 'Back' },
    { id: '6', name: 'Pull-ups', muscleGroup: 'Back' },
  ];

  const logStrengthRecord = async () => {
    if (!selectedExercise || !weight || !reps) {
      Alert.alert('Missing Data', 'Please select exercise and enter weight/reps');
      return;
    }

    setLoading(true);

    try {
      const weightNum = parseFloat(weight);
      const repsNum = parseInt(reps);

      // Calculate estimated 1RM (Epley formula)
      const estimated1RM = weightNum * (1 + repsNum / 30);

      // TODO: Implement API call when server is running
      // await fetch('http://localhost:3000/strength/record', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     userId,
      //     exerciseId: selectedExercise.id,
      //     exerciseName: selectedExercise.name,
      //     recordDate: new Date().toISOString().split('T')[0],
      //     weightLb: weightNum,
      //     reps: repsNum,
      //     rpe,
      //   }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if it's a PR (simplified for demo)
      const isPR = Math.random() > 0.7; // 30% chance of PR

      if (isPR) {
        Alert.alert(
          '🎉 New Personal Record!',
          `Congratulations! You set a new PR on ${selectedExercise.name}!\n\nEstimated 1RM: ${estimated1RM.toFixed(1)} lbs`,
          [
            {
              text: 'Awesome!',
              onPress: () => {
                setWeight('');
                setReps('');
                setSelectedExercise(null);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Success',
          'Strength record logged successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setWeight('');
                setReps('');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log strength record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Strength Tracking</Text>
        <Text style={styles.subtitle}>Log your lifts and track PRs</Text>
      </View>

      {/* Exercise Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Exercise</Text>
        
        {selectedExercise ? (
          <View style={styles.selectedExercise}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{selectedExercise.name}</Text>
              <Text style={styles.muscleGroup}>{selectedExercise.muscleGroup}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedExercise(null)}>
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exerciseGrid}>
            {popularExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() => setSelectedExercise(exercise)}
              >
                <Ionicons name="barbell" size={24} color="#3b82f6" />
                <Text style={styles.exerciseCardName}>{exercise.name}</Text>
                <Text style={styles.exerciseCardMuscle}>{exercise.muscleGroup}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Weight & Reps Input */}
      {selectedExercise && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Your Lift</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => {
                  Alert.prompt(
                    'Weight',
                    'Enter weight in pounds',
                    (text) => setWeight(text),
                    'plain-keyboard',
                    weight
                  );
                }}
              >
                <Ionicons name="fitness" size={20} color="#6b7280" />
                <Text style={styles.inputButtonText}>
                  {weight || 'Tap to enter'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => {
                  Alert.prompt(
                    'Reps',
                    'Enter number of reps',
                    (text) => setReps(text),
                    'plain-keyboard',
                    reps
                  );
                }}
              >
                <Ionicons name="repeat" size={20} color="#6b7280" />
                <Text style={styles.inputButtonText}>
                  {reps || 'Tap to enter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* RPE Selector */}
          <View style={styles.rpeContainer}>
            <Text style={styles.inputLabel}>RPE (Rate of Perceived Exertion)</Text>
            <View style={styles.rpeButtons}>
              {[6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.rpeButton,
                    rpe === value && styles.rpeButtonActive,
                  ]}
                  onPress={() => setRPE(value)}
                >
                  <Text
                    style={[
                      styles.rpeButtonText,
                      rpe === value && styles.rpeButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.rpeHint}>
              6 = Easy • 10 = Maximum Effort
            </Text>
          </View>

          {/* Estimated 1RM Display */}
          {weight && reps && (
            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>Estimated 1RM</Text>
              <Text style={styles.estimateValue}>
                {(parseFloat(weight) * (1 + parseInt(reps) / 30)).toFixed(1)} lbs
              </Text>
            </View>
          )}

          {/* Log Button */}
          <TouchableOpacity
            style={[styles.logButton, loading && styles.logButtonDisabled]}
            onPress={logStrengthRecord}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.logButtonText}>Log Lift</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Recent PRs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent PRs</Text>
          <Ionicons name="trophy" size={20} color="#f59e0b" />
        </View>

        {recentPRs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No recent PRs</Text>
            <Text style={styles.emptyStateSubtext}>
              Keep lifting to set new records!
            </Text>
          </View>
        ) : (
          recentPRs.map((pr, index) => (
            <View key={index} style={styles.prCard}>
              <View style={styles.prIcon}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                <Text style={styles.prValue}>{pr.recordValue} lbs</Text>
              </View>
              <Text style={styles.prDate}>{pr.recordDate}</Text>
            </View>
          ))
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Your estimated 1RM is calculated using the Epley formula. Track your progress over time and celebrate new PRs!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseCard: {
    width: '47%',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  exerciseCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  exerciseCardMuscle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  inputButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  rpeContainer: {
    marginBottom: 16,
  },
  rpeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  rpeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  rpeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  rpeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  rpeButtonTextActive: {
    color: '#fff',
  },
  rpeHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  estimateBox: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: 16,
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
  },
  estimateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  prIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  prValue: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  prDate: {
    fontSize: 12,
    color: '#92400e',
  },
  infoSection: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
