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

import DashboardCard from '../components/DashboardCard';
import { fetchMealLogs, submitMealLog } from '../services/mealLogs';
import type { MealPhotoScreenNavigationProp } from '../types/navigation';
import type { MealLabel, MealLog } from '../types/mealLog';

const MEAL_LABELS: MealLabel[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type Props = {
  navigation: MealPhotoScreenNavigationProp;
};

const MealPhotoScreen: React.FC<Props> = ({ navigation }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mealLabel, setMealLabel] = useState<MealLabel | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await fetchMealLogs();
      setMealLogs(response.mealLogs);
    } catch (err) {
      setError('Unable to load meal history.');
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

  const handlePickImage = async (source: 'camera' | 'library') => {
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
      setImageUri(result.assets[0].uri);
      setSuccess(null);
    }
  };

  const resetForm = () => {
    setImageUri(null);
    setMealLabel(null);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      setError('Please select or capture a photo.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const mealLog = await submitMealLog({
        photoUri: imageUri,
        mealLabel: mealLabel ?? undefined,
        notes: notes.trim().length > 0 ? notes.trim() : undefined,
      });

      setSuccess('Meal photo uploaded successfully!');
      await loadHistory();
      resetForm();

      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (err) {
      setError('Unable to upload meal photo. Please try again.');
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
        <Text style={styles.screenTitle}>Meal Photo</Text>

        <DashboardCard title="Capture" subtitle="Log a quick snapshot of your meal">
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handlePickImage('camera')}>
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => handlePickImage('library')}>
              <Text style={styles.actionButtonSecondaryText}>Choose From Library</Text>
            </TouchableOpacity>
          </View>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <Text style={styles.placeholderText}>No photo selected yet.</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Meal Label (Optional)</Text>
            <View style={styles.labelRow}>
              {MEAL_LABELS.map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.labelChip, mealLabel === label && styles.labelChipActive]}
                  onPress={() => setMealLabel(mealLabel === label ? null : label)}
                >
                  <Text style={[styles.labelChipText, mealLabel === label && styles.labelChipTextActive]}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Add quick context or macros to remember later..."
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>{success}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, (!imageUri || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!imageUri || submitting}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Save Meal</Text>}
          </TouchableOpacity>
        </DashboardCard>

        <DashboardCard title="Recent Meals" subtitle="Quick glance at your latest logs">
          {loadingHistory ? (
            <ActivityIndicator color="#2563EB" />
          ) : mealLogs.length === 0 ? (
            <Text style={styles.placeholderText}>No meal photos yet. Capture your first to start tracking.</Text>
          ) : (
            mealLogs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.historyRow}>
                <Image source={{ uri: log.photoUri }} style={styles.historyImage} />
                <View style={styles.historyTextGroup}>
                  <Text style={styles.historyLabel}>{log.mealLabel ? log.mealLabel.toUpperCase() : 'MEAL'}</Text>
                  <Text style={styles.historyMeta}>{new Date(log.takenAt).toLocaleString()}</Text>
                  {log.notes ? <Text style={styles.historyNotes}>{log.notes}</Text> : null}
                </View>
              </View>
            ))
          )}
        </DashboardCard>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#CBD5F5',
  },
  placeholderText: {
    fontSize: 14,
    color: '#475569',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
  },
  labelChipActive: {
    backgroundColor: '#2563EB',
  },
  labelChipText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  labelChipTextActive: {
    color: '#FFFFFF',
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
  historyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  historyImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#CBD5F5',
  },
  historyTextGroup: {
    flex: 1,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  historyNotes: {
    fontSize: 13,
    color: '#334155',
    marginTop: 6,
  },
});

export default MealPhotoScreen;
