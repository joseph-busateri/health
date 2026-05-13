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
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { DEFAULT_USER_ID, useUser } from '../context/UserContext';
import { uploadSleepNumberData } from '../services/sleepNumberService';

export default function SleepNumberUploadScreen() {
  const [selectedFile, setSelectedFile] = useState<DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedSessions, setUploadedSessions] = useState<number>(0);
  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setSelectedFile(asset);
      Alert.alert('File Selected', `${asset.name ?? 'File'} is ready to upload`, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const uploadSleepData = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    setLoading(true);

    try {
      const fileType = selectedFile.name?.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const result = await uploadSleepNumberData({
        userId: resolvedUserId,
        fileContent,
        fileType,
      });

      setUploadedSessions(result.sessionCount);

      Alert.alert(
        'Success!',
        `${result.sessionCount} sleep sessions uploaded successfully!\n\nYour sleep data is now being analyzed.`,
        [
          {
            text: 'View Insights',
            onPress: () => {
              // Navigate to sleep insights screen
              setSelectedFile(null);
            },
          },
          {
            text: 'OK',
            onPress: () => setSelectedFile(null),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload sleep data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sleep Number Upload</Text>
        <Text style={styles.subtitle}>Import your sleep tracking data</Text>
      </View>

      {/* Sleep Number Info */}
      <View style={styles.infoSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="bed" size={48} color="#3b82f6" />
        </View>
        <Text style={styles.infoTitle}>Sleep Number Integration</Text>
        <Text style={styles.infoText}>
          Upload your Sleep Number data to track sleep quality, heart rate, respiratory rate, and sleep stages over time.
        </Text>
      </View>

      {/* File Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Sleep Data</Text>

        {selectedFile ? (
          <View style={styles.selectedFile}>
            <View style={styles.fileIcon}>
              <Ionicons 
                name={selectedFile.name?.toLowerCase().endsWith('.json') ? 'document-text' : 'document'} 
                size={32} 
                color="#3b82f6" 
              />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{selectedFile.name ?? 'Selected File'}</Text>
              <Text style={styles.fileSize}>
                {selectedFile.size != null ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Size unknown'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Ionicons name="cloud-upload" size={32} color="#3b82f6" />
            <Text style={styles.uploadButtonText}>Select File</Text>
            <Text style={styles.uploadButtonSubtext}>JSON or CSV format</Text>
          </TouchableOpacity>
        )}

        {selectedFile && (
          <TouchableOpacity
            style={[styles.processButton, loading && styles.processButtonDisabled]}
            onPress={uploadSleepData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.processButtonText}>Upload Sleep Data</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Data Points Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Track</Text>

        <View style={styles.dataPointsGrid}>
          <View style={styles.dataPoint}>
            <Ionicons name="moon" size={24} color="#8b5cf6" />
            <Text style={styles.dataPointText}>Sleep Stages</Text>
          </View>

          <View style={styles.dataPoint}>
            <Ionicons name="heart" size={24} color="#ef4444" />
            <Text style={styles.dataPointText}>Heart Rate</Text>
          </View>

          <View style={styles.dataPoint}>
            <Ionicons name="pulse" size={24} color="#3b82f6" />
            <Text style={styles.dataPointText}>Respiratory Rate</Text>
          </View>

          <View style={styles.dataPoint}>
            <Ionicons name="analytics" size={24} color="#10b981" />
            <Text style={styles.dataPointText}>Sleep IQ Score</Text>
          </View>

          <View style={styles.dataPoint}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <Text style={styles.dataPointText}>Sleep Duration</Text>
          </View>

          <View style={styles.dataPoint}>
            <Ionicons name="body" size={24} color="#ec4899" />
            <Text style={styles.dataPointText}>Movement</Text>
          </View>
        </View>
      </View>

      {/* How to Export Section */}
      <View style={styles.guideSection}>
        <Text style={styles.guideTitle}>How to Export from Sleep Number App</Text>

        <View style={styles.guideStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Open the Sleep Number app on your phone
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Go to Settings → Data & Privacy
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Select "Export My Data"
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <Text style={styles.stepText}>
            Choose date range and export format (JSON or CSV)
          </Text>
        </View>

        <View style={styles.guideStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>5</Text>
          </View>
          <Text style={styles.stepText}>
            Save the file and upload it here
          </Text>
        </View>
      </View>

      {/* Stats Preview */}
      {uploadedSessions > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Upload Summary</Text>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.statValue}>{uploadedSessions}</Text>
            <Text style={styles.statLabel}>Sleep Sessions Uploaded</Text>
          </View>
        </View>
      )}

      {/* Info Footer */}
      <View style={styles.infoFooter}>
        <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
        <Text style={styles.infoFooterText}>
          Your sleep data is encrypted and stored securely. We never share your personal health information.
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
  infoSection: {
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
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#eff6ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
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
  uploadButton: {
    padding: 32,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 16,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dataPointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dataPoint: {
    width: '47%',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
  },
  dataPointText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  guideSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 16,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#fbbf24',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    paddingTop: 4,
  },
  statsSection: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#166534',
    marginTop: 4,
  },
  infoFooter: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    gap: 12,
  },
  infoFooterText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
});
