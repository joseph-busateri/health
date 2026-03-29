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

export default function SupplementUploadScreen() {
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

  const uploadSupplement = async () => {
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
      
      // await fetch('http://localhost:3000/supplement/upload', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Success',
        'Supplement stack uploaded successfully! Processing in background.',
        [
          {
            text: 'OK',
            onPress: () => setSelectedFile(null),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload supplement stack. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supplement Stack</Text>
        <Text style={styles.subtitle}>Upload your Excel supplement list</Text>
      </View>

      {/* Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Supplement Stack</Text>
        
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
            onPress={uploadSupplement}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Upload Supplement Stack</Text>
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
          <Text style={styles.formatText}>Supplement name</Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Dosage with unit (e.g., 500mg, 5g, 1000 IU)</Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Timing (morning, evening, etc.)</Text>
        </View>
        <View style={styles.formatItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.formatText}>Goal/reason (optional)</Text>
        </View>
      </View>

      {/* Example Section */}
      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example Format:</Text>
        <View style={styles.exampleBox}>
          <Text style={styles.exampleText}>Vitamin D3 | 5000 IU | Morning | Immune support</Text>
          <Text style={styles.exampleText}>Creatine | 5g | Post-workout | Strength</Text>
          <Text style={styles.exampleText}>Omega-3 | 1000mg | Evening | Heart health</Text>
          <Text style={styles.exampleText}>Magnesium | 400mg | Before bed | Sleep & recovery</Text>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What You'll Get</Text>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Interaction Checking</Text>
            <Text style={styles.featureText}>
              Automatic detection of supplement-supplement and supplement-medication interactions
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="notifications" size={24} color="#3b82f6" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Adherence Tracking</Text>
            <Text style={styles.featureText}>
              Log daily intake, side effects, and perceived effectiveness
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="cube" size={24} color="#3b82f6" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Inventory Management</Text>
            <Text style={styles.featureText}>
              Track servings remaining and get reorder alerts
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="analytics" size={24} color="#3b82f6" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Agent Optimization</Text>
            <Text style={styles.featureText}>
              AI-powered stack adjustments based on bloodwork and adherence
            </Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Upload your Excel supplement list and we'll automatically extract dosages, timing, and create a managed supplement stack with interaction checking.
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
    flex: 1,
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
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
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
