import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import CollapsibleSection from '../components/CollapsibleSection';
import DashboardCard from '../components/DashboardCard';
import { fetchLatestPhysiqueScan, fetchPhysiqueScans, submitPhysiqueScan } from '../services/physiqueScans';
import type { PhysiqueScanScreenNavigationProp } from '../types/navigation';
import type { PhysiqueScan } from '../types/physiqueScan';

const PHOTO_TYPES = [
  { key: 'front', label: 'Front' },
  { key: 'side', label: 'Side' },
  { key: 'back', label: 'Back' },
] as const;

type Props = {
  navigation: PhysiqueScanScreenNavigationProp;
};

const PhysiqueScanScreen: React.FC<Props> = ({ navigation }) => {
  const [photos, setPhotos] = useState<Record<string, string | null>>({ front: null, side: null, back: null });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scans, setScans] = useState<PhysiqueScan[]>([]);
  const [latestScan, setLatestScan] = useState<PhysiqueScan | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const [allScansResponse, latestScanResponse] = await Promise.all([
        fetchPhysiqueScans(),
        fetchLatestPhysiqueScan(),
      ]);
      setScans(allScansResponse.scans);
      setLatestScan(latestScanResponse);
      setError(null);
    } catch (err) {
      setError('Unable to load physique scans.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const requestPermission = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handlePickImage = async (slot: 'front' | 'side' | 'back', source: 'camera' | 'library') => {
    setError(null);
    const granted = await requestPermission(source);

    if (!granted) {
      setError('Permission denied. Please enable access to continue.');
      return;
    }

    const pickerFn =
      source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

    const result = await pickerFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotos((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
      setSuccess(null);
    }
  };

  const resetForm = () => {
    setPhotos({ front: null, side: null, back: null });
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!photos.front || !photos.side || !photos.back) {
      setError('Please provide front, side, and back photos.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await submitPhysiqueScan({
        frontPhotoUri: photos.front,
        sidePhotoUri: photos.side,
        backPhotoUri: photos.back,
        notes: notes.trim().length > 0 ? notes.trim() : undefined,
      });

      setSuccess('Physique scan uploaded successfully!');
      await loadHistory();
      resetForm();

      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (err) {
      setError('Unable to upload physique scan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Monthly Physique Scan</Text>

        <DashboardCard title="Capture" subtitle="Collect front, side, and back angles">
          {PHOTO_TYPES.map(({ key, label }) => (
            <View key={key} style={styles.photoRow}>
              <View style={styles.photoInfo}>
                <Text style={styles.photoLabel}>{label} Photo</Text>
                <Text style={styles.photoHint}>Capture clear, well-lit angle</Text>
              </View>
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handlePickImage(key, 'camera')}>
                  <Text style={styles.actionButtonText}>Take</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => handlePickImage(key, 'library')}>
                  <Text style={styles.actionButtonSecondaryText}>Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.previewGrid}>
            {PHOTO_TYPES.map(({ key, label }) => (
              <View key={`preview-${key}`} style={styles.previewTile}>
                {photos[key] ? (
                  <Image source={{ uri: photos[key]! }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.previewPlaceholder}>{label}</Text>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Add muscle group focus or coaching notes..."
            value={notes}
            onChangeText={setNotes}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>{success}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, (submitting || !photos.front || !photos.side || !photos.back) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !photos.front || !photos.side || !photos.back}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Save Scan</Text>}
          </TouchableOpacity>
        </DashboardCard>

        <CollapsibleSection
          title="Latest Scan"
          subtitle="Baseline for improvement"
          initiallyExpanded
        >
          {loadingHistory ? (
            <ActivityIndicator color="#2563EB" />
          ) : latestScan ? (
            <View>
              <Text style={styles.latestMeta}>Taken: {new Date(latestScan.takenAt).toLocaleString()}</Text>
              {latestScan.notes ? <Text style={styles.latestNotes}>Notes: {latestScan.notes}</Text> : null}
              <View style={styles.previewGrid}>
                <Image source={{ uri: latestScan.frontPhotoUri }} style={styles.previewImage} />
                <Image source={{ uri: latestScan.sidePhotoUri }} style={styles.previewImage} />
                <Image source={{ uri: latestScan.backPhotoUri }} style={styles.previewImage} />
              </View>
            </View>
          ) : (
            <Text style={styles.placeholderText}>No physique scans yet. Capture your first to build momentum.</Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="History" subtitle="Track your month-over-month consistency" initiallyExpanded={false}>
          {loadingHistory ? (
            <ActivityIndicator color="#2563EB" />
          ) : scans.length === 0 ? (
            <Text style={styles.placeholderText}>Scans will appear here once recorded.</Text>
          ) : (
            scans.map((scan) => (
              <View key={scan.id} style={styles.historyRow}>
                <View style={styles.historyTextGroup}>
                  <Text style={styles.historyTitle}>{new Date(scan.takenAt).toLocaleDateString()}</Text>
                  {scan.notes ? <Text style={styles.historyNotes}>{scan.notes}</Text> : null}
                </View>
                <Text style={styles.historyStatus}>{scan.status.toUpperCase()}</Text>
              </View>
            ))
          )}
        </CollapsibleSection>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1F2937',
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoInfo: {
    flex: 1,
    marginRight: 12,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  photoHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionButtonSecondaryText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewTile: {
    flex: 1,
    height: 120,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  previewPlaceholder: {
    color: '#475569',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 12,
  },
  successText: {
    color: '#16A34A',
    fontSize: 14,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  latestMeta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  latestNotes: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#475569',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTextGroup: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyNotes: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});

export default PhysiqueScanScreen;
