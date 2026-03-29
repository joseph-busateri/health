import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '../context/UserContext';
import { healthApi } from '../services/api';

export default function SupplementsScreen() {
  const { userId } = useUser();
  const [supplements, setSupplements] = useState<any[]>([]);
  const [regimen, setRegimen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timing: '',
  });

  useEffect(() => {
    if (userId) {
      loadSupplements();
    }
  }, [userId]);

  const loadSupplements = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [regimenResponse, historyResponse] = await Promise.allSettled([
        healthApi.supplements.getRegimen(userId),
        healthApi.supplements.getHistory(userId, 30),
      ]);

      if (regimenResponse.status === 'fulfilled') {
        setRegimen(regimenResponse.value.data.data);
      }
      if (historyResponse.status === 'fulfilled') {
        setSupplements(historyResponse.value.data.data || []);
      }
    } catch (error) {
      console.error('Error loading supplements:', error);
      Alert.alert('Error', 'Failed to load supplements');
    } finally {
      setLoading(false);
    }
  };

  const addToRegimen = async () => {
    if (!userId || !newSupplement.name || !newSupplement.dosage) {
      Alert.alert('Error', 'Please fill in supplement name and dosage');
      return;
    }

    try {
      await healthApi.supplements.addToRegimen(userId, {
        supplementName: newSupplement.name,
        dosage: newSupplement.dosage,
        frequency: newSupplement.frequency || 'daily',
        timing: newSupplement.timing || 'morning',
      });

      Alert.alert('Success', 'Supplement added to regimen!');
      setModalVisible(false);
      setNewSupplement({ name: '', dosage: '', frequency: '', timing: '' });
      loadSupplements();
    } catch (error) {
      console.error('Error adding supplement:', error);
      Alert.alert('Error', 'Failed to add supplement');
    }
  };

  const logIntake = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await healthApi.supplements.logIntake(userId, {
        intakeDate: today,
        supplementsTaken: regimen?.supplements || [],
      });

      Alert.alert('Success', 'Supplement intake logged!');
      setIntakeModalVisible(false);
      loadSupplements();
    } catch (error) {
      console.error('Error logging intake:', error);
      Alert.alert('Error', 'Failed to log intake');
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
        <Text style={styles.title}>Supplements</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logButton} onPress={() => setIntakeModalVisible(true)}>
            <Text style={styles.logButtonText}>Log Intake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Regimen</Text>
          {regimen?.supplements && regimen.supplements.length > 0 ? (
            regimen.supplements.map((supp: any, index: number) => (
              <View key={index} style={styles.supplementCard}>
                <View style={styles.supplementHeader}>
                  <Text style={styles.supplementName}>{supp.supplementName || supp.name}</Text>
                  <Text style={styles.supplementDosage}>{supp.dosage}</Text>
                </View>
                <View style={styles.supplementDetails}>
                  <Text style={styles.detailText}>📅 {supp.frequency || 'Daily'}</Text>
                  <Text style={styles.detailText}>⏰ {supp.timing || 'Morning'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No supplements in your regimen. Tap "+ Add" to get started!</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Intake History</Text>
          {supplements.length > 0 ? (
            supplements.slice(0, 10).map((intake: any, index: number) => (
              <View key={index} style={styles.historyCard}>
                <Text style={styles.historyDate}>{intake.intakeDate}</Text>
                <Text style={styles.historyCount}>
                  {intake.supplementsTaken?.length || 0} supplements taken
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No intake history yet</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Supplement</Text>

            <Text style={styles.label}>Supplement Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Vitamin D3, Creatine"
              value={newSupplement.name}
              onChangeText={(text) => setNewSupplement({ ...newSupplement, name: text })}
            />

            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5000 IU, 5g"
              value={newSupplement.dosage}
              onChangeText={(text) => setNewSupplement({ ...newSupplement, dosage: text })}
            />

            <Text style={styles.label}>Frequency</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Daily, Twice daily"
              value={newSupplement.frequency}
              onChangeText={(text) => setNewSupplement({ ...newSupplement, frequency: text })}
            />

            <Text style={styles.label}>Timing</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning, With meals"
              value={newSupplement.timing}
              onChangeText={(text) => setNewSupplement({ ...newSupplement, timing: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={addToRegimen}>
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={intakeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Today's Intake</Text>
            
            <Text style={styles.confirmText}>
              Log all supplements from your current regimen for today?
            </Text>

            {regimen?.supplements && (
              <View style={styles.confirmList}>
                {regimen.supplements.map((supp: any, index: number) => (
                  <Text key={index} style={styles.confirmItem}>
                    ✓ {supp.supplementName || supp.name} - {supp.dosage}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIntakeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={logIntake}>
                <Text style={styles.saveButtonText}>Log Intake</Text>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  logButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logButtonText: {
    color: 'white',
    fontWeight: '600',
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
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  supplementCard: {
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
  supplementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  supplementDosage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  supplementDetails: {
    flexDirection: 'row',
    gap: 15,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  historyCard: {
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
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historyCount: {
    fontSize: 14,
    color: '#666',
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
  confirmText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmList: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  confirmItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
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
