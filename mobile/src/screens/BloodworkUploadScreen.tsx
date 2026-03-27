import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import bloodworkService from '../services/bloodworkService';
import type {
  BloodworkDocument,
  BloodworkDocumentListItem,
  BloodworkUploadFormData,
  BloodworkStats,
  BloodworkDocumentType,
  BloodworkSource,
} from '../types/bloodwork';
import {
  BloodworkDocumentTypeOptions,
  BloodworkSourceOptions,
  getFileTypeIcon,
} from '../types/bloodwork';

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

interface BloodworkUploadScreenProps {
  navigation: any;
}

const BloodworkUploadScreen: React.FC<BloodworkUploadScreenProps> = ({ navigation }) => {
  const [state, setState] = useState({
    documents: [] as BloodworkDocumentListItem[],
    stats: null as BloodworkStats | null,
    loading: false,
    refreshing: false,
    uploading: false,
    showUploadModal: false,
    selectedFile: null as File | null,
    formData: {
      document_type: 'lab_panel' as BloodworkDocumentType,
      source: 'manual_upload' as BloodworkSource,
      test_date: '',
      notes: '',
    } as BloodworkUploadFormData,
    formErrors: {} as Record<string, string>,
  });

  const loadDocuments = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const [documentsResponse, statsResponse] = await Promise.all([
        bloodworkService.getBloodworkDocuments(TEST_USER_ID),
        bloodworkService.getBloodworkStats(TEST_USER_ID),
      ]);

      if (documentsResponse.success) {
        const transformedDocuments = bloodworkService.transformDocumentsForUI(
          documentsResponse.data?.documents || []
        );
        setState(prev => ({ ...prev, documents: transformedDocuments }));
      }

      if (statsResponse.success) {
        setState(prev => ({ ...prev, stats: statsResponse.data }));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const onRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await loadDocuments();
    setState(prev => ({ ...prev, refreshing: false }));
  }, [loadDocuments]);

  const pickDocument = async () => {
    try {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Choose PDF', 'Choose Image', 'Take Photo'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            switch (buttonIndex) {
              case 1:
                await pickPDFDocument();
                break;
              case 2:
                await pickImageDocument();
                break;
              case 3:
                await takePhoto();
                break;
              default:
                break;
            }
          }
        );
      } else {
        // For Android, show document picker first
        await pickPDFDocument();
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickPDFDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Convert to File object (simplified for React Native)
        const file = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        } as any;

        const validation = bloodworkService.validateFileType(file);
        
        if (!validation.isValid) {
          Alert.alert('Invalid File', validation.error);
          return;
        }

        setState(prev => ({
          ...prev,
          selectedFile: file,
          showUploadModal: true,
        }));
      }
    } catch (error) {
      console.error('Error picking PDF document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImageDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        const file = {
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        } as any;

        setState(prev => ({
          ...prev,
          selectedFile: file,
          showUploadModal: true,
        }));
      }
    } catch (error) {
      console.error('Error picking image document:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        const file = {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        } as any;

        setState(prev => ({
          ...prev,
          selectedFile: file,
          showUploadModal: true,
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const updateFormData = (field: keyof BloodworkUploadFormData, value: string) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
      formErrors: {
        ...prev.formErrors,
        [field]: undefined,
      },
    }));
  };

  const uploadDocument = async () => {
    if (!state.selectedFile) {
      Alert.alert('Error', 'Please select a file');
      return;
    }

    const validation = validateUploadFormData(state.formData);
    
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        formErrors: validation.errors,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, uploading: true }));

      const uploadRequest = {
        file: state.selectedFile,
        file_name: state.selectedFile.name,
        document_type: state.formData.document_type,
        source: state.formData.source,
        test_date: state.formData.test_date || undefined,
        notes: state.formData.notes || undefined,
      };

      const response = await bloodworkService.uploadBloodworkDocument(
        uploadRequest,
        TEST_USER_ID
      );

      if (response.success) {
        Alert.alert('Success', 'Bloodwork document uploaded successfully!');
        setState(prev => ({
          ...prev,
          showUploadModal: false,
          selectedFile: null,
          formData: {
            document_type: 'lab_panel',
            source: 'manual_upload',
            test_date: '',
            notes: '',
          },
          formErrors: {},
        }));
        loadDocuments();
      } else {
        Alert.alert('Upload Failed', response.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setState(prev => ({ ...prev, uploading: false }));
    }
  };

  const deleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this bloodwork document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bloodworkService.deleteBloodworkDocument(
                documentId,
                TEST_USER_ID
              );

              if (response.success) {
                Alert.alert('Success', 'Document deleted successfully');
                loadDocuments();
              } else {
                Alert.alert('Error', response.error || 'Failed to delete document');
              }
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const renderDocumentItem = (document: BloodworkDocumentListItem) => (
    <View key={document.id} style={styles.documentItem}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentFileName}>{document.file_name}</Text>
          <View style={styles.documentMeta}>
            <Text style={styles.documentType}>{document.type_label}</Text>
            <Text style={styles.documentSource}>• {document.source_label}</Text>
          </View>
        </View>
        <View style={styles.documentStatus}>
          <View style={[styles.statusBadge, { backgroundColor: document.status_color }]}>
            <Text style={styles.statusText}>{document.status_label}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.documentDetails}>
        <Text style={styles.documentDate}>
          Test Date: {document.formatted_date}
        </Text>
        <Text style={styles.documentUploadDate}>
          Uploaded: {document.formatted_upload_date}
        </Text>
        {document.extraction_confidence && (
          <Text style={styles.documentConfidence}>
            Confidence: {Math.round(document.extraction_confidence * 100)}%
          </Text>
        )}
      </View>

      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // TODO: Implement document preview
            Alert.alert('Preview', 'Document preview coming soon');
          }}
        >
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteDocument(document.id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUploadModal = () => {
    if (!state.showUploadModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Bloodwork Document</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setState(prev => ({ ...prev, showUploadModal: false }))}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {state.selectedFile && (
              <View style={styles.selectedFile}>
                <Text style={styles.selectedFileIcon}>
                  {getFileTypeIcon(state.selectedFile.type)}
                </Text>
                <Text style={styles.selectedFileName}>{state.selectedFile.name}</Text>
                <Text style={styles.selectedFileSize}>
                  {(state.selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Document Type</Text>
              <View style={styles.pickerContainer}>
                {BloodworkDocumentTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pickerOption,
                      state.formData.document_type === option.value && styles.pickerOptionSelected,
                    ]}
                    onPress={() => updateFormData('document_type', option.value)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        state.formData.document_type === option.value && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {state.formErrors.document_type && (
                <Text style={styles.errorText}>{state.formErrors.document_type}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Source</Text>
              <View style={styles.pickerContainer}>
                {BloodworkSourceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pickerOption,
                      state.formData.source === option.value && styles.pickerOptionSelected,
                    ]}
                    onPress={() => updateFormData('source', option.value)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        state.formData.source === option.value && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {state.formErrors.source && (
                <Text style={styles.errorText}>{state.formErrors.source}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Test Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  // TODO: Implement date picker
                  Alert.alert('Date Picker', 'Date picker coming soon');
                }}
              >
                <Text style={styles.dateInputText}>
                  {state.formData.test_date || 'Select test date'}
                </Text>
              </TouchableOpacity>
              {state.formErrors.test_date && (
                <Text style={styles.errorText}>{state.formErrors.test_date}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={state.formData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                placeholder="Add any notes about this document..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setState(prev => ({ ...prev, showUploadModal: false }))}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.uploadButton]}
              onPress={uploadDocument}
              disabled={state.uploading}
            >
              {state.uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderStats = () => {
    if (!state.stats) return null;

    const statusSummary = bloodworkService.getStatusSummary(state.stats);

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Bloodwork Overview</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statusSummary.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statusSummary.parsed}</Text>
            <Text style={styles.statLabel}>Parsed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statusSummary.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statusSummary.failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        <View style={styles.successRateContainer}>
          <Text style={styles.successRateLabel}>Success Rate</Text>
          <Text style={styles.successRateNumber}>{statusSummary.successRate}%</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bloodwork Documents</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickDocument}>
          <Text style={styles.addButtonText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={state.refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStats()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Uploads</Text>
          <Text style={styles.sectionSubtitle}>
            {state.documents.length} document{state.documents.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {state.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : state.documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No bloodwork documents</Text>
            <Text style={styles.emptySubtitle}>
              Upload your first bloodwork document to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={pickDocument}>
              <Text style={styles.emptyButtonText}>Upload Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.documentsList}>
            {state.documents.map(renderDocumentItem)}
          </View>
        )}
      </ScrollView>

      {renderUploadModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  successRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  successRateLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  successRateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  documentsList: {
    gap: 12,
  },
  documentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentType: {
    fontSize: 14,
    color: '#007AFF',
  },
  documentSource: {
    fontSize: 14,
    color: '#8E8E93',
  },
  documentStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  documentDetails: {
    marginBottom: 12,
  },
  documentDate: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 2,
  },
  documentUploadDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  documentConfidence: {
    fontSize: 14,
    color: '#8E8E93',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  selectedFile: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedFileIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  selectedFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedFileSize: {
    fontSize: 14,
    color: '#8E8E93',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#1D1D1F',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
  },
  dateInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#1D1D1F',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BloodworkUploadScreen;
