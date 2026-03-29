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

interface MeasurementType {
  id: string;
  name: string;
  bodyPart: string;
  value?: number;
}

export default function TapeMeasurementsScreen() {
  const [measurements, setMeasurements] = useState<MeasurementType[]>([
    { id: '1', name: 'Neck', bodyPart: 'Upper Body' },
    { id: '2', name: 'Chest', bodyPart: 'Upper Body' },
    { id: '3', name: 'Left Bicep', bodyPart: 'Upper Body' },
    { id: '4', name: 'Right Bicep', bodyPart: 'Upper Body' },
    { id: '5', name: 'Waist', bodyPart: 'Core' },
    { id: '6', name: 'Hips', bodyPart: 'Core' },
    { id: '7', name: 'Left Thigh', bodyPart: 'Lower Body' },
    { id: '8', name: 'Right Thigh', bodyPart: 'Lower Body' },
    { id: '9', name: 'Left Calf', bodyPart: 'Lower Body' },
    { id: '10', name: 'Right Calf', bodyPart: 'Lower Body' },
  ]);
  const [loading, setLoading] = useState(false);

  const updateMeasurement = (id: string, value: number) => {
    setMeasurements(prev =>
      prev.map(m => (m.id === id ? { ...m, value } : m))
    );
  };

  const saveMeasurements = async () => {
    const filledMeasurements = measurements.filter(m => m.value !== undefined);

    if (filledMeasurements.length === 0) {
      Alert.alert('No Measurements', 'Please enter at least one measurement');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement API call when server is running
      // await fetch('http://localhost:3000/measurements/session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     userId,
      //     measurementDate: new Date().toISOString().split('T')[0],
      //     measurements: filledMeasurements.map(m => ({
      //       measurementTypeId: m.id,
      //       measurementName: m.name,
      //       valueInches: m.value,
      //     })),
      //   }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Success',
        `${filledMeasurements.length} measurements saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear measurements
              setMeasurements(prev =>
                prev.map(m => ({ ...m, value: undefined }))
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save measurements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const groupedMeasurements = measurements.reduce((groups, m) => {
    if (!groups[m.bodyPart]) {
      groups[m.bodyPart] = [];
    }
    groups[m.bodyPart].push(m);
    return groups;
  }, {} as Record<string, MeasurementType[]>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tape Measurements</Text>
        <Text style={styles.subtitle}>Track your body measurements</Text>
      </View>

      {/* Body Diagram Info */}
      <View style={styles.diagramSection}>
        <View style={styles.diagramPlaceholder}>
          <Ionicons name="body" size={80} color="#3b82f6" />
          <Text style={styles.diagramText}>Measure at the widest/narrowest point</Text>
        </View>
      </View>

      {/* Measurement Groups */}
      {Object.entries(groupedMeasurements).map(([bodyPart, items]) => (
        <View key={bodyPart} style={styles.section}>
          <Text style={styles.sectionTitle}>{bodyPart}</Text>

          {items.map((measurement) => (
            <View key={measurement.id} style={styles.measurementRow}>
              <View style={styles.measurementInfo}>
                <Text style={styles.measurementName}>{measurement.name}</Text>
              </View>

              <TouchableOpacity
                style={styles.measurementInput}
                onPress={() => {
                  Alert.prompt(
                    measurement.name,
                    'Enter measurement in inches',
                    (text) => {
                      const value = parseFloat(text);
                      if (!isNaN(value) && value > 0) {
                        updateMeasurement(measurement.id, value);
                      }
                    },
                    'plain-keyboard',
                    measurement.value?.toString() || ''
                  );
                }}
              >
                <Ionicons name="resize" size={20} color="#6b7280" />
                <Text style={styles.measurementInputText}>
                  {measurement.value ? `${measurement.value}"` : 'Tap to enter'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}

      {/* Save Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={saveMeasurements}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Measurements</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Measurement Tips</Text>
        
        <View style={styles.tipItem}>
          <Ionicons name="time" size={16} color="#3b82f6" />
          <Text style={styles.tipText}>Measure at the same time of day</Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="water" size={16} color="#3b82f6" />
          <Text style={styles.tipText}>Measure before eating or drinking</Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="fitness" size={16} color="#3b82f6" />
          <Text style={styles.tipText}>Keep tape snug but not tight</Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="calendar" size={16} color="#3b82f6" />
          <Text style={styles.tipText}>Track weekly for best results</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Consistent measurements help track progress that the scale might not show. Measure at the same spots each time for accuracy.
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
  diagramSection: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  diagramPlaceholder: {
    alignItems: 'center',
  },
  diagramText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  measurementInfo: {
    flex: 1,
  },
  measurementName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  measurementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    minWidth: 140,
  },
  measurementInputText: {
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1e40af',
  },
  infoSection: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
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
