import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import bloodworkService from '../services/bloodworkService';
import type {
  BloodworkDocument,
  BloodworkDocumentListItem,
  BloodworkUploadFormData,
  BloodworkStats,
  BloodworkDocumentType,
  BloodworkSource,
  BloodworkProcessingStatus,
} from '../types/bloodwork';
import {
  BloodworkDocumentTypeOptions,
  BloodworkSourceOptions,
  getFileTypeIcon,
  formatFullDate,
} from '../types/bloodwork';

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

let actionSheetIOS: typeof import('react-native').ActionSheetIOS | undefined;
if (Platform.OS === 'ios') {
  const { ActionSheetIOS } = require('react-native');
  actionSheetIOS = ActionSheetIOS;
}

const PROCESSING_STATUS_META: Record<BloodworkProcessingStatus, { label: string; color: string; background: string }> = {
  uploaded: { label: 'Uploaded', color: '#1D1D1F', background: '#E5E5EA' },
  pending: { label: 'Queued', color: '#B26A00', background: '#FFE4B8' },
  parsing: { label: 'Parsing Document', color: '#005BBB', background: '#D6E8FF' },
  extracting: { label: 'Extracting Results', color: '#005BBB', background: '#D6E8FF' },
  generating_trends: { label: 'Generating Trends', color: '#2F5D62', background: '#D9F5EF' },
  generating_recommendations: { label: 'Preparing Insights', color: '#2F5D62', background: '#D9F5EF' },
  complete: { label: 'Complete', color: '#1B5E20', background: '#DFF5E1' },
  failed: { label: 'Failed', color: '#B00020', background: '#FFE5E5' },
};

const PROCESSING_ACTIVE_STATUSES: BloodworkProcessingStatus[] = [
  'uploaded',
  'pending',
  'parsing',
  'extracting',
  'generating_trends',
  'generating_recommendations',
];

