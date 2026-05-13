import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function WorkoutsScreen() {
  const { userId } = useUser();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    workoutType: '',
    duration: '',
    notes: '',
  });

  useEffect(() => {
    if (userId) {
      loadWorkouts();
    }
  }, [userId]);

  const loadWorkouts = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await healthApi.workouts.getHistory(userId, 20);
      setWorkouts(response.data.data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const logWorkout = async () => {
    if (!userId || !newWorkout.workoutType || !newWorkout.duration) {
      Alert.alert('Error', 'Please fill in workout type and duration');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await healthApi.workouts.logWorkout(userId, {
        workoutDate: today,
        workoutType: newWorkout.workoutType,
        duration: parseInt(newWorkout.duration),
        notes: newWorkout.notes,
      });

      Alert.alert('Success', 'Workout logged successfully!');
      setModalVisible(false);
      setNewWorkout({ workoutType: '', duration: '', notes: '' });
      loadWorkouts();
    } catch (error) {
      console.error('Error logging workout:', error);
      Alert.alert('Error', 'Failed to log workout');
    }
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Set your user ID in Settings to get started</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Log Workout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {workouts.length === 0 ? (
          <Text style={styles.emptyText}>No workouts logged yet. Tap "Log Workout" to get started!</Text>
        ) : (
          workouts.map((workout, index) => (
            <View key={index} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutType}>{workout.workoutType || 'Workout'}</Text>
                <Text style={styles.workoutDate}>{workout.workoutDate}</Text>
              </View>
              <Text style={styles.workoutDuration}>⏱️ {workout.duration} minutes</Text>
              {workout.notes && <Text style={styles.workoutNotes}>{workout.notes}</Text>}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Workout</Text>

            <Text style={styles.label}>Workout Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Strength Training, Cardio, Yoga"
              value={newWorkout.workoutType}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, workoutType: text })}
            />

            <Text style={styles.label}>Duration (minutes) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60"
              keyboardType="numeric"
              value={newWorkout.duration}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, duration: text })}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="How did it go?"
              multiline
              numberOfLines={3}
              value={newWorkout.notes}
              onChangeText={(text) => setNewWorkout({ ...newWorkout, notes: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={logWorkout}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  list: {
    flex: 1,
    padding: 16,
    paddingBottom: 100, // Extra padding for tab bar
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
  },
  workoutNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
