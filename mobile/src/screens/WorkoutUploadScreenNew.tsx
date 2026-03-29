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
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutUploadScreen() {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadWorkout = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    setUploading(true);

    try {
      // TODO: Implement API call when server is running
      // const formData = new FormData();
      // formData.append('file', {
      //   uri: selectedFile.uri,
      //   type: selectedFile.mimeType,
      //   name: selectedFile.name,
      // });
      // formData.append('user_id', userId);
      
      // await fetch('http://localhost:3000/workout/upload', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Success',
        'Workout plan uploaded successfully! Processing in background.',
        [
          {
            text: 'OK',
            onPress: () => setSelectedFile(null),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload workout plan. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Plan</Text>
        <Text style={styles.subtitle}>Upload your Excel workout plan</Text>
      </View>

      {/* Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Workout Plan</Text>
        
        {selectedFile ? (
          <View style={styles.fileContainer}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-text" size={40} color="#3b82f6" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setSelectedFile(null)}
            >
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Ionicons name="cloud-upload" size={48} color="#3b82f6" />
            <Text style={styles.uploadButtonText}>Choose Excel File</Text>
            <Text style={styles.uploadButtonSubtext}>
              .xlsx, .xls, or .csv format
            </Text>
          </TouchableOpacity>
        )}

        {selectedFile && (
          <TouchableOpacity
            style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
            onPress={uploadWorkout}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Upload Workout Plan</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Expected Format Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expected Format</Text>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Split day headers (Day 1, Push Day, etc.)</Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Exercise names</Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Sets and reps (e.g., 3x10, 4 x 12)</Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Weight (optional)</Text>
        </View>
      </View>

      {/* Example Section */}
      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example Format:</Text>
        <View style={styles.exampleBox}>
          <Text style={styles.exampleText}>Day 1 - Push</Text>
          <Text style={styles.exampleText}>Bench Press | 4x8 | 185lb</Text>
          <Text style={styles.exampleText}>Overhead Press | 3x10 | 95lb</Text>
          <Text style={styles.exampleText}>Tricep Dips | 3x12 | Bodyweight</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Upload your Excel workout plan and we'll automatically extract your exercises, sets, reps, and create a 12-week training cycle.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  uploadButtonSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  formatText: {
    fontSize: 14,
    color: '#374151',
  },
  exampleSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  exampleBox: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 4,
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