const formatProcessingDuration = (ms: number | null): string => {
  if (ms == null) {
    return '—';
  }

  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m${remainingSeconds ? ` ${remainingSeconds}s` : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ''}`;
};

// Simple validation function - removed document_type and source requirements
const validateUploadFormData = (formData: any) => {
  // No validation needed - AI will handle everything
  return {
    isValid: true,
    errors: {},
  };
};

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
    expandedDocumentId: null as string | null,
    retryingDocumentId: null as string | null,
    networkError: false,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<Map<string, BloodworkProcessingStatus>>(new Map());
  const completedDocsRef = useRef<Set<string>>(new Set());
  const webFileInputRef = useRef<any>(null);
  const webFileInputHandlerRef = useRef<((event: Event) => void) | null>(null);

  const finalizeFileSelection = useCallback((file: any) => {
    console.log('🔐 Finalizing file selection:', file?.name);
    const validation = bloodworkService.validateFileType(file);
    console.log('✅ File validation result:', validation);

    if (!validation.isValid) {
      Alert.alert('Invalid File', validation.error);
      return false;
    }

    console.log('📦 Setting selected file and opening modal');
    setState(prev => ({
      ...prev,
      selectedFile: file,
      showUploadModal: true,
    }));
    return true;
  }, []);

  const setupWebFileInput = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return null;
    }

    let input = webFileInputRef.current as HTMLInputElement | null;

    if (input && document.body.contains(input)) {
      return input;
    }

    input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*,text/plain,.doc,.docx,.tif,.tiff';
    input.style.display = 'none';

    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        console.log('⚠️ No file selected from web input');
        return;
      }

      console.log('🌐 Web file chosen via hidden input:', file.name);
      finalizeFileSelection(file);
      target.value = '';
    };

    webFileInputHandlerRef.current = handleChange;
    input.addEventListener('change', handleChange);
    document.body.appendChild(input);
    webFileInputRef.current = input;

    return input;
  }, [finalizeFileSelection]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const input = setupWebFileInput();

    return () => {
      if (Platform.OS !== 'web') {
        return;
      }

      const currentInput = (webFileInputRef.current ?? input) as HTMLInputElement | null;
      const handler = webFileInputHandlerRef.current;

      if (currentInput && handler) {
        currentInput.removeEventListener('change', handler);
      }
      if (currentInput && currentInput.parentNode) {
        currentInput.parentNode.removeChild(currentInput);
      }

      webFileInputRef.current = null;
      webFileInputHandlerRef.current = null;
    };
  }, [setupWebFileInput]);

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
        setState(prev => ({ ...prev, stats: (statsResponse.data ?? null) as BloodworkStats | null }));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    const activeDocuments = state.documents.filter(doc => PROCESSING_ACTIVE_STATUSES.includes(doc.processing_status));

    if (activeDocuments.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const pollStatuses = async () => {
      try {
        const results = await Promise.all(
          activeDocuments.map(async doc => {
            const statusResponse = await bloodworkService.getBloodworkDocumentStatus(doc.id);
            return { docId: doc.id, statusResponse };
          })
        );

        setState(prev => {
          const updatedDocuments = prev.documents.map(doc => {
            const result = results.find(item => item.docId === doc.id);
            if (result && result.statusResponse.success && result.statusResponse.data) {
              const statusData = result.statusResponse.data;
              const hasChanged =
                doc.processing_status !== statusData.processing_status ||
                doc.processing_progress !== (statusData.processing_progress ?? null) ||
                doc.processing_error !== (statusData.processing_error ?? null) ||
                doc.processing_started_at !== (statusData.processing_started_at ?? null) ||
                doc.processing_completed_at !== (statusData.processing_completed_at ?? null);

              if (!hasChanged) {
                return doc;
              }

              return {
                ...doc,
                processing_status: statusData.processing_status,
                processing_progress: statusData.processing_progress ?? null,
                processing_error: statusData.processing_error ?? null,
                processing_started_at: statusData.processing_started_at ?? null,
                processing_completed_at: statusData.processing_completed_at ?? null,
              };
            }
            return doc;
          });

          const documentsChanged =
            updatedDocuments.length !== prev.documents.length ||
            updatedDocuments.some((doc, index) => doc !== prev.documents[index]);

          if (!documentsChanged && !prev.networkError) {
            return prev;
          }

          return { ...prev, documents: updatedDocuments, networkError: false };
        });
      } catch (error) {
        console.error('Error polling processing status:', error);
        setState(prev => {
          if (prev.networkError) {
            return prev;
          }
          return { ...prev, networkError: true };
        });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    pollStatuses();
    const intervalMs = Platform.OS === 'web' ? 5000 : 5000;
    const intervalId = setInterval(pollStatuses, intervalMs);
    pollingIntervalRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      pollingIntervalRef.current = null;
    };
  }, [state.documents]);

  useEffect(() => {
    let shouldRefresh = false;

    state.documents.forEach(doc => {
      const previousStatus = previousStatusRef.current.get(doc.id);

      if (doc.processing_status !== 'complete' && completedDocsRef.current.has(doc.id)) {
        completedDocsRef.current.delete(doc.id);
      }

      if (previousStatus && previousStatus !== doc.processing_status) {
        if (doc.processing_status === 'complete' && !completedDocsRef.current.has(doc.id)) {
          Alert.alert('Bloodwork Ready', `${doc.file_name} has finished processing.`);
          completedDocsRef.current.add(doc.id);
          shouldRefresh = true;
        }
        if (doc.processing_status === 'failed') {
          Alert.alert('Processing Failed', doc.processing_error || 'Processing failed. You can retry.');
        }
      }

      previousStatusRef.current.set(doc.id, doc.processing_status);
    });

    if (shouldRefresh) {
      void loadDocuments();
    }
  }, [state.documents, loadDocuments]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
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
      console.log('📂 pickDocument invoked');

      if (Platform.OS === 'web') {
        const input = setupWebFileInput();
        if (input) {
          console.log('🌐 Triggering hidden web file input');
          input.click();
        } else {
          console.log('⚠️ Web file input not ready, falling back to DocumentPicker');
          await pickPDFDocument();
        }
        return;
      }

      if (actionSheetIOS && typeof actionSheetIOS.showActionSheetWithOptions === 'function') {
        actionSheetIOS.showActionSheetWithOptions(
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
        console.log('🖱️ Directly opening DocumentPicker (non-iOS)');
        await pickPDFDocument();
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickPDFDocument = async () => {
    try {
      console.log('📄 pickPDFDocument start');
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
      console.log('📄 DocumentPicker result:', result);

      if (result.canceled) {
        console.log('⚠️ DocumentPicker canceled');
        return;
      }

      const asset = result.assets?.[0] ?? {
        uri: (result as any).uri,
        name: (result as any).name ?? `document_${Date.now()}`,
        mimeType: (result as any).mimeType ?? 'application/pdf',
        size: (result as any).size ?? 0,
      };

      if (!asset?.uri) {
        Alert.alert('Invalid File', 'Unable to read selected file.');
        return;
      }

      let file: any;

      if (Platform.OS === 'web' && asset.file instanceof File) {
        console.log('🌐 Using native File from DocumentPicker');
        file = asset.file;
      } else {
        file = {
          uri: asset.uri,
          name: asset.name ?? `document_${Date.now()}`,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        } as any;
      }

      finalizeFileSelection(file);
    } catch (error) {
      console.error('Error picking PDF document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImageDocument = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

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
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

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
    setState(prev => {
      const { [field as string]: _removed, ...restErrors } = prev.formErrors;

      return {
        ...prev,
        formData: {
          ...prev.formData,
          [field]: value,
        },
        formErrors: restErrors,
      };
    });
  };

  const uploadDocument = async () => {
    console.log('🚀 Starting upload process...');
    
    if (!state.selectedFile) {
      console.log('❌ No file selected');
      Alert.alert('Error', 'Please select a file');
      return;
    }

    console.log('📁 File selected:', state.selectedFile.name);

    const validation = validateUploadFormData(state.formData);
    
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      setState(prev => ({
        ...prev,
        formErrors: validation.errors,
      }));
      return;
    }

    console.log('✅ Validation passed');

    try {
      console.log('⏳ Starting upload...');
      setState(prev => ({ ...prev, uploading: true }));

      const uploadRequest = {
        file: state.selectedFile,
        file_name: state.selectedFile.name,
        document_type: 'lab_panel' as const, // Default - AI will refine this
        source: 'manual_upload' as const, // Default - AI will refine this
        notes: state.formData.notes || undefined,
      };

      console.log('📤 Upload request:', uploadRequest);

      const response = await bloodworkService.uploadBloodworkDocument(
        uploadRequest,
        TEST_USER_ID
      );

      console.log('📥 Upload response:', response);

      if (response.success) {
        Alert.alert(
          '🎉 Upload Successful!', 
          'Your bloodwork document has been uploaded successfully. The AI will now analyze your results and provide personalized recommendations.',
          [
            {
              text: 'View Results',
              onPress: () => navigation.navigate('BloodworkResults', { userId: TEST_USER_ID })
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
        
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
        console.log('❌ Upload failed:', response.error);
        Alert.alert('Upload Failed', response.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('💥 Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      console.log('🏁 Upload process finished');
      setState(prev => ({ ...prev, uploading: false }));
    }
  };

  const deleteDocument = async (documentId: string) => {
    const performDelete = async () => {
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
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this bloodwork document?') : false;
      if (confirmed) {
        await performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this bloodwork document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performDelete();
          },
        },
      ]
    );
  };

  const handleRetry = async (documentId: string) => {
    try {
      setState(prev => ({ ...prev, retryingDocumentId: documentId }));
      const response = await bloodworkService.retryBloodworkProcessing(documentId, TEST_USER_ID);

      if (response.success) {
        Alert.alert('Retry Started', 'The document is being reprocessed.');
        await loadDocuments();
      } else {
        Alert.alert('Retry Failed', response.error || 'Unable to retry processing');
      }
    } catch (error) {
      console.error('Error retrying processing:', error);
      Alert.alert('Error', 'Failed to retry processing');
    } finally {
      setState(prev => ({ ...prev, retryingDocumentId: null }));
    }
  };

  const toggleDocumentExpansion = (documentId: string) => {
    setState(prev => ({
      ...prev,
      expandedDocumentId: prev.expandedDocumentId === documentId ? null : documentId,
    }));
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '—';
    const date = new Date(iso);
    return `${formatFullDate(date.toISOString())}`;
  };

  const formatDurationBetween = (start?: string | null, end?: string | null) => {
    if (!start) return '—';
    const startMs = new Date(start).getTime();
    const endMs = end ? new Date(end).getTime() : Date.now();
    const duration = endMs - startMs;
    if (duration <= 0) return '—';
    return formatProcessingDuration(duration);
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
          <View
            style={[styles.statusBadge, {
              backgroundColor: PROCESSING_STATUS_META[document.processing_status]?.background || document.status_color,
            }]}
          >
            <Text
              style={[styles.statusText, {
                color: PROCESSING_STATUS_META[document.processing_status]?.color || '#FFFFFF',
              }]}
            >
              {PROCESSING_STATUS_META[document.processing_status]?.label || document.status_label}
            </Text>
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

      {PROCESSING_ACTIVE_STATUSES.includes(document.processing_status) && (
        <View style={styles.processingContainer}>
          <ActivityIndicator color={PROCESSING_STATUS_META[document.processing_status].color} />
          <View style={styles.processingTextContainer}>
            <Text style={[styles.processingTitle, { color: PROCESSING_STATUS_META[document.processing_status].color }]}
            >
              {PROCESSING_STATUS_META[document.processing_status].label}
            </Text>
            <Text style={styles.processingSubtitle}>
              {document.processing_progress != null
                ? `Progress: ${Math.round(document.processing_progress)}%`
                : 'Processing...'}
            </Text>
            <Text style={styles.processingTimestamp}>
              Started {formatDurationBetween(document.processing_started_at, null)} ago
            </Text>
          </View>
        </View>
      )}

      {document.processing_status === 'failed' && (
        <View style={styles.processingErrorContainer}>
          <Text style={styles.processingErrorTitle}>Processing Failed</Text>
          {document.processing_error ? (
            <Text style={styles.processingErrorMessage}>{document.processing_error}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.processingRetryButton}
            onPress={() => handleRetry(document.id)}
            disabled={state.retryingDocumentId === document.id}
          >
            {state.retryingDocumentId === document.id ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.processingRetryButtonText}>Retry Processing</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {document.processing_status === 'complete' && (
        <View style={styles.processingCompleteContainer}>
          <Text style={styles.processingCompleteText}>
            Completed in {formatDurationBetween(document.processing_started_at, document.processing_completed_at)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.expandToggle}
        onPress={() => toggleDocumentExpansion(document.id)}
      >
        <Text style={styles.expandToggleText}>
          {state.expandedDocumentId === document.id ? 'Hide details' : 'Show details'}
        </Text>
      </TouchableOpacity>

      {state.expandedDocumentId === document.id && (
        <View style={styles.documentExtraDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processing Status</Text>
            <Text style={styles.detailValue}>{PROCESSING_STATUS_META[document.processing_status]?.label || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started At</Text>
            <Text style={styles.detailValue}>{formatTimestamp(document.processing_started_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed At</Text>
            <Text style={styles.detailValue}>{formatTimestamp(document.processing_completed_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {formatDurationBetween(document.processing_started_at, document.processing_completed_at)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parse Status</Text>
            <Text style={styles.detailValue}>{document.status_label}</Text>
          </View>
        </View>
      )}

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

        <View style={styles.processingSummaryContainer}>
          <Text style={styles.processingSummaryText}>
            In Progress: {statusSummary.inProgress}
          </Text>
          {statusSummary.averageProcessingTimeMs && (
            <Text style={styles.processingSummaryText}>
              Avg Duration: {formatProcessingDuration(statusSummary.averageProcessingTimeMs)}
            </Text>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
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
  processingSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  processingSummaryText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
  },
  processingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4,
  },
  processingTimestamp: {
    fontSize: 12,
    color: '#6E6E73',
  },
  processingErrorContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFE5E5',
  },
  processingErrorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B00020',
    marginBottom: 4,
  },
  processingErrorMessage: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 8,
  },
  processingRetryButton: {
    backgroundColor: '#B00020',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  processingCompleteContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#DFF5E1',
  },
  processingCompleteText: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '600',
  },
  expandToggle: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  expandToggleText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  documentExtraDetails: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6E6E73',
  },
  detailValue: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '500',
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
