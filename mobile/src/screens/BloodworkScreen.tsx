import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function BloodworkScreen() {
  const { userId } = useUser();
  const [results, setResults] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newResult, setNewResult] = useState({
    testDate: '',
    labName: '',
    testType: '',
  });

  useEffect(() => {
    if (userId) {
      loadBloodwork();
    }
  }, [userId]);

  const loadBloodwork = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [resultsResponse, scoreResponse] = await Promise.allSettled([
        healthApi.bloodwork.getResults(userId),
        healthApi.bloodwork.getHealthScore(userId),
      ]);

      if (resultsResponse.status === 'fulfilled') {
        setResults(resultsResponse.value.data.data || []);
      }
      if (scoreResponse.status === 'fulfilled') {
        setHealthScore(scoreResponse.value.data.data);
      }
    } catch (error) {
      console.error('Error loading bloodwork:', error);
      Alert.alert('Error', 'Failed to load bloodwork data');
    } finally {
      setLoading(false);
    }
  };

  const addResult = async () => {
    if (!userId || !newResult.testDate || !newResult.labName) {
      Alert.alert('Error', 'Please fill in test date and lab name');
      return;
    }

    try {
      await healthApi.bloodwork.addResult(userId, {
        testDate: newResult.testDate,
        labName: newResult.labName,
        testType: newResult.testType || 'comprehensive_metabolic_panel',
      });

      Alert.alert('Success', 'Bloodwork result added successfully!');
      setModalVisible(false);
      setNewResult({ testDate: '', labName: '', testType: '' });
      loadBloodwork();
    } catch (error) {
      console.error('Error adding result:', error);
      Alert.alert('Error', 'Failed to add bloodwork result');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bloodwork</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add Result</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {healthScore && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Overall Health Score</Text>
            <Text style={styles.scoreValue}>{healthScore.overallScore || 'N/A'}</Text>
            <Text style={styles.scoreSubtitle}>Based on latest bloodwork analysis</Text>
            
            {healthScore.categoryScores && (
              <View style={styles.categories}>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>Metabolic Health</Text>
                  <Text style={styles.categoryValue}>{healthScore.categoryScores.metabolic || 'N/A'}</Text>
                </View>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>Cardiovascular</Text>
                  <Text style={styles.categoryValue}>{healthScore.categoryScores.cardiovascular || 'N/A'}</Text>
                </View>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>Hormonal</Text>
                  <Text style={styles.categoryValue}>{healthScore.categoryScores.hormonal || 'N/A'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {results.length > 0 ? (
            results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultDate}>{result.testDate}</Text>
                  <Text style={styles.resultLab}>{result.labName}</Text>
                </View>
                <Text style={styles.resultType}>{result.testType || 'Blood Panel'}</Text>
                {result.markerCount && (
                  <Text style={styles.resultMarkers}>📊 {result.markerCount} markers analyzed</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No bloodwork results yet. Tap "+ Add Result" to get started!</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Track Your Health</Text>
          <Text style={styles.infoText}>
            Regular bloodwork helps you monitor key health markers and optimize your wellness strategy.
            Add your test results to track trends over time.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Bloodwork Result</Text>

            <Text style={styles.label}>Test Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g., 2026-03-29)"
              value={newResult.testDate}
              onChangeText={(text) => setNewResult({ ...newResult, testDate: text })}
            />

            <Text style={styles.label}>Lab Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Quest Diagnostics, LabCorp"
              value={newResult.labName}
              onChangeText={(text) => setNewResult({ ...newResult, labName: text })}
            />

            <Text style={styles.label}>Test Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Comprehensive Metabolic Panel"
              value={newResult.testType}
              onChangeText={(text) => setNewResult({ ...newResult, testType: text })}
            />

            <Text style={styles.helpText}>
              After adding the result, you can upload detailed marker values through the API.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={addResult}>
                <Text style={styles.saveButtonText}>Add</Text>
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
  },
  scoreCard: {
    backgroundColor: '#E8F5E9',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  scoreSubtitle: {
    fontSize: 14,
    color: '#558B2F',
    marginBottom: 15,
  },
  categories: {
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#558B2F',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultLab: {
    fontSize: 14,
    color: '#666',
  },
  resultType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
  },
  resultMarkers: {
    fontSize: 12,
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 12,
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
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
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
  helpText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 15,
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
