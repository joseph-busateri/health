import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { uploadSupplementDocument, ManualSupplementData } from '../services/supplementDocumentService';
import type { RootStackParamList } from '../types/navigation';
import { useUser, DEFAULT_USER_ID } from '../context/UserContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplementUpload'>;

const SupplementUploadScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [stackName, setStackName] = useState('');
  const [stackNotes, setStackNotes] = useState('');
  const [timingNotes, setTimingNotes] = useState('');
  const [frequencyNotes, setFrequencyNotes] = useState('');
  
  // Supplement form state
  const [supplements, setSupplements] = useState<Array<{
    supplementName: string;
    dosage: string;
    dosageUnit: string;
    frequency: string;
    timing: string;
    status: 'active' | 'paused' | 'removed';
    notes: string;
  }>>([
    {
      supplementName: '',
      dosage: '',
      dosageUnit: '',
      frequency: '',
      timing: '',
      status: 'active',
      notes: '',
    },
  ]);

  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;

  const addSupplement = () => {
    setSupplements([
      ...supplements,
      {
        supplementName: '',
        dosage: '',
        dosageUnit: '',
        frequency: '',
        timing: '',
        status: 'active',
        notes: '',
      },
    ]);
  };

  const updateSupplement = (index: number, field: string, value: string | 'active' | 'paused' | 'removed') => {
    const updatedSupplements = [...supplements];
    updatedSupplements[index] = {
      ...updatedSupplements[index],
      [field]: value,
    };
    setSupplements(updatedSupplements);
  };

  const removeSupplement = (index: number) => {
    if (supplements.length > 1) {
      setSupplements(supplements.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!stackName.trim()) {
      Alert.alert('Error', 'Stack name is required');
      return;
    }

    const validSupplements = supplements.filter(s => s.supplementName.trim() && s.dosage && s.dosageUnit && s.frequency && s.timing);
    if (validSupplements.length === 0) {
      Alert.alert('Error', 'At least one complete supplement entry is required');
      return;
    }

    // Validate supplement data
    for (const supplement of validSupplements) {
      const dosage = parseFloat(supplement.dosage);
      if (isNaN(dosage) || dosage <= 0) {
        Alert.alert('Error', `Invalid dosage for ${supplement.supplementName}`);
        return;
      }
    }

    setLoading(true);

    try {
      const manualSupplementData: ManualSupplementData = {
        stackName: stackName.trim(),
        stackNotes: stackNotes.trim() || undefined,
        timingNotes: timingNotes.trim() || undefined,
        frequencyNotes: frequencyNotes.trim() || undefined,
        supplements: validSupplements.map(s => ({
          supplementName: s.supplementName.trim(),
          dosage: parseFloat(s.dosage),
          dosageUnit: s.dosageUnit.trim(),
          frequency: s.frequency.trim(),
          timing: s.timing.trim(),
          status: s.status,
          notes: s.notes.trim() || undefined,
        })),
      };

      const result = await uploadSupplementDocument({
        userId: resolvedUserId,
        documentType: 'manual_entry',
        notes: 'Uploaded from mobile app',
        manualSupplementData,
      });

      Alert.alert(
        'Success',
        'Supplement stack uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to summary screen with the result
              navigation.navigate('SupplementSummary', {
                baseline: result.baseline,
                items: result.items,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload supplement stack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Upload Supplement Stack
        </Text>

        {/* Stack Information */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Stack Information
          </Text>
          
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Stack Name *
          </Text>
          <TextInput
            className="border border-gray-300 rounded-md p-2 mb-3 text-gray-900"
            value={stackName}
            onChangeText={setStackName}
            placeholder="e.g., Daily Health Stack"
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">
            Stack Notes
          </Text>
          <TextInput
            className="border border-gray-300 rounded-md p-2 mb-3 text-gray-900"
            value={stackNotes}
            onChangeText={setStackNotes}
            placeholder="Optional notes about your supplement stack"
            multiline
            numberOfLines={2}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">
            Timing Notes
          </Text>
          <TextInput
            className="border border-gray-300 rounded-md p-2 mb-3 text-gray-900"
            value={timingNotes}
            onChangeText={setTimingNotes}
            placeholder="e.g., Take with meals, separate from medications"
            multiline
            numberOfLines={2}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">
            Frequency Notes
          </Text>
          <TextInput
            className="border border-gray-300 rounded-md p-2 mb-3 text-gray-900"
            value={frequencyNotes}
            onChangeText={setFrequencyNotes}
            placeholder="e.g., Daily, weekdays only, cycle on/off"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Supplements */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Supplements
            </Text>
            <TouchableOpacity
              onPress={addSupplement}
              className="bg-blue-500 px-3 py-1 rounded-md"
            >
              <Text className="text-white text-sm font-medium">Add Supplement</Text>
            </TouchableOpacity>
          </View>

          {supplements.map((supplement, index) => (
            <View key={index} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
              <View className="flex-row justify-between items-start mb-3">
                <Text className="font-medium text-gray-900">Supplement {index + 1}</Text>
                {supplements.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeSupplement(index)}
                    className="bg-red-500 px-2 py-1 rounded"
                  >
                    <Text className="text-white text-xs">Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Supplement Name *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2 mb-2 text-gray-900"
                value={supplement.supplementName}
                onChangeText={(value) => updateSupplement(index, 'supplementName', value)}
                placeholder="e.g., Vitamin D3"
              />

              <View className="flex-row space-x-2 mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Dosage *
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-md p-2 text-gray-900"
                    value={supplement.dosage}
                    onChangeText={(value) => updateSupplement(index, 'dosage', value)}
                    placeholder="e.g., 1000"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-md p-2 text-gray-900"
                    value={supplement.dosageUnit}
                    onChangeText={(value) => updateSupplement(index, 'dosageUnit', value)}
                    placeholder="e.g., IU, mg, g"
                  />
                </View>
              </View>

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2 mb-2 text-gray-900"
                value={supplement.frequency}
                onChangeText={(value) => updateSupplement(index, 'frequency', value)}
                placeholder="e.g., Once daily, Twice daily"
              />

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Timing *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2 mb-2 text-gray-900"
                value={supplement.timing}
                onChangeText={(value) => updateSupplement(index, 'timing', value)}
                placeholder="e.g., Morning, With breakfast"
              />

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Status
              </Text>
              <View className="flex-row space-x-2 mb-2">
                {(['active', 'paused', 'removed'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => updateSupplement(index, 'status', status)}
                    className={`flex-1 p-2 rounded-md border ${
                      supplement.status === status
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-medium ${
                        supplement.status === status ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Notes
              </Text>
              <TextInput
                className="border border-gray-300 rounded-md p-2 text-gray-900"
                value={supplement.notes}
                onChangeText={(value) => updateSupplement(index, 'notes', value)}
                placeholder="Optional notes about this supplement"
                multiline
                numberOfLines={2}
              />
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`bg-green-500 p-4 rounded-md ${
            loading ? 'opacity-50' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Upload Supplement Stack
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SupplementUploadScreen;
