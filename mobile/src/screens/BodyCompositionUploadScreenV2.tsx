import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_USER_ID, useUser } from '../context/UserContext';
import {
  uploadBodyCompositionDocument,
  submitBodyCompositionScan,
  uploadBodyCompositionCSV,
} from '../services/bodyCompositionService';

interface BodyCompositionData {
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  visceralFat?: number;
}

interface SelectedImage {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

interface SelectedCSV {
  uri: string;
  fileName: string;
}

interface CSVParsePreview {
  rowCount: number;
  firstRow?: Record<string, string>;
}

export default function BodyCompositionUploadScreenV2() {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedCSV, setSelectedCSV] = useState<SelectedCSV | null>(null);
  const [uploading, setUploading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [data, setData] = useState<BodyCompositionData>({});
  const [csvPreview, setCsvPreview] = useState<CSVParsePreview | null>(null);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName ?? `body-composition-${Date.now()}.jpg`,
        mimeType: result.assets[0].mimeType ?? 'image/jpeg',
      });
      setSelectedCSV(null); // Clear CSV if image is selected
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName ?? result.assets[0].uri.split('/').pop() ?? `body-composition-${Date.now()}.jpg`,
        mimeType: result.assets[0].mimeType ?? 'image/jpeg',
      });
      setSelectedCSV(null); // Clear CSV if image is selected
    }
  };

  const pickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets[0]) {
        setSelectedCSV({
          uri: result.assets[0].uri,
          fileName: result.assets[0].name,
        });
        setSelectedImage(null); // Clear image if CSV is selected
        
        // Show preview modal
        setCsvPreview({
          rowCount: 1, // Will be updated after upload
        });
        setShowCSVPreview(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick CSV file');
    }
  };

  const uploadScan = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setUploading(true);

    try {
      await uploadBodyCompositionDocument({
        userId: resolvedUserId,
        uri: selectedImage.uri,
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
      });

      Alert.alert(
        'Success',
        'Body composition scan uploaded successfully! Processing in background.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedImage(null);
              setData({});
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload scan. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadCSV = async () => {
    if (!selectedCSV) {
      Alert.alert('No CSV', 'Please select a CSV file first');
      return;
    }

    setUploading(true);

    try {
      console.log('[CSV Upload Screen] Starting CSV upload');
      const response = await uploadBodyCompositionCSV({
        userId: resolvedUserId,
        uri: selectedCSV.uri,
        fileName: selectedCSV.fileName,
      });

      console.log('[CSV Upload Screen] Response received:', response);

      if (response.success) {
        console.log('[CSV Upload Screen] Upload successful, showing alert');
        Alert.alert(
          'Success',
          response.message,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('[CSV Upload Screen] Resetting CSV selection');
                setSelectedCSV(null);
                setCsvPreview(null);
                setShowCSVPreview(false);
              },
            },
          ]
        );
      } else {
        console.log('[CSV Upload Screen] Upload failed:', response.message);
        Alert.alert(
          'Upload Failed',
          response.message,
          response.errors && response.errors.length > 0
            ? [
                {
                  text: 'View Errors',
                  onPress: () => {
                    const errorText = response.errors
                      ?.map(e => `Row ${e.row}: ${e.message}`)
                      .join('\n');
                    Alert.alert('CSV Errors', errorText || 'Unknown errors');
                  },
                },
                {
                  text: 'OK',
                },
              ]
            : [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[CSV Upload Screen] Upload error:', error);
      Alert.alert('Error', 'Failed to upload CSV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const submitManualEntry = async () => {
    if (!data.weight) {
      Alert.alert('Missing Data', 'Please enter at least your weight');
      return;
    }

    setUploading(true);

    try {
      await submitBodyCompositionScan({
        userId: resolvedUserId,
        scanDate: new Date().toISOString().split('T')[0],
        scanSource: 'manual_entry',
        weightLb: data.weight,
        bodyFatPercentage: data.bodyFatPercentage,
        skeletalMuscleMassLb: data.muscleMass,
        visceralFatLevel: data.visceralFat,
      });

      Alert.alert(
        'Success',
        'Body composition data saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setManualEntry(false);
              setData({});
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save data. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Composition</Text>
        <Text style={styles.subtitle}>Upload InBody scan, CSV, or enter manually</Text>
      </View>

      {!manualEntry ? (
        <>
          {/* Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Scan</Text>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={32} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : selectedCSV ? (
              <View style={styles.csvContainer}>
                <Ionicons name="document-text" size={48} color="#3b82f6" />
                <Text style={styles.csvFileName}>{selectedCSV.fileName}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setSelectedCSV(null)}
                >
                  <Ionicons name="close-circle" size={32} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Ionicons name="camera" size={32} color="#3b82f6" />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadButton} onPress={pickFromGallery}>
                  <Ionicons name="images" size={32} color="#3b82f6" />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadButton} onPress={pickCSV}>
                  <Ionicons name="document" size={32} color="#10b981" />
                  <Text style={styles.uploadButtonText}>Upload CSV</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedImage && (
              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={uploadScan}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Upload Scan</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {selectedCSV && (
              <TouchableOpacity
                style={[styles.submitButton, styles.csvButton, uploading && styles.submitButtonDisabled]}
                onPress={uploadCSV}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Upload CSV</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Manual Entry Option */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => setManualEntry(true)}
          >
            <Ionicons name="create" size={20} color="#3b82f6" />
            <Text style={styles.manualEntryButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Manual Entry Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Entry</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lb) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="fitness" size={20} color="#6b7280" />
                <Text
                  style={styles.input}
                  onPress={() => {
                    Alert.prompt(
                      'Weight',
                      'Enter your weight in pounds',
                      text => setData({ ...data, weight: parseFloat(text) || undefined }),
                      'plain-text',
                      data.weight?.toString() || '',
                      'numeric'
                    );
                  }}
                >
                  {data.weight ? `${data.weight} lb` : 'Tap to enter'}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Body Fat %</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="analytics" size={20} color="#6b7280" />
                <Text
                  style={styles.input}
                  onPress={() => {
                    Alert.prompt(
                      'Body Fat Percentage',
                      'Enter your body fat percentage',
                      text => setData({ ...data, bodyFatPercentage: parseFloat(text) || undefined }),
                      'plain-text',
                      data.bodyFatPercentage?.toString() || '',
                      'decimal-pad'
                    );
                  }}
                >
                  {data.bodyFatPercentage ? `${data.bodyFatPercentage}%` : 'Tap to enter'}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Muscle Mass (lb)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="barbell" size={20} color="#6b7280" />
                <Text
                  style={styles.input}
                  onPress={() => {
                    Alert.prompt(
                      'Muscle Mass',
                      'Enter your muscle mass in pounds',
                      text => setData({ ...data, muscleMass: parseFloat(text) || undefined }),
                      'plain-text',
                      data.muscleMass?.toString() || '',
                      'numeric'
                    );
                  }}
                >
                  {data.muscleMass ? `${data.muscleMass} lb` : 'Tap to enter'}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Visceral Fat Level</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="warning" size={20} color="#6b7280" />
                <Text
                  style={styles.input}
                  onPress={() => {
                    Alert.prompt(
                      'Visceral Fat Level',
                      'Enter your visceral fat level (1-20)',
                      text => setData({ ...data, visceralFat: parseFloat(text) || undefined }),
                      'plain-text',
                      data.visceralFat?.toString() || '',
                      'number-pad'
                    );
                  }}
                >
                  {data.visceralFat ? data.visceralFat.toString() : 'Tap to enter'}
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setManualEntry(false);
                  setData({});
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={submitManualEntry}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Upload your InBody scan photo, CSV export, or enter measurements manually. CSV files can contain multiple scans for batch import.
        </Text>
      </View>

      {/* CSV Preview Modal */}
      <Modal
        visible={showCSVPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCSVPreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CSV File Selected</Text>
              <TouchableOpacity onPress={() => setShowCSVPreview(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Ionicons name="document-text" size={64} color="#3b82f6" />
              <Text style={styles.modalFileName}>{selectedCSV?.fileName}</Text>
              <Text style={styles.modalInfo}>
                This CSV file will be imported as body composition scans.
              </Text>
              <Text style={styles.modalInfo}>
                Required columns: date, weight
              </Text>
              <Text style={styles.modalInfo}>
                Optional columns: body_fat_percentage, skeletal_muscle_mass_lb, visceral_fat_level, bmi, bmr
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setSelectedCSV(null);
                  setShowCSVPreview(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  setShowCSVPreview(false);
                  uploadCSV();
                }}
              >
                <Text style={styles.modalButtonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  uploadOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    width: '45%',
    marginBottom: 12,
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 16,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  csvContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    marginVertical: 16,
    position: 'relative',
  },
  csvFileName: {
    marginTop: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
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
  csvButton: {
    backgroundColor: '#10b981',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  manualEntryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalFileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 12,
    marginBottom: 16,
  },
  modalInfo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  modalConfirmButton: {
    backgroundColor: '#10b981',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
