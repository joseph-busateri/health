/**
 * @deprecated This screen is superseded by GoalManagementScreen.
 * Use GoalManagementScreen instead for comprehensive goal management functionality.
 * This file is kept for backward compatibility but will be removed in a future release.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function GoalsScreen() {
  const { userId } = useUser();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: '',
    targetValue: '',
    targetDate: '',
    description: '',
  });

  useEffect(() => {
    if (userId) {
      loadGoals();
    }
  }, [userId]);

  const loadGoals = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await healthApi.goals.getActive(userId);
      setGoals(response.data.data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!userId || !newGoal.goalType || !newGoal.targetValue) {
      Alert.alert('Error', 'Please fill in goal type and target value');
      return;
    }

    try {
      await healthApi.goals.create(userId, {
        goalType: newGoal.goalType,
        targetValue: parseFloat(newGoal.targetValue),
        targetDate: newGoal.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: newGoal.description,
      });

      Alert.alert('Success', 'Goal created successfully!');
      setModalVisible(false);
      setNewGoal({ goalType: '', targetValue: '', targetDate: '', description: '' });
      loadGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const updateProgress = async (goalId: string) => {
    if (!userId) return;

    Alert.prompt(
      'Update Progress',
      'Enter your current value:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (value) => {
            if (value) {
              try {
                await healthApi.goals.updateProgress(userId, goalId, {
                  currentValue: parseFloat(value),
                  progressDate: new Date().toISOString().split('T')[0],
                });
                Alert.alert('Success', 'Progress updated!');
                loadGoals();
              } catch (error) {
                Alert.alert('Error', 'Failed to update progress');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getProgressPercentage = (goal: any) => {
    if (!goal.currentValue || !goal.targetValue) return 0;
    return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#F44336';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Create Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {goals.length > 0 ? (
          goals.map((goal, index) => {
            const progress = getProgressPercentage(goal);
            const progressColor = getProgressColor(progress);

            return (
              <View key={index} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalType}>{goal.goalType}</Text>
                  <Text style={[styles.progressBadge, { backgroundColor: progressColor }]}>
                    {progress}%
                  </Text>
                </View>

                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}

                <View style={styles.goalStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Current</Text>
                    <Text style={styles.statValue}>{goal.currentValue || 0}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Target</Text>
                    <Text style={styles.statValue}>{goal.targetValue}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Due Date</Text>
                    <Text style={styles.statValue}>{goal.targetDate}</Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%`, backgroundColor: progressColor },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => updateProgress(goal.goalId)}
                >
                  <Text style={styles.updateButtonText}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No active goals yet</Text>
            <Text style={styles.emptySubtext}>Create your first goal to start tracking progress!</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Goal Setting Tips</Text>
          <Text style={styles.infoText}>
            • Set specific, measurable targets{'\n'}
            • Choose realistic timeframes{'\n'}
            • Update progress regularly{'\n'}
            • Celebrate milestones along the way
          </Text>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Goal</Text>

            <Text style={styles.label}>Goal Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Weight Loss, Muscle Gain, Strength"
              value={newGoal.goalType}
              onChangeText={(text) => setNewGoal({ ...newGoal, goalType: text })}
            />

            <Text style={styles.label}>Target Value *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 180 (lbs), 225 (bench press)"
              keyboardType="numeric"
              value={newGoal.targetValue}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetValue: text })}
            />

            <Text style={styles.label}>Target Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (defaults to 90 days)"
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetDate: text })}
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What do you want to achieve?"
              multiline
              numberOfLines={3}
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={createGoal}>
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  content: {
    flex: 1,
    padding: 15,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
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
