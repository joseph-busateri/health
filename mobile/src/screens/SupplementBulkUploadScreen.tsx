import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

interface SupplementEntry {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
}

export default function SupplementBulkUploadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [parsedSupplements, setParsedSupplements] = useState<SupplementEntry[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const exampleText = `Vitamin D3 - 5000 IU - Daily - Morning
Omega-3 Fish Oil - 1000mg - Twice daily - With meals
Magnesium Glycinate - 400mg - Daily - Before bed
Creatine Monohydrate - 5g - Daily - Post-workout
Protein Powder - 30g - Daily - Post-workout`;

  const parseBulkText = () => {
    if (!bulkText.trim()) {
      Alert.alert('Error', 'Please enter supplement data');
      return;
    }

    const lines = bulkText.split('\n').filter(line => line.trim());
    const supplements: SupplementEntry[] = [];

    for (const line of lines) {
      const parts = line.split('-').map(p => p.trim());
      
      if (parts.length >= 2) {
        supplements.push({
          name: parts[0] || 'Unknown',
          dosage: parts[1] || '',
          frequency: parts[2] || 'Daily',
          timing: parts[3] || 'Anytime',
        });
      }
    }

    if (supplements.length === 0) {
      Alert.alert('Error', 'No valid supplements found. Please check the format.');
      return;
    }

    setParsedSupplements(supplements);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please set your user ID in Settings');
      return;
    }

    if (parsedSupplements.length === 0) {
      Alert.alert('Error', 'No supplements to upload');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:3000/api/supplements/bulk-upload',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            supplementText: bulkText,
            versionName: `Bulk Upload ${new Date().toLocaleDateString()}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      Alert.alert(
        'Success',
        `${data.supplementsCreated} supplements uploaded successfully!`,
        [
          {
            text: 'Upload More',
            onPress: () => {
              setBulkText('');
              setParsedSupplements([]);
              setShowPreview(false);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload supplements');
    } finally {
      setLoading(false);
    }
  };

  const removeSupplement = (index: number) => {
    setParsedSupplements(prev => prev.filter((_, i) => i !== index));
  };

  const useExample = () => {
    setBulkText(exampleText);
    setShowPreview(false);
    setParsedSupplements([]);
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>Set your user ID in Settings to upload supplements</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bulk Upload Supplements</Text>
        <Text style={styles.subtitle}>Upload multiple supplements at once</Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionsHeader}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.instructionsTitle}>Format Instructions</Text>
        </View>
        <Text style={styles.instructionsText}>
          Enter one supplement per line in this format:
        </Text>
        <View style={styles.formatExample}>
          <Text style={styles.formatText}>Name - Dosage - Frequency - Timing</Text>
        </View>
        <TouchableOpacity style={styles.exampleButton} onPress={useExample}>
          <Ionicons name="document-text" size={16} color="#3b82f6" />
          <Text style={styles.exampleButtonText}>Load Example</Text>
        </TouchableOpacity>
      </View>

      {/* Input Section */}
      {!showPreview ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Supplement Data</Text>
          <TextInput
            style={styles.textArea}
            placeholder={`Example:\n${exampleText}`}
            value={bulkText}
            onChangeText={setBulkText}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.parseButton}
              onPress={parseBulkText}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.parseButtonText}>Parse & Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.previewHeader}>
            <Text style={styles.sectionTitle}>Preview ({parsedSupplements.length} supplements)</Text>
            <TouchableOpacity
              onPress={() => {
                setShowPreview(false);
                setParsedSupplements([]);
              }}
            >
              <Ionicons name="create" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {parsedSupplements.map((supplement, index) => (
            <View key={index} style={styles.supplementCard}>
              <View style={styles.supplementHeader}>
                <Text style={styles.supplementName}>{supplement.name}</Text>
                <TouchableOpacity onPress={() => removeSupplement(index)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.supplementDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="flask" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Dosage:</Text>
                  <Text style={styles.detailValue}>{supplement.dosage}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="repeat" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Frequency:</Text>
                  <Text style={styles.detailValue}>{supplement.frequency}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Timing:</Text>
                  <Text style={styles.detailValue}>{supplement.timing}</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.uploadActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowPreview(false);
                setParsedSupplements([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload All</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>• Use hyphens (-) to separate fields</Text>
        <Text style={styles.tipText}>• One supplement per line</Text>
        <Text style={styles.tipText}>• Name and dosage are required</Text>
        <Text style={styles.tipText}>• Frequency defaults to "Daily" if omitted</Text>
        <Text style={styles.tipText}>• Timing defaults to "Anytime" if omitted</Text>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
  },
  formatExample: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  formatText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#1e3a8a',
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  exampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 200,
    fontFamily: 'monospace',
  },
  actionButtons: {
    marginTop: 16,
  },
  parseButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  parseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supplementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  supplementDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
