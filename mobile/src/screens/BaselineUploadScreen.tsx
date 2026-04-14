import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { uploadBaselineDocument } from '../services/baselineDocumentService';
import type { BaselineUploadRequest, ManualBaselineProfileData } from '../types/baselineDocument';
import { useUser, DEFAULT_USER_ID } from '../context/UserContext';

type BaselineUploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BaselineUpload'>;

export const BaselineUploadScreen: React.FC = () => {
  const navigation = useNavigation<BaselineUploadScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [notes, setNotes] = useState('');
  const [manualProfileData, setManualProfileData] = useState<ManualBaselineProfileData>({});
  const { userId } = useUser();
  const resolvedUserId = userId ?? DEFAULT_USER_ID;

  const handleUpload = async () => {
    setLoading(true);
    try {
      // For this implementation, we'll use a placeholder user ID
      // In a real app, this would come from authentication
      const request: BaselineUploadRequest = {
        documentType: useManualEntry ? 'manual_entry' : 'pdf',
        notes: notes || undefined,
        manualProfileData: useManualEntry ? manualProfileData : undefined,
      };

      const result = await uploadBaselineDocument(resolvedUserId, request);

      Alert.alert(
        'Success',
        'Baseline document uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('BaselineSummary', { profile: result.profile });
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload baseline document. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateManualProfileData = (field: string, value: any) => {
    setManualProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Upload Baseline Document</Text>
      
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Document Type</Text>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base">Use Manual Entry</Text>
          <Switch
            value={useManualEntry}
            onValueChange={setUseManualEntry}
          />
        </View>
        <Text className="text-sm text-gray-600">
          {useManualEntry 
            ? 'Enter your baseline information manually' 
            : 'Upload a PDF, DOCX, or TXT file (coming soon)'}
        </Text>
      </View>

      {useManualEntry && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-4">Baseline Information</Text>
          
          {/* Demographics */}
          <View className="mb-4">
            <Text className="text-base font-medium mb-2">Demographics</Text>
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Birth Date (YYYY-MM-DD)"
              value={manualProfileData.demographics?.birthDate || ''}
              onChangeText={(text) => updateManualProfileData('demographics', {
                ...manualProfileData.demographics,
                birthDate: text,
              })}
            />
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Height (cm)"
              value={manualProfileData.demographics?.height?.toString() || ''}
              onChangeText={(text) => updateManualProfileData('demographics', {
                ...manualProfileData.demographics,
                height: parseFloat(text) || undefined,
              })}
              keyboardType="numeric"
            />
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Starting Weight (kg)"
              value={manualProfileData.demographics?.weightStartingReference?.toString() || ''}
              onChangeText={(text) => updateManualProfileData('demographics', {
                ...manualProfileData.demographics,
                weightStartingReference: parseFloat(text) || undefined,
              })}
              keyboardType="numeric"
            />
          </View>

          {/* Training Context */}
          <View className="mb-4">
            <Text className="text-base font-medium mb-2">Training Context</Text>
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Workout Frequency"
              value={manualProfileData.trainingContext?.workoutFrequency || ''}
              onChangeText={(text) => updateManualProfileData('trainingContext', {
                ...manualProfileData.trainingContext,
                workoutFrequency: text,
              })}
            />
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Training Style"
              value={manualProfileData.trainingContext?.trainingStyle?.join(', ') || ''}
              onChangeText={(text) => updateManualProfileData('trainingContext', {
                ...manualProfileData.trainingContext,
                trainingStyle: text.split(', ').filter(Boolean),
              })}
            />
          </View>

          {/* Lifestyle Context */}
          <View className="mb-4">
            <Text className="text-base font-medium mb-2">Lifestyle Context</Text>
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Sleep Habits"
              value={manualProfileData.lifestyleContext?.sleepHabits || ''}
              onChangeText={(text) => updateManualProfileData('lifestyleContext', {
                ...manualProfileData.lifestyleContext,
                sleepHabits: text,
              })}
            />
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Travel Frequency"
              value={manualProfileData.lifestyleContext?.travelFrequency || ''}
              onChangeText={(text) => updateManualProfileData('lifestyleContext', {
                ...manualProfileData.lifestyleContext,
                travelFrequency: text,
              })}
            />
          </View>

          {/* Goals - simplified for this implementation */}
          <View className="mb-4">
            <Text className="text-base font-medium mb-2">Health Goals</Text>
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Weight Goal"
              value={manualProfileData.overallHealthGoals?.weightGoal || ''}
              onChangeText={(text) => updateManualProfileData('overallHealthGoals', {
                ...manualProfileData.overallHealthGoals,
                weightGoal: text,
              })}
            />
            <TextInput
              className="border border-gray-300 rounded p-2 mb-2"
              placeholder="Sleep Hours Goal"
              value={manualProfileData.overallHealthGoals?.sleepHoursGoal?.toString() || ''}
              onChangeText={(text) => updateManualProfileData('overallHealthGoals', {
                ...manualProfileData.overallHealthGoals,
                sleepHoursGoal: parseFloat(text) || undefined,
              })}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Notes (Optional)</Text>
        <TextInput
          className="border border-gray-300 rounded p-2 h-20"
          placeholder="Add any notes about this baseline document..."
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        className={`bg-blue-500 rounded-lg p-4 ${loading ? 'opacity-50' : ''}`}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            {useManualEntry ? 'Submit Baseline' : 'Upload Document'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};
